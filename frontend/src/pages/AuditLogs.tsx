import { useState, useEffect } from 'react';
import { auditAPI } from '@/services/api';
import type { AuditLog } from '@/types';
import { FileText, User, Server, Key, Settings, LogIn, LogOut, Plus, Edit, Trash2, RefreshCw, Clock, Globe } from 'lucide-react';

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

  const getActionBadge = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('create') || lowerAction.includes('add')) {
      return {
        icon: <Plus className="w-3.5 h-3.5" />,
        class: 'apple-badge-success'
      };
    }
    if (lowerAction.includes('update') || lowerAction.includes('edit')) {
      return {
        icon: <Edit className="w-3.5 h-3.5" />,
        class: 'apple-btn-primary'
      };
    }
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) {
      return {
        icon: <Trash2 className="w-3.5 h-3.5" />,
        class: 'apple-badge-error'
      };
    }
    if (lowerAction.includes('login')) {
      return {
        icon: <LogIn className="w-3.5 h-3.5" />,
        class: 'apple-badge-neutral'
      };
    }
    if (lowerAction.includes('logout')) {
      return {
        icon: <LogOut className="w-3.5 h-3.5" />,
        class: 'apple-badge-neutral'
      };
    }
    return {
      icon: <Settings className="w-3.5 h-3.5" />,
      class: 'apple-badge-neutral'
    };
  };

  const getResourceIcon = (resourceType: string) => {
    const lowerType = resourceType.toLowerCase();
    if (lowerType.includes('provider')) {
      return <Server className="w-4 h-4 text-[#0071e3]" />;
    }
    if (lowerType.includes('api_key') || lowerType.includes('key')) {
      return <Key className="w-4 h-4 text-[#0071e3]" />;
    }
    if (lowerType.includes('user')) {
      return <User className="w-4 h-4 text-[#0071e3]" />;
    }
    return <FileText className="w-4 h-4 text-[#0071e3]" />;
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6 animate-apple-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-apple-text tracking-tight">审计日志</h2>
          <p className="text-sm text-apple-text-secondary mt-1">记录所有系统操作和用户活动</p>
        </div>
      </div>

      <div className="apple-card">
        <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
          {isLoading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-7 h-7 animate-spin text-apple-text-secondary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-apple-text-secondary">
              <FileText className="w-14 h-14 mb-4 opacity-30" />
              <p className="text-base">暂无审计日志</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-[#e5e5ea]">
                {logs.map((log, index) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <div
                      key={log.id}
                      className="px-6 py-5 hover:bg-[#f5f5f7]/50 transition-all duration-200 animate-apple-slide-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-start gap-5">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`${badge.class} px-2.5 py-2 rounded-lg inline-flex items-center justify-center`}>
                            {badge.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-3 mb-2">
                            <h3 className="font-semibold text-apple-text text-[15px]">
                              {log.action}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[13px] text-apple-text-secondary">
                              {getResourceIcon(log.resource_type)}
                              <span className="font-medium">{log.resource_type}</span>
                            </div>
                            {log.resource_id && (
                              <span className="text-xs text-[#6e6e73] font-mono bg-[#f5f5f7] px-2 py-0.5 rounded-md">
                                #{log.resource_id.slice(0, 8)}
                              </span>
                            )}
                          </div>
                          
                          {log.details && (
                            <p className="text-sm text-apple-text-secondary mb-3 leading-relaxed">
                              {log.details}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-5 text-[12px] text-apple-text-secondary">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatDate(log.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5" />
                              <span>{log.ip_address || '未知'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="px-6 py-5 border-t border-[#e5e5ea] bg-[#fafafa]">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="apple-btn-secondary w-full py-3 text-[14px] font-medium"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        加载中...
                      </span>
                    ) : (
                      '加载更多'
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
