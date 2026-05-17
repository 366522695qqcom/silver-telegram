import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { providersAPI, customModelsAPI } from '@/services/api';
import type { Provider, CreateProviderData, TestConnectionResult, CustomModel, Model } from '@/types';
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  Globe,
  TestTube,
  Zap,
  Wifi,
  RotateCcw,
  X,
  Download,
  Check
} from 'lucide-react';

export default function Settings() {
  const { providers, setProviders } = useStore();
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [showCustomModelModal, setShowCustomModelModal] = useState(false);
  const [customModelForm, setCustomModelForm] = useState({
    model_id: '',
    model_name: '',
    model_type: 'chat',
    capabilities: [] as string[],
    context_window: '',
    max_output_tokens: '',
  });
  const [customModelModalTestResult, setCustomModelModalTestResult] = useState<TestConnectionResult | null>(null);
  const [customModelModalTestLoading, setCustomModelModalTestLoading] = useState(false);
  const [customModelTestResult, setCustomModelTestResult] = useState<TestConnectionResult | null>(null);
  const [customModelTestLoading, setCustomModelTestLoading] = useState<string | null>(null);
  const [customModelEditId, setCustomModelEditId] = useState<string | null>(null);

  const [showModelSelector, setShowModelSelector] = useState(false);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const [formData, setFormData] = useState<CreateProviderData>({
    provider_name: '',
    provider_type: 'openai',
    api_key: '',
    base_url: 'https://api.openai.com/v1',
  });

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await providersAPI.getAll();
        setProviders(data);
        if (selectedProvider) {
          const updated = data.find((p: Provider) => p.id === selectedProvider.id);
          if (updated) {
            setSelectedProvider(updated);
          }
        }
      } catch (error) {
        console.error('Failed to fetch providers:', error);
      }
    };
    fetchProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider && selectedProvider.id) {
      fetchCustomModels();
    }
  }, [selectedProvider?.id]);

  const fetchCustomModels = async () => {
    try {
      const data = await customModelsAPI.getAll();
      setCustomModels(data);
    } catch (error) {
      console.error('Failed to fetch custom models:', error);
    }
  };

  const resetCustomModelForm = () => ({
    model_id: '',
    model_name: '',
    model_type: 'chat',
    capabilities: [],
    context_window: '',
    max_output_tokens: '',
  });

  const handleOpenNewModelModal = () => {
    setCustomModelEditId(null);
    setCustomModelForm(resetCustomModelForm());
    setCustomModelModalTestResult(null);
    setShowCustomModelModal(true);
  };

  const handleOpenEditModelModal = (cm: CustomModel) => {
    setCustomModelEditId(cm.id);
    setCustomModelForm({
      model_id: cm.model_id,
      model_name: cm.model_name,
      model_type: cm.model_type || 'chat',
      capabilities: cm.capabilities || [],
      context_window: cm.context_window?.toString() || '',
      max_output_tokens: cm.max_output_tokens?.toString() || '',
    });
    setCustomModelModalTestResult(null);
    setShowCustomModelModal(true);
  };

  const toggleCapability = (cap: string) => {
    setCustomModelForm(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter(c => c !== cap)
        : [...prev.capabilities, cap],
    }));
  };

  const handleCreateCustomModel = async () => {
    if (!customModelForm.model_id) return;
    try {
      const data = {
        provider_id: selectedProvider?.id || undefined,
        model_name: customModelForm.model_name || customModelForm.model_id,
        model_id: customModelForm.model_id,
        model_type: customModelForm.model_type,
        capabilities: customModelForm.capabilities,
        context_window: customModelForm.context_window ? parseInt(customModelForm.context_window) : undefined,
        max_output_tokens: customModelForm.max_output_tokens ? parseInt(customModelForm.max_output_tokens) : undefined,
      };
      const newModel = await customModelsAPI.create(data);
      setCustomModels([newModel, ...customModels]);
      setShowCustomModelModal(false);
      setCustomModelForm(resetCustomModelForm());
    } catch (error) {
      console.error('Failed to create custom model:', error);
      alert('创建失败: ' + (error as Error).message);
    }
  };

  const handleUpdateCustomModel = async () => {
    if (!customModelEditId || !customModelForm.model_id) return;
    try {
      const data = {
        model_name: customModelForm.model_name || customModelForm.model_id,
        model_id: customModelForm.model_id,
        model_type: customModelForm.model_type,
        capabilities: customModelForm.capabilities,
        context_window: customModelForm.context_window ? parseInt(customModelForm.context_window) : undefined,
        max_output_tokens: customModelForm.max_output_tokens ? parseInt(customModelForm.max_output_tokens) : undefined,
      };
      const updated = await customModelsAPI.update(customModelEditId, data);
      setCustomModels(customModels.map(m => m.id === updated.id ? updated : m));
      setShowCustomModelModal(false);
      setCustomModelForm(resetCustomModelForm());
      setCustomModelEditId(null);
    } catch (error) {
      console.error('Failed to update custom model:', error);
      alert('更新失败: ' + (error as Error).message);
    }
  };

  const handleDeleteCustomModel = async (id: string) => {
    const originalModels = [...customModels];
    setCustomModels(customModels.filter(m => m.id !== id));
    try {
      await customModelsAPI.delete(id);
    } catch (error) {
      console.error('Failed to delete custom model:', error);
      setCustomModels(originalModels);
    }
  };

  const handleToggleCustomModel = async (id: string) => {
    try {
      const updated = await customModelsAPI.toggleStatus(id);
      setCustomModels(customModels.map(m => m.id === updated.id ? updated : m));
    } catch (error) {
      console.error('Failed to toggle custom model:', error);
    }
  };

  const handleTestCustomModel = async (id: string) => {
    setCustomModelTestLoading(id);
    setCustomModelTestResult(null);
    try {
      const result = await customModelsAPI.testConnection(id);
      setCustomModelTestResult(result);
    } catch (error) {
      setCustomModelTestResult({ success: false, message: (error as Error).message });
    } finally {
      setCustomModelTestLoading(null);
    }
  };

  const handleFetchAndSelectModels = async () => {
    if (!selectedProvider) return;
    setIsFetchingModels(true);
    try {
      const data = await providersAPI.getModels(selectedProvider.id);
      if (data && data.models && data.models.length > 0) {
        setAvailableModels(data.models);
        setSelectedModels([]);
        setShowModelSelector(true);
      } else {
        alert('未能获取到可用模型');
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      alert('获取模型失败: ' + (error as Error).message);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const selectAllModels = () => {
    setSelectedModels(availableModels.map(m => m.id));
  };

  const deselectAllModels = () => {
    setSelectedModels([]);
  };

  const handleAddSelectedModels = async () => {
    if (selectedModels.length === 0) {
      setShowModelSelector(false);
      return;
    }

    try {
      for (const modelId of selectedModels) {
        const model = availableModels.find(m => m.id === modelId);
        if (model && !customModels.some(cm => cm.model_id === modelId)) {
          await customModelsAPI.create({
            provider_id: selectedProvider?.id,
            model_name: model.name || model.id,
            model_id: model.id,
          });
        }
      }
      await fetchCustomModels();
      setShowModelSelector(false);
      setSelectedModels([]);
    } catch (error) {
      console.error('Failed to add models:', error);
      alert('添加模型失败: ' + (error as Error).message);
    }
  };

  const handleResetCustomModels = async () => {
    if (customModels.length === 0) return;

    if (!confirm('确定要清空所有自定义模型吗？此操作不可撤销。')) {
      return;
    }

    const originalModels = [...customModels];
    const modelIds = customModels.map(cm => cm.id);
    setCustomModels([]);

    try {
      await customModelsAPI.deleteAll(modelIds);
    } catch (error) {
      console.error('Failed to reset models:', error);
      setCustomModels(originalModels);
      alert('重置失败: ' + (error as Error).message);
    }
  };

  const handleTestInModal = async () => {
    if (!customModelForm.model_id) return;
    if (!customModelEditId) {
      alert('请先保存模型后再测试');
      return;
    }
    setCustomModelModalTestLoading(true);
    setCustomModelModalTestResult(null);
    try {
      const result = await customModelsAPI.testConnection(customModelEditId);
      setCustomModelModalTestResult(result);
    } catch (error) {
      setCustomModelModalTestResult({ success: false, message: (error as Error).message });
    } finally {
      setCustomModelModalTestLoading(false);
    }
  };

  const handleSaveCustomModel = async () => {
    if (!customModelForm.model_id) return;
    if (customModelEditId) {
      await handleUpdateCustomModel();
    } else {
      await handleCreateCustomModel();
    }
  };

  const handleSelectProvider = async (provider: Provider) => {
    console.log('handleSelectProvider called with provider:', provider);
    try {
      const providersData = await providersAPI.getAll();
      const updatedProvider = providersData.find((p: Provider) => p.id === provider.id);
      if (updatedProvider) {
        setSelectedProvider(updatedProvider);
        setFormData({
          provider_name: updatedProvider.provider_name,
          provider_type: updatedProvider.provider_type,
          api_key: (updatedProvider as any).api_key || '',
          base_url: updatedProvider.base_url,
        });
      } else {
        setSelectedProvider(provider);
        setFormData({
          provider_name: provider.provider_name,
          provider_type: provider.provider_type,
          api_key: (provider as any).api_key || '',
          base_url: provider.base_url,
        });
      }
    } catch {
      setSelectedProvider(provider);
      setFormData({
        provider_name: provider.provider_name,
        provider_type: provider.provider_type,
        api_key: (provider as any).api_key || '',
        base_url: provider.base_url,
      });
    }
    setIsEditing(false);
    setTestResult(null);
    setCustomModels([]);
    setCustomModelTestResult(null);
    setShowCustomModelModal(false);
  };

  const handleCreate = async () => {
    try {
      const newProvider = await providersAPI.create(formData);
      setProviders([...providers, newProvider]);
      setSelectedProvider(newProvider);
      setFormData({
        provider_name: newProvider.provider_name,
        provider_type: newProvider.provider_type,
        api_key: (newProvider as any).api_key || '',
        base_url: newProvider.base_url,
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create provider:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedProvider) return;
    try {
      const updated = await providersAPI.update(selectedProvider.id, formData);
      setProviders(providers.map(p => p.id === updated.id ? updated : p));
      setSelectedProvider(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update provider:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedProvider) return;
    try {
      await providersAPI.delete(selectedProvider.id);
      setProviders(providers.filter(p => p.id !== selectedProvider.id));
      setSelectedProvider(null);
    } catch (error) {
      console.error('Failed to delete provider:', error);
    }
  };

  const handleToggleStatus = async (provider: Provider) => {
    try {
      const updated = await providersAPI.toggleStatus(provider.id);
      setProviders(providers.map(p => p.id === updated.id ? updated : p));
      if (selectedProvider?.id === updated.id) {
        setSelectedProvider(updated);
      }
    } catch (error) {
      console.error('Failed to toggle provider:', error);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedProvider) return;
    setIsTesting(true);
    try {
      const result = await providersAPI.testConnection(selectedProvider.id);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: (error as Error).message });
    } finally {
      setIsTesting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const renderRightPanel = () => {
    console.log('Rendering right panel. isCreating:', isCreating, 'selectedProvider:', selectedProvider);

    if (isCreating) {
      return (
        <div className="flex-1 p-8 overflow-y-auto animate-apple-slide-up min-h-full">
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
                onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                className="apple-input"
                placeholder="如: OpenAI"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-apple-text mb-3">类型</label>
              <select
                value={formData.provider_type}
                onChange={(e) => setFormData({ ...formData, provider_type: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                className="apple-input"
                placeholder="sk-..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-apple-text mb-3">Base URL</label>
              <input
                type="url"
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                className="apple-input"
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div className="flex gap-4 pt-6">
              <button
                onClick={() => setIsCreating(false)}
                className="apple-btn-secondary flex-1 py-3.5"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="apple-btn-primary flex-1 py-3.5"
              >
                创建
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
                onClick={() => setIsEditing(!isEditing)}
                className="apple-btn-secondary px-4 py-2 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                <span>编辑</span>
              </button>
              <button
                onClick={handleDelete}
                className="apple-btn-danger px-4 py-2 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isEditing ? (
              <div className="p-8 animate-apple-slide-up">
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
                      onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                      className="apple-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-apple-text mb-3">类型</label>
                    <select
                      value={formData.provider_type}
                      onChange={(e) => setFormData({ ...formData, provider_type: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      className="apple-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-apple-text mb-3">Base URL</label>
                    <input
                      type="url"
                      value={formData.base_url}
                      onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                      className="apple-input"
                    />
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          provider_name: selectedProvider.provider_name,
                          provider_type: selectedProvider.provider_type,
                          api_key: (selectedProvider as any).api_key || '',
                          base_url: selectedProvider.base_url,
                        });
                      }}
                      className="apple-btn-secondary flex-1 py-3.5"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleUpdate}
                      className="apple-btn-primary flex-1 py-3.5"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 space-y-6 animate-apple-slide-up">
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
                      onClick={() => handleToggleStatus(selectedProvider)}
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
                      <span className="font-mono text-sm text-apple-text bg-apple-gray-bg px-3 py-1.5 rounded-apple-sm">
                        {(selectedProvider as any).api_key ? (selectedProvider as any).api_key.slice(0, 8) + '...' : '未设置'}
                      </span>
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
                        {(selectedProvider.avg_latency ?? 0) > 0 ? `${selectedProvider.avg_latency}ms` : '--'}
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
                  onClick={handleTestConnection}
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

                <button
                  onClick={() => {
                    if (!selectedProvider) return;
                    handleFetchAndSelectModels();
                  }}
                  disabled={isFetchingModels}
                  className="w-full py-3 flex items-center justify-center gap-2 mt-3 rounded-apple-md border border-apple-border text-apple-text-secondary text-sm font-medium hover:bg-apple-gray-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFetchingModels ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>获取模型中...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>获取模型</span>
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
                        onClick={() => {
                          if (!selectedProvider) {
                            alert('请先选择一个提供商');
                            return;
                          }
                          handleFetchAndSelectModels();
                        }}
                        disabled={isFetchingModels}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-apple-sm border border-apple-border text-apple-text-secondary text-sm font-medium hover:bg-apple-gray-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="从提供商获取模型"
                      >
                        {isFetchingModels ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span>获取</span>
                      </button>
                      <button
                        onClick={handleOpenNewModelModal}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-apple-sm bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                        title="新建模型"
                      >
                        <Plus className="w-4 h-4" />
                        <span>新建</span>
                      </button>
                      <button
                        onClick={handleResetCustomModels}
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

                  {customModelTestResult && (
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
                            {customModelTestResult.success ? '连接成功' : '连接失败'}
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
                      {customModels.map((cm) => (
                        <div
                          key={cm.id}
                          className={`flex items-center justify-between p-3 rounded-apple-sm border transition-colors ${
                            cm.enabled ? 'border-apple-border bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => handleToggleCustomModel(cm.id)}
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
                              <p className="text-sm font-medium text-apple-text truncate">{cm.model_name}</p>
                              <p className="text-xs text-apple-text-secondary truncate">{cm.model_id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleTestCustomModel(cm.id)}
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
                              onClick={() => handleOpenEditModelModal(cm)}
                              className="p-2 rounded-apple-sm hover:bg-apple-gray-bg transition-colors"
                              title="编辑"
                            >
                              <Edit className="w-4 h-4 text-apple-text-secondary" />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomModel(cm.id)}
                              className="p-2 rounded-apple-sm hover:bg-red-50 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-apple-text-secondary">暂无可用模型</p>
                      <p className="text-xs text-apple-text-secondary/60 mt-1">点击上方按钮添加模型</p>
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
          <div className="text-center animate-apple-slide-up">
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
  };

  return (
    <>
        <div className="min-h-[calc(100vh-6rem)] bg-apple-gray-bg animate-apple-slide-up">
          <div className="flex gap-4 max-w-7xl mx-auto py-6 px-6">
        <div className="w-80 flex-shrink-0 bg-white rounded-apple-lg shadow-apple-card flex flex-col" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
          <div className="p-5 border-b apple-border-light flex items-center justify-between">
            <h2 className="font-semibold text-apple-text text-lg">提供商列表</h2>
            <button
              onClick={() => {
                setIsCreating(true);
                setSelectedProvider(null);
                setFormData({
                  provider_name: '',
                  provider_type: 'openai',
                  api_key: '',
                  base_url: 'https://api.openai.com/v1',
                });
              }}
              className="apple-btn-primary flex items-center gap-2 px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              <span>新建</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {providers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-apple-text-secondary px-4">
                <div className="w-20 h-20 rounded-full bg-apple-gray-bg flex items-center justify-center mb-4">
                  <Globe className="w-10 h-10 opacity-50" />
                </div>
                <p className="text-sm font-medium mb-2">暂无提供商</p>
                <p className="text-xs opacity-70 text-center">点击上方按钮添加</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {providers.map((provider) => (
                  <li key={provider.id}>
                    <button
                      onClick={() => handleSelectProvider(provider)}
                      className={`w-full apple-nav-item flex items-center gap-3 px-4 py-4 rounded-apple-md transition-all ${
                        selectedProvider?.id === provider.id
                          ? 'apple-blue text-white shadow-lg'
                          : 'hover:shadow-md text-apple-text'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-apple-sm flex items-center justify-center flex-shrink-0 ${
                        provider.enabled
                          ? selectedProvider?.id === provider.id
                            ? 'bg-white/20'
                            : 'apple-badge-success'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {provider.enabled ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold truncate">{provider.provider_name}</p>
                        <p className={`text-xs truncate mt-0.5 ${
                          selectedProvider?.id === provider.id ? 'text-white/70' : 'text-apple-text-secondary'
                        }`}>
                          {provider.provider_type}
                        </p>
                      </div>
                      <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                        selectedProvider?.id === provider.id ? 'text-white/70' : 'text-apple-text-secondary'
                      }`} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-apple-lg shadow-apple-card min-h-[500px]" style={{ minHeight: 'calc(100vh - 12rem)' }}>
          <div className="flex-1 flex flex-col">
            {renderRightPanel()}
          </div>
        </div>
      </div>
    </div>

    {showCustomModelModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowCustomModelModal(false)}
        />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {customModelEditId ? '编辑模型' : '新建模型'}
            </h3>
            <button
              onClick={() => setShowCustomModelModal(false)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">模型 ID</label>
              <input
                type="text"
                value={customModelForm.model_id}
                onChange={(e) => setCustomModelForm({ ...customModelForm, model_id: e.target.value })}
                placeholder="如: gpt-4-turbo"
                className="apple-input w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">显示名称</label>
              <input
                type="text"
                value={customModelForm.model_name}
                onChange={(e) => setCustomModelForm({ ...customModelForm, model_name: e.target.value })}
                placeholder="可选"
                className="apple-input w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">模型类型</label>
              <select
                value={customModelForm.model_type}
                onChange={(e) => setCustomModelForm({ ...customModelForm, model_type: e.target.value })}
                className="apple-input w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="chat">聊天</option>
                <option value="embedding">嵌入</option>
                <option value="image_generation">图片生成</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">能力</label>
              <div className="flex gap-6">
                {[['vision', '视觉'], ['reasoning', '推理'], ['tool_use', '工具使用']].map(([cap, label]) => (
                  <label key={cap} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customModelForm.capabilities.includes(cap)}
                      onChange={() => toggleCapability(cap)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-600">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">高级设置</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">上下文窗口</label>
                  <input
                    type="number"
                    value={customModelForm.context_window}
                    onChange={(e) => setCustomModelForm({ ...customModelForm, context_window: e.target.value })}
                    placeholder="例如 128000"
                    className="apple-input w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">最大输出Token数</label>
                  <input
                    type="number"
                    value={customModelForm.max_output_tokens}
                    onChange={(e) => setCustomModelForm({ ...customModelForm, max_output_tokens: e.target.value })}
                    placeholder="例如 4096"
                    className="apple-input w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {customModelModalTestResult && (
              <div className={`p-3 rounded-lg ${
                customModelModalTestResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start gap-2">
                  {customModelModalTestResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${customModelModalTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {customModelModalTestResult.success ? '测试成功' : '测试失败'}
                    </p>
                    <p className={`text-xs mt-0.5 ${customModelModalTestResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {customModelModalTestResult.message}
                      {customModelModalTestResult.latency_ms !== undefined && (
                        <span> ({customModelModalTestResult.latency_ms}ms)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowCustomModelModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleTestInModal}
              disabled={customModelModalTestLoading || !customModelForm.model_id || !customModelEditId}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {customModelModalTestLoading ? '测试中...' : '测试模型'}
            </button>
            <button
              onClick={handleSaveCustomModel}
              disabled={!customModelForm.model_id}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    )}

    {showModelSelector && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModelSelector(false)}
        />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-semibold text-gray-900">选择模型</h3>
                <p className="text-xs text-gray-500">从提供商获取到 {availableModels.length} 个模型</p>
              </div>
            </div>
            <button
              onClick={() => setShowModelSelector(false)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <button onClick={selectAllModels} className="text-xs text-gray-600 hover:text-gray-900 transition-colors">全选</button>
              <span className="text-gray-300">|</span>
              <button onClick={deselectAllModels} className="text-xs text-gray-600 hover:text-gray-900 transition-colors">取消全选</button>
            </div>
            <span className="text-xs text-gray-500">已选择 {selectedModels.length} 个</span>
          </div>

          <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
            {availableModels.map((model) => {
              const isSelected = selectedModels.includes(model.id);
              const alreadyExists = customModels.some(cm => cm.model_id === model.id);

              return (
                <div
                  key={model.id}
                  onClick={() => !alreadyExists && toggleModelSelection(model.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : alreadyExists
                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'bg-purple-600 border-purple-600'
                      : alreadyExists
                        ? 'bg-gray-200 border-gray-300'
                        : 'border-gray-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{model.name || model.id}</p>
                    <p className="text-xs text-gray-500 truncate">{model.id}</p>
                  </div>
                  {alreadyExists && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">已存在</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowModelSelector(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAddSelectedModels}
              disabled={selectedModels.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              添加选中 ({selectedModels.length})
            </button>
          </div>
        </div>
      </div>
    )}

    </>
  );
}
