import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { apiKeysAPI } from '@/services/api';
import type { ApiKey, CreateApiKeyData } from '@/types';
import { Plus, Edit, Trash2, Copy, RefreshCw, CheckCircle, Eye, EyeOff, Key as KeyIcon } from 'lucide-react';

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
      console.error('Failed to toggle API key status:', error);
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
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(key);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = key;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('复制失败，请手动选择密钥并复制');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '永久有效';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const apiBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <div className="bg-apple-gray-bg min-h-screen p-6 space-y-6 animate-apple-fade-in">
      <div className="apple-card apple-lg p-6 animate-apple-slide-up">
        <h3 className="text-lg font-semibold text-apple-text mb-4">如何使用 API 密钥</h3>
        <div className="space-y-3 text-sm text-apple-text-secondary">
          <div className="flex items-start gap-3">
            <span className="bg-apple-blue/10 text-apple-blue px-2 py-1 rounded-lg font-semibold text-xs">1</span>
            <div>
              <p className="font-medium text-apple-text">调用地址</p>
              <code className="font-mono bg-gray-100 text-apple-text px-2 py-1 rounded text-xs mt-1 inline-block">
                {apiBaseUrl}/api/v1/chat/completions
              </code>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-apple-blue/10 text-apple-blue px-2 py-1 rounded-lg font-semibold text-xs">2</span>
            <div>
              <p className="font-medium text-apple-text">认证方式</p>
              <p className="mt-1">在请求头中添加：<code className="font-mono bg-gray-100 text-apple-text px-2 py-1 rounded text-xs">X-API-Key: your_api_key</code></p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-apple-blue/10 text-apple-blue px-2 py-1 rounded-lg font-semibold text-xs">3</span>
            <div>
              <p className="font-medium text-apple-text">请求格式</p>
              <p className="mt-1">支持 OpenAI 兼容格式，provider_id 可选</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between animate-apple-slide-up">
        <div>
          <h2 className="text-xl font-semibold text-apple-text">API 密钥管理</h2>
          <p className="text-sm text-apple-text-secondary mt-1">管理您的 API 密钥，用于访问 AI API Gateway</p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setSelectedKey(null);
            setFormData({ name: '' });
          }}
          className="apple-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          创建密钥
        </button>
      </div>

      {isCreating ? (
        <div className="apple-card apple-lg p-6 animate-apple-slide-up">
          <h3 className="text-lg font-semibold text-apple-text mb-6">创建 API 密钥</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-apple-text mb-2">密钥名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="apple-input"
                placeholder="如: 我的应用"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsCreating(false)}
                className="apple-btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="apple-btn-primary flex-1"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="apple-card apple-lg overflow-hidden animate-apple-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-apple-border-light">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-apple-text-secondary">名称</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-apple-text-secondary">密钥</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-apple-text-secondary">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-apple-text-secondary">过期时间</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-apple-text-secondary">创建时间</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-apple-text-secondary">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-border-light">
                {apiKeys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-apple-text-secondary">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <KeyIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="font-medium text-apple-text">暂无 API 密钥</p>
                        <p className="text-sm">点击上方按钮创建您的第一个密钥</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  apiKeys.map((apiKey, index) => (
                    <tr 
                      key={apiKey.id}
                      className={`hover:bg-gray-50/50 transition-colors animate-apple-fade-in ${
                        selectedKey?.id === apiKey.id ? 'bg-apple-blue/5' : ''
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {isEditing && selectedKey?.id === apiKey.id ? (
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="apple-input py-1 px-3"
                            />
                          ) : (
                            <span className="font-medium text-apple-text">{apiKey.name || '未命名'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-apple-text bg-gray-100 px-2 py-1 rounded apple-sm">
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
                            className="p-1.5 text-apple-text-secondary hover:text-apple-text hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {showKey && selectedKey?.id === apiKey.id ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopy(apiKey.key, apiKey.id)}
                            className="p-1.5 text-apple-text-secondary hover:text-apple-text hover:bg-gray-100 rounded-lg transition-colors"
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
                            <span className="apple-badge-success flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-current rounded-full" />
                              启用
                            </span>
                          ) : (
                            <span className="apple-badge-neutral flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-current rounded-full" />
                              禁用
                            </span>
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
                        <div className="flex items-center gap-1.5">
                          {isEditing && selectedKey?.id === apiKey.id ? (
                            <>
                              <button
                                onClick={handleUpdate}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="保存"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditing(false);
                                  setFormData({ name: selectedKey.name || '' });
                                }}
                                className="p-2 text-apple-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                                title="取消"
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
                                className="p-2 text-apple-text-secondary hover:text-apple-text hover:bg-gray-100 rounded-lg transition-colors"
                                title="编辑"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRegenerate(apiKey)}
                                className="p-2 text-apple-blue hover:bg-apple-blue/10 rounded-lg transition-colors"
                                title="重新生成"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(apiKey.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="删除"
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
