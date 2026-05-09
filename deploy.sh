#!/bin/bash

set -e

echo "🚀 AI API Gateway 部署脚本"
echo "=========================="

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，正在从 .env.example 复制..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ 已创建 .env 文件，请编辑配置后再运行"
        exit 1
    else
        echo "❌ .env.example 也不存在，请手动创建 .env 文件"
        exit 1
    fi
fi

# 创建数据目录
mkdir -p data

# 拉取最新代码（可选）
if [ "$1" == "--pull" ]; then
    echo "📥 拉取最新代码..."
    git pull origin main 2>/dev/null || echo "⚠️  非 git 仓库或拉取失败"
fi

# 停止旧容器
echo "🛑 停止旧容器..."
docker-compose down 2>/dev/null || true

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker-compose build --no-cache

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "🔍 检查服务状态..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ 服务启动成功！"
    echo ""
    echo "📋 服务信息："
    echo "   前端访问: http://localhost"
    echo "   后端 API: http://localhost:3000"
    echo "   健康检查: http://localhost:3000/api/health"
    echo ""
    echo "📊 查看日志: docker-compose logs -f"
    echo "🛑 停止服务: docker-compose down"
else
    echo "❌ 服务启动失败，请检查日志："
    docker-compose logs
    exit 1
fi
