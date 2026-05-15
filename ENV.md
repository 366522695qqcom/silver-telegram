# 环境变量说明

部署到 Vercel 时，需要在项目 Settings → Environment Variables 中配置以下变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `LIBSQL_URL` | Turso/libSQL 数据库地址 | `libsql://your-db.turso.io` |
| `LIBSQL_AUTH_TOKEN` | Turso 认证 Token | `eyJ...` |
| `JWT_SECRET` | JWT 签名密钥 | 随机字符串 |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `1h` |
| `FRONTEND_URL` | 前端域名 | `https://your-app.vercel.app` |
| `NODE_ENV` | 运行环境 | `production` |
| `LOG_LEVEL` | 日志级别 | `info` |

> 本地开发时复制 `.env.example` 为 `.env`，并将 `LIBSQL_URL` 改为 `file:./local.db` 使用本地 SQLite。