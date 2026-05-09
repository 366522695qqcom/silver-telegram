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
- **Apple风格设计**：前端采用精致、简洁的Apple设计风格
- **本地友好**：使用SQLite数据库，简化本地部署和数据迁移

### 1.3 需求分析
| 需求点 | 来源 | 说明 |
|-------|------|------|
| 个人开发者工具 | 用户选择A选项 | 面向个人开发者使用 |
| 支持全部AI厂商 | 用户选择D选项 | 通用API代理，支持任意OpenAI兼容接口 |
| 实时监控 | 用户明确要求 | 需要实时监控API调用状况 |
| Node.js + Express | 用户选择B选项 | 技术栈选择 |
| Web Dashboard | 用户选择A选项 | 可视化监控界面 |
| SQLite | 实际实现 | 使用SQLite简化本地部署 |
| 远程访问 | 用户选择E选项 | VPS或云服务器部署 |
| 无需厂商适配 | 用户明确要求 | 通用API代理模式 |
| 获取模型列表 | 用户明确要求 | 动态获取厂商模型 |
| 连通性测试 | 用户明确要求 | 测试API是否可用 |
| 审计日志 | 用户要求 | 增加操作审计记录 |
| Apple设计风格 | 用户要求 | 前端UI采用Apple风格设计 |
| Cookie认证 | 用户要求 | 支持Cookie保存用户信息 |

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
│  │               SQLite                       │               │
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
│  │  ┌──────────────────────────────────────┐  │               │
│  │  │ AuditLogs (审计日志表)               │  │               │
│  │  │ - action: 操作类型                   │  │               │
│  │  │ - details: 详细信息                  │  │               │
│  │  └──────────────────────────────────────┘  │               │
│  └─────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 核心组件

| 组件 | 职责 | 技术实现 |
|-----|------|---------|
| **API Gateway** | 统一入口，请求路由 | Express.js |
| **Auth Middleware** | API Key验证 | JWT + bcrypt + Cookie |
| **Provider Service** | 通用API代理服务 | Axios封装 |
| **Monitor Service** | 实时监控统计 | Socket.IO |
| **Database** | 持久化存储 | SQLite (not PostgreSQL) |
| **Frontend** | Web Dashboard | React 19 + TypeScript + Vite + TailwindCSS |
| **State Management** | 前端状态管理 | Zustand |
| **UI Components** | Apple风格设计 | TailwindCSS + Lucide Icons |

### 2.3 支持的API类型

| 类型 | 说明 | 兼容厂商 |
|-----|------|---------|
| **openai** | OpenAI兼容接口 | OpenAI、Azure、各种兼容服务 |
| **anthropic** | Anthropic Claude接口 | Claude API |

---

## 3. 数据库设计

### 3.1 数据库实现说明
**重要变更**：从PostgreSQL改为SQLite
- 原因：简化本地部署，减少依赖，方便数据迁移
- 实现：使用 `better-sqlite3` 库
- 文件位置：`src/local.db`
- 初始化：`src/utils/db.js` - 逐条执行SQL语句创建表

### 3.2 用户表 (users)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | UUID | PRIMARY KEY | 用户唯一标识 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 |
| name | VARCHAR(100) | | 用户名 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

### 3.3 API密钥表 (api_keys)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | UUID | PRIMARY KEY | 密钥唯一标识 |
| user_id | UUID | FOREIGN KEY | 关联用户 |
| key | VARCHAR(64) | UNIQUE, NOT NULL | API密钥值 (注意：字段名是key，非key_value) |
| name | VARCHAR(100) | | 密钥名称 |
| enabled | BOOLEAN | DEFAULT TRUE | 是否启用 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| expires_at | TIMESTAMP | | 过期时间 |

### 3.4 厂商配置表 (providers)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | UUID | PRIMARY KEY | 配置唯一标识 |
| user_id | UUID | FOREIGN KEY | 关联用户 |
| provider_name | VARCHAR(100) | NOT NULL | 厂商名称（自定义） |
| provider_type | VARCHAR(50) | DEFAULT 'openai' | 接口类型 |
| api_key | VARCHAR(255) | NOT NULL | 厂商API密钥 |
| base_url | VARCHAR(255) | NOT NULL | API基础地址 |
| enabled | BOOLEAN | DEFAULT TRUE | 是否启用 |
| avg_latency | INTEGER | | 平均延迟(ms) |
| last_success_at | TIMESTAMP | | 最后成功时间 |
| last_failed_at | TIMESTAMP | | 最后失败时间 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

