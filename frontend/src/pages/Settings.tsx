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
  }, [setProviders]);

  useEffect(() => {
    if (selectedProvider) {
      fetchModels(selectedProvider.id);
    }
  }, [selectedProvider]);

  const fetchModels = async (providerId: string) => {
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
    setSelectedProvider(provider);
    setIsEditing(false);
    setTestResult(null);
    setFormData({
      provider_name: provider.provider_name,
      provider_type: provider.provider_type,
      api_key: provider.api_key,
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

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4">
      <div className="w-72 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-apple-text">提供商列表</h2>
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
            className="p-2 bg-apple-blue text-white rounded-lg hover:bg-apple-blue-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {providers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-apple-text-secondary">
              <Globe className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">暂无提供商</p>
              <p className="text-xs">点击上方按钮添加</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {providers.map((provider) => (
                <li key={provider.id}>
                  <button
                    onClick={() => handleSelectProvider(provider)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                      selectedProvider?.id === provider.id
                        ? 'bg-apple-blue text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      provider.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    } ${selectedProvider?.id === provider.id ? 'bg-white/20' : ''}`}>
                      {provider.enabled ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{provider.provider_name}</p>
                      <p className={`text-xs truncate ${
                        selectedProvider?.id === provider.id ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {provider.provider_type}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                      selectedProvider?.id === provider.id ? 'text-white/70' : 'text-gray-400'
                    }`} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isCreating ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-lg font-semibold text-apple-text mb-6">创建提供商</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-apple-text mb-2">提供商名称</label>
                <input
                  type="text"
                  value={formData.provider_name}
                  onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue"
                  placeholder="如: OpenAI"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-2">类型</label>
                <select
                  value={formData.provider_type}
                  onChange={(e) => setFormData({ ...formData, provider_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue"
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
                <label className="block text-sm font-medium text-apple-text mb-2">API Key</label>
                <input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-2">Base URL</label>
                <input
                  type="url"
                  value={formData.base_url}
                  onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue"
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-3 bg-apple-blue text-white rounded-xl hover:bg-apple-blue-hover transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        ) : selectedProvider ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-apple-text">{selectedProvider.provider_name}</h2>
                <p className="text-sm text-apple-text-secondary">{selectedProvider.provider_type}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {isEditing ? (
                <div className="p-6">
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-apple-text mb-2">提供商名称</label>
                      <input
                        type="text"
                        value={formData.provider_name}
                        onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-apple-text mb-2">类型</label>
                      <select
                        value={formData.provider_type}
                        onChange={(e) => setFormData({ ...formData, provider_type: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue"
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
                      <label className="block text-sm font-medium text-apple-text mb-2">API Key</label>
                      <input
                        type="password"
                        value={formData.api_key}
                        onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-apple-text mb-2">Base URL</label>
                      <input
                        type="url"
                        value={formData.base_url}
                        onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            provider_name: selectedProvider.provider_name,
                            provider_type: selectedProvider.provider_type,
                            api_key: selectedProvider.api_key,
                            base_url: selectedProvider.base_url,
                          });
                        }}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleUpdate}
                        className="flex-1 px-4 py-3 bg-apple-blue text-white rounded-xl hover:bg-apple-blue-hover transition-colors"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="text-apple-text-secondary">状态</span>
                    <button
                      onClick={() => handleToggleStatus(selectedProvider)}
                      className="flex items-center gap-2"
                    >
                      {selectedProvider.enabled ? (
                        <>
                          <ToggleRight className="w-8 h-8 text-green-500" />
                          <span className="text-green-600 font-medium">启用</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-8 h-8 text-gray-400" />
                          <span className="text-gray-500 font-medium">禁用</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="w-5 h-5 text-apple-text-secondary" />
                      <span className="font-medium text-apple-text">连接信息</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-apple-text-secondary text-sm">Base URL</span>
                        <span className="font-medium text-apple-text text-sm">{selectedProvider.base_url}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-apple-text-secondary text-sm">API Key</span>
                        <span className="font-mono text-sm text-apple-text">
                          {selectedProvider.api_key.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-apple-text-secondary" />
                      <span className="font-medium text-apple-text">性能统计</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-apple-text-secondary text-sm">平均延迟</span>
                        <span className="font-medium text-apple-text text-sm">
                          {selectedProvider.avg_latency > 0 ? `${selectedProvider.avg_latency}ms` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-apple-text-secondary text-sm">最后成功</span>
                        <span className="text-sm text-apple-text">
                          {formatDate(selectedProvider.last_success_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-apple-text-secondary text-sm">最后失败</span>
                        <span className="text-sm text-apple-text">
                          {formatDate(selectedProvider.last_failed_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          测试中...
                        </>
                      ) : (
                        <>
                          <TestTube className="w-4 h-4" />
                          测试连接
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => fetchModels(selectedProvider.id)}
                      disabled={isRefreshingModels}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      {isRefreshingModels ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          刷新中...
                        </>
                      ) : (
                        <>
                          <List className="w-4 h-4" />
                          获取模型列表
                        </>
                      )}
                    </button>
                  </div>

                  {testResult && (
                    <div className={`p-4 rounded-xl ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {testResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                          {testResult.success ? '连接成功' : '连接失败'}
                        </span>
                      </div>
                      <p className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                        {testResult.message}
                      </p>
                    </div>
                  )}

                  {models.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-4">
                        <Key className="w-5 h-5 text-apple-text-secondary" />
                        <span className="font-medium text-apple-text">可用模型 ({models.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {models.map((model) => (
                          <span
                            key={model.id}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-apple-text"
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-apple-text-secondary">
            <div className="text-center">
              <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>选择或创建一个提供商</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
