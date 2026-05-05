# AI API Gateway

统一AI厂商API调用网关，支持多个AI厂商（国内外主流厂商），通过一套API Key和地址即可调用全部可用模型，并提供实时监控功能。

## 功能特性

- **统一接口**：一套API调用所有AI厂商
- **多厂商支持**：OpenAI、Anthropic、Google Gemini、百度文心一言、阿里通义千问、智谱AI等
- **实时监控**：实时查看调用状况、费用统计、性能指标
- **API Key管理**：安全的密钥管理与访问控制
- **Docker部署**：支持Docker容器化部署

## 技术栈

- Node.js + Express
- PostgreSQL
- Socket.IO (实时推送)
- JWT + bcrypt (认证)

## 快速开始

### 环境要求

- Node.js >= 20
- PostgreSQL >= 15
- Docker (可选)

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

### Docker部署

```bash
docker-compose build
docker-compose up -d
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

### 4. 配置厂商API密钥

```bash
curl -X POST http://localhost:3000/api/providers/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"provider_name": "openai", "api_key": "your-openai-api-key"}'
```

### 5. 调用AI模型

```bash
curl -X POST http://localhost:3000/api/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "provider": "openai",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 100,
    "temperature": 0.7
  }'
```

### 6. 获取监控统计

```bash
curl -X GET http://localhost:3000/api/monitor/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/me` | GET | 获取用户信息 |
| `/api/keys` | GET | 获取密钥列表 |
| `/api/keys` | POST | 创建密钥 |
| `/api/keys/:id` | PUT | 更新密钥 |
| `/api/keys/:id` | DELETE | 删除密钥 |
| `/api/chat/completions` | POST | 聊天补全 |
| `/api/chat/models` | GET | 获取模型列表 |
| `/api/providers` | GET | 获取厂商列表 |
| `/api/providers/config` | POST | 配置厂商密钥 |
| `/api/monitor/stats` | GET | 获取统计信息 |
| `/api/monitor/history` | GET | 获取调用历史 |
| `/api/monitor/hourly` | GET | 小时统计 |

## 支持的AI厂商

| 厂商 | 模型 |
|-----|------|
| OpenAI | gpt-4o, gpt-4, gpt-4-turbo, gpt-3.5-turbo |
| Anthropic | claude-3-opus, claude-3-sonnet, claude-3-haiku, claude-2.1 |
| Google Gemini | gemini-pro, gemini-ultra, gemini-nano |
| 百度文心一言 | ernie-3.5, ernie-4.0, ernie-turbo |
| 阿里通义千问 | qwen-7b-chat, qwen-14b-chat, qwen-plus, qwen-max |
| 智谱AI | glm-4, glm-4-air, glm-3-turbo |

## 项目结构

```
.
├── src/
│   ├── adapters/          # AI厂商适配器
│   │   ├── baseAdapter.js
│   │   ├── openaiAdapter.js
│   │   ├── anthropicAdapter.js
│   │   ├── baiduAdapter.js
│   │   ├── alibabaAdapter.js
│   │   ├── zhipuAdapter.js
│   │   ├── geminiAdapter.js
│   │   └── providerManager.js
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
├── .env.example          # 环境变量示例
├── package.json
├── docker-compose.yml
└── Dockerfile
```

## 许可证

MIT License