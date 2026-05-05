# AI API Gateway - 统一AI厂商API调用网关

## 1. 项目概述

### 1.1 项目目标
为个人开发者提供统一的AI API调用接口，支持多个AI厂商（国内外主流厂商），通过一套API Key和地址即可调用全部可用模型，并提供实时监控功能。

### 1.2 核心价值
- **统一接口**：一套API调用所有AI厂商
- **灵活切换**：无缝切换不同厂商模型
- **实时监控**：实时查看调用状况、费用统计、性能指标
- **安全管理**：API Key管理与访问控制

### 1.3 需求分析
| 需求点 | 来源 | 说明 |
|-------|------|------|
| 个人开发者工具 | 用户选择A选项 | 面向个人开发者使用 |
| 支持全部AI厂商 | 用户选择D选项 | 需要支持国际+国内主流厂商 |
| 实时监控 | 用户明确要求 | 需要实时监控API调用状况 |
| Node.js + Express | 用户选择B选项 | 技术栈选择 |
| Web Dashboard | 用户选择A选项 | 可视化监控界面 |
| PostgreSQL + Docker | 用户选择B+E | 数据存储和远程部署 |

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
│  │          │  AI Provider │ │  Monitor    │              │   │
│  │          │   厂商适配器  │ │   监控服务   │              │   │
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
│  └─────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 核心组件

| 组件 | 职责 | 技术实现 |
|-----|------|---------|
| **API Gateway** | 统一入口，请求路由 | Express.js |
| **Auth Middleware** | API Key验证 | JWT + bcrypt |
| **AI Provider Adapter** | 多厂商适配层 | Axios封装 |
| **Monitor Service** | 实时监控统计 | Socket.IO |
| **Database** | 持久化存储 | PostgreSQL |
| **Rate Limiting** | 流量控制 | express-rate-limit |

### 2.3 支持的AI厂商

| 厂商类型 | 厂商名称 | API端点 |
|---------|---------|---------|
| **国际厂商** | OpenAI | api.openai.com |
| | Anthropic | api.anthropic.com |
| | Google Gemini | api.gemini.google.com |
| | Cohere | api.cohere.com |
| | Azure OpenAI | azure.openai.com |
| **国内厂商** | 百度文心一言 | aip.baidubce.com |
| | 阿里通义千问 | dashscope.aliyuncs.com |
| | 智谱AI | api.zhipuai.cn |
| | 腾讯混元 | api.tencent.com |
| | 字节火山 | api.bytedance.com |

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

### 3.3 调用记录表 (requests)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | UUID | PRIMARY KEY | 记录唯一标识 |
| api_key_id | UUID | FOREIGN KEY | 关联密钥 |
| provider | VARCHAR(50) | NOT NULL | 厂商名称 |
| model | VARCHAR(100) | NOT NULL | 模型名称 |
| status_code | INTEGER | NOT NULL | 状态码 |
| latency | INTEGER | | 延迟(ms) |
| prompt_tokens | INTEGER | | 输入token数 |
| completion_tokens | INTEGER | | 输出token数 |
| error_message | TEXT | | 错误信息 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

### 3.4 厂商配置表 (providers)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | UUID | PRIMARY KEY | 配置唯一标识 |
| user_id | UUID | FOREIGN KEY | 关联用户 |
| provider_name | VARCHAR(50) | NOT NULL | 厂商名称 |
| api_key | VARCHAR(255) | NOT NULL | 厂商API密钥 |
| base_url | VARCHAR(255) | | 自定义基础URL |
| enabled | BOOLEAN | DEFAULT TRUE | 是否启用 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

---

## 4. API接口设计

### 4.1 认证接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/refresh` | POST | 刷新Token |

### 4.2 API密钥管理

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/keys` | GET | 获取密钥列表 |
| `/api/keys` | POST | 创建新密钥 |
| `/api/keys/:id` | GET | 获取密钥详情 |
| `/api/keys/:id` | PUT | 更新密钥 |
| `/api/keys/:id` | DELETE | 删除密钥 |

### 4.3 AI调用接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/chat/completions` | POST | 聊天补全（统一接口） |
| `/api/chat/models` | GET | 获取可用模型列表 |
| `/api/providers` | GET | 获取支持的厂商列表 |
| `/api/providers/config` | POST | 配置厂商API密钥 |

