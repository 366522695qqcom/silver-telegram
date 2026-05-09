# 修复 Settings 页面两个按钮问题

## 摘要

修复 AI API Gateway 项目 Settings 页面的两个按钮问题：
1. **"测试连接"按钮** - 点击后报错 "Maximum number of redirects exceeded"
2. **"获取模型列表"按钮** - 点击后 loading 转一下，然后没有任何反应（没有模型显示，也没有错误提示）

## 当前状态分析

### 问题1：测试连接报错 "Maximum number of redirects exceeded"

**根因：**
- `providerService.testConnection()` 在 `/workspace/src/services/providerService.js:5-27` 中使用 `axios.get(testEndpoint, { maxRedirects: 5 })`
- 当外部 API (如 OpenAI 兼容接口) 返回 302/301 重定向时，axios 自动跟随重定向
- 某些 URL 配置会导致重定向循环（例如 http→https 跳转、路径补全跳转等），超过 maxRedirects 限制后抛出 "Maximum number of redirects exceeded"
- 用户期望：直接返回原始响应状态，不自动跟随重定向

**相关代码：**
```javascript
// providerService.js:18
const response = await axios.get(testEndpoint, { headers, timeout: 10000, maxRedirects: 5 });
```

### 问题2：获取模型列表点击后无反应

**根因：**
- `fetchModels` 在 `/workspace/frontend/src/pages/Settings.tsx:60-79` 中，catch 块只做了 `console.error` 和 `setModels([])`，没有向用户展示任何错误信息
- 当 `getModels` 在 `providerService.js:129-137` 抛出错误时（如网络错误、API Key 无效、重定向错误等），前端静默处理，用户看不到任何反馈
- 同时，`getModels` 本身也有重定向处理问题，使用 `maxRedirects: 0` + `validateStatus: () => true` 手动处理重定向，但 `testConnection` 和 `getModels` 的处理逻辑不一致

**相关代码：**
```typescript
// Settings.tsx:60-79
const fetchModels = async (providerId: string) => {
  if (isRefreshingModels) return;
  setIsRefreshingModels(true);
  try {
    const data = await providersAPI.getModels(providerId);
    // ...设置模型
  } catch (error) {
    console.error('Failed to fetch models:', error);  // 只在控制台输出，用户看不到
    setModels([]);  // 静默设置为空
  } finally {
    setIsRefreshingModels(false);
  }
};
```

**UI 渲染逻辑：**
- 模型列表只在 `models.length > 0` 时渲染 (`Settings.tsx:484`)
- 当获取失败或返回空数组时，没有任何"空状态"或"错误状态"的 UI 提示

## 方案决策

### 决策1：测试连接的重定向处理
- **选择**：直接返回原始响应状态，不自动跟随重定向
- **理由**：用户明确选择此方案。让使用者知道目标 URL 返回了重定向，从而去修正 Base URL 配置

### 决策2：获取模型列表的错误反馈
- **选择**：在 UI 上显示错误提示（不是弹窗/Toast，而是在按钮下方显示错误信息卡片）
- **理由**：用户描述"点击后转了一下，然后没反应"——说明 loading 状态正常，但完成后没有任何视觉反馈。需要在 UI 上明确告知用户发生了什么（如"连接超时"、"API Key 无效"、"返回 302 重定向"等）

### 决策3：模型列表空状态
- **选择**：当模型列表为空时，显示一个"未获取到模型"的提示区域
- **理由**：让用户知道"获取完成但结果为空"，而不是"点击没反应"

## 具体修改计划

### 修改1：修复 testConnection 重定向问题
**文件**：`/workspace/src/services/providerService.js`
**行范围**：5-27

将 `testConnection` 方法中的 `maxRedirects: 5` 改为 `maxRedirects: 0`，并添加 `validateStatus: () => true`，然后手动处理 301/302/307/308 状态码：

```javascript
async testConnection(config) {
  const { base_url, api_key, provider_type } = config;
  
  try {
    let testEndpoint = base_url;
    const headers = this.buildHeaders(provider_type, api_key);

    if (base_url.includes('/v1') || provider_type === 'openai') {
      testEndpoint = base_url.replace(/\/$/, '') + '/models';
    } else if (provider_type === 'anthropic') {
      return { success: true, message: 'Anthropic API key validated (no test endpoint)' };
    }

    const response = await axios.get(testEndpoint, { 
      headers, 
      timeout: 10000, 
      maxRedirects: 0,
      validateStatus: (status) => true 
    });

    if ([301, 302, 307, 308].includes(response.status)) {
      return { 
        success: false, 
        status: response.status,
        message: `目标返回 ${response.status} 重定向，请检查 Base URL 是否正确（Location: ${response.headers.location || 'unknown'}）` 
      };
    }

    if (response.status >= 200 && response.status < 300) {
      return { success: true, status: response.status, message: 'Connection successful' };
    }

    return { 
      success: false, 
      status: response.status,
      message: response.data?.error?.message || `HTTP ${response.status}` 
    };
  } catch (error) {
    return { 
      success: false, 
      status: error.response?.status,
      message: error.response?.data?.error?.message || error.message 
    };
  }
}
```

