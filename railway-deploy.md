# Railway 部署指南

## 后端部署

1. 登录 [Railway](https://railway.app) 并创建新项目
2. 选择 "Deploy from GitHub repo"
3. 连接你的 GitHub 仓库
4. 添加环境变量：
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `DATABASE_URL` (Railway 会自动提供 PostgreSQL)
5. 部署完成后，复制服务域名

## 前端部署

1. 在 Railway 创建另一个服务
2. 选择 `frontend` 目录
3. 添加环境变量：
   - `VITE_API_BASE_URL` = 后端服务域名
4. 部署完成

## 使用 Railway CLI

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 初始化项目
railway init

# 部署
railway up
```