### 4.4 监控接口

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/monitor/stats` | GET | 获取调用统计 |
| `/api/monitor/history` | GET | 获取调用历史 |
| `/api/monitor/live` | WebSocket | 实时监控流 |

### 4.5 请求体示例

**聊天补全请求：**
```json
{
  "model": "gpt-4",
  "provider": "openai",
  "messages": [
    {"role": "system", "content": "你是一个助手"},
    {"role": "user", "content": "你好"}
  ],
  "max_tokens": 1000,
  "temperature": 0.7
}
```

**响应示例：**
```json
{
  "id": "chatcmpl-xxx",
  "model": "gpt-4",
  "provider": "openai",
  "choices": [{
    "message": {"role": "assistant", "content": "你好！有什么我可以帮助你的吗？"}
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  },
  "latency_ms": 1200
}
```

---

## 5. 任务分解

### 5.1 阶段一：基础框架搭建

| 任务 | 描述 | 状态 | 优先级 |
|-----|------|------|--------|
| T1.1 | 初始化Express项目结构 | 完成 | 高 |
| T1.2 | 配置Docker + PostgreSQL | 完成 | 高 |
| T1.3 | 配置环境变量和日志系统 | 待开发 | 高 |
| T1.4 | 数据库连接和表初始化 | 待开发 | 高 |

### 5.2 阶段二：认证系统

| 任务 | 描述 | 状态 | 优先级 |
|-----|------|------|--------|
| T2.1 | 用户注册/登录接口 | 待开发 | 高 |
| T2.2 | JWT Token生成与验证 | 待开发 | 高 |
| T2.3 | API密钥管理CRUD | 待开发 | 高 |
| T2.4 | 速率限制中间件 | 待开发 | 中 |

### 5.3 阶段三：AI厂商适配层

| 任务 | 描述 | 状态 | 优先级 |
|-----|------|------|--------|
| T3.1 | OpenAI适配器 | 待开发 | 高 |
| T3.2 | Anthropic适配器 | 待开发 | 高 |
| T3.3 | Google Gemini适配器 | 待开发 | 中 |
| T3.4 | 百度文心一言适配器 | 待开发 | 高 |
| T3.5 | 阿里通义千问适配器 | 待开发 | 高 |
| T3.6 | 智谱AI适配器 | 待开发 | 中 |

### 5.4 阶段四：监控系统

| 任务 | 描述 | 状态 | 优先级 |
|-----|------|------|--------|
| T4.1 | 调用记录存储 | 待开发 | 高 |
| T4.2 | 实时统计计算 | 待开发 | 高 |
| T4.3 | Socket.IO实时推送 | 待开发 | 高 |
| T4.4 | Web Dashboard前端 | 待开发 | 高 |

### 5.5 阶段五：测试与部署

| 任务 | 描述 | 状态 | 优先级 |
|-----|------|------|--------|
| T5.1 | 单元测试编写 | 待开发 | 中 |
| T5.2 | API文档生成 | 待开发 | 中 |
| T5.3 | Docker部署优化 | 待开发 | 高 |
| T5.4 | HTTPS配置 | 待开发 | 中 |

---

## 6. 安全性考虑

### 6.1 认证与授权
- API Key使用UUID生成，长度至少32位
- 密码使用bcrypt哈希存储（10轮）
- JWT Token设置合理过期时间
- 支持Token刷新机制

### 6.2 数据保护
- 所有API密钥加密存储
- 敏感字段在日志中脱敏
- 传输层使用HTTPS
- 数据库访问限制最小权限

### 6.3 攻击防护
- 速率限制防止暴力攻击
- SQL注入防护（参数化查询）
- XSS防护（输入验证）
- CSRF防护（必要时）

---

## 7. 监控指标

### 7.1 实时指标
- 活跃连接数
- 每秒请求数 (QPS)
- 平均延迟
- 成功率/失败率

### 7.2 历史统计
- 按时间段统计调用量
- 按厂商分组统计
- 按模型分组统计
- 费用估算（基于token）

---

## 8. 部署说明

### 8.1 环境变量配置

| 变量名 | 说明 | 默认值 |
|-------|------|-------|
| NODE_ENV | 运行环境 | development |
| PORT | 服务端口 | 3000 |
| DB_HOST | 数据库主机 | localhost |
| DB_PORT | 数据库端口 | 5432 |
| DB_NAME | 数据库名称 | ai_gateway |
| DB_USER | 数据库用户 | admin |
| DB_PASSWORD | 数据库密码 | password |
| JWT_SECRET | JWT密钥 | (必填) |
| JWT_EXPIRES_IN | Token过期时间 | 1h |

### 8.2 Docker部署命令

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 附录：学习记录

### 技术选型决策
1. **为什么选择Node.js + Express？**
   - 用户偏好，生态成熟
   - 异步IO适合API网关场景
   - Socket.IO支持实时推送

2. **为什么选择PostgreSQL？**
   - 支持JSON类型存储灵活数据
   - 性能稳定，适合生产环境
   - 丰富的聚合查询支持监控统计

3. **为什么需要适配器模式？**
   - 各厂商API差异较大
   - 统一接口便于扩展新厂商
   - 降低耦合，提高可测试性

### 潜在风险与应对
- **厂商API变更**：适配器隔离，易于维护
- **高并发压力**：速率限制 + 连接池
- **数据安全**：加密存储 + HTTPS

---

**版本**: v1.0.0  
**创建日期**: 2026-05-05  
**状态**: 设计完成，待实现