### 修改2：修复 getModels 重定向处理并改进错误信息
**文件**：`/workspace/src/services/providerService.js`
**行范围**：29-138

`getModels` 已经有 `maxRedirects: 0` 和手动重定向处理，但需要：
1. 当收到重定向响应时，返回更友好的错误信息（而不是空数组）
2. 统一错误处理，让前端能拿到具体的错误原因

修改重定向处理分支（line 62-101），当收到重定向时抛出带有明确信息的错误：

```javascript
if ([301, 302, 307, 308].includes(response.status)) {
  const redirectUrl = response.headers.location;
  throw new Error(`目标返回 ${response.status} 重定向，请检查 Base URL 是否正确（Location: ${redirectUrl || 'unknown'}）`);
}
```

同时修改 catch 块中的错误抛出，保留原始错误信息：

```javascript
catch (error) {
  console.error(`Failed to fetch models from ${base_url}:`, error.message);
  // 如果已经是自定义错误，直接抛出
  if (error.message.includes('重定向')) {
    throw error;
  }
  throw new Error(`无法获取模型列表: ${error.message}`);
}
```

### 修改3：前端添加模型获取错误状态显示
**文件**：`/workspace/frontend/src/pages/Settings.tsx`

1. **添加状态变量**（line 24-30 附近）：
```typescript
const [modelsError, setModelsError] = useState<string | null>(null);
```

2. **修改 fetchModels 函数**（line 60-79）：
```typescript
const fetchModels = async (providerId: string) => {
  if (isRefreshingModels) return;
  
  setIsRefreshingModels(true);
  setModelsError(null);  // 清除之前的错误
  try {
    const data = await providersAPI.getModels(providerId);
    if (data && data.models) {
      setModels(data.models);
    } else if (Array.isArray(data)) {
      setModels(data);
    } else {
      setModels([]);
    }
  } catch (error) {
    console.error('Failed to fetch models:', error);
    setModels([]);
    setModelsError((error as Error).message || '获取模型列表失败');  // 设置错误信息
  } finally {
    setIsRefreshingModels(false);
  }
};
```

3. **修改 handleSelectProvider**（line 81-92），清除错误状态：
```typescript
const handleSelectProvider = (provider: Provider) => {
  console.log('handleSelectProvider called with provider:', provider);
  setSelectedProvider(provider);
  setIsEditing(false);
  setTestResult(null);
  setModelsError(null);  // 切换提供商时清除错误
  setModels([]);  // 切换时清空模型列表
  // ...
};
```

4. **添加错误显示 UI**（在按钮下方、testResult 区域附近，line 456-482 之间）：

在 `{testResult && (...)}` 之后添加：

```tsx
{modelsError && (
  <div className="apple-card rounded-apple-md p-5 apple-badge-error border-2 border-red-200">
    <div className="flex items-center gap-3">
      <XCircle className="w-6 h-6" />
      <div>
        <p className="font-semibold text-red-800">获取模型失败</p>
        <p className="text-sm mt-1 text-red-600">{modelsError}</p>
      </div>
    </div>
  </div>
)}
```

5. **添加空状态提示**（修改 line 484 的模型列表渲染条件）：

将：
```tsx
{models.length > 0 && (
```
改为显示两种状态：
```tsx
{models.length > 0 ? (
  // 原有模型列表渲染...
) : !isRefreshingModels && !modelsError && (
  <div className="apple-card rounded-apple-md p-5 text-center">
    <p className="text-apple-text-secondary text-sm">暂无模型数据，点击"获取模型列表"按钮获取</p>
  </div>
)}
```

### 修改4：清除错误状态时机
在 `handleTestConnection` 中也清除 `modelsError`：

```typescript
const handleTestConnection = async () => {
  if (!selectedProvider) return;
  setIsTesting(true);
  setModelsError(null);  // 测试连接时清除模型错误
  // ...
};
```

## 验证步骤

1. 启动后端服务器：`node src/server.js`（端口 3000）
2. 启动前端开发服务器：`cd frontend && npm run dev`（端口 5173）
3. 访问 http://localhost:5173/settings
4. 选择一个配置了会返回 302 重定向的 Base URL 的提供商
5. 点击"测试连接"：
   - 预期：显示红色错误卡片，内容为"目标返回 302 重定向，请检查 Base URL 是否正确"
6. 点击"获取模型列表"：
   - 预期：按钮 loading 转动，然后显示红色错误卡片，内容为"获取模型失败: 目标返回 302 重定向..."
7. 修正 Base URL 为正确的地址后：
   - 点击"测试连接"：显示绿色"连接成功"
   - 点击"获取模型列表"：显示模型标签列表
8. 如果 API Key 无效：
   - 两个按钮都应显示相应的认证错误信息

## 假设与依赖

- 后端 `/api/providers/:id/test` 和 `/api/providers/:id/models` 路由正常工作
- `providerService` 中的 `buildHeaders` 方法能正确构建各提供商的认证头
- 前端 `providersAPI` 封装能正确传递错误信息
- 用户使用的 Base URL 确实是可访问的（网络连通）
