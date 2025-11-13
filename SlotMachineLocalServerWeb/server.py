#!/usr/bin/env python3
# Raspberry Pi 5: Button (pressed) + VL53L0X (coin) → Flask + WebSocket
# pressed：物理按钮，沿用原逻辑
# coin：投币检测到时发送 coin:true（短脉冲），前端自行处理

import json, time, threading
from flask import Flask, jsonify
from flask_sock import Sock
from gpiozero import Button

# ===== 按钮（gpiozero, 适配 Pi 5）=====
BUTTON_PIN = 16  # BCM
button = Button(BUTTON_PIN, pull_up=True, bounce_time=0.02)  # 20ms 去抖

# ===== Web 服务 =====
app = Flask(__name__, static_folder="public", static_url_path="")
sock = Sock(app)

clients = set()
lock = threading.Lock()

# ===== coin 短脉冲状态 =====
_coin_flag = False
coin_lock = threading.Lock()

def set_coin(value: bool):
    global _coin_flag
    with coin_lock:
        _coin_flag = bool(value)

def get_coin() -> bool:
    with coin_lock:
        return _coin_flag

def compose_state():
    pressed = bool(button.is_pressed)
    raw = 0 if pressed else 1   # 兼容你原来的 raw 语义
    coin = get_coin()
    return {"pressed": pressed, "raw": raw, "coin": coin}

def push_to_all(obj: dict):
    payload = json.dumps(obj)
    with lock:
        dead = []
        for c in list(clients):
            try:
                c.send(payload)
            except Exception:
                dead.append(c)
        for d in dead:
            clients.discard(d)

def push_current_state():
    push_to_all(compose_state())

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
        ws.send(json.dumps(compose_state()))
        while True:
            msg = ws.receive(timeout=60)
            if msg is None:
                pass
    except Exception:
        pass
    finally:
        with lock:
            clients.discard(ws)

def on_button_edge():
    # 按钮变化：按原逻辑广播 pressed/raw；coin 不受影响
    push_current_state()

def broadcast_loop():
    # 兜底轮询，避免偶发丢包
    last = compose_state()
    while True:
        cur = compose_state()
        if cur != last:
            push_to_all(cur)
            last = cur
        time.sleep(0.01)

# ===== VL53L0X：投币检测 → coin:true 短脉冲 =====
def coin_pulse(duration_s=0.2):
    """把 coin 置 true，duration 后置回 false，并各广播一次"""
    set_coin(True)
    push_current_state()
    def _off():
        set_coin(False)
        push_current_state()
    threading.Timer(duration_s, _off).start()

def vl53_worker():
    # 基于你调试后的极简阈值+冷却逻辑
    import board, busio, adafruit_vl53l0x

    i2c = busio.I2C(board.SCL, board.SDA)
    vl53 = adafruit_vl53l0x.VL53L0X(i2c)
    vl53.measurement_timing_budget = 20000  # ~50 Hz

    COOLDOWN = 0.5   # s
    THRESH   = 5    # mm
    SLEEP    = 0.005 # s
    COIN_PULSE = 0.2 # s, coin:true 的脉冲时长

    prev = vl53.range
    last_trigger = 0.0

    print("[VL53] started. first:", prev, "mm")
    while True:
        d = vl53.range
        now = time.monotonic()

        if abs(prev - d) > THRESH and (now - last_trigger) > COOLDOWN:
            print("coin drop detected:", d, "mm")
            last_trigger = now
            coin_pulse(COIN_PULSE)  # 只发送 coin:true/false，不影响 pressed

        prev = d
        time.sleep(SLEEP)

if __name__ == "__main__":
    # 绑定按钮边沿
    button.when_pressed  = on_button_edge
    button.when_released = on_button_edge

    # 后台线程
    threading.Thread(target=broadcast_loop, daemon=True).start()
    threading.Thread(target=vl53_worker,   daemon=True).start()

    try:
        app.run(host="0.0.0.0", port=5000)
    finally:
        button.close()
