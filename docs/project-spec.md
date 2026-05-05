# AI API Gateway - 统一AI厂商API调用网关

## 1. 项目概述

### 1.1 项目目标
为个人开发者提供统一的AI API调用接口，支持多个AI厂商，通过一套API Key和地址即可调用全部可用模型，并提供实时监控功能。

### 1.2 核心价值
- **统一接口**：一套API调用所有AI厂商
- **灵活配置**：自由配置厂商API地址和密钥
- **实时监控**：实时查看调用状况、费用统计、性能指标
- **连通测试**：测试厂商API是否可用
- **模型列表**：获取厂商支持的模型列表

### 1.3 需求分析
| 需求点 | 来源 | 说明 |
|-------|------|------|
| 个人开发者工具 | 用户选择A选项 | 面向个人开发者使用 |
| 支持全部AI厂商 | 用户选择D选项 | 通用API代理，支持任意OpenAI兼容接口 |
| 实时监控 | 用户明确要求 | 需要实时监控API调用状况 |
| Node.js + Express | 用户选择B选项 | 技术栈选择 |
| Web Dashboard | 用户选择A选项 | 可视化监控界面 |
| PostgreSQL | 用户选择B选项 | 数据存储 |
| 远程访问 | 用户选择E选项 | VPS或云服务器部署 |
| 无需厂商适配 | 用户明确要求 | 通用API代理模式 |
| 获取模型列表 | 用户明确要求 | 动态获取厂商模型 |
| 连通性测试 | 用户明确要求 | 测试API是否可用 |

---

## 2. 技术架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户层                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  REST API    │  │ Web Dashboard│  │   Socket.IO Client  │ │
│  │   调用接口    │  │   监控面板    │  │     实时推送        │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘ │
└─────────┼─────────────────┼──────────────────────┼─────────────┘
          │                 │                      │
┌─────────▼─────────────────▼──────────────────────▼─────────────┐
│                        服务层                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Express Gateway                       │   │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐   │   │
│  │  │ Auth    │  │ Router   │  │ Rate     │  │ Logger  │   │   │
│  │  │ Middleware│ │  路由    │  │ Limiting │  │ 日志    │   │   │
│  │  └────┬────┘  └────┬─────┘  └────┬─────┘  └────┬────┘   │   │
│  │       │            │             │             │        │   │
│  │       └────────────┼─────────────┼─────────────┘        │   │
│  │                    ▼             ▼                      │   │
│  │          ┌──────────────┐ ┌─────────────┐              │   │
│  │          │  Provider    │ │  Monitor    │              │   │
│  │          │   Service    │ │   Service   │              │   │
│  │          │  (通用代理)   │ │   监控服务   │              │   │
│  │          └──────┬───────┘ └──────┬──────┘              │   │
│  └─────────────────┼────────────────┼──────────────────────┘   │
└────────────────────┼────────────────┼───────────────────────────┘
                     │                │
┌────────────────────▼────────────────▼───────────────────────────┐
│                        数据层                                   │
│  ┌─────────────────────────────────────────────┐               │
│  │              PostgreSQL                     │               │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │               │
│  │  │ Users    │  │ ApiKeys  │  │ Requests │  │               │
│  │  │ 用户表   │  │ 密钥表   │  │ 调用记录  │  │               │
│  │  └──────────┘  └──────────┘  └──────────┘  │               │
│  │  ┌──────────────────────────────────────┐  │               │
│  │  │ Providers (厂商配置表)                │  │               │
│  │  │ - provider_name: 厂商名称             │  │               │
│  │  │ - provider_type: openai/anthropic    │  │               │
│  │  │ - base_url: API地址                  │  │               │
│  │  │ - api_key: 厂商密钥                  │  │               │
│  │  └──────────────────────────────────────┘  │               │
│  └─────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 核心组件

| 组件 | 职责 | 技术实现 |
|-----|------|---------|
| **API Gateway** | 统一入口，请求路由 | Express.js |
| **Auth Middleware** | API Key验证 | JWT + bcrypt |
| **Provider Service** | 通用API代理服务 | Axios封装 |
| **Monitor Service** | 实时监控统计 | Socket.IO |
| **Database** | 持久化存储 | PostgreSQL |

### 2.3 支持的API类型

