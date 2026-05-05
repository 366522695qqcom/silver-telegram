import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { apiClient } from '../services/api';
import { Provider, Model } from '../types';
import {
  Settings,
  Globe,
  Bot,
  Search,
  FileText,
  MessageSquare,
  Keyboard,
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    providers,
    selectedProviderId,
    setProviders,
    setSelectedProviderId,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<Model[]>([]);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (selectedProviderId) {
      const provider = providers.find(p => p.id === selectedProviderId);
      setSelectedProvider(provider || null);
    }
  }, [selectedProviderId, providers]);

  const fetchProviders = async () => {
    try {
      const data = await apiClient.getProviders();
      setProviders(data);
      if (data.length > 0 && !selectedProviderId) {
        setSelectedProviderId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestProvider = async () => {
    if (!selectedProvider) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await apiClient.testProvider(selectedProvider.id);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleGetModels = async () => {
    if (!selectedProvider) return;
    try {
      const data = await apiClient.getProviderModels(selectedProvider.id);
      setModels(data);
    } catch (err) {
      console.error('Failed to get models:', err);
    }
  };

  const getProviderIconColor = (name: string) => {
    const colors = {
      openai: 'from-green-500 to-green-600',
      anthropic: 'from-amber-500 to-amber-600',
      gemini: 'from-blue-500 to-blue-600',
    };
    for (const [key, color] of Object.entries(colors)) {
      if (name.toLowerCase().includes(key)) return color;
    }
    return 'from-gray-500 to-gray-600';
  };

  const getProviderInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const sidebarItems = [
    { icon: Settings, label: 'General', active: true },
    { icon: Globe, label: 'Model Providers', active: true },
    { icon: Bot, label: 'Default Model', active: false },
    { icon: Search, label: 'Web Search', active: false },
    { icon: FileText, label: 'Document Parser', active: false },
    { icon: MessageSquare, label: 'Chat Settings', active: false },
    { icon: Keyboard, label: 'Keyboard Shortcuts', active: false },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        </div>
        <div className="flex-1 px-3 space-y-1">
          {sidebarItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.label === 'Model Providers';
            return (
              <button
                key={idx}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle: Provider List */}
      <div className="w-72 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-medium text-gray-900">Providers</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddProvider(true)}
              className="p-2 text-primary hover:bg-blue-50 rounded-lg"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              Loading...
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No providers configured
            </div>
          ) : (
            providers.map((provider) => {
              const isSelected = selectedProviderId === provider.id;
              const isOnline = provider.last_success_at && 
                (!provider.last_failed_at || 
                  new Date(provider.last_success_at) > new Date(provider.last_failed_at));
              return (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProviderId(provider.id)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                    isSelected
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-medium ${
                    getProviderIconColor(provider.provider_name)
                  }`}>
                    {getProviderInitial(provider.provider_name)}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">
                      {provider.provider_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {provider.provider_type}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Provider Config */}
      <div className="flex-1 bg-white overflow-y-auto">
        {selectedProvider ? (
          <div className="p-8 max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-semibold ${
                getProviderIconColor(selectedProvider.provider_name)
              }`}>
                {getProviderInitial(selectedProvider.provider_name)}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {selectedProvider.provider_name}
                </h2>
                <p className="text-gray-500">
                  {selectedProvider.provider_type.charAt(0).toUpperCase() + 
                   selectedProvider.provider_type.slice(1)} compatible
                </p>
              </div>
              <button className="ml-auto text-gray-400 hover:text-gray-600">
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8">
              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={selectedProvider.api_key}
                    readOnly
                    className="w-full px-4 py-3 pr-24 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                    placeholder="sk-..."
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={handleTestProvider}
                      disabled={testing}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {testing ? 'Checking...' : 'Check'}
                    </button>
                  </div>
                </div>
                {testResult && (
                  <div className={`mt-3 flex items-center gap-2 text-sm ${
                    testResult.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                    {testResult.message}
                  </div>
                )}
              </div>

              {/* API Host */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  API Host
                </label>
                <input
                  type="text"
                  value={selectedProvider.base_url}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                  placeholder="https://api.openai.com/v1"
                />
              </div>

              {/* Models */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-900">
                    Models
                  </label>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary border border-gray-200 hover:border-primary rounded-lg">
                      + Add New
                    </button>
                    <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary border border-gray-200 hover:border-primary rounded-lg">
                      Reset
                    </button>
                    <button
                      onClick={handleGetModels}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary border border-gray-200 hover:border-primary rounded-lg flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Fetch
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                  {models.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      Click "Fetch" to get models from provider
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {models.map((model) => (
                        <div
                          key={model.id}
                          className="px-4 py-3 flex items-center justify-between hover:bg-gray-100"
                        >
                          <div className="text-gray-900">{model.name}</div>
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Settings className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-400 hover:text-red-600">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a provider to configure
          </div>
        )}
      </div>
    </div>
  );
}
