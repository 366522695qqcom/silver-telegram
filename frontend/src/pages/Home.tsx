import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { apiClient } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowRight,
  BarChart2,
  Zap,
  TrendingUp,
  Activity,
  Globe,
} from 'lucide-react';

export default function Home() {
  const { stats, setStats } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await apiClient.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Requests',
      value: stats?.total_requests.toLocaleString() || '-',
      icon: BarChart2,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      title: 'Today Requests',
      value: stats?.today_requests.toLocaleString() || '-',
      icon: Zap,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      title: 'Success Rate',
      value: `${stats?.success_rate.toFixed(1) || 0}%`,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    {
      title: 'Avg Latency',
      value: `${stats?.avg_latency_ms || 0}ms`,
      icon: Activity,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of your AI gateway performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-apple shadow-apple p-6"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 ${stat.bg} rounded-full`}>
                  <Icon className={stat.color} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Provider Stats */}
        <div className="bg-white rounded-apple shadow-apple p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Providers Performance
          </h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Loading...
            </div>
          ) : stats?.provider_stats && stats.provider_stats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.provider_stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="provider" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)' 
                  }} 
                />
                <Bar 
                  dataKey="count" 
                  fill="#007aff" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No providers configured
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-apple shadow-apple p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Quick Actions
          </h2>
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/settings'}
              className="w-full p-4 border border-gray-200 rounded-apple hover:border-primary hover:bg-blue-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-full">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Manage Providers</p>
                  <p className="text-sm text-gray-500">Configure AI providers</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button
              onClick={() => window.location.href = '/monitor'}
              className="w-full p-4 border border-gray-200 rounded-apple hover:border-primary hover:bg-blue-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-full">
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">View Activity</p>
                  <p className="text-sm text-gray-500">Check request logs</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
