import React from 'react';
import {
  X,
  RefreshCw,
  TestTube,
  Eye,
  Brain,
  Wrench,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { TestConnectionResult } from '@/types';
import type { ModelFormState } from './settingsUtils';

interface ModelModalProps {
  showModelModal: boolean;
  modelForm: ModelFormState;
  modelEditId: string | null;
  customModelTestResult: TestConnectionResult | null;
  isSavingModel: boolean;
  modelFormTestLoading: boolean;
  onClose: () => void;
  onModelIdChange: (value: string) => void;
  onModelNameChange: (value: string) => void;
  onModelTypeChange: (value: string) => void;
  onCapabilityChange: (capability: 'vision' | 'reasoning' | 'tool_use', checked: boolean) => void;
  onContextWindowChange: (value: number) => void;
  onMaxOutputTokensChange: (value: number) => void;
  onTestModel: () => void;
  onSaveModel: () => void;
}

const ModelModal: React.FC<ModelModalProps> = React.memo(({
  showModelModal,
  modelForm,
  modelEditId,
  customModelTestResult,
  isSavingModel,
  modelFormTestLoading,
  onClose,
  onModelIdChange,
  onModelNameChange,
  onModelTypeChange,
  onCapabilityChange,
  onContextWindowChange,
  onMaxOutputTokensChange,
  onTestModel,
  onSaveModel,
}) => {
  if (!showModelModal) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-apple-lg shadow-2xl w-full max-w-lg mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b apple-border-light">
          <h3 className="text-lg font-semibold text-apple-text">{modelEditId ? '编辑模型' : '新建模型'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-apple-sm hover:bg-apple-gray-bg transition-colors">
            <X className="w-5 h-5 text-apple-text-secondary" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">模型 ID <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={modelForm.model_id}
              onChange={(e) => onModelIdChange(e.target.value)}
              placeholder="如: gpt-3.5-turbo, doubao-pro"
              className="apple-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">显示名称</label>
            <input
              type="text"
              value={modelForm.model_name}
              onChange={(e) => onModelNameChange(e.target.value)}
              placeholder="可选"
              className="apple-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">模型类型</label>
            <select
              value={modelForm.model_type}
              onChange={(e) => onModelTypeChange(e.target.value)}
              className="apple-input w-full"
            >
              <option value="chat">聊天</option>
              <option value="embedding">嵌入</option>
              <option value="image">图片生成</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-apple-text mb-2">能力</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modelForm.capabilities.vision}
                  onChange={(e) => onCapabilityChange('vision', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <Eye className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-apple-text">视觉</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modelForm.capabilities.reasoning}
                  onChange={(e) => onCapabilityChange('reasoning', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-apple-text">推理</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modelForm.capabilities.tool_use}
                  onChange={(e) => onCapabilityChange('tool_use', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <Wrench className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-apple-text">工具使用</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-apple-text mb-2">高级设置</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-apple-text-secondary mb-1">上下文窗口</label>
                <input
                  type="number"
                  value={modelForm.context_window}
                  onChange={(e) => onContextWindowChange(parseInt(e.target.value) || 0)}
                  className="apple-input w-full"
                  placeholder="128000"
                />
              </div>
              <div>
                <label className="block text-xs text-apple-text-secondary mb-1">最大输出Token数</label>
                <input
                  type="number"
                  value={modelForm.max_output_tokens}
                  onChange={(e) => onMaxOutputTokensChange(parseInt(e.target.value) || 0)}
                  className="apple-input w-full"
                  placeholder="4096"
                />
              </div>
            </div>
          </div>

          {customModelTestResult && (
            <div className={`p-3 rounded-apple-md ${
              customModelTestResult.success
                ? 'apple-badge-success border border-green-200'
                : 'apple-badge-error border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {customModelTestResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={`text-xs font-medium ${customModelTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {customModelTestResult.success ? '测试成功' : '测试失败'}
                  </p>
                  <p className={`text-xs ${customModelTestResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {customModelTestResult.message}
                    {customModelTestResult.latency_ms !== undefined && (
                      <span className="ml-1">({customModelTestResult.latency_ms}ms)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t apple-border-light">
          <button
            onClick={onClose}
            className="apple-btn-secondary px-5 py-2.5"
          >
            取消
          </button>
          {modelEditId && (
            <button
              onClick={onTestModel}
              disabled={modelFormTestLoading}
              className="px-5 py-2.5 rounded-apple-sm bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {modelFormTestLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              测试模型
            </button>
          )}
          <button
            onClick={onSaveModel}
            disabled={!modelForm.model_id || isSavingModel}
            className="apple-btn-primary px-5 py-2.5 ml-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isSavingModel ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            {isSavingModel ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
});

ModelModal.displayName = 'ModelModal';

export default ModelModal;
