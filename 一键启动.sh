#!/bin/bash

echo "=========================================="
echo "      深渊呼吸 - 一键启动脚本"
echo "=========================================="
echo ""

# 进入游戏目录
cd "$(dirname "$0")"

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误：未找到 python3"
    echo "请安装 Python 3"
    exit 1
fi

# 杀死旧服务器
echo "🔄 清理旧服务器..."
pkill -f "python3 -m http.server 8000" 2>/dev/null

# 启动服务器
echo "🚀 启动游戏服务器..."
python3 -m http.server 8000 > /dev/null 2>&1 &
SERVER_PID=$!

sleep 2

# 检查服务器是否启动
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ 服务器启动成功！"
    echo ""
    echo "📱 访问地址："
    echo "   测试页面: http://localhost:8000/test.html"
    echo "   完整游戏: http://localhost:8000/index.html"
    echo ""
    echo "🌐 正在打开浏览器..."
    
    # 打开浏览器
    sleep 1
    open "http://localhost:8000/test.html"
    
    echo ""
    echo "✨ 游戏已启动！"
    echo "⚠️  关闭此终端窗口将停止服务器"
    echo ""
    
    # 等待用户退出
    echo "按 Ctrl+C 停止服务器..."
    wait $SERVER_PID
else
    echo "❌ 服务器启动失败"
    exit 1
fi
