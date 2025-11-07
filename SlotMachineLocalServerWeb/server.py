#!/usr/bin/env python3
import json, time, threading
from flask import Flask, jsonify
from flask_sock import Sock
from gpiozero import Button

# ===== 硬件设置（适配 Raspberry Pi 5，用 gpiozero）=====
BUTTON_PIN = 16  # BCM 编号
# pull_up=True：内部上拉；按下时接 GND → is_pressed=True
button = Button(BUTTON_PIN, pull_up=True, bounce_time=0.02)  # 20ms 去抖

# ===== Web 服务 =====
app = Flask(__name__, static_folder="public", static_url_path="")
sock = Sock(app)

clients = set()
lock = threading.Lock()

def compose_state():
    """
    与原版保持兼容字段：
      pressed: True 表示按钮按下
      raw: 原始电平语义（按下=0，未按=1），匹配你之前 RPi.GPIO 的约定
    """
    pressed = button.is_pressed
    raw = 0 if pressed else 1
    return {"pressed": pressed, "raw": raw}

@app.get("/")
def index():
    return app.send_static_file("index.html")

@app.get("/api/state")
def api_state():
    return jsonify(compose_state())

@sock.route("/ws")
def ws(ws):
    with lock:
        clients.add(ws)
    try:
        # 刚连先发一次
        ws.send(json.dumps(compose_state()))
        # 被动等待（主要靠服务器主动推送；这里保持住连接）
        while True:
            msg = ws.receive(timeout=60)
            # 可选：处理心跳/客户端消息，这里忽略
            if msg is None:
                pass
    except Exception:
        pass
    finally:
        with lock:
            clients.discard(ws)

def push_to_all(payload: str):
    """把JSON字符串推给所有连接的客户端，并清理掉线的连接"""
    with lock:
        dead = []
        for c in list(clients):
            try:
                c.send(payload)
            except Exception:
                dead.append(c)
        for d in dead:
            clients.discard(d)

def on_button_edge():
    """边沿回调：按下或松开都调用一次"""
    payload = json.dumps(compose_state())
    push_to_all(payload)

def broadcast_loop():
    """兜底轮询：极端情况下（浏览器/网络异常）也能保持状态更新"""
    last = compose_state()
    while True:
        cur = compose_state()
        if cur != last:
            push_to_all(json.dumps(cur))
            last = cur
        time.sleep(0.01)  # 10ms 兜底

if __name__ == "__main__":
    # 绑定边沿事件（gpiozero 提供的回调）
    button.when_pressed  = on_button_edge
    button.when_released = on_button_edge

    # 启动兜底轮询线程
    t = threading.Thread(target=broadcast_loop, daemon=True)
    t.start()

    try:
        app.run(host="0.0.0.0", port=5000)
    finally:
        # 优雅清理
        button.close()
