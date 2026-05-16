import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { providersAPI, customModelsAPI } from '@/services/api';
import type { Provider, CreateProviderData, Model, TestConnectionResult, CustomModel, CreateCustomModelData } from '@/types';
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
  List,
  Zap,
  Wifi,
  Download,
  RotateCcw,
  X,
  Check
} from 'lucide-react';

export default function Settings() {
  const { providers, setProviders } = useStore();
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [showCustomModelForm, setShowCustomModelForm] = useState(false);
  const [customModelForm, setCustomModelForm] = useState<CreateCustomModelData>({
    model_name: '',
    model_id: '',
    base_url: '',
    api_key: '',
  });
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
      fetchModels(selectedProvider.id);
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

  const handleCreateCustomModel = async () => {
    if (!customModelForm.model_name || !customModelForm.model_id) return;
    try {
      const data = {
        ...customModelForm,
        provider_id: selectedProvider?.id || undefined,
      };
      const newModel = await customModelsAPI.create(data);
      setCustomModels([newModel, ...customModels]);
      setShowCustomModelForm(false);
      setCustomModelForm({ model_name: '', model_id: '', base_url: '', api_key: '' });
    } catch (error) {
      console.error('Failed to create custom model:', error);
    }
  };

  const handleUpdateCustomModel = async () => {
    if (!customModelEditId || !customModelForm.model_name || !customModelForm.model_id) return;
    try {
      const updated = await customModelsAPI.update(customModelEditId, customModelForm);
      setCustomModels(customModels.map(m => m.id === updated.id ? updated : m));
      setCustomModelEditId(null);
      setShowCustomModelForm(false);
      setCustomModelForm({ model_name: '', model_id: '', base_url: '', api_key: '' });
    } catch (error) {
      console.error('Failed to update custom model:', error);
    }
  };

  const handleDeleteCustomModel = async (id: string) => {
    try {
      await customModelsAPI.delete(id);
      setCustomModels(customModels.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete custom model:', error);
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

  const handleAddSelectedModels = async () => {
    if (selectedModels.length === 0) {
      setShowModelSelector(false);
      return;
    }
    
    try {
      for (const modelId of selectedModels) {
        const model = availableModels.find(m => m.id === modelId);
        if (model && !customModels.some(cm => cm.model_id === modelId)) {
          const newModel: CreateCustomModelData = {
            model_name: model.name || model.id,
            model_id: model.id,
            base_url: selectedProvider?.base_url || '',
            api_key: '',
          };
          await customModelsAPI.create(newModel);
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
    
    try {
      for (const cm of customModels) {
        await customModelsAPI.delete(cm.id);
      }
      setCustomModels([]);
    } catch (error) {
      console.error('Failed to reset models:', error);
      alert('重置失败: ' + (error as Error).message);
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

  const fetchModels = async (providerId: string) => {
    if (isRefreshingModels) return;
    
    setIsRefreshingModels(true);
    setModelsError(null);
    try {
      const data = await providersAPI.getModels(providerId);
      if (data && data.models) {
        setModels(data.models);
      } else if (Array.isArray(data)) {
        setModels(data);
      } else {
        setModels([]);
      }
      if (data && data.error) {
        setModelsError(data.error);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setModels([]);
      setModelsError((error as Error).message || '获取模型列表失败');
    } finally {
      setIsRefreshingModels(false);
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
    setModelsError(null);
    setModels([]);
    setCustomModels([]);
    setCustomModelTestResult(null);
    setShowCustomModelForm(false);
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
      setModels([]);
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
    setModelsError(null);
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

                <div className="flex gap-4">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="apple-btn-primary flex-1 py-4 flex items-center justify-center gap-2"
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
                    onClick={() => fetchModels(selectedProvider.id)}
                    disabled={isRefreshingModels}
                    className="apple-btn-secondary flex-1 py-4 flex items-center justify-center gap-2"
                  >
                    {isRefreshingModels ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>刷新中...</span>
                      </>
                    ) : (
                      <>
                        <List className="w-4 h-4" />
                        <span>获取模型列表</span>
                      </>
                    )}
                  </button>
                </div>

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

                {!isRefreshingModels && !modelsError && models.length === 0 && (
                  <div className="apple-card rounded-apple-md p-5 text-center">
                    <p className="text-apple-text-secondary text-sm">暂无模型数据，点击"获取模型列表"按钮获取</p>
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
                          setShowCustomModelForm(!showCustomModelForm);
                          setCustomModelEditId(null);
                          setCustomModelForm({ model_name: '', model_id: '', base_url: '', api_key: '' });
                        }}
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
                      <button
                        onClick={handleFetchAndSelectModels}
                        disabled={!selectedProvider || isFetchingModels}
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
                    </div>
                  </div>
                  <div className="p-5">

                  {showCustomModelForm && (
                    <div className="mb-5 p-4 rounded-apple-md border-2 border-dashed border-purple-200 bg-purple-50/50">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-apple-text-secondary mb-1">模型名称 *</label>
                          <input
                            type="text"
                            value={customModelForm.model_name}
                            onChange={(e) => setCustomModelForm({ ...customModelForm, model_name: e.target.value })}
                            placeholder="如: GPT-4 Turbo"
                            className="apple-input w-full px-3 py-2 text-sm rounded-apple-sm border border-apple-border focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-apple-text-secondary mb-1">模型 ID *</label>
                          <input
                            type="text"
                            value={customModelForm.model_id}
                            onChange={(e) => setCustomModelForm({ ...customModelForm, model_id: e.target.value })}
                            placeholder="如: gpt-4-turbo"
                            className="apple-input w-full px-3 py-2 text-sm rounded-apple-sm border border-apple-border focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-apple-text-secondary mb-1">Base URL (可选)</label>
                          <input
                            type="text"
                            value={customModelForm.base_url || ''}
                            onChange={(e) => setCustomModelForm({ ...customModelForm, base_url: e.target.value })}
                            placeholder="如: https://api.openai.com/v1"
                            className="apple-input w-full px-3 py-2 text-sm rounded-apple-sm border border-apple-border focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-apple-text-secondary mb-1">API Key (可选)</label>
                          <input
                            type="password"
                            value={customModelForm.api_key || ''}
                            onChange={(e) => setCustomModelForm({ ...customModelForm, api_key: e.target.value })}
                            placeholder="用于测试连通性"
                            className="apple-input w-full px-3 py-2 text-sm rounded-apple-sm border border-apple-border focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={customModelEditId ? handleUpdateCustomModel : handleCreateCustomModel}
                          disabled={!customModelForm.model_name || !customModelForm.model_id}
                          className="apple-btn-primary px-4 py-2 text-sm font-medium rounded-apple-sm bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {customModelEditId ? '更新模型' : '添加模型'}
                        </button>
                        <button
                          onClick={() => {
                            setShowCustomModelForm(false);
                            setCustomModelEditId(null);
                            setCustomModelForm({ model_name: '', model_id: '', base_url: '', api_key: '' });
                          }}
                          className="px-4 py-2 text-sm font-medium rounded-apple-sm border border-apple-border text-apple-text-secondary hover:bg-apple-gray-bg transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

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
                          </p>
                          {customModelTestResult.availableModels && customModelTestResult.availableModels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {customModelTestResult.availableModels.map(m => (
                                <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{m}</span>
                              ))}
                            </div>
                          )}
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
                              {cm.base_url && (
                                <p className="text-xs text-apple-text-secondary/60 truncate">{cm.base_url}</p>
                              )}
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
                              onClick={() => {
                                setCustomModelEditId(cm.id);
                                setShowCustomModelForm(true);
                                setCustomModelForm({
                                  model_name: cm.model_name,
                                  model_id: cm.model_id,
                                  base_url: cm.base_url || '',
                                  api_key: cm.api_key || '',
                                });
                              }}
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
                  ) : !showCustomModelForm && (
                    <div className="text-center py-8">
                      <p className="text-sm text-apple-text-secondary">暂无可用模型</p>
                      <p className="text-xs text-apple-text-secondary/60 mt-1">点击上方按钮添加或获取模型</p>
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

    {showModelSelector && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModelSelector(false)}
        />
        <div className="relative bg-white rounded-apple-xl shadow-apple-modal w-full max-w-lg overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between px-6 py-4 border-b apple-border-light">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-apple-sm bg-purple-50 flex items-center justify-center">
                <Download className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-apple-text">选择模型</h3>
                <p className="text-xs text-apple-text-secondary mt-0.5">从提供商获取到 {availableModels.length} 个模型</p>
              </div>
            </div>
            <button
              onClick={() => setShowModelSelector(false)}
              className="p-2 rounded-apple-sm hover:bg-apple-gray-bg transition-colors"
            >
              <X className="w-5 h-5 text-apple-text-secondary" />
            </button>
          </div>
          
          <div className="flex items-center justify-between px-6 py-3 bg-apple-gray-bg/50">
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllModels}
                className="text-xs text-apple-text-secondary hover:text-apple-text transition-colors"
              >
                全选
              </button>
              <span className="text-apple-text-secondary/50">|</span>
              <button
                onClick={deselectAllModels}
                className="text-xs text-apple-text-secondary hover:text-apple-text transition-colors"
              >
                取消全选
              </button>
            </div>
            <span className="text-xs text-apple-text-secondary">
              已选择 {selectedModels.length} 个
            </span>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
            {availableModels.map((model) => {
              const isSelected = selectedModels.includes(model.id);
              const alreadyExists = customModels.some(cm => cm.model_id === model.id);
              
              return (
                <div
                  key={model.id}
                  onClick={() => !alreadyExists && toggleModelSelection(model.id)}
                  className={`flex items-center gap-3 p-3 rounded-apple-sm border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-50' 
                      : alreadyExists
                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        : 'border-apple-border hover:border-purple-200 hover:bg-purple-50/50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected 
                      ? 'bg-purple-600 border-purple-600' 
                      : alreadyExists
                        ? 'bg-gray-200 border-gray-300'
                        : 'border-apple-border'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-apple-text truncate">{model.name || model.id}</p>
                    <p className="text-xs text-apple-text-secondary">{model.id}</p>
                  </div>
                  {alreadyExists && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                      已存在
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t apple-border-light">
            <button
              onClick={() => setShowModelSelector(false)}
              className="px-4 py-2 text-sm font-medium text-apple-text-secondary hover:text-apple-text transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAddSelectedModels}
              disabled={selectedModels.length === 0}
              className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-apple-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
