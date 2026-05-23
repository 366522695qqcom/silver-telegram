import React from 'react';
import {
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Globe,
  TestTube,
  Zap,
  Wifi,
  RotateCcw,
  Plus,
  Download,
  Eye,
  Brain,
  Wrench,
} from 'lucide-react';
import type { Provider, CreateProviderData, TestConnectionResult, CustomModel } from '@/types';

interface ProviderDetailProps {
  selectedProvider: Provider | null;
  isCreating: boolean;
  isEditing: boolean;
  formData: CreateProviderData;
  testResult: TestConnectionResult | null;
  customModels: CustomModel[];
  customModelTestResult: TestConnectionResult | null;
  customModelTestLoading: string | null;
  isTesting: boolean;
  isFetchingModels: boolean;
  showModelModal: boolean;
  isCreatingProvider: boolean;
  onCancelCreate: () => void;
  onCreate: () => void;
  onToggleEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  onToggleStatus: (provider: Provider) => void;
  onTestConnection: () => void;
  onFormDataChange: (data: CreateProviderData) => void;
  onFetchModels: () => void;
  onCreateModel: () => void;
  onResetModels: () => void;
  onToggleCustomModel: (id: string) => void;
  onTestCustomModel: (id: string) => void;
  onEditCustomModel: (cm: CustomModel) => void;
  onDeleteCustomModel: (id: string) => void;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('zh-CN');
};

const parseCapabilities = (capsStr: string | null | undefined) => {
  try {
    const parsed = JSON.parse(capsStr || '{}');
    return { vision: !!parsed.vision, reasoning: !!parsed.reasoning, tool_use: !!parsed.tool_use };
  } catch {
    return { vision: false, reasoning: false, tool_use: false };
  }
};