### 3.5 调用记录表 (requests)

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

### 3.6 审计日志表 (audit_logs)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | UUID | PRIMARY KEY | 日志唯一标识 |
| user_id | UUID | FOREIGN KEY | 关联用户 |
| action | VARCHAR(100) | NOT NULL | 操作类型 |
| details | TEXT | | 详细信息 |
| ip_address | VARCHAR(45) | | IP地址 |
| user_agent | VARCHAR(255) | | 用户代理 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

---

## 4. API接口设计

### 4.1 认证接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 (设置Cookie + 返回Token) |
| `/api/auth/me` | GET | 获取当前用户信息 (支持Cookie或Bearer Token) |

### 4.2 API密钥管理

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/keys` | GET | 获取密钥列表 |
| `/api/keys` | POST | 创建新密钥 |
| `/api/keys/:id` | PUT | 更新密钥 |
| `/api/keys/:id` | DELETE | 删除密钥 |

### 4.3 厂商管理

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/providers` | GET | 获取厂商列表 |
| `/api/providers` | POST | 添加厂商配置 |
| `/api/providers/:id` | GET | 获取单个厂商详情 (新增) |
| `/api/providers/:id` | PUT | 更新厂商配置 |
| `/api/providers/:id` | DELETE | 删除厂商配置 |
| `/api/providers/:id/test` | POST | **测试连通性** |
| `/api/providers/:id/models` | GET | **获取模型列表** |
| `/api/providers/:id/toggle` | POST | **启用/禁用厂商** |

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
| `/api/monitor/realtime` | GET | **实时统计 (新增)** |

### 4.6 审计日志接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/audit/logs` | GET | 获取审计日志列表 |

---

## 5. 前端架构与设计

### 5.1 技术栈
- **框架**：React 19 + TypeScript
- **构建工具**：Vite
- **样式**：TailwindCSS
- **状态管理**：Zustand
- **图标**：Lucide React
- **图表**：Recharts
- **路由**：React Router

### 5.2 Apple设计风格实现

