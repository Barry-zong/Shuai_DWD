import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { RectAreaLightHelper } from "https://unpkg.com/three@0.160.0/examples/jsm/helpers/RectAreaLightHelper.js";
import { RectAreaLightUniformsLib } from "https://unpkg.com/three@0.160.0/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { RoomEnvironment } from "https://unpkg.com/three@0.160.0/examples/jsm/environments/RoomEnvironment.js";

// Declare stats early to avoid TDZ when animate() runs before dynamic import completes
let stats = null;

const container = document.getElementById("three-root");

// 模型路径与需要旋转的节点名可覆盖
export const MODEL_URL =
  window.MODEL_URL ||
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_MODEL_URL) ||
  "/models/slot.glb"; // 将你的 .glb 放到 SlotMachine/public/models/

export const REELS_NODE_NAME =
  window.REELS_NODE_NAME ||
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_REELS_NODE_NAME) ||
  "Reels"; // 若无该节点，自动回退到场景根

// WS 地址
const urlParamWS = new URLSearchParams(location.search).get("ws");
export const PI_WS_URL =
  urlParamWS ||
  window.PI_WS_URL ||
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_PI_WS_URL) ||
  `ws://${location.hostname}:5000/ws`;

// 本地开发默认关闭 WS（除非显式配置了地址），避免无树莓派时刷屏报错
const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
const hasConfiguredWS = Boolean(
  urlParamWS ||
  (typeof window !== "undefined" && window.PI_WS_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_PI_WS_URL)
);
// 允许通过 window.ENABLE_PI_WS 显式开启/关闭
const ENABLE_PI_WS = (typeof window !== "undefined" && typeof window.ENABLE_PI_WS === "boolean")
  ? window.ENABLE_PI_WS
  : (hasConfiguredWS || !isLocalHost);

