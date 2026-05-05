import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { apiClient } from '../services/api';
import { AuditLog } from '../types';
import {
  UserPlus,
  Settings,
  Plus,
  Edit,
  Trash,
  Clock,
} from 'lucide-react';

export default function AuditLogsPage() {
  const { auditLogs, setAuditLogs } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const data = await apiClient.getAuditLogs();
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return <Plus className="w-5 h-5 text-green-500" />;
      case 'update':
        return <Edit className="w-5 h-5 text-blue-500" />;
      case 'delete':
        return <Trash className="w-5 h-5 text-red-500" />;
      case 'register':
      case 'login':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      default:
        return <Settings className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500 mt-1">View all user actions</p>
      </div>

      <div className="bg-white rounded-apple shadow-apple overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Activity Log</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-400">
              Loading...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              No activity yet
            </div>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50"
              >
                <div className="p-2 bg-gray-100 rounded-full mt-0.5">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">
                      {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                  {log.resource_type && (
                    <p className="text-gray-600 text-sm">
                      {log.resource_type}
                    </p>
                  )}
                  {log.details && (
                    <p className="text-gray-400 text-sm mt-1">
                      {JSON.stringify(log.details)}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
