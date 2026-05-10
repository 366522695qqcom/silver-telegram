import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { providersAPI, apiKeysAPI, monitorAPI } from '@/services/api';
import { Activity, Server, Key, Clock, TrendingUp, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export default function Home() {
  const { providers, apiKeys, setProviders, setApiKeys, setStats } = useStore();
  const [stats, setLocalStats] = useState<{
    total_requests: number;
    success_rate: number;
    avg_latency: number;
    top_providers: { provider: string; count: number }[];
    top_models: { model: string; count: number }[];
  } | null>(null);
  const [realtimeStats, setRealtimeStats] = useState<{
    totalRequests: number;
    successCount: number;
    errorCount: number;
    avgLatency: number;
    activeConnections: number;
  }>({
    totalRequests: 0,
    successCount: 0,
    errorCount: 0,
    avgLatency: 0,
    activeConnections: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const fetchData = async () => {
      try {
        const [providers, apiKeys, monitorStats, realtime] = await Promise.all([
          providersAPI.getAll(),
          apiKeysAPI.getAll(),
          monitorAPI.getStats(),
          monitorAPI.getRealtimeStats(),
        ]);
        setProviders(providers);
        setApiKeys(apiKeys);
        setLocalStats(monitorStats);
        setRealtimeStats(realtime);
        setStats(realtime);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
  }, [setProviders, setApiKeys, setStats]);

  const chartData = Array.from({ length: 7 }, (_, i) => ({
    day: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
    requests: Math.floor(Math.random() * 100) + 50,
  }));

  const COLORS = ['#0071e3', '#34c759', '#ff9500', '#ff3b30', '#af52de'];

  const statsCards = [
    {
      icon: Activity,
      label: '今日请求',
      value: realtimeStats.totalRequests.toLocaleString(),
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: Server,
      label: '已配置提供商',
      value: providers.length.toString(),
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      icon: Key,
      label: 'API密钥',
      value: apiKeys.length.toString(),
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      icon: Clock,
      label: '平均延迟',
      value: `${realtimeStats.avgLatency}ms`,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6 animate-apple-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="apple-card group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`apple-stat-icon ${card.bgColor} ${card.iconColor} group-hover:scale-105 transition-transform duration-200`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="apple-stat-label">{card.label}</p>
              <p className="apple-stat-value mt-1">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 apple-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-apple-text tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-apple-blue" />
              请求趋势
            </h3>
            <span className="text-xs text-apple-text-tertiary">最近 7 天</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#86868b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#86868b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e5ea',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#1d1d1f', fontWeight: 500 }}
              />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="#0071e3"
                strokeWidth={2}
                dot={{ fill: '#0071e3', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: '#0071e3', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="apple-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-apple-text tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-apple-warning" />
              Top 提供商
            </h3>
          </div>
          {stats?.top_providers && stats.top_providers.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.top_providers.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis type="number" tick={{ fill: '#86868b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="provider" type="category" width={80} tick={{ fill: '#1d1d1f', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e5ea',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {stats.top_providers.slice(0, 5).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-apple-text-secondary">
              <Server className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">暂无数据</p>
              <p className="text-xs text-apple-text-tertiary mt-1">配置提供商后查看</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="apple-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-apple-text tracking-tight">实时状态</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-apple-success animate-pulse" />
              <span className="text-xs text-apple-text-tertiary">实时更新</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-apple-text-secondary">成功率</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-apple-success rounded-full transition-all duration-500"
                    style={{ width: `${stats?.success_rate || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-apple-text w-12 text-right">
                  {stats?.success_rate ? `${stats.success_rate.toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-apple-border-light">
              <span className="text-sm text-apple-text-secondary">活跃连接</span>
              <span className="text-sm font-semibold text-apple-text">{realtimeStats.activeConnections}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-apple-border-light">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-apple-success" />
                <span className="text-sm text-apple-text-secondary">成功请求</span>
              </div>
              <span className="text-sm font-semibold text-apple-success">{realtimeStats.successCount}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-apple-border-light">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-apple-error" />
                <span className="text-sm text-apple-text-secondary">失败请求</span>
              </div>
              <span className="text-sm font-semibold text-apple-error">{realtimeStats.errorCount}</span>
            </div>
          </div>
        </div>

        <div className="apple-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-apple-text tracking-tight">系统概览</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-apple-gray-bg rounded-apple-md">
              <p className="text-xs text-apple-text-tertiary mb-1">总请求数</p>
              <p className="text-xl font-semibold text-apple-text">{stats?.total_requests?.toLocaleString() || '0'}</p>
            </div>
            <div className="p-4 bg-apple-gray-bg rounded-apple-md">
              <p className="text-xs text-apple-text-tertiary mb-1">平均延迟</p>
              <p className="text-xl font-semibold text-apple-text">{stats?.avg_latency ? `${stats.avg_latency}ms` : 'N/A'}</p>
            </div>
            <div className="p-4 bg-apple-gray-bg rounded-apple-md">
              <p className="text-xs text-apple-text-tertiary mb-1">提供商数量</p>
              <p className="text-xl font-semibold text-apple-text">{providers.length}</p>
            </div>
            <div className="p-4 bg-apple-gray-bg rounded-apple-md">
              <p className="text-xs text-apple-text-tertiary mb-1">API密钥数量</p>
              <p className="text-xl font-semibold text-apple-text">{apiKeys.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
