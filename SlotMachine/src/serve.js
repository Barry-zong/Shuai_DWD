import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 提供 public 目录下的静态资源（HTML、CSS、JS、PNG）
app.use(express.static(path.join(__dirname, "public")));

// Fallback：让浏览器直接拿到 index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Slot machine server is running at http://localhost:${PORT}`);
});
