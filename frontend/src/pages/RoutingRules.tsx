import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, Edit, MoreHorizontal } from 'lucide-react';
import { routingAPI } from '@/services/api';

interface RoutingRule {
  id: string;
  name: string;
  strategy: string;
  model_filter?: string;
  provider_priority?: string[];
  enabled: boolean;
  created_at: string;
}

export default function RoutingRules() {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [form, setForm] = useState({
    name: '',
    strategy: 'latency',
    model_filter: '',
    provider_priority: '',
    enabled: true
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await routingAPI.getRules();
      setRules(res);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        provider_priority: form.provider_priority 
          ? form.provider_priority.split(',').map(s => s.trim()) 
          : undefined
      };
      
      if (editingRule) {
        await routingAPI.updateRule(editingRule.id, data);
      } else {
        await routingAPI.createRule(data);
      }
      
      setShowModal(false);
      setEditingRule(null);
      resetForm();
      loadRules();
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleEdit = (rule: RoutingRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      strategy: rule.strategy,
      model_filter: rule.model_filter || '',
      provider_priority: rule.provider_priority ? rule.provider_priority.join(', ') : '',
      enabled: rule.enabled
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此规则吗？')) return;
    try {
      await routingAPI.deleteRule(id);
      loadRules();
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      strategy: 'latency',
      model_filter: '',
      provider_priority: '',
      enabled: true
    });
  };

  const getStrategyLabel = (strategy: string) => {
    const labels: Record<string, string> = {
      latency: '最低延迟',
      availability: '最高可用性',
      priority: '自定义优先级'
    };
    return labels[strategy] || strategy;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-apple-text">智能路由</h1>
          <p className="text-apple-text-secondary mt-1">配置请求路由策略</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="apple-btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          新建规则
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="apple-card overflow-hidden">
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔀</div>
              <p className="text-apple-text-secondary">暂无路由规则</p>
              <button
                onClick={() => setShowModal(true)}
                className="apple-btn-primary mt-4"
              >
                创建第一个规则
              </button>
            </div>
          ) : (
            <div className="divide-y divide-apple-border">
              {rules.map(rule => (
                <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-apple-gray-bg/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-apple-text">{rule.name}</h3>
                      <span className={`apple-badge ${rule.enabled ? 'apple-badge-success' : 'apple-badge-warning'}`}>
                        {rule.enabled ? '已启用' : '已禁用'}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-apple-text-secondary">
                      策略: {getStrategyLabel(rule.strategy)}
                      {rule.model_filter && ` • 模型: ${rule.model_filter}`}
                      {rule.provider_priority && ` • 优先级: ${rule.provider_priority.join(', ')}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="p-2 hover:bg-apple-gray-bg rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
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
          <div className="apple-card w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingRule ? '编辑规则' : '新建规则'}
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
                <label className="block text-sm font-medium text-apple-text mb-1">策略</label>
                <select
                  value={form.strategy}
                  onChange={e => setForm({ ...form, strategy: e.target.value })}
                  className="apple-input"
                >
                  <option value="latency">最低延迟</option>
                  <option value="availability">最高可用性</option>
                  <option value="priority">自定义优先级</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">模型过滤 (可选)</label>
                <input
                  type="text"
                  value={form.model_filter}
                  onChange={e => setForm({ ...form, model_filter: e.target.value })}
                  className="apple-input"
                  placeholder="例如: gpt-4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">提供商优先级 (逗号分隔, 可选)</label>
                <input
                  type="text"
                  value={form.provider_priority}
                  onChange={e => setForm({ ...form, provider_priority: e.target.value })}
                  className="apple-input"
                  placeholder="例如: OpenAI, Claude"
                />
              </div>
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
                    setEditingRule(null);
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
    </div>
  );
}
