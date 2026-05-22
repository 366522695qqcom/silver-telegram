import React from 'react';
import {
  Plus,
  CheckCircle,
  XCircle,
  ChevronRight,
  Globe,
} from 'lucide-react';
import type { Provider } from '@/types';

interface ProviderListProps {
  providers: Provider[];
  selectedProvider: Provider | null;
  onSelectProvider: (provider: Provider) => void;
  onCreateClick: () => void;
}

const ProviderList: React.FC<ProviderListProps> = React.memo(({
  providers,
  selectedProvider,
  onSelectProvider,
  onCreateClick,
}) => {
  return (
    <div className="w-80 flex-shrink-0 bg-white rounded-apple-lg shadow-apple-card flex flex-col" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
      <div className="p-5 border-b apple-border-light flex items-center justify-between">
        <h2 className="font-semibold text-apple-text text-lg">提供商列表</h2>
        <button
          onClick={onCreateClick}
          className="apple-btn-primary flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          <span>新建</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {providers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-apple-text-secondary px-4">
            <div className="w-20 h-20 rounded-full bg-apple-gray-bg flex items-center justify-center mb-4">
              <Globe className="w-10 h-10 opacity-50" />
            </div>
            <p className="text-sm font-medium mb-2">暂无提供商</p>
            <p className="text-xs opacity-70 text-center">点击上方按钮添加</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {providers.map((provider) => (
              <li key={provider.id}>
                <button
                  onClick={() => onSelectProvider(provider)}
                  className={`w-full apple-nav-item flex items-center gap-3 px-4 py-4 rounded-apple-md transition-all ${
                    selectedProvider?.id === provider.id
                      ? 'apple-blue text-white shadow-lg'
                      : 'hover:shadow-md text-apple-text'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-apple-sm flex items-center justify-center flex-shrink-0 ${
                    provider.enabled
                      ? selectedProvider?.id === provider.id
                        ? 'bg-white/20'
                        : 'apple-badge-success'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {provider.enabled ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold truncate">{provider.provider_name}</p>
                    <p className={`text-xs truncate mt-0.5 ${
                      selectedProvider?.id === provider.id ? 'text-white/70' : 'text-apple-text-secondary'
                    }`}>
                      {provider.provider_type}
                    </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                    selectedProvider?.id === provider.id ? 'text-white/70' : 'text-apple-text-secondary'
                  }`} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

ProviderList.displayName = 'ProviderList';

export default ProviderList;