const ProviderDetail: React.FC<ProviderDetailProps> = React.memo(({ 
  selectedProvider,
  isCreating,
  isEditing,
  formData,
  testResult,
  customModels,
  customModelTestResult,
  customModelTestLoading,
  isTesting,
  isFetchingModels,
  showModelModal,
  isCreatingProvider,
  onCancelCreate,
  onCreate,
  onToggleEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onToggleStatus,
  onTestConnection,
  onFormDataChange,
  onFetchModels,
  onCreateModel,
  onResetModels,
  onToggleCustomModel,
  onTestCustomModel,
  onEditCustomModel,
  onDeleteCustomModel,
}) => {
  if (isCreating) {
    return (
      <div className="flex-1 p-8 overflow-y-auto min-h-full">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-apple-text mb-2">创建提供商</h2>
          <p className="text-apple-text-secondary">配置新的 AI 服务提供商</p>
        </div>
        <div className="space-y-5 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-apple-text mb-3">提供商名称</label>
            <input
              type="text"
              value={formData.provider_name}
              onChange={(e) => onFormDataChange({ ...formData, provider_name: e.target.value })}
              className="apple-input"
              placeholder="如: OpenAI"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-3">类型</label>
            <select
              value={formData.provider_type}
              onChange={(e) => onFormDataChange({ ...formData, provider_type: e.target.value })}
              className="apple-input"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="baidu">百度</option>
              <option value="alibaba">阿里云</option>
              <option value="zhipu">智谱AI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-3">API Key</label>
            <input
              type="password"
              value={formData.api_key}
              onChange={(e) => onFormDataChange({ ...formData, api_key: e.target.value })}
              className="apple-input"
              placeholder="sk-..."
            />
            <p className="text-xs text-apple-text-secondary mt-1.5">支持多个 Key，用英文逗号分隔，将自动轮询调用</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-3">Base URL</label>
            <input
              type="url"
              value={formData.base_url}
              onChange={(e) => onFormDataChange({ ...formData, base_url: e.target.value })}
              className="apple-input"
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div className="flex gap-4 pt-6">
            <button
              onClick={onCancelCreate}
              className="apple-btn-secondary flex-1 py-3.5"
              disabled={isCreatingProvider}
            >
              取消
            </button>
            <button
              onClick={onCreate}
              disabled={isCreatingProvider}
              className="apple-btn-primary flex-1 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreatingProvider ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>创建中...</span>
                </>
              ) : (
                <span>创建</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  } else if (selectedProvider) {
    return (
      <div className="flex-1 flex flex-col min-h-full">
        <div className="p-6 border-b apple-border-light flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-semibold text-apple-text text-xl">{selectedProvider.provider_name}</h2>
            <p className="text-sm text-apple-text-secondary mt-1">{selectedProvider.provider_type}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleEdit}
              className="apple-btn-secondary px-4 py-2 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              <span>编辑</span>
            </button>
            <button
              onClick={onDelete}
              className="apple-btn-danger px-4 py-2 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>删除</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isEditing ? (
            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-apple-text">编辑提供商</h3>
                <p className="text-sm text-apple-text-secondary mt-1">修改提供商配置信息</p>
              </div>
              <div className="space-y-5 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-apple-text mb-3">提供商名称</label>
                  <input
                    type="text"
                    value={formData.provider_name}
                    onChange={(e) => onFormDataChange({ ...formData, provider_name: e.target.value })}
                    className="apple-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-apple-text mb-3">类型</label>
                  <select
                    value={formData.provider_type}
                    onChange={(e) => onFormDataChange({ ...formData, provider_type: e.target.value })}
                    className="apple-input"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google</option>
                    <option value="baidu">百度</option>
                    <option value="alibaba">阿里云</option>
                    <option value="zhipu">智谱AI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-apple-text mb-3">API Key</label>
                  <input
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => onFormDataChange({ ...formData, api_key: e.target.value })}
                    className="apple-input"
                  />
                  <p className="text-xs text-apple-text-secondary mt-1.5">支持多个 Key，用英文逗号分隔，将自动轮询调用</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-apple-text mb-3">Base URL</label>
                  <input
                    type="url"
                    value={formData.base_url}
                    onChange={(e) => onFormDataChange({ ...formData, base_url: e.target.value })}
                    className="apple-input"
                  />
                </div>
                <div className="flex gap-4 pt-6">
                  <button
                    onClick={onCancelEdit}
                    className="apple-btn-secondary flex-1 py-3.5"
                  >
                    取消
                  </button>
                  <button
                    onClick={onUpdate}
                    className="apple-btn-primary flex-1 py-3.5"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 space-y-6">
              <div className="apple-card rounded-apple-md p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-apple-sm apple-gray-bg flex items-center justify-center">
                      <ToggleRight className="w-6 h-6 text-apple-text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-apple-text-secondary">启用状态</p>
                      <p className="font-semibold text-apple-text">{selectedProvider.enabled ? '已启用' : '已禁用'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleStatus(selectedProvider)}
                    className="flex items-center gap-2 apple-btn-secondary px-5 py-2.5"
                  >
                    {selectedProvider.enabled ? (
                      <>
                        <ToggleRight className="w-5 h-5" />
                        <span>禁用</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5" />
                        <span>启用</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="apple-card rounded-apple-md p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-apple-sm apple-blue/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-apple-blue" />
                  </div>
                  <span className="font-semibold text-apple-text text-lg">连接信息</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b apple-border-light">
                    <span className="text-apple-text-secondary text-sm">Base URL</span>
                    <span className="font-medium text-apple-text text-sm">{selectedProvider.base_url}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-apple-text-secondary text-sm">API Key</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-apple-text bg-apple-gray-bg px-3 py-1.5 rounded-apple-sm">
                        {(selectedProvider as any).api_key ? (selectedProvider as any).api_key.split(',').filter((k: string) => k.trim()).length > 1
                          ? `${(selectedProvider as any).api_key.split(',').filter((k: string) => k.trim()).length} 个 Key`
                          : (selectedProvider as any).api_key.slice(0, 8) + '...'
                          : '未设置'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="apple-card rounded-apple-md p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-apple-sm apple-blue/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-apple-blue" />
                  </div>
                  <span className="font-semibold text-apple-text text-lg">性能统计</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 apple-gray-bg rounded-apple-md">
                    <p className="text-2xl font-bold text-apple-text mb-1">
                      {(selectedProvider.avg_latency ?? 0) > 0 ? `${Math.round(selectedProvider.avg_latency ?? 0)}ms` : '--'}
                    </p>
                    <p className="text-xs text-apple-text-secondary">平均延迟</p>
                  </div>
                  <div className="text-center p-4 apple-gray-bg rounded-apple-md">
                    <p className="text-sm font-semibold text-apple-text mb-1">
                      {formatDate(selectedProvider.last_success_at ?? null)}
                    </p>
                    <p className="text-xs text-apple-text-secondary">最后成功</p>
                  </div>
                  <div className="text-center p-4 apple-gray-bg rounded-apple-md">
                    <p className="text-sm font-semibold text-apple-text mb-1">
                      {formatDate(selectedProvider.last_failed_at ?? null)}
                    </p>
                    <p className="text-xs text-apple-text-secondary">最后失败</p>
                  </div>
                </div>
              </div>

              <button
                onClick={onTestConnection}
                disabled={isTesting}
                className="apple-btn-primary w-full py-4 flex items-center justify-center gap-2"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>测试中...</span>
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4" />
                    <span>测试连接</span>
                  </>
                )}
              </button>

              {testResult && (
                <div className={`apple-card rounded-apple-md p-5 ${
                  testResult.success
                    ? 'apple-badge-success border-2 border-green-200'
                    : 'apple-badge-error border-2 border-red-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {testResult.success ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <XCircle className="w-6 h-6" />
                    )}
                    <div>
                      <p className={`font-semibold ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.success ? '连接成功' : '连接失败'}
                      </p>
                      <p className={`text-sm mt-1 ${
                        testResult.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {testResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="apple-card rounded-apple-md">
                <div className="flex items-center justify-between px-5 py-3 border-b apple-border-light">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-apple-sm bg-purple-50 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-semibold text-apple-text">模型</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onFetchModels}
                      disabled={isFetchingModels}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-apple-sm bg-purple-50 text-purple-600 text-sm font-medium hover:bg-purple-100 transition-colors disabled:opacity-50"
                      title="获取模型"
                    >
                      {isFetchingModels ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>获取</span>
                    </button>
                    <button
                      onClick={onCreateModel}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-apple-sm bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                      title="新建模型"
                    >
                      <Plus className="w-4 h-4" />
                      <span>新建</span>
                    </button>
                    <button
                      onClick={onResetModels}
                      disabled={customModels.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-apple-sm border border-apple-border text-apple-text-secondary text-sm font-medium hover:bg-apple-gray-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="重置所有模型"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>重置</span>
                    </button>
                  </div>
                </div>
                <div className="p-5">

                {customModelTestResult && !showModelModal && (
                  <div className={`mb-5 p-4 rounded-apple-md ${
                    customModelTestResult.success
                      ? 'apple-badge-success border-2 border-green-200'
                      : 'apple-badge-error border-2 border-red-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      {customModelTestResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm ${customModelTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                          {customModelTestResult.success ? '测试成功' : '测试失败'}
                        </p>
                        <p className={`text-xs mt-0.5 ${customModelTestResult.success ? 'text-green-600' : 'text-red-600'}`}>
                          {customModelTestResult.message}
                          {customModelTestResult.latency_ms !== undefined && (
                            <span className="ml-1">({customModelTestResult.latency_ms}ms)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {customModels.length > 0 ? (
                  <div className="space-y-2">
                    {customModels.map((cm) => {
                      const caps = parseCapabilities(cm.capabilities);
                      return (
                        <div
                          key={cm.id}
                          className={`p-3 rounded-apple-sm border transition-colors ${
                            cm.enabled ? 'border-apple-border bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                onClick={() => onToggleCustomModel(cm.id)}
                                className="flex-shrink-0"
                                title={cm.enabled ? '禁用' : '启用'}
                              >
                                {cm.enabled ? (
                                  <ToggleRight className="w-5 h-5 text-purple-600" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-apple-text truncate">{cm.model_name}</p>
                                  <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                                    {cm.model_type === 'chat' ? '聊天' : cm.model_type === 'embedding' ? '嵌入' : cm.model_type === 'image' ? '图片' : cm.model_type}
                                  </span>
                                </div>
                                <p className="text-xs text-apple-text-secondary truncate">{cm.model_id}</p>
                                {(caps.vision || caps.reasoning || caps.tool_use) && (
                                  <div className="flex gap-1 mt-1">
                                    {caps.vision && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-600">
                                        <Eye className="w-2.5 h-2.5" />视觉
                                      </span>
                                    )}
                                    {caps.reasoning && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">
                                        <Brain className="w-2.5 h-2.5" />推理
                                      </span>
                                    )}
                                    {caps.tool_use && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-600">
                                        <Wrench className="w-2.5 h-2.5" />工具
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => onTestCustomModel(cm.id)}
                                disabled={customModelTestLoading === cm.id}
                                className="p-2 rounded-apple-sm hover:bg-purple-50 transition-colors"
                                title="测试连通性"
                              >
                                {customModelTestLoading === cm.id ? (
                                  <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
                                ) : (
                                  <Wifi className="w-4 h-4 text-purple-600" />
                                )}
                              </button>
                              <button
                                onClick={() => onEditCustomModel(cm)}
                                className="p-2 rounded-apple-sm hover:bg-apple-gray-bg transition-colors"
                                title="编辑"
                              >
                                <Edit className="w-4 h-4 text-apple-text-secondary" />
                              </button>
                              <button
                                onClick={() => onDeleteCustomModel(cm.id)}
                                className="p-2 rounded-apple-sm hover:bg-red-50 transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-apple-text-secondary">暂无可用模型</p>
                    <p className="text-xs text-apple-text-secondary/60 mt-1">点击上方按钮获取或新建模型</p>
                  </div>
                )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-apple-gray-bg flex items-center justify-center mx-auto mb-8">
            <Globe className="w-12 h-12 text-apple-text-secondary opacity-50" />
          </div>
          <p className="text-lg font-semibold text-apple-text mb-4">
            选择或创建一个提供商
          </p>
          <div className="space-y-1">
            <p className="text-sm text-apple-text-secondary">
              在左侧列表中选择现有提供商
            </p>
            <p className="text-sm text-apple-text-secondary">
              或创建新的提供商
            </p>
          </div>
        </div>
      </div>
    );
  }
});

ProviderDetail.displayName = 'ProviderDetail';

export default ProviderDetail;
