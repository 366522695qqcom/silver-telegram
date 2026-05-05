import { useState, useEffect } from 'react';
import { auditAPI } from '@/services/api';
import type { AuditLog } from '@/types';
import { FileText, User, Server, Key, Settings, Login, Logout, Plus, Edit, Trash2, RefreshCw, Clock, Globe } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await auditAPI.getLogs(page, 50);
        if (data.length < 50) {
          setHasMore(false);
        }
        if (page === 1) {
          setLogs(data);
        } else {
          setLogs(prev => [...prev, ...data]);
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [page]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getActionIcon = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('create') || lowerAction.includes('add')) {
      return <Plus className="w-4 h-4 text-green-500" />;
    }
    if (lowerAction.includes('update') || lowerAction.includes('edit')) {
      return <Edit className="w-4 h-4 text-blue-500" />;
    }
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) {
      return <Trash2 className="w-4 h-4 text-red-500" />;
    }
    if (lowerAction.includes('login')) {
      return <Login className="w-4 h-4 text-purple-500" />;
    }
    if (lowerAction.includes('logout')) {
      return <Logout className="w-4 h-4 text-gray-500" />;
    }
    return <Settings className="w-4 h-4 text-gray-500" />;
  };

  const getResourceIcon = (resourceType: string) => {
    const lowerType = resourceType.toLowerCase();
    if (lowerType.includes('provider')) {
      return <Server className="w-4 h-4 text-blue-500" />;
    }
    if (lowerType.includes('api_key') || lowerType.includes('key')) {
      return <Key className="w-4 h-4 text-yellow-500" />;
    }
    if (lowerType.includes('user')) {
      return <User className="w-4 h-4 text-green-500" />;
    }
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-apple-text">审计日志</h2>
          <p className="text-sm text-apple-text-secondary mt-1">记录所有系统操作和用户活动</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
          {isLoading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-apple-text-secondary">
              <FileText className="w-12 h-12 mb-3 opacity-50" />
              <p>暂无审计日志</p>
            </div>
          ) : (
            <>
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-apple-text">{log.action}</span>
                        <div className="flex items-center gap-1">
                          {getResourceIcon(log.resource_type)}
                          <span className="text-sm text-apple-text-secondary">
                            {log.resource_type}
                          </span>
                        </div>
                        {log.resource_id && (
                          <span className="text-xs text-gray-400 font-mono">
                            #{log.resource_id.slice(0, 8)}
                          </span>
                        )}
                      </div>
                      {log.details && (
                        <p className="text-sm text-apple-text-secondary mb-2">
                          {log.details}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-apple-text-secondary">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {log.ip_address || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="px-6 py-4 border-t border-gray-100">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>加载更多</>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