// --- Three 基础 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
camera.position.set(0, 5, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.3;
controls.zoomSpeed = 0.6;
controls.maxPolarAngle = Math.PI * 0.5;
controls.target.set(0, 1, 0);

// Image-based lighting (neutral room env) for guaranteed visibility on PBR materials
try {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
} catch {}

// Lights (RectArea + Points + subtle ambient + hemisphere)
RectAreaLightUniformsLib.init();
const rectLight = new THREE.RectAreaLight(0xffffff, 5, 10, 3);
rectLight.position.set(0, 3, -6);
rectLight.rotation.set(0, Math.PI, 0);
scene.add(rectLight, new RectAreaLightHelper(rectLight));

const ambient = new THREE.AmbientLight(0xffffff, 0.15);
scene.add(ambient);

const hemi = new THREE.HemisphereLight(0xffffff, 0x454545, 0.3);
scene.add(hemi);

const pointLights = [];
for (let i = 0; i < 6; i++) {
  const p = new THREE.PointLight(0xffffff, 1.2, 50);
  p.position.set((Math.random() - 0.5) * 12, Math.random() * 6 + 2, (Math.random() - 0.5) * 12);
  p.castShadow = true;
  pointLights.push(p);
  scene.add(p);
}

function resize() {
  const w = container.clientWidth || window.innerWidth;
  const h = container.clientHeight || window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
window.addEventListener("resize", resize);
resize();

// Floor for reference
const floorGeo = new THREE.PlaneGeometry(2000, 2000);
const floorMat = new THREE.MeshStandardMaterial({ color: 0xfffff, roughness: 0.3, metalness: 0.0 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -5;
floor.receiveShadow = true;
scene.add(floor);

// --- 加载模型 ---
const loader = new GLTFLoader();
let root, reelsGroup;

loader.load(
  MODEL_URL,
  (gltf) => {
    root = gltf.scene;
    root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;

        // 修改材质颜色
        if (o.material) {
          // 如果材质是数组（多材质）
          const materials = Array.isArray(o.material) ? o.material : [o.material];
          materials.forEach(mat => {
            // 修改颜色（可以按需调整）
           // mat.color.set(0xff0000);  // 红色，改成你想要的颜色
            // mat.color.set(0x00ff00);  // 绿色
             mat.color.set(0xffd700);  // 金色

            // 可选：调整材质属性
             mat.metalness = 0.8;  // 金属度 (0-1)
             mat.roughness = 0.2;  // 粗糙度 (0-1)
          });
        }
      }
    });
    scene.add(root);

    reelsGroup =
      root.getObjectByName(REELS_NODE_NAME) ||
      root.getObjectByProperty("name", REELS_NODE_NAME) ||
      root; // 找不到则旋转整个模型

    root.rotation.y = THREE.MathUtils.degToRad(15);

    // Frame the loaded object in view
    try {
      const box = new THREE.Box3().setFromObject(reelsGroup);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fitOffset = 1.6;
      const fov = (camera.fov * Math.PI) / 180;
      const distance = Math.abs(maxDim / Math.tan(fov / 2)) * fitOffset;
      const dir = new THREE.Vector3(0, 0.2, 1).normalize();
      camera.position.copy(center.clone().add(dir.multiplyScalar(distance)));
      controls.target.copy(center);
      controls.update();

      // Adapt lights to model scale/position so it's never black
      rectLight.width = Math.max(4, maxDim * 1.2);
      rectLight.height = Math.max(1.5, maxDim * 0.35);
      rectLight.intensity = 6;
      rectLight.position.copy(center.clone().add(new THREE.Vector3(0, maxDim * 0.3, -maxDim * 1.2)));
      rectLight.lookAt(center);

      ambient.intensity = 0.2;
      hemi.intensity = 0.35;

      const radius = Math.max(6, maxDim * 1.1);
      pointLights.forEach((p, i) => {
        const a = (i / pointLights.length) * Math.PI * 2;
        p.position.set(
          center.x + Math.cos(a) * radius,
          center.y + maxDim * 0.4,
          center.z + Math.sin(a) * radius
        );
        p.distance = radius * 4;
        p.intensity = 1.2;
      });
    } catch {}
  },
  undefined,
  (err) => console.error("Failed to load model:", err)
);

// --- 旋转动画（指数衰减）---
let spinning = false;
let t0 = 0;
const SPIN_INITIAL_VELOCITY = 10; // rad/s
const SPIN_DECAY = 1.8; // 衰减系数
const SPIN_MIN_TIME = 1.0; // 最短旋转秒数
let lastTime = performance.now();

export function triggerSpin() {
  if (!reelsGroup || spinning) return;
  spinning = true;
  t0 = performance.now();
}

function update(now) {
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  lastTime = now;

  if (spinning && reelsGroup) {
    const t = (now - t0) / 1000;
    const vel = SPIN_INITIAL_VELOCITY * Math.exp(-SPIN_DECAY * t);
    reelsGroup.rotation.y += vel * dt;

    if (t > SPIN_MIN_TIME && vel < 0.1) {
      spinning = false;
    }
  }
}

function animate(now = performance.now()) {
  requestAnimationFrame(animate);
  update(now);
  renderer.render(scene, camera);
  controls.update();
  if (stats) stats.update();
}
animate();

// Stats (optional visual FPS)
// 动态加载 stats.js，避免 CDN CORS 问题导致整个模块失败
(async () => {
  const candidates = [
    "https://cdn.jsdelivr.net/npm/stats.js@0.17.0/build/stats.module.js",
    "https://esm.sh/stats.js@0.17.0",
  ];
  for (const url of candidates) {
    try {
      const mod = await import(url);
      const Stats = mod.default || mod.Stats || mod;
      stats = new Stats();
      stats.dom.style.left = "unset";
      stats.dom.style.right = "0";
      document.body.appendChild(stats.dom);
      break;
    } catch (_) {
      // try next
    }
  }
})();

// --- Space 键触发 ---
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    triggerSpin();
  }
});

// --- WebSocket：spin 指令 / pressed 上升沿 ---
let ws;
let lastPressed = false;

function handleWSMessage(data) {
  if (typeof data === "string") {
    if (data.trim().toLowerCase() === "spin") {
      triggerSpin();
      return;
    }
    try { data = JSON.parse(data); } catch { return; }
  }
  if (data && typeof data === "object") {
    if (data.spin === true || data.type === "spin" || data.command === "spin") {
      triggerSpin();
      return;
    }
    if (typeof data.pressed === "boolean") {
      if (data.pressed && !lastPressed) triggerSpin();
      lastPressed = !!data.pressed;
    }
  }
}

let wsAttempts = 0;
const MAX_WS_ATTEMPTS = 2; // 避免在本地无设备时刷屏

function connectWS() {
  if (!ENABLE_PI_WS) {
    console.info("[3D] PI WebSocket disabled; use Space to spin.");
    return;
  }
  try {
    wsAttempts++;
    ws = new WebSocket(PI_WS_URL);
    ws.onmessage = (e) => handleWSMessage(e.data);
    ws.onclose = () => {
      if (wsAttempts < MAX_WS_ATTEMPTS) setTimeout(connectWS, 1200);
    };
    ws.onerror = () => {
      if (wsAttempts < MAX_WS_ATTEMPTS) setTimeout(connectWS, 1200);
    };
  } catch {
    if (wsAttempts < MAX_WS_ATTEMPTS) setTimeout(connectWS, 1600);
  }
}
connectWS();
