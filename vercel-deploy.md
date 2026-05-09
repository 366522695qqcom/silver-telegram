# Vercel 部署指南

## 前端部署

1. 登录 [Vercel](https://vercel.com)
2. 点击 "Add New Project"
3. 导入 GitHub 仓库
4. 配置：
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 添加环境变量：
   - `VITE_API_BASE_URL` = 你的后端 API 地址
6. 点击 Deploy

## 使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署前端
cd frontend
vercel --prod
```

## 注意事项

- Vercel 是前端托管平台，后端需要部署在其他平台
- 后端需要配置 CORS 允许 Vercel 域名访问
- 建议后端使用 Railway、Render 或自己的服务器
