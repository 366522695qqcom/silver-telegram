# AI API Gateway - 项目技术规范

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
- **多Key轮询**：同一提供商支持多个API Key（逗号分隔），平均轮询调用

---

## 2. 技术架构

### 2.1 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 后端 | Node.js + Express | API Gateway 核心 |
| 数据库 | Turso (LibSQL/SQLite) | 边缘数据库，兼容 SQLite |
| 前端 | React 19 + TypeScript + Vite | Apple 风格 Dashboard |
| 状态管理 | Zustand | 轻量级响应式状态 |
| 样式 | TailwindCSS | Apple 设计系统 |
| 图表 | Recharts | 监控数据可视化 |
| 图标 | Lucide React | 统一图标库 |
| 认证 | JWT + bcrypt | Token + Cookie 双模式 |
| 部署 | Vercel (Serverless) | 零运维部署 |

### 2.2 整体架构

```
┌──────────────────────────────────────────────────────┐
│                      用户层                           │
│  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │  REST API    │  │     Web Dashboard            │ │
│  │  调用接口     │  │  HTTP 轮询 (10s/5s 刷新)     │ │
│  └──────┬───────┘  └──────────┬───────────────────┘ │
└─────────┼─────────────────────┼──────────────────────┘
          │                     │
┌─────────▼─────────────────────▼──────────────────────┐
│                      服务层                           │
│  ┌─────────────────────────────────────────────────┐ │
│  │              Express Gateway                     │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐│ │
│  │  │ Auth     │ │ Key      │ │ Rate Limiting    ││ │
│  │  │ 环境变量  │ │ Rotation │ │ 限流保护         ││ │
│  │  └────┬─────┘ └────┬─────┘ └────────┬─────────┘│ │
│  │       └─────────────┼───────────────┘          │ │
│  │                     ▼                           │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐│ │
│  │  │ Provider │ │ Monitor  │ │ Cost             ││ │
│  │  │ Service  │ │ Stats    │ │ Calculator       ││ │
│  │  │ (代理)   │ │ (统计)   │ │ (费用)           ││ │
│  │  └────┬─────┘ └────┬─────┘ └────────┬─────────┘│ │
│  └───────┼─────────────┼───────────────┘          │ │
└──────────┼─────────────┼──────────────────────────┘
           │             │
┌──────────▼─────────────▼──────────────────────────┐
│                      数据层                         │
│  ┌──────────────────────────────────────────────┐ │
│  │            Turso (LibSQL)                    │ │
│  │  ┌────────┐ ┌─────────┐ ┌─────────────────┐ │ │
│  │  │ users  │ │api_keys │ │   providers     │ │ │
│  │  └────────┘ └─────────┘ └─────────────────┘ │ │
│  │  ┌────────┐ ┌─────────────────────────────┐ │ │
│  │  │requests│ │     custom_models           │ │ │
│  │  └────────┘ └─────────────────────────────┘ │ │
│  └──────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

### 2.3 已删除的模块

以下模块在迭代中已删除（用户要求简化）：
- ~~智能路由~~ — 路由规则表、健康检查
- ~~批处理~~ — 批处理任务表、队列管理
- ~~工具管理~~ — 工具注册表、安全沙箱
- ~~视觉功能~~ — 图像理解与生成
- ~~异步任务~~ — 异步任务表、Webhook 回调

---

## 3. 数据库设计

### 3.1 数据库实现

- **引擎**：Turso (LibSQL)，兼容 SQLite
- **连接**：`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`
- **本地开发**：`file:./local.db`（无需 Token）
- **初始化**：`src/utils/db.js` — 首次启动自动建表
- **类型转换**：`src/config/turso.js` — `extractTursoValue` 处理 Pipeline API 返回值

### 3.2 用户表 (users)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | UUID | PRIMARY KEY | 用户唯一标识 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱（来自 ADMIN_EMAIL 环境变量） |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 |
| name | VARCHAR(100) | | 用户名 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

### 3.3 API密钥表 (api_keys)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | UUID | PRIMARY KEY | 密钥唯一标识 |
| user_id | UUID | FOREIGN KEY | 关联用户 |
| key | VARCHAR(64) | UNIQUE, NOT NULL | API密钥值 |
| name | VARCHAR(100) | | 密钥名称 |
| enabled | INTEGER | DEFAULT 1 | 是否启用（0/1，SQLite 无 BOOLEAN） |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| expires_at | TIMESTAMP | | 过期时间 |

### 3.4 厂商配置表 (providers)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | UUID | PRIMARY KEY | 配置唯一标识 |
| user_id | UUID | FOREIGN KEY | 关联用户 |
| provider_name | VARCHAR(100) | NOT NULL | 厂商名称 |
| provider_type | VARCHAR(50) | DEFAULT 'openai' | 接口类型 |
| api_key | VARCHAR(255) | NOT NULL | 厂商API密钥（支持逗号分隔多Key） |
| base_url | VARCHAR(255) | NOT NULL | API基础地址 |
| enabled | INTEGER | DEFAULT 1 | 是否启用 |
| avg_latency | REAL | | 平均延迟(ms)，移动平均 |
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
| cost | REAL | | 调用费用 |
| error_message | TEXT | | 错误信息 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

### 3.6 自定义模型表 (custom_models)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | UUID | PRIMARY KEY | 模型唯一标识 |
| user_id | UUID | FOREIGN KEY | 关联用户 |
| provider_id | UUID | FOREIGN KEY | 关联厂商 |
| model_id | VARCHAR(100) | NOT NULL | 模型ID |
| model_name | VARCHAR(100) | | 显示名称 |
| model_type | VARCHAR(50) | DEFAULT 'chat' | 模型类型 |
| capabilities | TEXT | | 能力描述 (JSON) |
| context_window | INTEGER | | 上下文窗口 |
| max_output_tokens | INTEGER | | 最大输出token |
| enabled | INTEGER | DEFAULT 1 | 是否启用 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

---

## 4. API接口设计

### 4.1 认证接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/auth/login` | POST | 用户登录（环境变量凭证，无注册） |
| `/api/auth/me` | GET | 获取当前用户信息 |