#### 5.2.1 设计Token
定义于 [frontend/src/index.css](file:///workspace/frontend/src/index.css#L5-L20)

```css
:root {
  --apple-white: #ffffff;
  --apple-gray-bg: #f5f5f7;
  --apple-gray-light: #fbfbfd;
  --apple-blue: #0071e3;
  --apple-blue-hover: #0077ed;
  --apple-blue-subtle: #e8f4fd;
  --apple-text: #1d1d1f;
  --apple-text-secondary: #6e6e73;
  --apple-text-tertiary: #86868b;
  --apple-border: #d2d2d7;
  --apple-border-light: #e5e5ea;
  --apple-success: #34c759;
  --apple-warning: #ff9500;
  --apple-error: #ff3b30;
}
```

#### 5.2.2 可复用组件类
- `.apple-card` - Apple风格卡片
- `.apple-btn-primary` - 主按钮（蓝色）
- `.apple-btn-secondary` - 次要按钮（白色边框）
- `.apple-btn-danger` - 危险按钮（红色）
- `.apple-input` - 输入框样式
- `.apple-badge-*` - 状态徽章
- `.apple-nav-item` - 导航项样式
- `.animate-apple-fade-in` - Apple风格淡入动画
- `.animate-apple-slide-up` - Apple风格滑入动画

### 5.3 页面结构

#### 5.3.1 登录/注册页面 ([frontend/src/pages/Login.tsx](file:///workspace/frontend/src/pages/Login.tsx))
- 居中卡片设计
- 渐变灰色背景
- 优雅的表单聚焦动画
- Sparkles图标替代传统Logo
- 支持注册和登录切换

#### 5.3.2 仪表盘页面 ([frontend/src/pages/Home.tsx](file:///workspace/frontend/src/pages/Home.tsx))
- 统计卡片网格布局
- 图表容器优化
- 实时状态进度条
- 系统概览面板

#### 5.3.3 厂商管理页面 ([frontend/src/pages/Settings.tsx](file:///workspace/frontend/src/pages/Settings.tsx))
- 三栏布局：左侧导航 → 中间厂商列表 → 右侧详情面板
- 厂商列表：显示启用状态、名称、类型
- 详情面板：
  - 厂商信息展示
  - 编辑模式切换
  - 测试连接功能
  - 获取模型列表
  - 删除厂商
- **修复记录**：解决了点击提供商后右侧面板空白问题
  - 移除了异步API调用，直接使用列表数据
  - 修复了容器高度和布局
  - 添加了调试日志

#### 5.3.4 API密钥管理页面 ([frontend/src/pages/ApiKeys.tsx](file:///workspace/frontend/src/pages/ApiKeys.tsx))
- API密钥列表展示
- 创建/编辑/删除功能
- 密钥复制功能（带HTTPS降级方案）
- 使用说明文档
- 动态API地址（基于当前window.location.origin）

#### 5.3.5 监控页面 ([frontend/src/pages/Monitor.tsx](file:///workspace/frontend/src/pages/Monitor.tsx))
- 实时调用监控
- 统计图表展示
- 性能指标

#### 5.3.6 审计日志页面 ([frontend/src/pages/AuditLogs.tsx](file:///workspace/frontend/src/pages/AuditLogs.tsx))
- 审计日志列表
- 时间线展示
- 操作详情查看

### 5.4 关键前端实现

#### 5.4.1 认证流程 ([frontend/src/services/api.ts](file:///workspace/frontend/src/services/api.ts))
- 支持Cookie自动携带
- 支持Bearer Token认证（从localStorage读取）
- API请求拦截器自动添加认证头

#### 5.4.2 路由守卫 ([frontend/src/App.tsx](file:///workspace/frontend/src/App.tsx))
- 检查用户登录状态
- 未登录用户重定向到登录页
- 已登录用户正常访问

#### 5.4.3 布局组件 ([frontend/src/pages/Layout.tsx](file:///workspace/frontend/src/pages/Layout.tsx))
- 左侧导航栏（可折叠）
- 用户头像展示
- 移动端响应式设计
- 系统状态指示器

---

## 6. 请求/响应示例

### 6.1 用户登录
**请求：**
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**响应：**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-xxx",
    "email": "user@example.com",
    "name": "John"
  }
}
```
*注：响应同时设置Cookie，包含token*

### 6.2 添加厂商配置
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
  "avg_latency": 0,
  "last_success_at": null,
  "last_failed_at": null,
  "created_at": "2026-05-09T10:00:00Z"
}
```

### 6.3 获取单个厂商详情
**请求：**
```json
GET /api/providers/:id
Authorization: Bearer <JWT_TOKEN>
```

**响应：**
```json
{
  "id": "uuid-xxx",
  "provider_name": "我的OpenAI",
  "provider_type": "openai",
  "base_url": "https://api.openai.com/v1",
  "api_key": "sk-xxx",  // 完整密钥（仅详情接口返回）
  "enabled": true,
  "avg_latency": 150,
  "last_success_at": "2026-05-09T10:30:00Z",
  "last_failed_at": null,
  "created_at": "2026-05-09T10:00:00Z"
}
```

### 6.4 测试连通性
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

### 6.5 获取模型列表
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

### 6.6 聊天补全
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

## 7. 任务分解

### 7.1 阶段一：基础框架 ✅
| 任务 | 描述 | 状态 |
|-----|------|------|
| T1.1 | 初始化Express项目结构 | 完成 |
| T1.2 | 配置SQLite连接 | 完成 |
| T1.3 | 配置环境变量和日志系统 | 完成 |
| T1.4 | 数据库表初始化 | 完成 |

### 7.2 阶段二：认证系统 ✅
| 任务 | 描述 | 状态 |
|-----|------|------|
| T2.1 | 用户注册/登录接口 | 完成 |
| T2.2 | JWT Token生成与验证 | 完成 |
| T2.3 | Cookie认证支持 | 完成 |
| T2.4 | API密钥管理CRUD | 完成 |
| T2.5 | 速率限制中间件 | 完成 |

### 7.3 阶段三：通用API代理 ✅
| 任务 | 描述 | 状态 |
|-----|------|------|
| T3.1 | ProviderService通用代理 | 完成 |
| T3.2 | 厂商配置CRUD | 完成 |
| T3.3 | 连通性测试接口 | 完成 |
| T3.4 | 模型列表获取接口 | 完成 |
| T3.5 | 单个厂商详情接口 | 完成 (新增) |

