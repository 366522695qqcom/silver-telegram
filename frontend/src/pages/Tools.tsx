import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Zap, Bot, Link } from 'lucide-react';
import { toolsAPI } from '@/services/api';

interface Tool {
  id: string;
  name: string;
  description?: string;
  type: string;
  schema: any;
  endpoint?: string;
  auth_config?: any;
  enabled: boolean;
  created_at: string;
}

export default function Tools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'custom',
    schema: '{"type": "object", "properties": {}}',
    endpoint: '',
    auth_config: '',
    enabled: true
  });

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setLoading(true);
      const res = await toolsAPI.getAll();
      setTools(res);
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        schema: JSON.parse(form.schema),
        auth_config: form.auth_config ? JSON.parse(form.auth_config) : undefined
      };
      
      if (editingTool) {
        await toolsAPI.update(editingTool.id, data);
      } else {
        await toolsAPI.create(data);
      }
      
      setShowModal(false);
      setEditingTool(null);
      resetForm();
      loadTools();
    } catch (error) {
      console.error('Failed to save tool:', error);
      alert('JSON 格式错误，请检查');
    }
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setForm({
      name: tool.name,
      description: tool.description || '',
      type: tool.type,
      schema: JSON.stringify(tool.schema, null, 2),
      endpoint: tool.endpoint || '',
      auth_config: tool.auth_config ? JSON.stringify(tool.auth_config, null, 2) : '',
      enabled: tool.enabled
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此工具吗？')) return;
    try {
      await toolsAPI.delete(id);
      loadTools();
    } catch (error) {
      console.error('Failed to delete tool:', error);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      type: 'custom',
      schema: '{"type": "object", "properties": {}}',
      endpoint: '',
      auth_config: '',
      enabled: true
    });
  };

  return (
    <div className="p-6 animate-apple-slide-up">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-apple-text">工具注册表</h1>
            <p className="text-apple-text-secondary mt-1">注册可在对话中自动调用的工具</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="apple-btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            注册工具
          </button>
        </div>

        <div className="mt-4 apple-card rounded-apple-md p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">自动 Tool Calling 工作原理</p>
              <p>客户端发送对话请求时携带 <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">tools</code> 参数，网关会自动将请求转发给大模型。当模型决定调用工具时，网关会自动匹配注册表中的工具并执行，然后将结果喂回模型继续生成，直到模型给出最终回复。整个过程完全自动，无需手动干预。</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {tools.length === 0 ? (
            <div className="apple-card rounded-apple-md p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-apple-gray-bg flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-apple-text-secondary opacity-50" />
              </div>
              <p className="text-lg font-medium text-apple-text mb-2">暂无注册工具</p>
              <p className="text-sm text-apple-text-secondary mb-4">注册工具后，当模型在对话中需要调用工具时，网关会自动执行</p>
              <button
                onClick={() => setShowModal(true)}
                className="apple-btn-primary"
              >
                注册第一个工具
              </button>
            </div>
          ) : (
            tools.map(tool => (
              <div key={tool.id} className="apple-card rounded-apple-md p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tool.type === 'builtin' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {tool.type === 'builtin' ? <Zap className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                      </div>
                      <h3 className="font-semibold text-apple-text text-lg">{tool.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tool.enabled 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {tool.enabled ? '已启用' : '已禁用'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                        {tool.type === 'builtin' ? '内置' : 'API'}
                      </span>
                    </div>
                    {tool.description && (
                      <p className="text-sm text-apple-text-secondary mb-2">{tool.description}</p>
                    )}
                    {tool.type === 'custom' && tool.endpoint && (
                      <p className="text-xs text-apple-text-secondary font-mono bg-apple-gray-bg inline-block px-2 py-1 rounded">
                        {tool.endpoint}
                      </p>
                    )}
                    <div className="mt-2">
                      <p className="text-xs text-apple-text-secondary mb-1">参数 Schema:</p>
                      <pre className="text-xs font-mono text-apple-text-secondary bg-apple-gray-bg p-2 rounded max-h-24 overflow-y-auto">
                        {JSON.stringify(tool.schema, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => handleEdit(tool)}
                      className="p-2 hover:bg-apple-gray-bg rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit size={16} className="text-apple-text-secondary" />
                    </button>
                    <button
                      onClick={() => handleDelete(tool.id)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="apple-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-1">
                {editingTool ? '编辑工具' : '注册工具'}
              </h2>
              <p className="text-sm text-apple-text-secondary mb-4">
                注册的工具会在对话中自动被模型调用。模型根据用户意图决定何时调用哪个工具。
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-apple-text mb-1">工具名称</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="apple-input"
                    placeholder="如: get_weather"
                    required
                  />
                  <p className="text-xs text-apple-text-secondary mt-1">模型会根据此名称匹配工具调用</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-apple-text mb-1">描述</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="apple-input"
                    rows={2}
                    placeholder="描述工具的功能，帮助模型判断何时调用"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-apple-text mb-1">类型</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="apple-input"
                  >
                    <option value="custom">API 工具（调用外部接口）</option>
                    <option value="builtin">内置工具</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-apple-text mb-1">参数 Schema (JSON)</label>
                  <textarea
                    value={form.schema}
                    onChange={e => setForm({ ...form, schema: e.target.value })}
                    className="apple-input font-mono text-sm"
                    rows={8}
                    placeholder='{"type": "object", "properties": {"location": {"type": "string", "description": "城市名"}}}'
                    required
                  />
                  <p className="text-xs text-apple-text-secondary mt-1">遵循 JSON Schema 格式，模型会根据此生成参数</p>
                </div>
                {form.type === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-apple-text mb-1">API 端点</label>
                      <input
                        type="text"
                        value={form.endpoint}
                        onChange={e => setForm({ ...form, endpoint: e.target.value })}
                        className="apple-input"
                        placeholder="https://api.example.com/weather"
                      />
                      <p className="text-xs text-apple-text-secondary mt-1">模型调用此工具时，网关会 POST 到此地址</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-apple-text mb-1">认证配置 (JSON, 可选)</label>
                      <textarea
                        value={form.auth_config}
                        onChange={e => setForm({ ...form, auth_config: e.target.value })}
                        className="apple-input font-mono text-sm"
                        rows={4}
                        placeholder='{"headers": {"X-API-Key": "xxx"}}'
                      />
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={form.enabled}
                    onChange={e => setForm({ ...form, enabled: e.target.checked })}
                  />
                  <label htmlFor="enabled" className="text-apple-text">启用（只有启用的工具才会被自动调用）</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTool(null);
                      resetForm();
                    }}
                    className="apple-btn-secondary flex-1 py-3"
                  >
                    取消
                  </button>
                  <button type="submit" className="apple-btn-primary flex-1 py-3">
                    {editingTool ? '保存' : '注册'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
