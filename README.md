# AI API Gateway

统一AI厂商API调用网关，支持任意OpenAI兼容接口，通过一套API Key和地址即可调用全部可用模型，并提供实时监控功能。

## 功能特性

- **统一接口**：一套API调用所有AI厂商
- **通用代理**：支持任意OpenAI兼容接口，无需厂商适配
- **灵活配置**：自由配置厂商API地址和密钥
- **连通测试**：测试厂商API是否可用
- **模型列表**：动态获取厂商支持的模型
- **实时监控**：实时查看调用状况、费用统计、性能指标
- **API Key管理**：安全的密钥管理与访问控制
- **多Key轮询**：同一提供商支持多个API Key，平均轮询调用

## 技术栈

- Node.js + Express
- Turso (LibSQL/SQLite)
- React + TypeScript + Vite
- JWT + bcrypt (认证)
- Recharts (图表)
- Tailwind CSS (样式)

## 部署教程

### 方式一：Vercel 一键部署（推荐）

#### 第 1 步：获取 Turso 数据库（免费）

本项目使用 [Turso](https://turso.tech/) 作为数据库，免费套餐足够个人使用。

1. 注册 Turso 账号：访问 [https://turso.tech/](https://turso.tech/)，使用 GitHub 登录
2. 安装 Turso CLI：
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
3. 登录并创建数据库：
   ```bash
   turso auth login
   turso db create ai-gateway
   ```
4. 获取数据库连接信息：
   ```bash
   # 获取数据库 URL
   turso db show ai-gateway --url
   # 输出类似：libsql://ai-gateway-xxx.turso.io

   # 创建 Auth Token
   turso db tokens create ai-gateway
   # 输出一串 token 字符串
   ```

> 也可以在 Turso 网页控制台 [https://turso.tech/app](https://turso.tech/app) 中直接创建数据库和获取连接信息。

#### 第 2 步：Fork 项目

1. 访问项目 GitHub 仓库
2. 点击右上角 **Fork** 按钮，将项目复制到你的 GitHub 账号下

#### 第 3 步：在 Vercel 中导入项目

1. 访问 [https://vercel.com/new](https://vercel.com/new)
2. 选择你 Fork 的仓库，点击 **Import**
3. 配置项保持默认即可（构建脚本已内置）

#### 第 4 步：配置环境变量

在 Vercel 的 **Settings → Environment Variables** 中添加以下变量：

| 变量名 | 必填 | 说明 | 示例值 |
|--------|------|------|--------|
| `LIBSQL_URL` | ✅ | Turso 数据库连接地址 | `libsql://ai-gateway-xxx.turso.io` |
| `LIBSQL_AUTH_TOKEN` | ✅ | Turso 数据库认证 Token | `eyJhbGciOi...` |
| `JWT_SECRET` | ✅ | JWT 签名密钥，随意填写一串随机字符 | `my-s3cret-key-abc123` |
| `ADMIN_EMAIL` | ✅ | 管理员登录邮箱 | `admin@example.com` |
| `ADMIN_PASSWORD` | ✅ | 管理员登录密码 | `MySecureP@ss123` |
| `JWT_EXPIRES_IN` | ❌ | Token 过期时间，默认 `7d` | `7d` |
| `APP_DOMAIN` | ❌ | 应用域名，用于 CORS 和 Cookie（如 `mybiog.us.ci`） | `mybiog.us.ci` |
| `TZ_OFFSET` | ❌ | 时区偏移（小时），用于 SQL"今日"统计，默认 `8`（UTC+8） | `8` |
| `FRONTEND_URL` | ❌ | 前端地址，本地开发用 | `http://localhost:5173` |
| `LOG_LEVEL` | ❌ | 日志级别，默认 `info` | `info` |

> **说明**：
> - `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 是你登录后台的账号密码，自己设定即可
> - `JWT_SECRET` 建议使用随机字符串，如 `openssl rand -hex 32` 生成
> - 数据库表会在首次启动时自动创建，无需手动建表；`APP_DOMAIN` 填写你的域名（不含 `https://`），用于跨域和 Cookie 配置；`TZ_OFFSET` 根据你的时区填写，中国用户默认 `8` 即可

#### 第 5 步：部署

1. 配置好环境变量后，点击 **Deploy**
2. 等待构建完成（约 1-2 分钟）
3. 访问 Vercel 分配的域名，使用 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 登录

#### 第 6 步：开始使用

1. 登录后进入 **设置** 页面，添加 AI 提供商（如 OpenAI、Anthropic 等）
2. 在 **API 密钥** 页面创建一个 API Key
3. 使用该 API Key 调用 AI 接口：
   ```bash
   curl -X POST https://your-domain.vercel.app/api/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "X-API-Key: YOUR_API_KEY" \
     -d '{
       "model": "gpt-4",
       "messages": [{"role": "user", "content": "你好"}]
     }'
   ```

---

### 方式二：本地开发

#### 环境要求

- Node.js >= 20

#### 安装依赖

```bash
npm install
cd frontend && npm install
```

#### 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，最少只需配置 5 个变量：

```env
# 数据库 - 本地开发可使用本地 SQLite 文件
LIBSQL_URL=file:./local.db
LIBSQL_AUTH_TOKEN=

# JWT 密钥 - 随意填写
JWT_SECRET=dev-secret-key

# 登录凭证 - 自己设定
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

# 应用域名 (部署时设置)
APP_DOMAIN=

# 时区偏移 (UTC+8 填 8，默认 8)
TZ_OFFSET=8
```

> 本地开发时 `LIBSQL_AUTH_TOKEN` 可以留空，`LIBSQL_URL` 使用 `file:./local.db` 即可在本地创建 SQLite 文件。

#### 启动服务

```bash
# 开发模式（前后端分别启动）
npm run dev          # 后端 :3000
cd frontend && npm run dev  # 前端 :5173

# 或构建后运行
node vercel-build.js
```

---

## 环境变量说明

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `LIBSQL_URL` | ✅ | - | Turso 数据库连接地址。本地开发用 `file:./local.db`，线上用 Turso 提供的 `libsql://` 地址 |
| `LIBSQL_AUTH_TOKEN` | 线上必填 | - | Turso 数据库认证 Token。本地 SQLite 不需要 |
| `JWT_SECRET` | ✅ | - | JWT 签名密钥，用于生成登录 Token |
| `ADMIN_EMAIL` | ✅ | - | 管理员登录邮箱，与 `ADMIN_PASSWORD` 配合使用 |
| `ADMIN_PASSWORD` | ✅ | - | 管理员登录密码 |
| `JWT_EXPIRES_IN` | ❌ | `7d` | Token 过期时间 |
| `PORT` | ❌ | `3000` | 本地开发端口号 |
| `NODE_ENV` | ❌ | `development` | 运行环境 |
| `APP_DOMAIN` | ❌ | `` | 应用域名，用于 CORS 允许和 Cookie Secure 设置。部署时填写你的域名（不含 https://） |
| `TZ_OFFSET` | ❌ | `8` | 时区偏移小时数，用于 SQL 查询中的"今日"统计。UTC+8 填 8，UTC-5 填 -5 |
| `FRONTEND_URL` | ❌ | - | 前端开发服务器地址，本地开发时使用 |
| `LOG_LEVEL` | ❌ | `info` | 日志级别（debug/info/warn/error） |

## API使用

### 1. 用户登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "your_secure_password"}'
```

### 2. 创建API密钥

```bash
curl -X POST http://localhost:3000/api/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "My API Key"}'
```

### 3. 添加厂商配置

```bash
curl -X POST http://localhost:3000/api/providers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "provider_name": "我的OpenAI",
    "provider_type": "openai",
    "base_url": "https://api.openai.com/v1",
    "api_key": "sk-xxx"
  }'
```

### 4. 调用AI模型

```bash
curl -X POST http://localhost:3000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 100,
    "temperature": 0.7
  }'
```

### 5. 获取监控统计

```bash
curl -X GET http://localhost:3000/api/monitor/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API接口

### 认证接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/auth/login` | POST | 用户登录（环境变量凭证） |
| `/api/auth/me` | GET | 获取用户信息 |

### API密钥管理

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/keys` | GET | 获取密钥列表 |
| `/api/keys` | POST | 创建密钥 |
| `/api/keys/:id/toggle` | PUT | 切换密钥状态 |
| `/api/keys/:id` | DELETE | 删除密钥 |

### 厂商管理

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/providers` | GET | 获取厂商列表 |
| `/api/providers` | POST | 添加厂商配置 |
| `/api/providers/:id` | PUT | 更新厂商配置 |
| `/api/providers/:id` | DELETE | 删除厂商配置 |
| `/api/providers/:id/test` | POST | 测试连通性 |
| `/api/providers/:id/models` | GET | 获取模型列表 |

### AI调用接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/v1/chat/completions` | POST | 聊天补全 |
| `/api/v1/chat/embeddings` | POST | 文本嵌入 |

### 监控接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/monitor/stats` | GET | 统计信息 |
| `/api/monitor/realtime` | GET | 实时统计 |
| `/api/monitor/daily` | GET | 每日统计（7天） |
| `/api/monitor/requests` | GET | 请求列表 |
| `/api/monitor/hourly` | GET | 小时统计 |
| `/api/monitor/models` | GET | 模型统计 |

### 自定义模型

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/custom-models` | GET | 获取自定义模型列表 |
| `/api/custom-models/batch` | POST | 批量创建模型 |
| `/api/custom-models/:id/toggle` | PUT | 切换模型状态 |
| `/api/custom-models/:id` | PUT | 更新模型 |
| `/api/custom-models/:id` | DELETE | 删除模型 |

## 支持的API类型

| 类型 | 说明 | 认证方式 |
|-----|------|---------|
| `openai` | OpenAI兼容接口 | Bearer Token |
| `anthropic` | Anthropic Claude接口 | x-api-key |

## 项目结构

```
.
├── src/
│   ├── services/          # 核心服务
│   │   ├── providerService.js  # 通用API代理服务
│   │   ├── routerService.js    # 路由服务
│   │   └── costService.js      # 费用计算服务
│   ├── config/            # 配置文件
│   │   └── database.js    # 数据库配置
│   ├── middleware/        # 中间件
│   │   ├── auth.js        # JWT认证
│   │   └── rateLimit.js   # 限流
│   ├── routes/            # 路由
│   │   ├── auth.js        # 认证（登录）
│   │   ├── apiKeys.js     # API密钥管理
│   │   ├── chat.js        # AI调用代理
│   │   ├── providers.js   # 厂商管理
│   │   ├── customModels.js # 自定义模型
│   │   └── monitor.js     # 监控统计
│   ├── utils/             # 工具
│   │   ├── db.js          # 数据库工具
│   │   ├── keyRotation.js # Key轮询
│   │   ├── cache.js       # 缓存
│   │   ├── retry.js       # 重试
│   │   └── logger.js      # 日志
│   └── server.js          # 主服务
├── frontend/              # React前端
│   └── src/
│       ├── pages/         # 页面组件
│       ├── components/    # 通用组件
│       ├── services/      # API服务
│       └── store/         # Zustand状态管理
├── docs/
│   └── project-spec.md    # 项目规范文档
└── package.json
```

## 许可证

MIT License
