import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { apiClient } from '../services/api';
import { Request } from '../types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Monitor() {
  const { requests, setRequests } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchRequests();
  }, [page]);

  const fetchRequests = async () => {
    try {
      const data = await apiClient.getRequests(50, (page - 1) * 50);
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Requests Monitor</h1>
          <p className="text-gray-500 mt-1">View all your API requests</p>
        </div>
      </div>

      <div className="bg-white rounded-apple shadow-apple overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Time
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Provider
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Model
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Latency
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Tokens
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No requests yet
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {new Date(req.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">{req.provider}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{req.model}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {req.status_code === 200 ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="text-green-600">Success</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-600">Error</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDuration(req.latency)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {(req.prompt_tokens || 0) + (req.completion_tokens || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {requests.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {page}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage(page + 1)}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:border-primary hover:text-primary"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
