import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { providersAPI, apiKeysAPI, monitorAPI, costAPI } from '@/services/api';
import { Activity, Server, Key, Clock, TrendingUp, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export default function Home() {
  const { setProviders, setApiKeys, setStats } = useStore();
  const [stats, setLocalStats] = useState<{
    total_requests: number;
    success_rate: number;
    avg_latency: number;
    top_providers: { provider: string; count: number }[];
    top_models: { model: string; count: number }[];
  } | null>(null);
  const [monthlyUsage, setMonthlyUsage] = useState<{
    month: number;
    year: number;
    total_cost: number;
    total_requests: number;
    total_prompt_tokens: number;
    total_completion_tokens: number;
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
        const [providers, apiKeys, monitorStats, monthly, realtime] = await Promise.all([
          providersAPI.getAll(),
          apiKeysAPI.getAll(),
          monitorAPI.getStats(),
          costAPI.getMonthlyUsage(),
          monitorAPI.getRealtimeStats(),
        ]);
        setProviders(providers);
        setApiKeys(apiKeys);
        setLocalStats(monitorStats);
        setMonthlyUsage(monthly);
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
    },
    {
      icon: Server,
      label: '提供商',
      value: useStore.getState().providers.length.toString(),
      color: 'green',
    },
    {
      icon: Key,
      label: 'API密钥',
      value: useStore.getState().apiKeys.length.toString(),
      color: 'orange',
    },
    {
      icon: Clock,
      label: '平均延迟',
      value: `${realtimeStats.avgLatency}ms`,
      color: 'purple',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          const colorMap = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            orange: 'bg-orange-50 text-orange-600',
            purple: 'bg-purple-50 text-purple-600',
          };
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl ${colorMap[card.color as keyof typeof colorMap]} flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm text-apple-text-secondary mb-1">{card.label}</p>
              <p className="text-2xl font-semibold text-apple-text">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-apple-text mb-6">请求趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fill: '#86868b' }} />
              <YAxis tick={{ fill: '#86868b' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e5ea',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="requests" 
                stroke="#0071e3" 
                strokeWidth={2}
                dot={{ fill: '#0071e3', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#0071e3' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-apple-text mb-6">Top 提供商</h3>
          {stats?.top_providers && stats.top_providers.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.top_providers.slice(0, 5)} layout="vertical">
                <XAxis type="number" tick={{ fill: '#86868b' }} />
                <YAxis dataKey="provider" type="category" width={100} tick={{ fill: '#1d1d1f' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e5ea',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.top_providers.slice(0, 5).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-apple-text-secondary">
              暂无数据
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-apple-text">本月统计</h3>
            {monthlyUsage && (
              <span className="text-sm text-apple-text-secondary">
                {monthlyUsage.year}年{monthlyUsage.month}月
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-apple-text-secondary mb-1">总请求</p>
              <p className="text-xl font-semibold text-apple-text">
                {monthlyUsage?.total_requests.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-apple-text-secondary mb-1">总消耗</p>
              <p className="text-xl font-semibold text-apple-text">
                ${(monthlyUsage?.total_cost || 0).toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-apple-text-secondary mb-1">Prompt Token</p>
              <p className="text-xl font-semibold text-apple-text">
                {(monthlyUsage?.total_prompt_tokens || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-apple-text-secondary mb-1">Completion Token</p>
              <p className="text-xl font-semibold text-apple-text">
                {(monthlyUsage?.total_completion_tokens || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-apple-text">实时状态</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-apple-text-secondary">成功率</span>
              <span className="font-semibold text-apple-text">
                {stats?.success_rate ? `${stats.success_rate.toFixed(1)}%` : '0%'}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${stats?.success_rate || 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-apple-text-secondary">活跃连接</span>
              <span className="font-semibold text-apple-text">
                {realtimeStats.activeConnections}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-apple-text-secondary">成功请求</span>
              <span className="font-semibold text-green-600">
                {realtimeStats.successCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-apple-text-secondary">失败请求</span>
              <span className="font-semibold text-red-500">
                {realtimeStats.errorCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