#### T3.3 连通性测试接口
- 文件：[src/services/providerService.js](file:///workspace/src/services/providerService.js)
- 路由：[src/routes/providers.js](file:///workspace/src/routes/providers.js)
- 功能：调用厂商 /models 端点验证 API Key 有效性
- 支持类型：openai (200), anthropic (直接成功)
- 返回：success, status, message

#### T3.4 模型列表获取接口
- 文件：[src/services/providerService.js](file:///workspace/src/services/providerService.js)
- 路由：[src/routes/providers.js](file:///workspace/src/routes/providers.js)
- 功能：从厂商 API 获取可用模型列表
- 支持格式：OpenAI data 标准格式
- 返回：models 数组，每个元素包含 id, name, owned_by

### 7.4 阶段四：监控系统 ✅
| 任务 | 描述 | 状态 |
|-----|------|------|
| T4.1 | 调用记录存储 | 完成 |
| T4.2 | 实时统计计算 | 完成 |
| T4.3 | Socket.IO实时推送 | 完成 |
| T4.4 | 实时统计API端点 | 完成 (新增) |

### 7.5 阶段五：核心功能增强 ✅
| 任务 | 描述 | 状态 |
|-----|------|------|
| T5.1 | 流式响应（SSE）支持 | 完成 |
| T5.2 | Embeddings接口代理 | 完成 |
| T5.3 | 自动重试与超时控制 | 完成 |
| T5.4 | Prompt缓存功能 | 完成 |
| T5.5 | 自动路由与负载均衡 | 完成 |

#### T5.1 流式响应（SSE）支持
- 文件：[src/services/providerService.js](file:///workspace/src/services/providerService.js)
- 路由：[src/routes/chat.js](file:///workspace/src/routes/chat.js)
- 功能：支持OpenAI流式输出，透传SSE流给客户端
- 使用：请求中添加 `stream: true` 参数

#### T5.3 自动重试与超时控制
- 文件：[src/utils/retry.js](file:///workspace/src/utils/retry.js)
- 功能：指数退避重试，支持429/5xx错误自动重试
- 配置：最大重试3次，初始延迟1秒，最大延迟10秒

#### T5.4 Prompt缓存功能
- 文件：[src/utils/cache.js](file:///workspace/src/utils/cache.js)
- 功能：相同请求自动返回缓存结果，节省费用
- TTL：默认1小时

### 7.6 阶段六：安全与隐私保护 ✅
| 任务 | 描述 | 状态 |
|-----|------|------|
| T6.1 | 操作审计日志 | 完成 |
| T6.2 | 用户配额管理 | 完成 |
| T6.3 | API Key细粒度权限 | 完成 |

#### T6.1 操作审计日志
- 文件：[src/services/auditService.js](file:///workspace/src/services/auditService.js)
- 路由：[src/routes/audit.js](file:///workspace/src/routes/audit.js)
- 功能：记录用户操作，支持追溯

#### T6.2 用户配额管理
- 文件：[src/services/quotaService.js](file:///workspace/src/services/quotaService.js)
- 路由：[src/routes/cost.js](file:///workspace/src/routes/cost.js)
- 功能：每日请求数、月度费用、总tokens限制

### 7.7 阶段七：费用与成本管理 ✅
| 任务 | 描述 | 状态 |
|-----|------|------|
| T7.1 | 费用预计算与统计 | 完成 |
| T7.2 | 价格配置管理 | 完成 |
| T7.3 | 月度账单统计 | 完成 |

#### T7.1 费用预计算与统计
- 文件：[src/services/costService.js](file:///workspace/src/services/costService.js)
- 功能：自动计算每次调用费用，记录到requests表

#### T7.2 价格配置管理
- 默认价格：内置GPT-4、GPT-3.5、Claude系列模型价格
- 支持自定义价格配置

### 7.8 阶段八：前端开发 ✅
| 任务 | 描述 | 状态 |
|-----|------|------|
| T8.1 | React+TypeScript+Vite项目初始化 | 完成 |
| T8.2 | Apple设计风格实现 | 完成 |
| T8.3 | 登录/注册页面 | 完成 |
| T8.4 | 仪表盘页面 | 完成 |
| T8.5 | 厂商管理页面 | 完成 (含bug修复) |
| T8.6 | API密钥管理页面 | 完成 |
| T8.7 | 监控页面 | 完成 |
| T8.8 | 审计日志页面 | 完成 |

---

## 8. 问题修复记录

### 8.1 数据库相关

#### 8.1.1 PostgreSQL → SQLite迁移
**问题**：PostgreSQL对本地部署过于复杂
**修复**：
- 使用 `better-sqlite3` 替代 pg
- 修改 [src/utils/db.js](file:///workspace/src/utils/db.js)：逐条执行SQL语句创建表
- 数据库文件位置：`src/local.db`

#### 8.1.2 字段名修正
**问题**：api_keys表字段名不一致
**修复**：
- `key_value` → `key`
- 移除 `rate_limit` 字段

### 8.2 后端认证相关

#### 8.2.1 JWT中间件异步问题
**问题**：`jwt.verify` 回调导致中间件时序问题
**修复**：[src/middleware/auth.js](file:///workspace/src/middleware/auth.js)
- 使用Promise包装jwt.verify
- 正确支持async/await

#### 8.2.2 Cookie认证
**问题**：用户需要Cookie保存登录信息
**修复**：
- 登录/注册时设置Cookie
- 认证中间件支持Cookie和Bearer Token两种方式
- 前端API客户端自动携带Cookie

#### 8.2.3 错误信息中文化
**问题**："Invalid credentials" 是英文
**修复**：改为中文 "无效的凭证"

### 8.3 后端API相关

#### 8.3.1 缺失单个厂商详情API
**问题**：前端需要获取单个厂商完整信息（含api_key）
**修复**：新增 `GET /api/providers/:id` 端点
- 文件：[src/routes/providers.js](file:///workspace/src/routes/providers.js)

#### 8.3.2 缺失实时监控API
**问题**：前端需要实时统计数据
**修复**：新增 `GET /api/monitor/realtime` 端点

### 8.4 前端相关

#### 8.4.1 提供商点击后右侧面板空白
**问题**：点击提供商后右侧面板内容不显示
**修复**：
- 移除了异步API调用，直接使用列表数据
- 修复了容器高度问题（从 `maxHeight+overflow-hidden` 改为 `minHeight+flex-col`）
- 优化了内容布局结构
- 添加了调试日志

#### 8.4.2 API密钥无法复制
**问题**：HTTPS环境下navigator.clipboard可能不可用
**修复**：添加降级方案
- 优先使用 navigator.clipboard.writeText
- 降级使用 textarea + document.execCommand('copy')

#### 8.4.3 硬编码localhost地址
**问题**：远程部署时地址无效
**修复**：使用 `window.location.origin` 动态获取当前地址

#### 8.4.4 TypeScript错误
**问题**：存在未使用的导入和类型错误
**修复**：移除未使用的导入（ToggleLeft, ToggleRight, Users, Model等）

#### 8.4.5 文字间距问题
**问题**：右侧面板空状态文字太挤
**修复**：
- 增加图标下方间距
- 文字分行显示
- 使用 `space-y-` 工具类控制间距

---

## 9. 部署说明

### 9.1 环境变量配置

```env
NODE_ENV=development
PORT=3000

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

LOG_LEVEL=info
```

### 9.2 启动命令

```bash
# 安装依赖（根目录）
npm install

# 安装前端依赖
cd frontend
npm install
cd ..

# 启动后端
npm start

# 启动前端（新终端）
cd frontend
npm run dev
```

### 9.3 访问地址

- **后端API**：http://localhost:3000
- **前端Dashboard**：http://localhost:5173

### 9.4 Vite代理配置
前端开发环境通过Vite代理访问后端API：
- 配置文件：[frontend/vite.config.ts](file:///workspace/frontend/vite.config.ts)
- `/api` 请求代理到 `http://localhost:3000`

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

4. **为什么选择SQLite？**
   - 本地部署简单，无额外依赖
   - 数据文件可直接复制迁移
   - 个人开发场景性能足够

5. **Apple设计风格核心特点？**
   - 大量留白
   - 精致的圆角
   - 微妙的阴影
   - 清晰的信息层级
   - 柔和的动画过渡

6. **Cookie vs Bearer Token？**
   - Cookie：用户体验好，浏览器自动处理
   - Bearer Token：灵活，适合API调用
   - 实现：两者都支持，优先Cookie

---

**版本**: v3.0.0  
**创建日期**: 2026-05-05  
**最后更新**: 2026-05-09  
**状态**: 完整功能，已修复关键bug
