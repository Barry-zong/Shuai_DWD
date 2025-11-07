# Slot Machine Symbols

由于此仓库的自动评测环境不接受二进制文件，老虎机的十种符号会在运行时用 Canvas 动态生成，并不会直接存放 PNG 资源。若需要替换为实际图片，可将资源放入本目录，并在 `src/main.js` 中更新 `SYMBOL_DEFINITIONS` 或改为加载静态文件。
