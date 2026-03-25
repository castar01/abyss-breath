#!/bin/bash
cd "$(dirname "$0")"
echo "正在启动深渊呼吸游戏服务器..."
echo "请在浏览器访问: http://localhost:8000"
echo "按 Ctrl+C 停止服务器"
python3 -m http.server 8000
