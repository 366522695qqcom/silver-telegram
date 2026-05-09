import { useEffect, useState } from 'react';
import { Plus, Trash2, Play, Eye, MoreHorizontal } from 'lucide-react';
import { batchAPI } from '@/services/api';

interface BatchTask {
  id: string;
  name: string;
  status: string;
  requests: any[];
  results?: any[];
  strategy: string;
  created_at: string;
}

export default function BatchTasks() {
  const [tasks, setTasks] = useState<BatchTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<BatchTask | null>(null);
  const [form, setForm] = useState({
    name: '',
    requests: '[{"messages": [{"role": "user", "content": "你好"}], "model": "gpt-3.5-turbo"}]',
    strategy: 'parallel'
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await batchAPI.getTasks();
      setTasks(res);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        requests: JSON.parse(form.requests)
      };
      await batchAPI.createTask(data);
      setShowModal(false);
      resetForm();
      loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('请求格式错误，请检查 JSON 格式');
    }
  };

  const handleView = (task: BatchTask) => {
    setSelectedTask(task);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此任务吗？')) return;
    try {
      await batchAPI.deleteTask(id);
      loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      requests: '[{"messages": [{"role": "user", "content": "你好"}], "model": "gpt-3.5-turbo"}]',
      strategy: 'parallel'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; label: string }> = {
      pending: { className: 'apple-badge-warning', label: '等待中' },
      processing: { className: 'apple-badge-info', label: '处理中' },
      completed: { className: 'apple-badge-success', label: '已完成' },
      failed: { className: 'apple-badge-danger', label: '失败' }
    };
    return badges[status] || { className: '', label: status };
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-apple-text">批处理任务</h1>
          <p className="text-apple-text-secondary mt-1">批量执行 API 请求</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="apple-btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          新建任务
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="apple-card overflow-hidden">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-apple-text-secondary">暂无批处理任务</p>
              <button
                onClick={() => setShowModal(true)}
                className="apple-btn-primary mt-4"
              >
                创建第一个任务
              </button>
            </div>
          ) : (
            <div className="divide-y divide-apple-border">
              {tasks.map(task => {
                const badge = getStatusBadge(task.status);
                return (
                  <div key={task.id} className="p-4 flex items-center justify-between hover:bg-apple-gray-bg/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-apple-text">{task.name}</h3>
                        <span className={`apple-badge ${badge.className}`}>{badge.label}</span>
                      </div>
                      <div className="mt-1 text-sm text-apple-text-secondary">
                        {task.requests.length} 个请求 • {task.strategy === 'parallel' ? '并行' : '串行'} • {new Date(task.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(task)}
                        className="p-2 hover:bg-apple-gray-bg rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="apple-card w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">新建批处理任务</h2>
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
                <label className="block text-sm font-medium text-apple-text mb-1">执行策略</label>
                <select
                  value={form.strategy}
                  onChange={e => setForm({ ...form, strategy: e.target.value })}
                  className="apple-input"
                >
                  <option value="parallel">并行执行</option>
                  <option value="serial">串行执行</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">请求列表 (JSON)</label>
                <textarea
                  value={form.requests}
                  onChange={e => setForm({ ...form, requests: e.target.value })}
                  className="apple-input font-mono text-sm"
                  rows={10}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="apple-btn-secondary flex-1"
                >
                  取消
                </button>
                <button type="submit" className="apple-btn-primary flex-1">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="apple-card w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedTask.name}</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 hover:bg-apple-gray-bg rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">原始请求</h3>
                <pre className="apple-input font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedTask.requests, null, 2)}
                </pre>
              </div>
              {selectedTask.results && (
                <div>
                  <h3 className="font-medium mb-2">结果</h3>
                  <pre className="apple-input font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedTask.results, null, 2)}
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
