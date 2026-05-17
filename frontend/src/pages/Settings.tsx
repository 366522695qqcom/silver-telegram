import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '@/store';
import { providersAPI, customModelsAPI } from '@/services/api';
import type { Provider, CreateProviderData, TestConnectionResult, CustomModel, Model } from '@/types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  Globe,
  TestTube,
  Zap,
  Wifi,
  RotateCcw,
  X,
  Download,
  Eye,
  Brain,
  Wrench,
  Search
} from 'lucide-react';

interface ModelFormState {
  model_id: string;
  model_name: string;
  model_type: string;
  capabilities: {
    vision: boolean;
    reasoning: boolean;
    tool_use: boolean;
  };
  context_window: number;
  max_output_tokens: number;
}

const defaultFormState: ModelFormState = {
  model_id: '',
  model_name: '',
  model_type: 'chat',
  capabilities: { vision: false, reasoning: false, tool_use: false },
  context_window: 128000,
  max_output_tokens: 4096,
};

const MODEL_CONTEXT_MAP: Record<string, { context_window: number; max_output_tokens: number }> = {
  'gpt-4o': { context_window: 128000, max_output_tokens: 16384 },
  'gpt-4o-mini': { context_window: 128000, max_output_tokens: 16384 },
  'gpt-4-turbo': { context_window: 128000, max_output_tokens: 4096 },
  'gpt-4': { context_window: 8192, max_output_tokens: 8192 },
  'gpt-3.5-turbo': { context_window: 16385, max_output_tokens: 4096 },
  'claude-3-opus': { context_window: 200000, max_output_tokens: 4096 },
  'claude-3-sonnet': { context_window: 200000, max_output_tokens: 8192 },
  'claude-3-haiku': { context_window: 200000, max_output_tokens: 4096 },
  'claude-3.5-sonnet': { context_window: 200000, max_output_tokens: 8192 },
  'gemini-pro': { context_window: 32768, max_output_tokens: 8192 },
  'gemini-1.5-pro': { context_window: 2097152, max_output_tokens: 8192 },
  'gemini-1.5-flash': { context_window: 1048576, max_output_tokens: 8192 },
};

function inferModelInfo(modelId: string): Partial<ModelFormState> {
  const id = modelId.toLowerCase();
  const modelType = id.includes('embed') || id.includes('e5') || id.includes('bge')
    ? 'embedding'
    : id.includes('dall-e') || id.includes('flux') || id.includes('stable-diffusion') || id.includes('image')
    ? 'image'
    : 'chat';

  const vision = /vision|gpt-4o|gpt-4-turbo|claude-3|gemini|qwen-vl|glm-4v|doubao-vision/i.test(id);
  const reasoning = /o1-|o3-|deepseek-r1|deepseek-reasoner|qwq|reasoning/i.test(id);
  const tool_use = /gpt-4|claude-3|gemini|qwen|glm-4/i.test(id);

  let contextWindow = 128000;
  let maxOutputTokens = 4096;

  for (const [key, val] of Object.entries(MODEL_CONTEXT_MAP)) {
    if (id.includes(key)) {
      contextWindow = val.context_window;
      maxOutputTokens = val.max_output_tokens;
      break;
    }
  }

  return {
    model_type: modelType,
    capabilities: { vision, reasoning, tool_use },
    context_window: contextWindow,
    max_output_tokens: maxOutputTokens,
  };
}

