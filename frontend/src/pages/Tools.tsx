import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Play } from 'lucide-react';
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
  const [showExecModal, setShowExecModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [executingTool, setExecutingTool] = useState<Tool | null>(null);
  const [execParams, setExecParams] = useState('{}');
  const [execResult, setExecResult] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'builtin',
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

  const handleExecute = (tool: Tool) => {
    setExecutingTool(tool);
    setExecParams('{}');
    setExecResult(null);
    setShowExecModal(true);
  };

  const doExecute = async () => {
    if (!executingTool) return;
    try {
      const params = JSON.parse(execParams);
      const res = await toolsAPI.execute(executingTool.id, params);
      setExecResult(res);
    } catch (error) {
      console.error('Failed to execute tool:', error);
      alert('执行失败');
    }
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
      type: 'builtin',
      schema: '{"type": "object", "properties": {}}',
      endpoint: '',
      auth_config: '',
      enabled: true
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-apple-text">工具管理</h1>
          <p className="text-apple-text-secondary mt-1">管理函数调用工具</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="apple-btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          新建工具
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="apple-card overflow-hidden">
          {tools.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔧</div>
              <p className="text-apple-text-secondary">暂无工具</p>
              <button
                onClick={() => setShowModal(true)}
                className="apple-btn-primary mt-4"
              >
                创建第一个工具
              </button>
            </div>
          ) : (
            <div className="divide-y divide-apple-border">
              {tools.map(tool => (
                <div key={tool.id} className="p-4 flex items-center justify-between hover:bg-apple-gray-bg/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-apple-text">{tool.name}</h3>
                      <span className={`apple-badge ${tool.enabled ? 'apple-badge-success' : 'apple-badge-warning'}`}>
                        {tool.enabled ? '已启用' : '已禁用'}
                      </span>
                      <span className="apple-badge apple-badge-info">
                        {tool.type === 'builtin' ? '内置' : '自定义'}
                      </span>
                    </div>
                    {tool.description && (
                      <p className="mt-1 text-sm text-apple-text-secondary">{tool.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExecute(tool)}
                      className="p-2 hover:bg-apple-gray-bg rounded-lg transition-colors"
                    >
                      <Play size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(tool)}
                      className="p-2 hover:bg-apple-gray-bg rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(tool.id)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="apple-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingTool ? '编辑工具' : '新建工具'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="apple-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">描述</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="apple-input"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">类型</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="apple-input"
                >
                  <option value="builtin">内置</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">Schema (JSON)</label>
                <textarea
                  value={form.schema}
                  onChange={e => setForm({ ...form, schema: e.target.value })}
                  className="apple-input font-mono text-sm"
                  rows={8}
                  required
                />
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
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-apple-text mb-1">认证配置 (JSON, 可选)</label>
                    <textarea
                      value={form.auth_config}
                      onChange={e => setForm({ ...form, auth_config: e.target.value })}
                      className="apple-input font-mono text-sm"
                      rows={4}
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
                <label htmlFor="enabled" className="text-apple-text">启用</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTool(null);
                    resetForm();
                  }}
                  className="apple-btn-secondary flex-1"
                >
                  取消
                </button>
                <button type="submit" className="apple-btn-primary flex-1">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExecModal && executingTool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="apple-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">执行: {executingTool.name}</h2>
              <button
                onClick={() => setShowExecModal(false)}
                className="p-2 hover:bg-apple-gray-bg rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">参数 (JSON)</label>
                <textarea
                  value={execParams}
                  onChange={e => setExecParams(e.target.value)}
                  className="apple-input font-mono text-sm"
                  rows={6}
                />
              </div>
              <button onClick={doExecute} className="apple-btn-primary w-full">
                执行
              </button>
              {execResult && (
                <div>
                  <label className="block text-sm font-medium text-apple-text mb-1">结果</label>
                  <pre className="apple-input font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(execResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
