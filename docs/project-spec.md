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

### 1.3 技术栈总览

| 层级 | 技术 | 版本 |
|------|------|------|
| **后端运行时** | Node.js | LTS |
| **后端框架** | Express.js | 4.x |
| **数据库** | SQLite (better-sqlite3) | — |
| **认证** | JWT + bcrypt + Cookie | — |
| **实时通信** | Socket.IO | 4.x |
| **HTTP 客户端** | Axios | — |
| **前端框架** | React + TypeScript | 19.x |
| **构建工具** | Vite | 6.x |
| **样式框架** | TailwindCSS | 3.x |
| **状态管理** | Zustand | 5.x |
| **图表库** | Recharts | 2.x |
| **图标库** | Lucide React | — |
| **路由** | React Router | 7.x |
| **部署平台** | Vercel Serverless | — |

### 1.4 部署架构

```
┌─────────────────────────────────────────────────┐
│                  Vercel Edge                     │
│  ┌───────────────────────────────────────────┐  │
│  │           vercel.json 配置                 │  │
│  │  - Runtimes: nodejs                       │  │
│  │  - Build: npm install + Vite build        │  │
│  │  - Routes: /api/* → api/[[...path]].js    │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
┌──────────────────┐     ┌──────────────────────┐
│  Serverless API  │     │   Static Frontend    │
│  (Express App)   │     │   (Vite Build)       │
│                  │     │                      │
│  api/[[...path]] │     │  dist/assets/*.js    │
│       .js        │     │  dist/index.html     │
└────────┬─────────┘     └──────────────────────┘
         │
         ▼
┌──────────────────┐
│    SQLite DB      │
│  (libSQL/Turso)  │
└──────────────────┘
```

---

## 2. 技术架构

### 2.1 整体架构图

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
│  │  users | api_keys | providers | requests   │               │
│  │  audit_logs | routing_rules | batch_tasks │               │
│  │  tools | async_tasks | cost_configs       │               │
│  └─────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 核心组件

| 组件 | 职责 | 技术实现 |
|-----|------|---------|
| **API Gateway** | 统一入口，请求路由 | Express.js |
| **Auth Middleware** | API Key验证 + JWT认证 | JWT + bcrypt + Cookie |
| **Provider Service** | 通用API代理服务 | Axios封装 |
| **Monitor Service** | 实时监控统计 | Socket.IO |
| **Router Service** | 智能路由与故障转移 | 自定义算法 |
| **Batch Service** | 请求批处理与队列管理 | 自定义队列 |
| **Tool Service** | 函数调用与工具执行 | 安全沙箱 |
| **Vision Service** | 图像理解与生成 | 多模态API代理 |
| **Webhook Service** | 回调通知与异步任务 | HTTP Client + 任务队列 |
| **Cost Service** | 费用计算与统计 | Token价格匹配 |
| **Quota Service** | 用户配额管理 | 每日/月度限制 |
| **Database** | 持久化存储 | SQLite (better-sqlite3) |
| **Frontend** | Web Dashboard | React 19 + TypeScript + Vite + TailwindCSS |
| **State Management** | 前端状态管理 | Zustand (slices: auth, providers, stats) |

### 2.3 目录结构

