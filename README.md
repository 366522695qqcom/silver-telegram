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

## 快速开始

### 环境要求

- Node.js >= 20

### 安装依赖

```bash
npm install
cd frontend && npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
NODE_ENV=development
PORT=3000

# 数据库 (Turso)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 管理员账户 (登录凭证)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
```

> **注意**：`ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 是登录系统的唯一凭证，注册功能已移除。首次登录时会自动创建用户。

### 启动服务

```bash
# 开发模式
npm run dev

# 构建
node vercel-build.js
```

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
│   │   └── turso.js       # Turso数据库配置
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
│   │   └── retry.js       # 重试
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

## 部署

项目支持 Vercel 部署：

1. Fork 本仓库
2. 在 Vercel 中导入项目
3. 配置环境变量（`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`）
4. 部署

## 许可证

MIT License
