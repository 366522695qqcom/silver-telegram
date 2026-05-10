# AI API Gateway - 全功能 MCP 测试计划

## 摘要

使用 curl 命令对 AI API Gateway 的全部 API 端点进行端到端测试，覆盖认证、提供商管理、API Key 管理、聊天补全、嵌入、监控、审计日志、成本管理共 8 大模块。

## 当前状态

- 后端运行在 http://localhost:3000
- 前端运行在 http://localhost:5173
- 已有测试用户 token（可能过期，需重新注册/登录）
- 已有 Google AI 提供商（ID: 48b038df-87a5-4efe-986d-86b97fef7e74）

## 测试步骤

### 第1步：认证模块（3个端点）

1. `POST /api/auth/register` - 注册新用户
2. `POST /api/auth/login` - 登录获取 token
3. `GET /api/auth/me` - 获取当前用户信息

### 第2步：提供商管理（7个端点）

4. `POST /api/providers` - 创建提供商（Google AI，使用提供的 Key 和 URL）
5. `GET /api/providers` - 获取提供商列表
6. `GET /api/providers/:id` - 获取提供商详情（验证 api_key 返回）
7. `PUT /api/providers/:id` - 更新提供商
8. `POST /api/providers/:id/toggle` - 切换启用状态
9. `POST /api/providers/:id/test` - 测试连接
10. `GET /api/providers/:id/models` - 获取模型列表

### 第3步：API Key 管理（5个端点）

11. `POST /api/api-keys` - 创建 API Key
12. `GET /api/api-keys` - 获取 API Key 列表
13. `GET /api/api-keys/:id` - 获取单个 API Key
14. `PUT /api/api-keys/:id` - 更新 API Key
15. `DELETE /api/api-keys/:id` - 删除 API Key

### 第4步：聊天补全（3个端点）

16. `POST /api/chat/completions` - 聊天补全（使用 API Key 认证）
17. `POST /api/chat/completions` - 带 provider_id 的聊天补全
18. `GET /api/chat/models` - 获取可用模型列表（API Key 认证）

### 第5步：嵌入（1个端点）

19. `POST /api/chat/embeddings` - 文本嵌入

### 第6步：监控模块（5个端点）

20. `GET /api/monitoring/realtime` - 实时监控数据
21. `GET /api/monitoring/stats` - 统计数据
22. `GET /api/monitoring/requests` - 请求历史
23. `GET /api/monitoring/hourly` - 每小时统计
24. `GET /api/monitoring/models` - 模型统计

### 第7步：审计日志（2个端点）

25. `GET /api/audit` - 获取审计日志
26. `GET /api/audit/action/:action` - 按操作类型获取日志

### 第8步：成本管理（5个端点）

27. `GET /api/cost/monthly` - 月度使用情况
28. `GET /api/cost/history` - 成本历史
29. `GET /api/cost/quota` - 获取配额
30. `PUT /api/cost/quota` - 更新配额
31. `GET /api/cost/prices` - 获取价格表

### 第9步：前端构建验证

32. `npx tsc --noEmit` - TypeScript 类型检查
33. `npx vite build` - 前端构建

### 第10步：删除测试数据

34. `DELETE /api/providers/:id` - 删除测试提供商
35. `DELETE /api/api-keys/:id` - 删除测试 API Key

## 验证标准

- 所有端点返回正确的 HTTP 状态码
- 所有端点返回正确的数据结构
- 认证失败的请求返回 401
- 不存在的资源返回 404
- 聊天补全返回有效的 AI 响应
- 模型列表返回非空数组
- 监控数据与请求数据一致
