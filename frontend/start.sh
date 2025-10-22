#!/bin/bash

echo "🚀 启动 Astra Token DApp..."
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo "✅ npm 版本: $(npm -v)"
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
    echo ""
fi

echo "🌟 启动开发服务器..."
echo ""
echo "📝 重要提示:"
echo "  1. 请确保已安装 MetaMask 浏览器扩展"
echo "  2. 确保钱包中有足够的 ETH 支付 gas 费"
echo "  3. 确认连接到正确的网络"
echo ""
echo "🌐 应用将在 http://localhost:3000 打开"
echo ""

npm start