### 4.2 API密钥管理

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/keys` | GET | 获取密钥列表 |
| `/api/keys` | POST | 创建新密钥 |
| `/api/keys/:id/toggle` | PUT | 切换密钥启用/禁用 |
| `/api/keys/:id` | DELETE | 删除密钥 |

### 4.3 厂商管理

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/providers` | GET | 获取厂商列表 |
| `/api/providers` | POST | 添加厂商配置 |
| `/api/providers/:id` | PUT | 更新厂商配置 |
| `/api/providers/:id` | DELETE | 删除厂商配置 |
| `/api/providers/:id/test` | POST | 测试连通性 |
| `/api/providers/:id/models` | GET | 获取模型列表 |

### 4.4 AI调用接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/v1/chat/completions` | POST | 聊天补全 |
| `/api/v1/chat/embeddings` | POST | 文本嵌入 |

### 4.5 监控接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/monitor/stats` | GET | 统计信息（含 top_providers, top_models） |
| `/api/monitor/realtime` | GET | 实时统计 |
| `/api/monitor/daily` | GET | 每日统计（7天） |
| `/api/monitor/requests` | GET | 请求列表 |
| `/api/monitor/hourly` | GET | 小时统计 |
| `/api/monitor/models` | GET | 模型统计 |

### 4.6 自定义模型

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/custom-models` | GET | 获取自定义模型列表 |
| `/api/custom-models/batch` | POST | 批量创建模型 |
| `/api/custom-models/:id/toggle` | PUT | 切换模型状态 |
| `/api/custom-models/:id` | PUT | 更新模型 |
| `/api/custom-models/:id` | DELETE | 删除模型 |

### 4.7 诊断接口（调试用）

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/debug-keys` | GET | API Key 调试信息 |
| `/api/debug-stats` | GET | 数据库统计诊断 |
| `/api/test-request` | POST | 发送测试请求（验证数据链路） |

---

## 5. 关键技术决策与踩坑记录

### 5.1 Turso Pipeline API 类型陷阱

**问题**：Turso 的 Pipeline API 返回 `integer` 类型字段值为**字符串**（如 `"0"`, `"1"`），而非 JavaScript 的 Number。

**影响**：
- `"0"` 在 JS 中是 truthy，导致 `if (row.enabled)` 判断错误
- `parseInt("100")` 对已经是 Number 的值安全，但 `parseInt(100.7)` 会截断小数
- `AVG()` 返回浮点数字符串如 `"1036.0523716109997"`

**解决方案**：
1. `extractTursoValue` 函数统一类型转换（`src/config/turso.js`）
2. 所有 `enabled` 判断使用 `Number(row.enabled) === 1`
3. 所有数值显示使用 `Math.round(Number(value))`
4. **绝对不要**用 `parseInt` 处理 Turso 返回值

```javascript
// ❌ 错误
if (row.enabled) { ... }           // "0" 是 truthy
const latency = parseInt(row.avg); // 截断小数

// ✅ 正确
if (Number(row.enabled) === 1) { ... }
const latency = Math.round(Number(row.avg));
```

### 5.2 Vercel 不支持 WebSocket

**问题**：Monitor 页面使用 `socket.io-client` 实时推送，但 Vercel 是 Serverless 环境，WebSocket 连接无法建立。