export default function Settings() {
  const { providers, setProviders } = useStore();
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [showModelModal, setShowModelModal] = useState(false);
  const [modelForm, setModelForm] = useState<ModelFormState>({ ...defaultFormState });
  const [modelEditId, setModelEditId] = useState<string | null>(null);
  const [customModelTestResult, setCustomModelTestResult] = useState<TestConnectionResult | null>(null);
  const [customModelTestLoading, setCustomModelTestLoading] = useState<string | null>(null);
  const [modelFormTestLoading, setModelFormTestLoading] = useState(false);

  const [showModelSelector, setShowModelSelector] = useState(false);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [isSavingModel, setIsSavingModel] = useState(false);
  const [isAddingModels, setIsAddingModels] = useState(false);

  const [formData, setFormData] = useState<CreateProviderData>({
    provider_name: '',
    provider_type: 'openai',
    api_key: '',
    base_url: 'https://api.openai.com/v1',
  });

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await providersAPI.getAll();
        setProviders(data);
        if (selectedProvider) {
          const updated = data.find((p: Provider) => p.id === selectedProvider.id);
          if (updated) {
            setSelectedProvider(updated);
          }
        }
      } catch (error) {
        console.error('Failed to fetch providers:', error);
      }
    };
    fetchProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider && selectedProvider.id) {
      fetchCustomModels();
    }
  }, [selectedProvider?.id]);

  const fetchCustomModels = async () => {
    try {
      const data = await customModelsAPI.getAll();
      setCustomModels(data);
    } catch (error) {
      console.error('Failed to fetch custom models:', error);
    }
  };

  const openCreateModelModal = () => {
    setModelEditId(null);
    setModelForm({ ...defaultFormState });
    setCustomModelTestResult(null);
    setShowModelModal(true);
  };

  const openEditModelModal = (cm: CustomModel) => {
    setModelEditId(cm.id);
    let caps = { vision: false, reasoning: false, tool_use: false };
    try {
      const parsed = JSON.parse(cm.capabilities || '{}');
      caps = { vision: !!parsed.vision, reasoning: !!parsed.reasoning, tool_use: !!parsed.tool_use };
    } catch {}
    setModelForm({
      model_id: cm.model_id,
      model_name: cm.model_name,
      model_type: cm.model_type || 'chat',
      capabilities: caps,
      context_window: cm.context_window || 128000,
      max_output_tokens: cm.max_output_tokens || 4096,
    });
    setCustomModelTestResult(null);
    setShowModelModal(true);
  };

  const closeModelModal = () => {
    setShowModelModal(false);
    setModelEditId(null);
    setModelForm({ ...defaultFormState });
    setCustomModelTestResult(null);
    setModelFormTestLoading(false);
  };

  const handleSaveModel = async () => {
    if (!modelForm.model_id) return;
    setIsSavingModel(true);
    try {
      if (modelEditId) {
        const updated = await customModelsAPI.update(modelEditId, {
          model_name: modelForm.model_name || modelForm.model_id,
          model_id: modelForm.model_id,
          model_type: modelForm.model_type,
          capabilities: modelForm.capabilities,
          context_window: modelForm.context_window || null,
          max_output_tokens: modelForm.max_output_tokens || null,
        });
        setCustomModels(customModels.map(m => m.id === updated.id ? updated : m));
      } else {
        const newModel = await customModelsAPI.create({
          provider_id: selectedProvider?.id || undefined,
          model_name: modelForm.model_name || modelForm.model_id,
          model_id: modelForm.model_id,
          model_type: modelForm.model_type,
          capabilities: modelForm.capabilities,
          context_window: modelForm.context_window || null,
          max_output_tokens: modelForm.max_output_tokens || null,
        });
        setCustomModels([newModel, ...customModels]);
      }
      closeModelModal();
    } catch (error) {
      console.error('Failed to save model:', error);
      closeModelModal();
      fetchCustomModels();
      alert('保存模型失败: ' + (error as Error).message);
    } finally {
      setIsSavingModel(false);
    }
  };

  const handleTestModelFromForm = async () => {
    if (!modelEditId) return;
    setModelFormTestLoading(true);
    setCustomModelTestResult(null);
    try {
      const result = await customModelsAPI.testConnection(modelEditId);
      setCustomModelTestResult(result);
    } catch (error) {
      setCustomModelTestResult({ success: false, message: (error as Error).message });
    } finally {
      setModelFormTestLoading(false);
    }
  };

  const handleDeleteCustomModel = async (id: string) => {
    const originalModels = [...customModels];
    setCustomModels(customModels.filter(m => m.id !== id));
    try {
      await customModelsAPI.delete(id);
    } catch (error) {
      console.error('Failed to delete custom model:', error);
      setCustomModels(originalModels);
    }
  };

  const handleToggleCustomModel = async (id: string) => {
    try {
      const updated = await customModelsAPI.toggleStatus(id);
      setCustomModels(customModels.map(m => m.id === updated.id ? updated : m));
    } catch (error) {
      console.error('Failed to toggle custom model:', error);
    }
  };

  const handleTestCustomModel = async (id: string) => {
    setCustomModelTestLoading(id);
    setCustomModelTestResult(null);
    try {
      const result = await customModelsAPI.testConnection(id);
      setCustomModelTestResult(result);
    } catch (error) {
      setCustomModelTestResult({ success: false, message: (error as Error).message });
    } finally {
      setCustomModelTestLoading(null);
    }
  };

  const handleResetCustomModels = async () => {
    if (customModels.length === 0) return;
    if (!confirm('确定要清空所有自定义模型吗？此操作不可撤销。')) return;
    const originalModels = [...customModels];
    const modelIds = customModels.map(cm => cm.id);
    setCustomModels([]);
    try {
      await customModelsAPI.deleteAll(modelIds);
    } catch (error) {
      console.error('Failed to reset models:', error);
      setCustomModels(originalModels);
      alert('重置失败: ' + (error as Error).message);
    }
  };

  const handleFetchModels = async () => {
    if (!selectedProvider) return;
    setIsFetchingModels(true);
    setAvailableModels([]);
    setSelectedModels(new Set());
    setModelSearchQuery('');
    setShowModelSelector(true);
    try {
      const result = await providersAPI.getModels(selectedProvider.id);
      setAvailableModels(result.models || []);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => {
      const next = new Set(prev);
      if (next.has(modelId)) next.delete(modelId);
      else next.add(modelId);
      return next;
    });
  };

  const selectAllModels = () => {
    setSelectedModels(new Set(filteredModels.map(m => m.id)));
  };

  const deselectAllModels = () => {
    setSelectedModels(new Set());
  };

  const handleAddSelectedModels = async () => {
    if (selectedModels.size === 0 || !selectedProvider) return;
    setShowModelSelector(false);
    setIsAddingModels(true);
    const modelsToAdd = availableModels.filter(m => selectedModels.has(m.id));
    const createData = modelsToAdd.map(m => {
      const inferred = inferModelInfo(m.id);
      return {
        provider_id: selectedProvider.id,
        model_id: m.id,
        model_name: m.id,
        model_type: inferred.model_type || 'chat',
        capabilities: inferred.capabilities || { vision: false, reasoning: false, tool_use: false },
        context_window: inferred.context_window || null,
        max_output_tokens: inferred.max_output_tokens || null,
      };
    });
    try {
      const newModels = await customModelsAPI.batchCreate(createData);
      setCustomModels([...newModels, ...customModels]);
    } catch (error) {
      console.error('Failed to add models:', error);
      alert('添加模型失败: ' + (error as Error).message);
      fetchCustomModels();
    } finally {
      setIsAddingModels(false);
    }
  };

  const filteredModels = availableModels.filter(m =>
    m.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  const handleSelectProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    setFormData({
      provider_name: provider.provider_name,
      provider_type: provider.provider_type,
      api_key: (provider as any).api_key || '',
      base_url: provider.base_url,
    });
    setIsEditing(false);
    setTestResult(null);
    setCustomModels([]);
    setCustomModelTestResult(null);
    setShowModelModal(false);
  };

  const handleCreate = async () => {
    try {
      const newProvider = await providersAPI.create(formData);
      setProviders([...providers, newProvider]);
      setSelectedProvider(newProvider);
      setFormData({
        provider_name: newProvider.provider_name,
        provider_type: newProvider.provider_type,
        api_key: (newProvider as any).api_key || '',
        base_url: newProvider.base_url,
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create provider:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedProvider) return;
    try {
      const updated = await providersAPI.update(selectedProvider.id, formData);
      setProviders(providers.map(p => p.id === updated.id ? updated : p));
      setSelectedProvider(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update provider:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedProvider) return;
    try {
      await providersAPI.delete(selectedProvider.id);
      setProviders(providers.filter(p => p.id !== selectedProvider.id));
      setSelectedProvider(null);
    } catch (error) {
      console.error('Failed to delete provider:', error);
    }
  };

  const handleToggleStatus = async (provider: Provider) => {
    try {
      const updated = await providersAPI.toggleStatus(provider.id);
      setProviders(providers.map(p => p.id === updated.id ? updated : p));
      if (selectedProvider?.id === updated.id) {
        setSelectedProvider(updated);
      }
    } catch (error) {
      console.error('Failed to toggle provider:', error);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedProvider) return;
    setIsTesting(true);
    try {
      const result = await providersAPI.testConnection(selectedProvider.id);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: (error as Error).message });
    } finally {
      setIsTesting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const parseCapabilities = (capsStr: string | null | undefined) => {
    try {
      const parsed = JSON.parse(capsStr || '{}');
      return { vision: !!parsed.vision, reasoning: !!parsed.reasoning, tool_use: !!parsed.tool_use };
    } catch {
      return { vision: false, reasoning: false, tool_use: false };
    }
  };

  const renderModelModal = () => {
    if (!showModelModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={closeModelModal}>
        <div className="bg-white rounded-apple-lg shadow-2xl w-full max-w-lg mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b apple-border-light">
            <h3 className="text-lg font-semibold text-apple-text">{modelEditId ? '编辑模型' : '新建模型'}</h3>
            <button onClick={closeModelModal} className="p-1.5 rounded-apple-sm hover:bg-apple-gray-bg transition-colors">
              <X className="w-5 h-5 text-apple-text-secondary" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-apple-text mb-1.5">模型 ID <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={modelForm.model_id}
                onChange={(e) => {
                  const val = e.target.value;
                  const inferred = inferModelInfo(val);
                  setModelForm(prev => ({
                    ...prev,
                    model_id: val,
                    ...(prev.model_name ? {} : { model_name: val }),
                    ...inferred,
                  }));
                }}
                placeholder="如: gpt-3.5-turbo, doubao-pro"
                className="apple-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-apple-text mb-1.5">显示名称</label>
              <input
                type="text"
                value={modelForm.model_name}
                onChange={(e) => setModelForm({ ...modelForm, model_name: e.target.value })}
                placeholder="可选"
                className="apple-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-apple-text mb-1.5">模型类型</label>
              <select
                value={modelForm.model_type}
                onChange={(e) => setModelForm({ ...modelForm, model_type: e.target.value })}
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
                    onChange={(e) => setModelForm({
                      ...modelForm,
                      capabilities: { ...modelForm.capabilities, vision: e.target.checked },
                    })}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <Eye className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-apple-text">视觉</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modelForm.capabilities.reasoning}
                    onChange={(e) => setModelForm({
                      ...modelForm,
                      capabilities: { ...modelForm.capabilities, reasoning: e.target.checked },
                    })}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-apple-text">推理</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modelForm.capabilities.tool_use}
                    onChange={(e) => setModelForm({
                      ...modelForm,
                      capabilities: { ...modelForm.capabilities, tool_use: e.target.checked },
                    })}
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
                    onChange={(e) => setModelForm({ ...modelForm, context_window: parseInt(e.target.value) || 0 })}
                    className="apple-input w-full"
                    placeholder="128000"
                  />
                </div>
                <div>
                  <label className="block text-xs text-apple-text-secondary mb-1">最大输出Token数</label>
                  <input
                    type="number"
                    value={modelForm.max_output_tokens}
                    onChange={(e) => setModelForm({ ...modelForm, max_output_tokens: parseInt(e.target.value) || 0 })}
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
              onClick={closeModelModal}
              className="apple-btn-secondary px-5 py-2.5"
            >
              取消
            </button>
            {modelEditId && (
              <button
                onClick={handleTestModelFromForm}
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
              onClick={handleSaveModel}
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
  };

  const renderModelSelector = () => {
    if (!showModelSelector) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={() => setShowModelSelector(false)}>
        <div className="bg-white rounded-apple-lg shadow-2xl w-full max-w-2xl mx-4 animate-scale-in max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b apple-border-light flex-shrink-0">
            <h3 className="text-lg font-semibold text-apple-text">获取模型</h3>
            <button onClick={() => setShowModelSelector(false)} className="p-1.5 rounded-apple-sm hover:bg-apple-gray-bg transition-colors">
              <X className="w-5 h-5 text-apple-text-secondary" />
            </button>
          </div>

          <div className="px-6 py-3 border-b apple-border-light flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-text-secondary" />
                <input
                  type="text"
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  placeholder="搜索模型..."
                  className="apple-input w-full pl-9"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={selectAllModels} className="text-xs text-purple-600 hover:text-purple-700 font-medium">全选</button>
                <button onClick={deselectAllModels} className="text-xs text-apple-text-secondary hover:text-apple-text font-medium">取消全选</button>
              </div>
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
                {filteredModels.map(m => (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-apple-sm hover:bg-apple-gray-bg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedModels.has(m.id)}
                      onChange={() => toggleModelSelection(m.id)}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-apple-text truncate">{m.id}</p>
                      <p className="text-xs text-apple-text-secondary">{m.owned_by}</p>
                    </div>
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
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t apple-border-light flex-shrink-0">
            <span className="text-sm text-apple-text-secondary">
              已选 {selectedModels.size} 个模型
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModelSelector(false)}
                className="apple-btn-secondary px-5 py-2.5"
              >
                取消
              </button>
              <button
                onClick={handleAddSelectedModels}
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
  };

  const renderRightPanel = () => {
    if (isCreating) {
      return (
        <div className="flex-1 p-8 overflow-y-auto min-h-full">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-apple-text mb-2">创建提供商</h2>
            <p className="text-apple-text-secondary">配置新的 AI 服务提供商</p>
          </div>
          <div className="space-y-5 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-apple-text mb-3">提供商名称</label>
              <input
                type="text"
                value={formData.provider_name}
                onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                className="apple-input"
                placeholder="如: OpenAI"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-apple-text mb-3">类型</label>
              <select
                value={formData.provider_type}
                onChange={(e) => setFormData({ ...formData, provider_type: e.target.value })}
                className="apple-input"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
                <option value="baidu">百度</option>
                <option value="alibaba">阿里云</option>
                <option value="zhipu">智谱AI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-apple-text mb-3">API Key</label>
              <input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                className="apple-input"
                placeholder="sk-..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-apple-text mb-3">Base URL</label>
              <input
                type="url"
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                className="apple-input"
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div className="flex gap-4 pt-6">
              <button
                onClick={() => setIsCreating(false)}
                className="apple-btn-secondary flex-1 py-3.5"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="apple-btn-primary flex-1 py-3.5"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      );
    } else if (selectedProvider) {
      return (
        <div className="flex-1 flex flex-col min-h-full">
          <div className="p-6 border-b apple-border-light flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="font-semibold text-apple-text text-xl">{selectedProvider.provider_name}</h2>
              <p className="text-sm text-apple-text-secondary mt-1">{selectedProvider.provider_type}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="apple-btn-secondary px-4 py-2 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                <span>编辑</span>
              </button>
              <button
                onClick={handleDelete}
                className="apple-btn-danger px-4 py-2 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isEditing ? (
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-apple-text">编辑提供商</h3>
                  <p className="text-sm text-apple-text-secondary mt-1">修改提供商配置信息</p>
                </div>
                <div className="space-y-5 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-apple-text mb-3">提供商名称</label>
                    <input
                      type="text"
                      value={formData.provider_name}
                      onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                      className="apple-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-apple-text mb-3">类型</label>
                    <select
                      value={formData.provider_type}
                      onChange={(e) => setFormData({ ...formData, provider_type: e.target.value })}
                      className="apple-input"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                      <option value="baidu">百度</option>
                      <option value="alibaba">阿里云</option>
                      <option value="zhipu">智谱AI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-apple-text mb-3">API Key</label>
                    <input
                      type="password"
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      className="apple-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-apple-text mb-3">Base URL</label>
                    <input
                      type="url"
                      value={formData.base_url}
                      onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                      className="apple-input"
                    />
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          provider_name: selectedProvider.provider_name,
                          provider_type: selectedProvider.provider_type,
                          api_key: (selectedProvider as any).api_key || '',
                          base_url: selectedProvider.base_url,
                        });
                      }}
                      className="apple-btn-secondary flex-1 py-3.5"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleUpdate}
                      className="apple-btn-primary flex-1 py-3.5"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 space-y-6">
                <div className="apple-card rounded-apple-md p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-apple-sm apple-gray-bg flex items-center justify-center">
                        <ToggleRight className="w-6 h-6 text-apple-text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-apple-text-secondary">启用状态</p>
                        <p className="font-semibold text-apple-text">{selectedProvider.enabled ? '已启用' : '已禁用'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleStatus(selectedProvider)}
                      className="flex items-center gap-2 apple-btn-secondary px-5 py-2.5"
                    >
                      {selectedProvider.enabled ? (
                        <>
                          <ToggleRight className="w-5 h-5" />
                          <span>禁用</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5" />
                          <span>启用</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="apple-card rounded-apple-md p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-apple-sm apple-blue/10 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-apple-blue" />
                    </div>
                    <span className="font-semibold text-apple-text text-lg">连接信息</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b apple-border-light">
                      <span className="text-apple-text-secondary text-sm">Base URL</span>
                      <span className="font-medium text-apple-text text-sm">{selectedProvider.base_url}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-apple-text-secondary text-sm">API Key</span>
                      <span className="font-mono text-sm text-apple-text bg-apple-gray-bg px-3 py-1.5 rounded-apple-sm">
                        {(selectedProvider as any).api_key ? (selectedProvider as any).api_key.slice(0, 8) + '...' : '未设置'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="apple-card rounded-apple-md p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-apple-sm apple-blue/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-apple-blue" />
                    </div>
                    <span className="font-semibold text-apple-text text-lg">性能统计</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 apple-gray-bg rounded-apple-md">
                      <p className="text-2xl font-bold text-apple-text mb-1">
                        {(selectedProvider.avg_latency ?? 0) > 0 ? `${selectedProvider.avg_latency}ms` : '--'}
                      </p>
                      <p className="text-xs text-apple-text-secondary">平均延迟</p>
                    </div>
                    <div className="text-center p-4 apple-gray-bg rounded-apple-md">
                      <p className="text-sm font-semibold text-apple-text mb-1">
                        {formatDate(selectedProvider.last_success_at ?? null)}
                      </p>
                      <p className="text-xs text-apple-text-secondary">最后成功</p>
                    </div>
                    <div className="text-center p-4 apple-gray-bg rounded-apple-md">
                      <p className="text-sm font-semibold text-apple-text mb-1">
                        {formatDate(selectedProvider.last_failed_at ?? null)}
                      </p>
                      <p className="text-xs text-apple-text-secondary">最后失败</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="apple-btn-primary w-full py-4 flex items-center justify-center gap-2"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>测试中...</span>
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4" />
                      <span>测试连接</span>
                    </>
                  )}
                </button>

                {testResult && (
                  <div className={`apple-card rounded-apple-md p-5 ${
                    testResult.success
                      ? 'apple-badge-success border-2 border-green-200'
                      : 'apple-badge-error border-2 border-red-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      {testResult.success ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <XCircle className="w-6 h-6" />
                      )}
                      <div>
                        <p className={`font-semibold ${
                          testResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {testResult.success ? '连接成功' : '连接失败'}
                        </p>
                        <p className={`text-sm mt-1 ${
                          testResult.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {testResult.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="apple-card rounded-apple-md">
                  <div className="flex items-center justify-between px-5 py-3 border-b apple-border-light">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-apple-sm bg-purple-50 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-semibold text-apple-text">模型</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleFetchModels}
                        disabled={isFetchingModels}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-apple-sm bg-purple-50 text-purple-600 text-sm font-medium hover:bg-purple-100 transition-colors disabled:opacity-50"
                        title="获取模型"
                      >
                        {isFetchingModels ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span>获取</span>
                      </button>
                      <button
                        onClick={openCreateModelModal}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-apple-sm bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                        title="新建模型"
                      >
                        <Plus className="w-4 h-4" />
                        <span>新建</span>
                      </button>
                      <button
                        onClick={handleResetCustomModels}
                        disabled={customModels.length === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-apple-sm border border-apple-border text-apple-text-secondary text-sm font-medium hover:bg-apple-gray-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="重置所有模型"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>重置</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-5">

                  {customModelTestResult && !showModelModal && (
                    <div className={`mb-5 p-4 rounded-apple-md ${
                      customModelTestResult.success
                        ? 'apple-badge-success border-2 border-green-200'
                        : 'apple-badge-error border-2 border-red-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        {customModelTestResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className={`font-semibold text-sm ${customModelTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                            {customModelTestResult.success ? '测试成功' : '测试失败'}
                          </p>
                          <p className={`text-xs mt-0.5 ${customModelTestResult.success ? 'text-green-600' : 'text-red-600'}`}>
                            {customModelTestResult.message}
                            {customModelTestResult.latency_ms !== undefined && (
                              <span className="ml-1">({customModelTestResult.latency_ms}ms)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {customModels.length > 0 ? (
                    <div className="space-y-2">
                      {customModels.map((cm) => {
                        const caps = parseCapabilities(cm.capabilities);
                        return (
                          <div
                            key={cm.id}
                            className={`p-3 rounded-apple-sm border transition-colors ${
                              cm.enabled ? 'border-apple-border bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  onClick={() => handleToggleCustomModel(cm.id)}
                                  className="flex-shrink-0"
                                  title={cm.enabled ? '禁用' : '启用'}
                                >
                                  {cm.enabled ? (
                                    <ToggleRight className="w-5 h-5 text-purple-600" />
                                  ) : (
                                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                                  )}
                                </button>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-apple-text truncate">{cm.model_name}</p>
                                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                                      {cm.model_type === 'chat' ? '聊天' : cm.model_type === 'embedding' ? '嵌入' : cm.model_type === 'image' ? '图片' : cm.model_type}
                                    </span>
                                  </div>
                                  <p className="text-xs text-apple-text-secondary truncate">{cm.model_id}</p>
                                  {(caps.vision || caps.reasoning || caps.tool_use) && (
                                    <div className="flex gap-1 mt-1">
                                      {caps.vision && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-600">
                                          <Eye className="w-2.5 h-2.5" />视觉
                                        </span>
                                      )}
                                      {caps.reasoning && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">
                                          <Brain className="w-2.5 h-2.5" />推理
                                        </span>
                                      )}
                                      {caps.tool_use && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-600">
                                          <Wrench className="w-2.5 h-2.5" />工具
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleTestCustomModel(cm.id)}
                                  disabled={customModelTestLoading === cm.id}
                                  className="p-2 rounded-apple-sm hover:bg-purple-50 transition-colors"
                                  title="测试连通性"
                                >
                                  {customModelTestLoading === cm.id ? (
                                    <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
                                  ) : (
                                    <Wifi className="w-4 h-4 text-purple-600" />
                                  )}
                                </button>
                                <button
                                  onClick={() => openEditModelModal(cm)}
                                  className="p-2 rounded-apple-sm hover:bg-apple-gray-bg transition-colors"
                                  title="编辑"
                                >
                                  <Edit className="w-4 h-4 text-apple-text-secondary" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCustomModel(cm.id)}
                                  className="p-2 rounded-apple-sm hover:bg-red-50 transition-colors"
                                  title="删除"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-apple-text-secondary">暂无可用模型</p>
                      <p className="text-xs text-apple-text-secondary/60 mt-1">点击上方按钮获取或新建模型</p>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-apple-gray-bg flex items-center justify-center mx-auto mb-8">
              <Globe className="w-12 h-12 text-apple-text-secondary opacity-50" />
            </div>
            <p className="text-lg font-semibold text-apple-text mb-4">
              选择或创建一个提供商
            </p>
            <div className="space-y-1">
              <p className="text-sm text-apple-text-secondary">
                在左侧列表中选择现有提供商
              </p>
              <p className="text-sm text-apple-text-secondary">
                或创建新的提供商
              </p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <>
        <div className="min-h-[calc(100vh-6rem)] bg-apple-gray-bg">
          <div className="flex gap-4 max-w-7xl mx-auto py-6 px-6">
        <div className="w-80 flex-shrink-0 bg-white rounded-apple-lg shadow-apple-card flex flex-col" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
          <div className="p-5 border-b apple-border-light flex items-center justify-between">
            <h2 className="font-semibold text-apple-text text-lg">提供商列表</h2>
            <button
              onClick={() => {
                setIsCreating(true);
                setSelectedProvider(null);
                setFormData({
                  provider_name: '',
                  provider_type: 'openai',
                  api_key: '',
                  base_url: 'https://api.openai.com/v1',
                });
              }}
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
                      onClick={() => handleSelectProvider(provider)}
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

        <div className="flex-1 flex flex-col bg-white rounded-apple-lg shadow-apple-card min-h-[500px]" style={{ minHeight: 'calc(100vh - 12rem)' }}>
          <div className="flex-1 flex flex-col">
            {renderRightPanel()}
          </div>
        </div>
      </div>
    </div>

    {renderModelModal()}
    {renderModelSelector()}
    </>
  );
}
