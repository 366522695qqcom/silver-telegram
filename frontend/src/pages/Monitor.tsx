import { useState, useEffect, useRef } from 'react';
import { monitorAPI } from '@/services/api';
import type { Request, Stats } from '@/types';
import { Activity, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function Monitor() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    successCount: 0,
    errorCount: 0,
    avgLatency: 0,
    activeConnections: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await monitorAPI.getRequests(1, 50);
        setRequests(data);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  useEffect(() => {
    socketRef.current = io('http://localhost:3000');

    socketRef.current.on('stats', (newStats: Stats) => {
      setStats(newStats);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const data = await monitorAPI.getRequests(1, 50);
      setRequests(data);
    } catch (error) {
      console.error('Failed to refresh requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getStatusIcon = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 400) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const statsCards = [
    {
      icon: Activity,
      label: '总请求数',
      value: stats.totalRequests.toLocaleString(),
      color: 'blue',
    },
    {
      icon: CheckCircle,
      label: '成功请求',
      value: stats.successCount.toLocaleString(),
      color: 'green',
    },
    {
      icon: XCircle,
      label: '失败请求',
      value: stats.errorCount.toLocaleString(),
      color: 'red',
    },
    {
      icon: Clock,
      label: '平均延迟',
      value: `${stats.avgLatency}ms`,
      color: 'purple',
    },
    {
      icon: AlertTriangle,
      label: '活跃连接',
      value: stats.activeConnections.toString(),
      color: 'orange',
    },
  ];

  const successRate = stats.totalRequests > 0
    ? ((stats.successCount / stats.totalRequests) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-apple-text">实时监控</h2>
          <p className="text-sm text-apple-text-secondary mt-1">实时查看 API 请求状态和性能指标</p>
        </div>
        <button
          onClick={refreshData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          刷新
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          const colorMap = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            red: 'bg-red-50 text-red-600',
            purple: 'bg-purple-50 text-purple-600',
            orange: 'bg-orange-50 text-orange-600',
          };
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
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
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-apple-text">最近请求</h3>
            <span className="text-sm text-apple-text-secondary">{requests.length} 条记录</span>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-apple-text-secondary">
              <Activity className="w-12 h-12 mb-3 opacity-50" />
              <p>暂无请求记录</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(request.status_code)}
                      <span className="font-medium text-apple-text">{request.provider}</span>
                      <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-xs text-apple-text-secondary">
                        {request.model}
                      </span>
                    </div>
                    <span className={`text-sm font-mono ${
                      request.status_code >= 200 && request.status_code < 400
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {request.status_code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-apple-text-secondary">
                    <span>{formatDate(request.created_at)}</span>
                    <span>延迟: {request.latency}ms</span>
                    {request.prompt_tokens > 0 && (
                      <span>Tokens: {request.prompt_tokens} + {request.completion_tokens || 0}</span>
                    )}
                  </div>
                  {request.error_message && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-red-600">
                      {request.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-apple-text mb-6">实时状态</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-apple-text-secondary">成功率</span>
                <span className="font-semibold text-apple-text">{successRate}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    parseFloat(successRate) >= 90 ? 'bg-green-500' :
                    parseFloat(successRate) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-apple-text-secondary">今日请求</span>
                <span className="font-semibold text-apple-text">{stats.totalRequests}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-semibold text-green-600">{stats.successCount}</p>
                  <p className="text-xs text-green-600">成功</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-semibold text-red-600">{stats.errorCount}</p>
                  <p className="text-xs text-red-600">失败</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-blue-600">活跃连接数</span>
                <span className="text-2xl font-semibold text-blue-600">{stats.activeConnections}</span>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-purple-600">平均延迟</span>
                <span className="text-2xl font-semibold text-purple-600">{stats.avgLatency}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
