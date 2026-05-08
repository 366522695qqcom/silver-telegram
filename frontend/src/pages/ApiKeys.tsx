import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { apiKeysAPI } from '@/services/api';
import type { ApiKey, CreateApiKeyData } from '@/types';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Copy, RefreshCw, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ApiKeys() {
  const { apiKeys, setApiKeys } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateApiKeyData>({
    name: '',
  });

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const data = await apiKeysAPI.getAll();
        setApiKeys(data);
      } catch (error) {
        console.error('Failed to fetch API keys:', error);
      }
    };
    fetchApiKeys();
  }, [setApiKeys]);

  const handleCreate = async () => {
    try {
      const newKey = await apiKeysAPI.create(formData);
      setApiKeys([...apiKeys, newKey]);
      setIsCreating(false);
      setFormData({ name: '' });
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedKey) return;
    try {
      const updated = await apiKeysAPI.update(selectedKey.id, formData);
      setApiKeys(apiKeys.map(k => k.id === updated.id ? updated : k));
      setSelectedKey(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update API key:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiKeysAPI.delete(id);
      setApiKeys(apiKeys.filter(k => k.id !== id));
      if (selectedKey?.id === id) {
        setSelectedKey(null);
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const handleToggleStatus = async (apiKey: ApiKey) => {
    try {
      const updated = await apiKeysAPI.toggleStatus(apiKey.id);
      setApiKeys(apiKeys.map(k => k.id === updated.id ? updated : k));
      if (selectedKey?.id === updated.id) {
        setSelectedKey(updated);
      }
    } catch (error) {
      console.error('Failed to toggle API key:', error);
    }
  };

  const handleRegenerate = async (apiKey: ApiKey) => {
    try {
      const updated = await apiKeysAPI.regenerate(apiKey.id);
      setApiKeys(apiKeys.map(k => k.id === updated.id ? updated : k));
      if (selectedKey?.id === updated.id) {
        setSelectedKey(updated);
        setShowKey(true);
      }
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
    }
  };

  const handleCopy = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '永久有效';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">如何使用 API 密钥</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start gap-3">
            <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded-lg font-semibold text-xs">1</span>
            <div>
              <p className="font-medium">调用地址</p>
              <code className="bg-blue-100 px-2 py-1 rounded text-xs mt-1 inline-block">
                http://localhost:3000/api/v1/chat/completions
              </code>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded-lg font-semibold text-xs">2</span>
            <div>
              <p className="font-medium">认证方式</p>
              <p className="mt-1">在请求头中添加：<code className="bg-blue-100 px-2 py-1 rounded text-xs">X-API-Key: your_api_key</code></p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded-lg font-semibold text-xs">3</span>
            <div>
              <p className="font-medium">请求格式</p>
              <p className="mt-1">支持 OpenAI 兼容格式，provider_id 可选</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-apple-text">API 密钥管理</h2>
          <p className="text-sm text-apple-text-secondary mt-1">管理您的 API 密钥，用于访问 AI API Gateway</p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setSelectedKey(null);
            setFormData({ name: '' });
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-apple-blue text-white rounded-xl hover:bg-apple-blue-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          创建密钥
        </button>
      </div>

      {isCreating ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-apple-text mb-6">创建 API 密钥</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-apple-text mb-2">密钥名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue"
                placeholder="如: 我的应用"
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
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-apple-text-secondary">名称</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-apple-text-secondary">密钥</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-apple-text-secondary">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-apple-text-secondary">过期时间</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-apple-text-secondary">创建时间</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-apple-text-secondary">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {apiKeys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-apple-text-secondary">
                      <p>暂无 API 密钥</p>
                      <p className="text-sm mt-1">点击上方按钮创建</p>
                    </td>
                  </tr>
                ) : (
                  apiKeys.map((apiKey) => (
                    <tr 
                      key={apiKey.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedKey?.id === apiKey.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {isEditing && selectedKey?.id === apiKey.id ? (
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue"
                            />
                          ) : (
                            <span className="font-medium text-apple-text">{apiKey.name || '未命名'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-apple-text">
                            {showKey && selectedKey?.id === apiKey.id
                              ? apiKey.key
                              : `${apiKey.key.slice(0, 8)}...${apiKey.key.slice(-4)}`}
                          </span>
                          <button
                            onClick={() => {
                              if (selectedKey?.id === apiKey.id) {
                                setShowKey(!showKey);
                              } else {
                                setSelectedKey(apiKey);
                                setShowKey(true);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            {showKey && selectedKey?.id === apiKey.id ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopy(apiKey.key, apiKey.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            {copiedId === apiKey.id ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(apiKey)}
                          className="flex items-center gap-2"
                        >
                          {apiKey.enabled ? (
                            <>
                              <span className="w-2 h-2 bg-green-500 rounded-full" />
                              <span className="text-sm text-green-600 font-medium">启用</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 bg-gray-400 rounded-full" />
                              <span className="text-sm text-gray-500 font-medium">禁用</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-apple-text-secondary">
                          {formatDate(apiKey.expires_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-apple-text-secondary">
                          {new Date(apiKey.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isEditing && selectedKey?.id === apiKey.id ? (
                            <>
                              <button
                                onClick={handleUpdate}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditing(false);
                                  setFormData({ name: selectedKey.name || '' });
                                }}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedKey(apiKey);
                                  setIsEditing(true);
                                  setFormData({ name: apiKey.name || '' });
                                }}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRegenerate(apiKey)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(apiKey.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
