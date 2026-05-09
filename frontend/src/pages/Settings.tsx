import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { providersAPI } from '@/services/api';
import type { Provider, CreateProviderData, Model, TestConnectionResult } from '@/types';
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
  Key,
  TestTube,
  List
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
      } catch (error) {
        console.error('Failed to fetch providers:', error);
      }
    };
    fetchProviders();
  }, []);

  const [lastFetchProviderId, setLastFetchProviderId] = useState<string | null>(null);
  
  useEffect(() => {
    if (selectedProvider && selectedProvider.id && selectedProvider.id !== lastFetchProviderId) {
      setLastFetchProviderId(selectedProvider.id);
      fetchModels(selectedProvider.id);
    }
  }, [selectedProvider?.id]);

  const fetchModels = async (providerId: string) => {
    if (isRefreshingModels) return;
    
    setIsRefreshingModels(true);
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
    } finally {
      setIsRefreshingModels(false);
    }
  };

  const handleSelectProvider = (provider: Provider) => {
    console.log('handleSelectProvider called with provider:', provider);
    setSelectedProvider(provider);
    setIsEditing(false);
    setTestResult(null);
    setFormData({
      provider_name: provider.provider_name,
      provider_type: provider.provider_type,
      api_key: (provider as any).api_key || '',
      base_url: provider.base_url,
    });
  };

  const handleCreate = async () => {
    try {
      const newProvider = await providersAPI.create(formData);
      setProviders([...providers, newProvider]);
      setIsCreating(false);
      setFormData({
        provider_name: '',
        provider_type: 'openai',
        api_key: '',
        base_url: 'https://api.openai.com/v1',
      });
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
                        {selectedProvider.avg_latency > 0 ? `${selectedProvider.avg_latency}ms` : '--'}
                      </p>
                      <p className="text-xs text-apple-text-secondary">平均延迟</p>
                    </div>
                    <div className="text-center p-4 apple-gray-bg rounded-apple-md">
                      <p className="text-sm font-semibold text-apple-text mb-1">
                        {formatDate(selectedProvider.last_success_at)}
                      </p>
                      <p className="text-xs text-apple-text-secondary">最后成功</p>
                    </div>
                    <div className="text-center p-4 apple-gray-bg rounded-apple-md">
                      <p className="text-sm font-semibold text-apple-text mb-1">
                        {formatDate(selectedProvider.last_failed_at)}
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

                {models.length > 0 && (
                  <div className="apple-card rounded-apple-md p-5">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-apple-sm apple-blue/10 flex items-center justify-center">
                        <Key className="w-5 h-5 text-apple-blue" />
                      </div>
                      <span className="font-semibold text-apple-text text-lg">可用模型</span>
                      <span className="apple-badge-neutral ml-2 px-3 py-1 rounded-full text-sm font-medium">
                        {models.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {models.map((model) => (
                        <span
                          key={model.id}
                          className="apple-badge-neutral px-4 py-2 rounded-full text-sm font-medium"
                        >
                          {model.id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
  );
}
