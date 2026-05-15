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
    try {
      const socketUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : undefined;
      if (socketUrl) {
        socketRef.current = io(socketUrl, {
          reconnectionAttempts: 3,
          timeout: 5000,
        });
        socketRef.current.on('stats', (newStats: Stats) => {
          setStats(newStats);
        });
        socketRef.current.on('connect_error', () => {
          socketRef.current?.disconnect();
        });
      }
    } catch {
      // socket.io not available (Vercel serverless)
    }

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
      return <CheckCircle className="w-4 h-4 text-apple-success" />;
    }
    return <XCircle className="w-4 h-4 text-apple-error" />;
  };

  const getStatusIndicator = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 400) {
      return (
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-apple-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-apple-success"></span>
        </span>
      );
    }
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-apple-error opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-apple-error"></span>
      </span>
    );
  };

  const statsCards = [
    {
      icon: Activity,
      label: '总请求数',
      value: stats.totalRequests.toLocaleString(),
      color: 'blue',
      badge: 'apple-badge-neutral',
    },
    {
      icon: CheckCircle,
      label: '成功请求',
      value: stats.successCount.toLocaleString(),
      color: 'green',
      badge: 'apple-badge-success',
    },
    {
      icon: XCircle,
      label: '失败请求',
      value: stats.errorCount.toLocaleString(),
      color: 'red',
      badge: 'apple-badge-error',
    },
    {
      icon: Clock,
      label: '平均延迟',
      value: `${stats.avgLatency}ms`,
      color: 'purple',
      badge: 'apple-badge-neutral',
    },
    {
      icon: AlertTriangle,
      label: '活跃连接',
      value: stats.activeConnections.toString(),
      color: 'orange',
      badge: 'apple-badge-neutral',
    },
  ];

  const successRate = stats.totalRequests > 0
    ? ((stats.successCount / stats.totalRequests) * 100).toFixed(1)
    : '0';

  const getSuccessRateStatus = () => {
    if (parseFloat(successRate) >= 90) return 'success';
    if (parseFloat(successRate) >= 70) return 'warning';
    return 'error';
  };

  const statusColors = {
    success: {
      bg: 'bg-apple-success/10',
      text: 'text-apple-success',
      bar: 'bg-apple-success',
    },
    warning: {
      bg: 'bg-apple-warning/10',
      text: 'text-apple-warning',
      bar: 'bg-apple-warning',
    },
    error: {
      bg: 'bg-apple-error/10',
      text: 'text-apple-error',
      bar: 'bg-apple-error',
    },
  };

  return (
    <div className="min-h-screen bg-apple-gray-bg p-6 space-y-6 animate-apple-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-apple-text">实时监控</h2>
          <p className="text-sm text-apple-text-secondary mt-1">实时查看 API 请求状态和性能指标</p>
        </div>
        <button
          onClick={refreshData}
          disabled={isLoading}
          className="apple-btn-secondary flex items-center gap-2"
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
            blue: 'bg-apple-blue/10 text-apple-blue',
            green: 'bg-apple-success/10 text-apple-success',
            red: 'bg-apple-error/10 text-apple-error',
            purple: 'bg-purple-500/10 text-purple-600',
            orange: 'bg-apple-warning/10 text-apple-warning',
          };
          return (
            <div
              key={index}
              className="apple-card group"
            >
              <div className={`w-12 h-12 apple-lg ${colorMap[card.color as keyof typeof colorMap]} flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-105`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-sm text-apple-text-secondary mb-1">{card.label}</p>
              <p className="text-3xl font-semibold text-apple-text apple-stat-value">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 apple-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-apple-text">最近请求</h3>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-apple-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-apple-blue"></span>
              </span>
            </div>
            <span className="apple-badge-neutral">{requests.length} 条记录</span>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-apple-text-secondary" />
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
                  className="p-4 bg-apple-gray-bg apple-md hover:bg-apple-border-light transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIndicator(request.status_code)}
                      {getStatusIcon(request.status_code)}
                      <span className="font-medium text-apple-text">{request.provider}</span>
                      <span className="apple-badge-neutral">
                        {request.model}
                      </span>
                    </div>
                    <span className={`font-mono font-semibold ${
                      request.status_code >= 200 && request.status_code < 400
                        ? 'text-apple-success'
                        : 'text-apple-error'
                    }`}>
                      {request.status_code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-apple-text-secondary">
                    <span>{formatDate(request.created_at)}</span>
                    <span className="text-apple-text font-medium">延迟: {request.latency}ms</span>
                    {request.prompt_tokens > 0 && (
                      <span className="apple-badge-neutral">
                        Tokens: {request.prompt_tokens} + {request.completion_tokens || 0}
                      </span>
                    )}
                  </div>
                  {request.error_message && (
                    <div className="mt-2 p-2 bg-apple-error/10 apple-sm text-xs text-apple-error">
                      {request.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="apple-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-semibold text-apple-text">实时状态</h3>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-apple-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-apple-success"></span>
            </span>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-apple-text-secondary">成功率</span>
                <span className={`font-semibold ${statusColors[getSuccessRateStatus() as keyof typeof statusColors].text}`}>
                  {successRate}%
                </span>
              </div>
              <div className="h-2 bg-apple-border-light apple-md overflow-hidden">
                <div 
                  className={`h-full apple-md transition-all duration-700 ease-out ${
                    statusColors[getSuccessRateStatus() as keyof typeof statusColors].bar
                  }`}
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-apple-gray-bg apple-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-apple-text-secondary">今日请求</span>
                <span className="font-semibold text-apple-text apple-stat-value">{stats.totalRequests}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`text-center p-3 apple-md ${statusColors.success.bg}`}>
                  <p className={`text-2xl font-semibold ${statusColors.success.text} apple-stat-value`}>
                    {stats.successCount}
                  </p>
                  <p className={`text-xs ${statusColors.success.text} mt-1`}>成功</p>
                </div>
                <div className={`text-center p-3 apple-md ${statusColors.error.bg}`}>
                  <p className={`text-2xl font-semibold ${statusColors.error.text} apple-stat-value`}>
                    {stats.errorCount}
                  </p>
                  <p className={`text-xs ${statusColors.error.text} mt-1`}>失败</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-apple-blue/10 apple-lg">
              <div className="flex items-center justify-between">
                <span className="text-apple-blue">活跃连接数</span>
                <span className="text-2xl font-semibold text-apple-blue apple-stat-value">
                  {stats.activeConnections}
                </span>
              </div>
            </div>

            <div className="p-4 bg-purple-500/10 apple-lg">
              <div className="flex items-center justify-between">
                <span className="text-purple-600">平均延迟</span>
                <span className="text-2xl font-semibold text-purple-600 apple-stat-value">
                  {stats.avgLatency}ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