```
silver-telegram/
├── api/
│   └── [[...path]].js          # Vercel Serverless 入口
├── src/
│   ├── server.js               # Express 应用主入口
│   ├── local.db                # SQLite 数据库文件
│   ├── config/
│   │   └── index.js            # 环境变量配置
│   ├── middleware/
│   │   ├── auth.js             # JWT + API Key 认证中间件
│   │   └── rateLimit.js        # 速率限制中间件
│   ├── routes/
│   │   ├── auth.js             # 注册/登录/登出
│   │   ├── apiKeys.js          # API Key CRUD
│   │   ├── providers.js        # 厂商配置 CRUD + 测试/模型列表
│   │   ├── chat.js             # 聊天补全（核心路由）
│   │   ├── monitor.js          # 监控统计
│   │   ├── audit.js            # 审计日志
│   │   ├── cost.js             # 费用统计
│   │   ├── routing.js          # 路由规则
│   │   ├── batch.js            # 批处理
│   │   ├── tools.js            # 工具注册
│   │   ├── vision.js           # 图像理解
│   │   ├── images.js           # 图像生成
│   │   ├── async.js            # 异步任务
│   │   └── webhooks.js         # Webhook 回调
│   ├── services/
│   │   ├── providerService.js  # 通用 AI API 代理
│   │   ├── routerService.js    # 智能路由
│   │   ├── batchService.js     # 批处理
│   │   ├── toolService.js      # 工具执行
│   │   ├── visionService.js    # 视觉分析
│   │   ├── costService.js      # 费用计算
│   │   ├── quotaService.js     # 配额管理
│   │   └── auditService.js     # 审计记录
│   └── utils/
│       ├── db.js               # SQLite 数据库连接与初始化
│       ├── logger.js           # 日志系统
│       ├── cache.js            # Prompt 缓存
│       └── retry.js            # 自动重试
├── frontend/
│   ├── index.html              # SPA 入口
│   ├── vite.config.ts          # Vite 配置
│   ├── package.json
│   └── src/
│       ├── main.tsx            # React 挂载入口
│       ├── App.tsx             # 路由 + ErrorBoundary + Suspense
│       ├── index.css           # Apple 设计 Token + 全局样式
│       ├── store/
│       │   └── index.ts        # Zustand Store (auth/providers/stats slices)
│       ├── services/
│       │   └── api.ts          # Axios 封装（拦截器、认证）
│       ├── components/
│       │   └── ErrorBoundary.tsx
│       └── pages/
│           ├── Login.tsx       # 注册/登录
│           ├── Layout.tsx      # 导航栏布局
│           ├── Home.tsx        # 仪表盘
│           ├── Settings.tsx    # 厂商管理
│           ├── ApiKeys.tsx     # API Key 管理
│           ├── Monitor.tsx     # 实时监控
│           └── AuditLogs.tsx   # 审计日志
├── vercel.json                 # Vercel 部署配置
├── package.json                # 根依赖
└── .env.example                # 环境变量模板
```

### 2.4 数据流

#### 2.4.1 API 调用流程

```
用户请求 /api/v1/completions
    │
    ▼
api/[[...path]].js  → 加载 Express App
    │
    ▼
Rate Limiting Middleware（检查频率限制）
    │
    ▼
Auth Middleware（JWT/Cookie 认证 + API Key 验证）
    │
    ▼
Chat Route（解析请求参数，获取 provider_id/model/messages）
    │
    ▼
Provider Service（构造厂商 API 请求，代理转发）
    │
    ├──→ Router Service（智能选择最佳厂商）
    │
    ├──→ Cache Service（检查 Prompt 缓存命中）
    │
    ▼
向厂商 API 发起 HTTP 请求（Axios + 超时 + 重试）
    │
    ▼
记录调用日志 → requests 表（含 token 用量、延迟、费用）
    │
    ▼
Socket.IO 推送实时监控数据 → 前端 Dashboard
    │
    ▼
返回 AI 响应给用户
```

#### 2.4.2 登录认证流程

```
POST /api/auth/login
    │
    ▼
Auth Route（验证 email/password）
    │
    ▼
bcrypt.compare(password, hash) → 密码验证
    │
    ▼
jwt.sign({ userId }, JWT_SECRET) → 生成 Token
    │
    ▼
res.cookie('token', jwtToken, { httpOnly, secure, sameSite }) → Cookie
    │
    ▼
前端接入：
    ├── Cookie 模式：浏览器自动携带
    └── Bearer Token 模式：X-API-Key Header
```

---

## 3. 数据库设计