**解决方案**：
- 移除 `socket.io-client`
- 改用 HTTP 轮询：仪表盘 10 秒，监控页面 5 秒
- 使用 `useCallback` 包裹 fetch 函数修复闭包问题

### 5.3 useEffect + setInterval 闭包陷阱

**问题**：`useEffect` 中 `setInterval(fetchData, 30000)` 捕获了初始渲染时的 `fetchData` 闭包，后续状态更新不会反映到 interval 回调中。

**解决方案**：
```tsx
// ❌ 错误 — 闭包捕获过时状态
useEffect(() => {
  const fetchData = async () => { ... };
  setInterval(fetchData, 10000);
}, []);

// ✅ 正确 — useCallback + 正确的依赖
const fetchData = useCallback(async () => { ... }, [setProviders, setApiKeys]);

useEffect(() => {
  fetchData();
  const id = setInterval(fetchData, 10000);
  return () => clearInterval(id);
}, [fetchData]);
```

### 5.4 SQLite 时区问题

**问题**：`DATE('now')` 使用 UTC，中国用户需要今日数据但 UTC+8 跨日不同步。

**解决方案**：
```sql
-- 今日请求（UTC+8）
datetime('now', 'start of day', '-6 days')  -- daily 端点
```

### 5.5 移动平均延迟浮点精度

**问题**：`routerService.recordProviderStatus` 使用 `(avg_latency * 9 + latency) / 10` 移动平均公式，SQLite 浮点除法累积精度误差，产生 `1036.0523716109997` 这样的值。

**解决方案**：providers 路由返回时统一 `Math.round(Number(row.avg_latency))`，前端显示也加 `Math.round()`。

### 5.6 Chat API 空错误响应

**问题**：`providerService.chatCompletion` 的 catch 块使用 `error.response?.data?.error?.message || error.message`，当两者都为空时返回 `{"error": ""}`。

**解决方案**：`extractErrorMessage` 方法按优先级构建错误信息：
1. `data.error.message`（标准 OpenAI 格式）
2. `data.message`（某些 provider 格式）
3. `data.error`（字符串类型）
4. `"Provider error: HTTP " + status`
5. `"Request timeout"`（ECONNABORTED）
6. `"Network error: " + error.code`
7. `error.message`（兜底）
8. `"Unknown error"`（最终兜底）

### 5.7 认证系统简化

**问题**：注册功能对个人开发者不必要，且存在安全风险。

**解决方案**：
- 删除 `/register` 路由
- 登录时检查 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 环境变量
- 首次登录自动在数据库中创建用户（find-or-create）

### 5.8 多 API Key 轮询

**问题**：同一提供商需要支持多个 API Key，避免单 Key 限流。

**解决方案**：
- `api_key` 字段支持逗号分隔多个 Key
- `keyRotation.js` 使用 Map 存储每个 provider 的计数器
- Round-Robin 轮询选择 Key

### 5.9 Vercel 构建配置

**问题**：Vercel 默认构建不适用于本项目的前后端混合架构。

**解决方案**：
- 自定义 `vercel-build.js` 构建脚本
- esbuild 打包后端为单文件
- Vite 打包前端静态资源
- 输出 Vercel Build Output API v3 格式

### 5.10 前端性能优化

**问题**：Settings 页面 INP 过高（1349ms），首屏加载慢。

**解决方案**：
1. Settings 页面拆分子组件（ProviderList, ProviderDetail, ModelModal, ModelSelector），React.memo 包裹
2. React.lazy + Suspense 路由懒加载（Settings, ApiKeys, Monitor, AuditLogs）
3. Vite manualChunks 代码分割（recharts, lucide-react 独立 chunk）
4. 首屏 gzipped 约 66KB

---

## 6. 前端架构

### 6.1 页面结构

| 页面 | 文件 | 功能 |
|------|------|------|
| 登录 | `Login.tsx` | 环境变量凭证登录（无注册） |
| 仪表盘 | `Home.tsx` | 统计卡片 + 7天趋势图 + Top提供商 + 实时状态，10秒自动刷新 |
| 设置 | `Settings.tsx` | 提供商管理 + 自定义模型，拆分为4个子组件 |
| API密钥 | `ApiKeys.tsx` | 密钥CRUD + 使用说明 |
| 监控 | `Monitor.tsx` | 实时统计 + 请求列表，5秒自动刷新 |
| 审计日志 | `AuditLogs.tsx` | 操作日志查看 |

### 6.2 Settings 子组件

| 组件 | 文件 | 功能 |
|------|------|------|
| ProviderList | `ProviderList.tsx` | 左侧提供商列表 |
| ProviderDetail | `ProviderDetail.tsx` | 右侧详情面板（编辑/测试/模型） |
| ModelModal | `ModelModal.tsx` | 添加模型弹窗 |
| ModelSelector | `ModelSelector.tsx` | 模型选择器（标记已添加模型） |

