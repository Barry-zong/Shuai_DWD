import path from "path";
import express from "express";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 提供打包后的静态资源（HTML、CSS、JS、PNG）
const distDir = path.join(__dirname, "../dist");
app.use(express.static(distDir, { extensions: ["html"] }));

// 根路径返回 index.html，避免 catch-all 造成重定向循环
app.get("/", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

// 其余未命中的路径直接返回 404，避免错误回退到 index.html
app.use((_req, res) => {
  res.status(404).send("Not found");
});

app.listen(PORT, () => {
  console.log(`Slot machine server is running at http://localhost:${PORT}`);
});