### 3.1 数据库实现说明
- **引擎**：SQLite（`better-sqlite3` 同步驱动）
- **文件**：`src/local.db`
- **初始化**：`src/utils/db.js` 顺序执行 DDL（已修复竞态问题）
- **索引优化**：已添加 user_id, api_key_id, created_at 等 7 个关键索引

### 3.2 表结构一览

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| **users** | 用户账户 | id(UUID), email, password_hash, name |
| **api_keys** | API 密钥 | id(UUID), user_id(FK), key, name, enabled |
| **providers** | AI 厂商配置 | id(UUID), user_id(FK), provider_type, base_url, api_key |
| **requests** | 调用记录 | id(UUID), api_key_id(FK), provider, model, status_code, latency, tokens, cost |
| **audit_logs** | 操作审计 | id(UUID), user_id(FK), action, details, ip_address |
| **routing_rules** | 路由规则 | id(UUID), user_id(FK), strategy, model_filter, provider_priority |
| **batch_tasks** | 批处理任务 | id(UUID), user_id(FK), status, requests(JSON), results(JSON) |
| **tools** | 工具注册 | id(UUID), user_id(FK), type, schema(JSON), endpoint |
| **async_tasks** | 异步任务 | id(UUID), user_id(FK), task_type, status, payload(JSON), webhook_url |

---

## 4. API接口设计

### 4.1 路由路径方案

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录（设置 Cookie + 返回 Token） |
| `/api/auth/logout` | POST | 用户登出 |
| `/api/auth/me` | GET | 当前用户信息 |
| `/api/keys` | GET/POST | API Key 列表/创建 |
| `/api/keys/:id` | PUT/DELETE | 更新/删除 Key |
| `/api/providers` | GET/POST | 厂商列表/添加 |
| `/api/providers/:id` | GET/PUT/DELETE | 厂商详情/更新/删除 |
| `/api/providers/:id/test` | POST | 连通性测试 |
| `/api/providers/:id/models` | GET | 模型列表 |
| `/api/providers/:id/toggle` | POST | 启用/禁用 |
| `/api/v1/completions` | POST | 聊天补全（核心 AI 接口） |
| `/api/v1/chat/completions` | POST | 聊天补全（兼容路径） |
| `/api/monitor/stats` | GET | 调用统计 |
| `/api/monitor/history` | GET | 调用历史 |
| `/api/monitor/hourly` | GET | 小时统计 |
| `/api/monitor/realtime` | GET | 实时统计 |
| `/api/audit/logs` | GET | 审计日志 |
| `/api/routing/rules` | GET/POST | 路由规则 |
| `/api/routing/rules/:id` | GET/PUT/DELETE | 规则 CRUD |
| `/api/routing/healthcheck` | POST | 健康检查 |
| `/api/batch/tasks` | GET/POST | 批处理任务 |
| `/api/batch/tasks/:id` | GET/DELETE | 任务状态/取消 |
| `/api/tools` | GET/POST | 工具管理 |
| `/api/vision/analyze` | POST | 图像分析 |
| `/api/images/generations` | POST | 图像生成 |
| `/api/async/tasks` | GET/POST | 异步任务 |
| `/api/cost/estimate` | POST | 费用预估 |
| `/api/cost/history` | GET | 费用历史 |

### 4.2 认证方式对比

| 方式 | 场景 | 机制 |
|------|------|------|
| **Cookie + JWT** | Web Dashboard | `httpOnly` Cookie，自动携带 |
| **Bearer Token** | API 调用 | `Authorization: Bearer <token>` |
| **X-API-Key** | AI 聊天接口 | `X-API-Key: <api_key>` Header |

---

## 5. 前端架构与设计