### 6.3 状态管理

```typescript
// Zustand Store 结构
{
  user: User | null,
  isAuthenticated: boolean,
  error: string | null,
  providers: Provider[],
  apiKeys: ApiKey[],
  stats: Stats | null,

  // Actions
  setUser, setIsAuthenticated, setError,
  setProviders, setApiKeys, setStats,
  logout
}
```

---

## 7. 测试体系

### 7.1 后端测试（Jest）

| 测试文件 | 测试数 | 覆盖范围 |
|---------|--------|---------|
| `turso.test.js` | 22 | extractTursoValue, convertTursoRows, toTursoValue |
| `keyRotation.test.js` | 15 | selectApiKey, getApiKeyCount, getFirstApiKey |
| `cache.test.js` | 10 | set/get, delete, clear, generateCacheKey, TTL |
| `retry.test.js` | 11 | success, retryable codes, non-retryable, max retries, backoff |
| `auth.test.js` | 10 | authenticateToken, authenticateApiKey |
| `apiKeys.test.js` | 8 | GET, POST, toggle, DELETE |
| `monitor.test.js` | 7 | /realtime, /stats, /daily |
| `chat.test.js` | 4 | INSERT recording, error recording |
| `providerService.test.js` | 10 | extractErrorMessage 各种场景 |

### 7.2 前端测试（Vitest）

| 测试文件 | 测试数 | 覆盖范围 |
|---------|--------|---------|
| `Home.test.tsx` | 5 | 数据渲染, 空状态, store响应式, 10秒轮询, 卸载清理 |
| `Monitor.test.tsx` | 2 | 统计渲染, 5秒轮询 |
| `api.test.ts` | 4 | success, timeout, 401, token header |

---

## 8. 环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `TURSO_DATABASE_URL` | ✅ | - | Turso 连接地址。本地用 `file:./local.db` |
| `TURSO_AUTH_TOKEN` | 线上必填 | - | Turso 认证 Token |
| `JWT_SECRET` | ✅ | - | JWT 签名密钥 |
| `ADMIN_EMAIL` | ✅ | - | 管理员登录邮箱 |
| `ADMIN_PASSWORD` | ✅ | - | 管理员登录密码 |
| `JWT_EXPIRES_IN` | ❌ | `7d` | Token 过期时间 |
| `PORT` | ❌ | `3000` | 本地开发端口 |
| `NODE_ENV` | ❌ | `development` | 运行环境 |

---

## 9. 部署

### 9.1 Vercel 部署（推荐）

1. 获取 Turso 数据库（免费）：https://turso.tech/
2. Fork 项目到 GitHub
3. Vercel 导入项目
4. 配置 5 个必填环境变量
5. 部署

### 9.2 本地开发

```bash
npm install && cd frontend && npm install
cp .env.example .env  # 编辑环境变量
npm run dev           # 后端 :3000
cd frontend && npm run dev  # 前端 :5173
```

### 9.3 构建命令

```bash
node vercel-build.js  # 前后端一起构建
```

---

## 10. 项目结构

```
.
├── src/
│   ├── config/
│   │   └── turso.js              # Turso 连接 + 类型转换
│   ├── middleware/
│   │   ├── auth.js               # JWT 认证（Token + Cookie）
│   │   └── rateLimit.js          # 限流
│   ├── routes/
│   │   ├── auth.js               # 登录（环境变量凭证）
│   │   ├── apiKeys.js            # API 密钥管理
│   │   ├── chat.js               # AI 调用代理
│   │   ├── providers.js          # 厂商管理
│   │   ├── customModels.js       # 自定义模型
│   │   └── monitor.js            # 监控统计
│   ├── services/
│   │   ├── providerService.js    # 通用 API 代理 + 错误处理
│   │   ├── routerService.js      # 提供商状态记录
│   │   └── costService.js        # 费用计算
│   ├── utils/
│   │   ├── db.js                 # 数据库工具
│   │   ├── keyRotation.js        # 多 Key 轮询
│   │   ├── cache.js              # 请求缓存
│   │   └── retry.js              # 指数退避重试
│   └── server.js                 # 主服务入口
├── frontend/
│   └── src/
│       ├── pages/                # 页面组件
│       ├── components/settings/  # Settings 子组件
│       ├── services/api.ts       # API 服务层
│       └── store/index.ts        # Zustand 状态管理
├── vercel-build.js               # Vercel 构建脚本
├── jest.config.js                # Jest 配置
└── frontend/vitest.config.ts     # Vitest 配置
```

---

**版本**: v5.0.0
**最后更新**: 2026-05-23
