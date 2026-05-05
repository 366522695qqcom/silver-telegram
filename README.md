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

## 技术栈

- Node.js + Express
- PostgreSQL
- Socket.IO (实时推送)
- JWT + bcrypt (认证)

## 快速开始

### 环境要求

- Node.js >= 20
- PostgreSQL >= 15

### 安装依赖

```bash
npm install
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
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_gateway
DB_USER=admin
DB_PASSWORD=password
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1h
```

### 启动服务

```bash
npm run dev
```

## API使用

### 1. 用户注册

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password", "name": "John"}'
```

### 2. 用户登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

### 3. 创建API密钥

```bash
curl -X POST http://localhost:3000/api/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "My API Key"}'
```

### 4. 添加厂商配置

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

### 5. 测试连通性

```bash
curl -X POST http://localhost:3000/api/providers/PROVIDER_ID/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. 获取模型列表

```bash
curl -X GET http://localhost:3000/api/providers/PROVIDER_ID/models \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. 调用AI模型

```bash
curl -X POST http://localhost:3000/api/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "provider_id": "PROVIDER_ID",
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 100,
    "temperature": 0.7
  }'
```

### 8. 获取监控统计

```bash
curl -X GET http://localhost:3000/api/monitor/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API接口

### 认证接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/me` | GET | 获取用户信息 |

### API密钥管理

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/keys` | GET | 获取密钥列表 |
| `/api/keys` | POST | 创建密钥 |
| `/api/keys/:id` | PUT | 更新密钥 |
| `/api/keys/:id` | DELETE | 删除密钥 |

### 厂商管理

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/providers` | GET | 获取厂商列表 |
| `/api/providers` | POST | 添加厂商配置 |
| `/api/providers/:id` | PUT | 更新厂商配置 |
| `/api/providers/:id` | DELETE | 删除厂商配置 |
| `/api/providers/:id/test` | POST | **测试连通性** |
| `/api/providers/:id/models` | GET | **获取模型列表** |

### AI调用接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/chat/completions` | POST | 聊天补全 |
| `/api/chat/providers` | GET | 获取可用厂商 |

### 监控接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/monitor/stats` | GET | 获取统计信息 |
| `/api/monitor/history` | GET | 获取调用历史 |
| `/api/monitor/hourly` | GET | 小时统计 |

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
│   │   └── providerService.js  # 通用API代理服务
│   ├── config/            # 配置文件
│   │   ├── database.js
│   │   ├── logger.js
│   │   └── init.sql
│   ├── middleware/        # 中间件
│   │   ├── auth.js
│   │   └── rateLimit.js
│   ├── routes/            # 路由
│   │   ├── auth.js
│   │   ├── apiKeys.js
│   │   ├── chat.js
│   │   ├── providers.js
│   │   └── monitor.js
│   └── server.js          # 主服务
├── docs/
│   └── project-spec.md    # 项目规范文档
├── .env.example           # 环境变量示例
└── package.json
```

## 许可证

MIT License