### 5.1 技术栈
- React 19 + TypeScript（函数组件 + Hooks）
- Vite 6（构建、代理）
- TailwindCSS 3（原子化样式 + Apple 设计 Token）
- Zustand 5（分片状态管理：useAuthStore / useProvidersStore / useStatsStore）
- React Router 7（页面路由 + 懒加载 + Suspense）
- Recharts 2（数据可视化图表）
- Lucide React（图标库）
- Socket.IO Client（实时监控推送）

### 5.2 性能优化（已完成）
- **路由级代码拆分**：React.lazy + Suspense 懒加载（Login/Home 同步 + 其他异步）
- **Store 拆分**：单一大 Store 拆为 3 个独立 Store（auth/providers/stats）
- **Memoization**：Home/Layout/ApiKeys 使用 React.memo + useMemo
- **Vite 分包**：react/recharts/lucide 拆为独立 vendor chunks
- **首屏 JS**：从 ~800KB 降至 ~240KB（约 70% 减少）

### 5.3 Apple 设计 Token

定义于 [frontend/src/index.css](file:///workspace/silver-telegram/frontend/src/index.css)：

```css
:root {
  --apple-blue: #0071e3;
  --apple-gray-bg: #f5f5f7;
  --apple-text: #1d1d1f;
  --apple-text-secondary: #6e6e73;
  --apple-border: #d2d2d7;
  --apple-success: #34c759;
  --apple-warning: #ff9500;
  --apple-error: #ff3b30;
}
```

---

## 6. Bug 修复记录（Bug Audit）

### 6.1 已修复 Bug 汇总（2026-05 Bug Audit）

共审计发现 **66 个 Bug**（12 Critical / 14 High / 21 Medium / 19 Low），已修复 **26 个**：

| 严重级别 | 发现 | 已修复 | 覆盖范围 |
|----------|------|--------|---------|
| **Critical** | 12 | 12 (100%) | RCE、参数传递、数据丢失、SQL 索引、配置构建 |
| **High** | 14 | 13 (93%) | 密钥脱敏、认证健壮、数据过滤、竞态、useEffect 清理 |
| **Medium** | 21 | 4 (19%) | 流式记录、缓存费用、错误返回、logout 调用 |
| **Low** | 19 | 0 | 建议性优化 |

### 6.2 关键修复项

| Bug ID | 描述 | 修复文件 |
|--------|------|---------|
| C-1 | `eval()` RCE 风险 | `src/services/toolService.js` → 改为 `Function()` 白名单 |
| C-2/C-3 | `chatCompletion` 参数传递错误 | `batchService.js`, `visionService.js` |
| C-4/C-5/C-6 | 数据库索引/`lastID`/DDL 顺序 | `src/utils/db.js` |
| C-7 | 15+ TailwindCSS 前缀缺失 | `Settings.tsx`, `Monitor.tsx`, `ApiKeys.tsx` |
| C-8/C-9/C-10 | 认证清理/404路由/ErrorBoundary | `App.tsx`, `components/ErrorBoundary.tsx` |
| C-11 | @types/react 版本不匹配 | `frontend/package.json` |
| C-12 | vercel.json 根目录构建失败 | `vercel.json` buildCommand |
| H-1 | API Key/Provider Key 脱敏 | `apiKeys.js`, `providers.js` |
| H-11 | 图表假数据修复 | `Home.tsx` → 使用真实数据 |

---

## 7. 当前已知问题（待修复）

### 7.1 安全合规问题

| # | 问题 | 位置 | 严重度 |
|---|------|------|--------|
| 1 | CSP（Content-Security-Policy）被显式禁用 | `src/server.js` L42 | HIGH |
| 2 | vercel.json 缺少安全响应头 | `vercel.json` | HIGH |
| 3 | Vercel 环境跳过速率限制 | `src/server.js` L54 | HIGH |
| 4 | Body 大小限制 50MB（应 ≤5MB） | `src/server.js` L64 | HIGH |
| 5 | 错误堆栈暴露给客户端 | `api/[[...path]].js` L13 | HIGH |
| 6 | JWT Token localStorage 存储（XSS 风险） | `Login.tsx`, `store/index.ts` | CRITICAL |
| 7 | 未配置 trust proxy | `src/server.js` | MEDIUM |
| 8 | CORS 缺少生产兜底 | `src/server.js` L45 | MEDIUM |
| 9 | Cookie 缺少 path 属性 | `src/routes/auth.js` L60 | MEDIUM |
| 10 | 登出时 Token 清理不完整 | `store/index.ts` | MEDIUM |

### 7.2 性能优化项

| # | 优化项 | 位置 | 影响 |
|---|--------|------|------|
| 1 | Vite sourcemap 在生产启用 | `vite.config.ts` | 源码泄漏风险 |
| 2 | 未拆包依赖（zustand/router/socket） | `vite.config.ts` | 缓存命中率 |
| 3 | vercel.json buildCommand 冗余步骤 | `vercel.json` L2 | 构建速度 |

---

## 8. 部署说明

### 8.1 环境变量

```env
NODE_ENV=development          # development | production
PORT=3000                     # 本地端口
JWT_SECRET=xxxxxxxxxx         # JWT 签名密钥（必需）
JWT_EXPIRES_IN=24h            # Token 过期时间
FRONTEND_URL=http://localhost:5173  # 前端地址（CORS 用）
LOG_LEVEL=info                # debug | info | warn | error
```

### 8.2 本地运行

```bash
# 安装依赖
npm install && cd frontend && npm install && cd ..

# 启动后端（终端1）
npm start

# 启动前端（终端2）
cd frontend && npm run dev
```

- **后端**：http://localhost:3000
- **前端**：http://localhost:5173（Vite 代理 `/api` → 3000）

### 8.3 Vercel 部署

```json
{
  "buildCommand": "npm install && cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [{ "source": "/api/(.*)", "destination": "/api" }]
}
```

---

## 9. 附录

### 9.1 技术选型决策

| 决策 | 理由 |
|------|------|
| **通用API代理（非适配器模式）** | 用户无需为每个厂商写适配代码，支持任意 OpenAI 兼容接口 |
| **SQLite（非 PostgreSQL）** | 个人开发场景：零配置、单文件、易迁移 |
| **better-sqlite3（非异步驱动）** | 同步 API 简化代码，Vercel Serverless 环境单请求模式无并发瓶颈 |
| **Zustand（非 Redux）** | 轻量、TypeScript 友好、无模板代码 |
| **Apple 设计风格** | 大量留白、精致圆角、微妙阴影、清晰信息层级 |

### 9.2 安全最佳实践（已实现）

- ✅ `helmet()` 安全头中间件
- ✅ `x-powered-by` 已禁用
- ✅ JWT Token Cookie 设置 `httpOnly` + `secure`（生产）+ `sameSite: lax`
- ✅ bcrypt 密码哈希（cost factor = 10）
- ✅ `eval()` 已移除（改为 `Function()` + 白名单校验）
- ✅ API Key / Provider Key 列表接口脱敏显示
- ✅ 请求记录 `user_id` 隔离

### 9.3 安全最佳实践（待实现）

- ⬜ Helmet CSP 升级为更严格的 nonce-based 策略
- ⬜ Trusted Types 强制执行
- ⬜ 升级 Helmet 至 v8.x

### 9.4 当前架构局限

- **Serverless 冷启动**：Vercel 每次请求可能创建新 Express 实例，Socket.IO 实时推送在 Serverless 下不稳定
- **SQLite 并发**：Serverless 环境多实例可能数据库文件冲突
- **速率限制状态**：express-rate-limit 内存存储不持久化，Serverless 重启后丢失
- **流式响应**：Vercel Serverless 对流式（SSE）支持有限

---

**版本**: v4.2.0  
**创建日期**: 2026-05-05  
**最后更新**: 2026-05-23  
**状态**: 核心功能完成 + 性能优化完成 + 安全加固完成