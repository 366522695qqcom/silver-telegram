import { useEffect, useState } from 'react';
import { Plus, Trash2, Eye, MoreHorizontal, Webhook } from 'lucide-react';
import { asyncAPI, webhookAPI } from '@/services/api';

interface AsyncTask {
  id: string;
  task_type: string;
  status: string;
  payload: any;
  result?: any;
  webhook_url?: string;
  error_message?: string;
  created_at: string;
}

export default function AsyncTasks() {
  const [tasks, setTasks] = useState<AsyncTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AsyncTask | null>(null);
  const [testWebhook, setTestWebhook] = useState({ url: '', secret: '' });
  const [testResult, setTestResult] = useState<any>(null);
  const [form, setForm] = useState({
    task_type: '',
    payload: '{}',
    webhook_url: '',
    webhook_secret: ''
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await asyncAPI.getTasks();
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
        payload: JSON.parse(form.payload)
      };
      await asyncAPI.createTask(data);
      setShowModal(false);
      resetForm();
      loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('JSON 格式错误');
    }
  };

  const handleView = (task: AsyncTask) => {
    setSelectedTask(task);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此任务吗？')) return;
    try {
      await asyncAPI.deleteTask(id);
      loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleTestWebhook = async () => {
    try {
      const res = await webhookAPI.test(testWebhook.url, testWebhook.secret);
      setTestResult(res);
    } catch (error) {
      console.error('Failed to test webhook:', error);
      setTestResult({ success: false, error: error.message });
    }
  };

  const resetForm = () => {
    setForm({
      task_type: '',
      payload: '{}',
      webhook_url: '',
      webhook_secret: ''
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
          <h1 className="text-2xl font-semibold text-apple-text">异步任务 & Webhook</h1>
          <p className="text-apple-text-secondary mt-1">管理异步任务和 Webhook 回调</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTestModal(true)}
            className="apple-btn-secondary flex items-center gap-2"
          >
            <Webhook size={20} />
            测试 Webhook
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="apple-btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            新建任务
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="apple-card overflow-hidden">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⚡</div>
              <p className="text-apple-text-secondary">暂无异步任务</p>
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
                        <h3 className="font-medium text-apple-text">{task.task_type}</h3>
                        <span className={`apple-badge ${badge.className}`}>{badge.label}</span>
                      </div>
                      <div className="mt-1 text-sm text-apple-text-secondary">
                        {new Date(task.created_at).toLocaleString()}
                        {task.webhook_url && ' • 有 Webhook'}
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
            <h2 className="text-xl font-semibold mb-4">新建异步任务</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">任务类型</label>
                <input
                  type="text"
                  value={form.task_type}
                  onChange={e => setForm({ ...form, task_type: e.target.value })}
                  className="apple-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">任务数据 (JSON)</label>
                <textarea
                  value={form.payload}
                  onChange={e => setForm({ ...form, payload: e.target.value })}
                  className="apple-input font-mono text-sm"
                  rows={8}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">Webhook URL (可选)</label>
                <input
                  type="text"
                  value={form.webhook_url}
                  onChange={e => setForm({ ...form, webhook_url: e.target.value })}
                  className="apple-input"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">Webhook 密钥 (可选)</label>
                <input
                  type="text"
                  value={form.webhook_secret}
                  onChange={e => setForm({ ...form, webhook_secret: e.target.value })}
                  className="apple-input"
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

      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="apple-card w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">测试 Webhook</h2>
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestResult(null);
                }}
                className="p-2 hover:bg-apple-gray-bg rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">Webhook URL</label>
                <input
                  type="text"
                  value={testWebhook.url}
                  onChange={e => setTestWebhook({ ...testWebhook, url: e.target.value })}
                  className="apple-input"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">签名密钥 (可选)</label>
                <input
                  type="text"
                  value={testWebhook.secret}
                  onChange={e => setTestWebhook({ ...testWebhook, secret: e.target.value })}
                  className="apple-input"
                />
              </div>
              <button onClick={handleTestWebhook} className="apple-btn-primary w-full">
                发送测试
              </button>
              {testResult && (
                <div>
                  <h3 className="font-medium mb-2">结果</h3>
                  <pre className="apple-input font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="apple-card w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">任务详情</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 hover:bg-apple-gray-bg rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-apple-text-secondary text-sm">类型</span>
                  <p className="font-medium">{selectedTask.task_type}</p>
                </div>
                <div>
                  <span className="text-apple-text-secondary text-sm">状态</span>
                  <p>
                    <span className={`apple-badge ${getStatusBadge(selectedTask.status).className}`}>
                      {getStatusBadge(selectedTask.status).label}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">任务数据</h3>
                <pre className="apple-input font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedTask.payload, null, 2)}
                </pre>
              </div>
              {selectedTask.result && (
                <div>
                  <h3 className="font-medium mb-2">结果</h3>
                  <pre className="apple-input font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedTask.result, null, 2)}
                  </pre>
                </div>
              )}
              {selectedTask.error_message && (
                <div>
                  <h3 className="font-medium mb-2 text-red-500">错误</h3>
                  <pre className="apple-input font-mono text-sm overflow-x-auto whitespace-pre-wrap text-red-500">
                    {selectedTask.error_message}
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
