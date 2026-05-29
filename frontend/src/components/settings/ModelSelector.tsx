import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Search,
  RefreshCw,
  Eye,
  Brain,
  Wrench,
} from 'lucide-react';
import type { Model } from '@/types';
import { inferModelInfo } from './settingsUtils';

interface ModelSelectorProps {
  showModelSelector: boolean;
  availableModels: Model[];
  selectedModels: Set<string>;
  modelSearchQuery: string;
  isFetchingModels: boolean;
  isAddingModels: boolean;
  existingModelIds: Set<string>;
  onClose: () => void;
  onSearchQueryChange: (query: string) => void;
  onSelectAll: (ids: string[]) => void;
  onDeselectAll: () => void;
  onToggleModel: (modelId: string) => void;
  onAddSelectedModels: () => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = React.memo(({ 
  showModelSelector,
  availableModels,
  selectedModels,
  modelSearchQuery,
  isFetchingModels,
  isAddingModels,
  existingModelIds,
  onClose,
  onSearchQueryChange,
  onSelectAll,
  onDeselectAll,
  onToggleModel,
  onAddSelectedModels,
}) => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  if (!showModelSelector) return null;

  const filteredModels = availableModels.filter(m =>
    m.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-apple-lg shadow-2xl w-full max-w-2xl mx-4 animate-scale-in max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b apple-border-light flex-shrink-0">
          <h3 className="text-lg font-semibold text-apple-text">获取模型</h3>
          <button onClick={onClose} className="p-1.5 rounded-apple-sm hover:bg-apple-gray-bg transition-colors">
            <X className="w-5 h-5 text-apple-text-secondary" />
          </button>
        </div>

        <div className="px-6 py-3 border-b apple-border-light flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchExpanded(!searchExpanded)}
              className="flex-shrink-0 p-2 rounded-apple-sm hover:bg-apple-gray-bg transition-colors"
            >
              <Search className="w-4 h-4 text-apple-text-secondary" />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${searchExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
              <input
                ref={searchInputRef}
                type="text"
                value={modelSearchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="搜索模型..."
                className="apple-input w-full text-apple-text bg-white"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => onSelectAll(filteredModels.map(m => m.id))} className="text-xs text-purple-600 hover:text-purple-700 font-medium">全选</button>
            <button onClick={onDeselectAll} className="text-xs text-apple-text-secondary hover:text-apple-text font-medium">取消全选</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3">
          {isFetchingModels ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mb-3" />
              <p className="text-sm text-apple-text-secondary">正在获取模型列表...</p>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-apple-text-secondary">{availableModels.length === 0 ? '未获取到模型' : '无匹配模型'}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredModels.map(m => {
                const isExisting = existingModelIds.has(m.id);
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-apple-sm transition-colors ${
                      isExisting ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:bg-apple-gray-bg cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedModels.has(m.id)}
                      onChange={() => onToggleModel(m.id)}
                      disabled={isExisting}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-40"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-apple-text truncate">{m.id}</p>
                      <p className="text-xs text-apple-text-secondary">{m.owned_by}</p>
                    </div>
                    {isExisting && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 flex-shrink-0">已添加</span>
                    )}
                    <div className="flex gap-1 flex-shrink-0">
                      {(() => {
                        const info = inferModelInfo(m.id);
                        return (
                          <>
                            {info.capabilities?.vision && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-600">
                                <Eye className="w-2.5 h-2.5" />视觉
                              </span>
                            )}
                            {info.capabilities?.reasoning && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">
                                <Brain className="w-2.5 h-2.5" />推理
                              </span>
                            )}
                            {info.capabilities?.tool_use && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-600">
                                <Wrench className="w-2.5 h-2.5" />工具
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t apple-border-light flex-shrink-0">
          <span className="text-sm text-apple-text-secondary">
            已选 {selectedModels.size} 个模型
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="apple-btn-secondary px-5 py-2.5"
            >
              取消
            </button>
            <button
              onClick={onAddSelectedModels}
              disabled={selectedModels.size === 0 || isAddingModels}
              className="apple-btn-primary px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isAddingModels ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {isAddingModels ? '添加中...' : '添加选中模型'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ModelSelector.displayName = 'ModelSelector';

export default ModelSelector;
