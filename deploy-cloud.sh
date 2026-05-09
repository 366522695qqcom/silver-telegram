#!/bin/bash

set -e

echo "☁️  AI API Gateway 云端部署脚本"
echo "==============================="

# 配置变量（请根据实际环境修改）
SERVER_HOST=${SERVER_HOST:-"your-server-ip"}
SERVER_USER=${SERVER_USER:-"root"}
PROJECT_NAME="ai-api-gateway"
REMOTE_DIR="/opt/${PROJECT_NAME}"

# 检查必要参数
if [ "$SERVER_HOST" == "your-server-ip" ]; then
    echo "⚠️  请设置服务器地址:"
    echo "   export SERVER_HOST=your-server-ip"
    echo "   export SERVER_USER=root"
    exit 1
fi

echo "🎯 部署目标: ${SERVER_USER}@${SERVER_HOST}"
echo "📁 远程目录: ${REMOTE_DIR}"

# 构建本地镜像
echo "🔨 构建 Docker 镜像..."
docker-compose build

# 保存镜像
echo "💾 保存镜像..."
docker save ai-api-gateway-backend:latest | gzip > backend.tar.gz
docker save ai-api-gateway-frontend:latest | gzip > frontend.tar.gz

# 创建远程目录
echo "📂 创建远程目录..."
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${REMOTE_DIR}/data"

# 上传文件
echo "📤 上传文件..."
scp backend.tar.gz frontend.tar.gz docker-compose.yml .env ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/

# 远程部署
echo "🚀 远程部署..."
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
    cd ${REMOTE_DIR}

    # 加载镜像
    echo "📥 加载镜像..."
    docker load < backend.tar.gz
    docker load < frontend.tar.gz

    # 停止旧服务
    echo "🛑 停止旧服务..."
    docker-compose down 2>/dev/null || true

    # 启动新服务
    echo "🚀 启动新服务..."
    docker-compose up -d

    # 清理
    echo "🧹 清理临时文件..."
    rm -f backend.tar.gz frontend.tar.gz

    echo "✅ 部署完成！"
EOF

# 清理本地临时文件
rm -f backend.tar.gz frontend.tar.gz

echo ""
echo "🎉 云端部署完成！"
echo "📋 访问地址: http://${SERVER_HOST}"
