import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { apiKeysAPI } from '@/services/api';
import type { ApiKey, CreateApiKeyData } from '@/types';
import { Plus, Trash2, Copy, RefreshCw, CheckCircle, Eye, EyeOff, AlertTriangle, Clock, ToggleLeft, ToggleRight } from 'lucide-react';

const EXPIRY_OPTIONS = [
  { label: '永久有效', value: '' },
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
  { label: '90天', value: '90d' },
  { label: '365天', value: '365d' },
];

const getExpiryDate = (value: string): string | null => {
  if (!value) return null;
  const days = parseInt(value);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export default function ApiKeys() {
  const { apiKeys, setApiKeys } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  const [formData, setFormData] = useState<CreateApiKeyData & { expiry: string }>({
    name: '',
    expiry: '',
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
    if (!formData.name.trim()) return;
    setIsCreatingKey(true);
    try {
      const expires_at = getExpiryDate(formData.expiry);
      const newKey = await apiKeysAPI.create({ name: formData.name, expires_at: expires_at || undefined });
      setApiKeys([...apiKeys, newKey]);
      setIsCreating(false);
      setFormData({ name: '', expiry: '' });
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('创建失败: ' + (error as Error).message);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await apiKeysAPI.delete(id);
      setApiKeys(apiKeys.filter(k => k.id !== id));
      if (selectedKey?.id === id) {
        setSelectedKey(null);
      }
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete API key:', error);
      alert('删除失败: ' + (error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (apiKey: ApiKey) => {
    setIsToggling(apiKey.id);
    try {
      const updated = await apiKeysAPI.toggleStatus(apiKey.id);
      setApiKeys(apiKeys.map(k => k.id === updated.id ? updated : k));
      if (selectedKey?.id === updated.id) {
        setSelectedKey(updated);
      }
    } catch (error) {
      console.error('Failed to toggle API key status:', error);
      alert('切换状态失败: ' + (error as Error).message);
    } finally {
      setIsToggling(null);
    }
  };

  const handleRegenerate = async (apiKey: ApiKey) => {
    if (!confirm('重新生成密钥后，旧密钥将立即失效。确定要继续吗？')) return;
    setIsRegenerating(apiKey.id);
    try {
      const updated = await apiKeysAPI.regenerate(apiKey.id);
      setApiKeys(apiKeys.map(k => k.id === updated.id ? updated : k));
      if (selectedKey?.id === updated.id) {
        setSelectedKey(updated);
        setShowKey(true);
      }
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
      alert('重新生成失败: ' + (error as Error).message);
    } finally {
      setIsRegenerating(null);
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
              <p className="mt-1">在请求头中添加：<code className="font-mono bg-gray-100 text-apple-text px-2 py-1 rounded text-xs">Authorization: Bearer your_api_key</code></p>
              <p className="mt-1 text-xs text-apple-text-secondary">也支持 <code className="font-mono bg-gray-100 text-apple-text px-1 py-0.5 rounded text-xs">X-API-Key: your_api_key</code></p>
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
            setFormData({ name: '', expiry: '' });
          }}
          className="apple-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          创建密钥
        </button>
      </div>

      {isCreating && (
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
            <div>
              <label className="block text-sm font-medium text-apple-text mb-2">有效期</label>
              <div className="flex flex-wrap gap-2">
                {EXPIRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFormData({ ...formData, expiry: opt.value })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      formData.expiry === opt.value
                        ? 'bg-apple-blue text-white shadow-sm'
                        : 'bg-gray-100 text-apple-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
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
                disabled={!formData.name.trim() || isCreatingKey}
                className="apple-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreatingKey ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    创建中...
                  </>
                ) : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                apiKeys.map((apiKey) => (
                  <tr
                    key={apiKey.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      selectedKey?.id === apiKey.id ? 'bg-apple-blue/5' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-apple-text">{apiKey.name || '未命名'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-apple-text bg-gray-100 px-2 py-1 rounded">
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
                          title={showKey && selectedKey?.id === apiKey.id ? '隐藏密钥' : '显示密钥'}
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
                          title="复制密钥"
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
                        disabled={isToggling === apiKey.id}
                        className="flex items-center gap-2 disabled:opacity-50"
                        title={apiKey.enabled ? '点击禁用' : '点击启用'}
                      >
                        {isToggling === apiKey.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-apple-blue" />
                        ) : apiKey.enabled ? (
                          <ToggleRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                        <span className={`text-sm font-medium ${apiKey.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                          {apiKey.enabled ? '启用' : '禁用'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-apple-text-secondary" />
                        <span className="text-sm text-apple-text-secondary">
                          {formatDate(apiKey.expires_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-apple-text-secondary">
                        {new Date(apiKey.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRegenerate(apiKey)}
                          disabled={isRegenerating === apiKey.id}
                          className="p-2 text-apple-blue hover:bg-apple-blue/10 rounded-lg transition-colors disabled:opacity-50"
                          title="重新生成"
                        >
                          {isRegenerating === apiKey.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </button>
                        {deleteConfirmId === apiKey.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(apiKey.id)}
                              disabled={isDeleting}
                              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              {isDeleting ? '删除中...' : '确认'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={isDeleting}
                              className="px-2 py-1 bg-gray-200 text-apple-text text-xs rounded hover:bg-gray-300 transition-colors"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(apiKey.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-apple-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-apple-text">确认删除</h3>
                <p className="text-sm text-apple-text-secondary">此操作不可撤销</p>
              </div>
            </div>
            <p className="text-sm text-apple-text-secondary mb-6">
              删除后，使用此密钥的所有请求将立即失效。确定要删除吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="apple-btn-secondary flex-1"
                disabled={isDeleting}
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    删除中...
                  </>
                ) : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  );
}