| 类型 | 说明 | 兼容厂商 |
|-----|------|---------|
| **openai** | OpenAI兼容接口 | OpenAI、Azure、各种兼容服务 |
| **anthropic** | Anthropic Claude接口 | Claude API |

---

## 3. 数据库设计

### 3.1 用户表 (users)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | UUID | PRIMARY KEY | 用户唯一标识 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 |
| name | VARCHAR(100) | | 用户名 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

### 3.2 API密钥表 (api_keys)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | UUID | PRIMARY KEY | 密钥唯一标识 |
| user_id | UUID | FOREIGN KEY | 关联用户 |
| key_value | VARCHAR(64) | UNIQUE, NOT NULL | API密钥值 |
| name | VARCHAR(100) | | 密钥名称 |
| enabled | BOOLEAN | DEFAULT TRUE | 是否启用 |
| rate_limit | INTEGER | DEFAULT 1000 | 速率限制 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| expires_at | TIMESTAMP | | 过期时间 |

### 3.3 厂商配置表 (providers)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | UUID | PRIMARY KEY | 配置唯一标识 |
| user_id | UUID | FOREIGN KEY | 关联用户 |
| provider_name | VARCHAR(100) | NOT NULL | 厂商名称（自定义） |
| provider_type | VARCHAR(50) | DEFAULT 'openai' | 接口类型 |
| api_key | VARCHAR(255) | NOT NULL | 厂商API密钥 |
| base_url | VARCHAR(255) | NOT NULL | API基础地址 |
| enabled | BOOLEAN | DEFAULT TRUE | 是否启用 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

### 3.4 调用记录表 (requests)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | UUID | PRIMARY KEY | 记录唯一标识 |
| api_key_id | UUID | FOREIGN KEY | 关联密钥 |
| provider | VARCHAR(100) | NOT NULL | 厂商名称 |
| model | VARCHAR(100) | NOT NULL | 模型名称 |
| status_code | INTEGER | NOT NULL | 状态码 |
| latency | INTEGER | | 延迟(ms) |
| prompt_tokens | INTEGER | | 输入token数 |
| completion_tokens | INTEGER | | 输出token数 |
| error_message | TEXT | | 错误信息 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

---

## 4. API接口设计

### 4.1 认证接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/me` | GET | 获取当前用户 |

### 4.2 API密钥管理

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/keys` | GET | 获取密钥列表 |
| `/api/keys` | POST | 创建新密钥 |
| `/api/keys/:id` | GET | 获取密钥详情 |
| `/api/keys/:id` | PUT | 更新密钥 |
| `/api/keys/:id` | DELETE | 删除密钥 |

### 4.3 厂商管理

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/providers` | GET | 获取厂商列表 |
| `/api/providers` | POST | 添加厂商配置 |
| `/api/providers/:id` | PUT | 更新厂商配置 |
| `/api/providers/:id` | DELETE | 删除厂商配置 |
| `/api/providers/:id/test` | POST | **测试连通性** |
| `/api/providers/:id/models` | GET | **获取模型列表** |

### 4.4 AI调用接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/chat/completions` | POST | 聊天补全（统一接口） |
| `/api/chat/providers` | GET | 获取可用厂商列表 |

### 4.5 监控接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/monitor/stats` | GET | 获取调用统计 |
| `/api/monitor/history` | GET | 获取调用历史 |
| `/api/monitor/hourly` | GET | 小时统计 |

---

## 5. 请求/响应示例

### 5.1 添加厂商配置

**请求：**
```json
POST /api/providers
Authorization: Bearer <JWT_TOKEN>

{
  "provider_name": "我的OpenAI",
  "provider_type": "openai",
  "base_url": "https://api.openai.com/v1",
  "api_key": "sk-xxx"
}
```

**响应：**
```json
{
  "id": "uuid-xxx",
  "provider_name": "我的OpenAI",
  "provider_type": "openai",
  "base_url": "https://api.openai.com/v1",
  "enabled": true,
  "created_at": "2026-05-05T10:00:00Z"
}
```

### 5.2 测试连通性

**请求：**
```json
POST /api/providers/:id/test
Authorization: Bearer <JWT_TOKEN>
```

**响应：**
```json
{
  "provider_id": "uuid-xxx",
  "provider_name": "我的OpenAI",
  "success": true,
  "status": 200,
  "message": "Connection successful"
}
```

### 5.3 获取模型列表

**请求：**
```json
GET /api/providers/:id/models
Authorization: Bearer <JWT_TOKEN>
```

**响应：**
```json
{
  "provider_id": "uuid-xxx",
  "provider_name": "我的OpenAI",
  "models": [
    { "id": "gpt-4", "name": "gpt-4", "owned_by": "openai" },
    { "id": "gpt-3.5-turbo", "name": "gpt-3.5-turbo", "owned_by": "openai" }
  ]
}
```

### 5.4 聊天补全

**请求：**
```json
POST /api/chat/completions
X-API-Key: <YOUR_API_KEY>

{
  "provider_id": "uuid-xxx",
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "user", "content": "你好"}
  ],
  "max_tokens": 100,
  "temperature": 0.7
}
```

**响应：**
```json
{
  "id": "chatcmpl-xxx",
  "model": "gpt-3.5-turbo",
  "provider": "openai-compatible",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "你好！有什么我可以帮助你的吗？"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  }
}
```

---

## 6. 任务分解

### 6.1 阶段一：基础框架 ✅

| 任务 | 描述 | 状态 |
|-----|------|------|
| T1.1 | 初始化Express项目结构 | 完成 |
| T1.2 | 配置PostgreSQL连接 | 完成 |
| T1.3 | 配置环境变量和日志系统 | 完成 |
| T1.4 | 数据库表初始化 | 完成 |

### 6.2 阶段二：认证系统 ✅

| 任务 | 描述 | 状态 |
|-----|------|------|
| T2.1 | 用户注册/登录接口 | 完成 |
| T2.2 | JWT Token生成与验证 | 完成 |
| T2.3 | API密钥管理CRUD | 完成 |
| T2.4 | 速率限制中间件 | 完成 |

### 6.3 阶段三：通用API代理 ✅

| 任务 | 描述 | 状态 |
|-----|------|------|
| T3.1 | ProviderService通用代理 | 完成 |
| T3.2 | 厂商配置CRUD | 完成 |
| T3.3 | 连通性测试接口 | **已实现** |
| T3.4 | 模型列表获取接口 | **已实现** |

#### T3.3 连通性测试接口
- 文件：[src/services/providerService.js](file:///workspace/src/services/providerService.js#L4-L26)
- 路由：[src/routes/providers.js](file:///workspace/src/routes/providers.js#L81-L104)
- 功能：调用厂商 /models 端点验证 API Key 有效性
- 支持类型：openai (200), anthropic (直接成功)
- 返回：success, status, message

#### T3.4 模型列表获取接口
- 文件：[src/services/providerService.js](file:///workspace/src/services/providerService.js#L28-L57)
- 路由：[src/routes/providers.js](file:///workspace/src/routes/providers.js#L106-L129)
- 功能：从厂商 API 获取可用模型列表
- 支持格式：OpenAI data 标准格式
- 返回：models 数组，每个元素包含 id, name, owned_by


### 6.4 阶段四：监控系统 ✅

| 任务 | 描述 | 状态 |
|-----|------|------|
| T4.1 | 调用记录存储 | 完成 |
| T4.2 | 实时统计计算 | 完成 |
| T4.3 | Socket.IO实时推送 | 完成 |

### 6.5 阶段五：待完成

| 任务 | 描述 | 状态 |
|-----|------|------|
| T5.1 | Web Dashboard前端 | 待开发 |
| T5.2 | 单元测试编写 | 待开发 |

---

## 7. 部署说明

### 7.1 环境变量配置

```env
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_gateway
DB_USER=admin
DB_PASSWORD=password

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1h

LOG_LEVEL=info
```

### 7.2 启动命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产模式
npm start
```

---

## 附录：学习记录

### 技术选型决策

1. **为什么使用通用API代理而非厂商适配器？**
   - 用户需求：不需要为每个厂商写适配代码
   - 灵活性：支持任意OpenAI兼容接口
   - 可扩展：用户可自定义厂商名称和API地址

2. **provider_type字段的作用？**
   - `openai`: 使用Bearer Token认证，调用`/chat/completions`端点
   - `anthropic`: 使用x-api-key认证，调用`/messages`端点

3. **连通性测试实现方式？**
   - 调用厂商的`/models`端点验证API Key有效性
   - 返回状态码和错误信息便于调试

---

**版本**: v2.0.0  
**创建日期**: 2026-05-05  
**状态**: 核心功能完成