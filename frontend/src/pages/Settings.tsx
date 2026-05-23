import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import { providersAPI, customModelsAPI } from '@/services/api';
import type { Provider, CreateProviderData, TestConnectionResult, CustomModel, Model } from '@/types';
import type { ModelFormState } from '@/components/settings/settingsUtils';
import { inferModelInfo } from '@/components/settings/settingsUtils';
import ProviderList from '@/components/settings/ProviderList';
import ProviderDetail from '@/components/settings/ProviderDetail';
import ModelModal from '@/components/settings/ModelModal';
import ModelSelector from '@/components/settings/ModelSelector';

const defaultFormState: ModelFormState = {
  model_id: '',
  model_name: '',
  model_type: 'chat',
  capabilities: { vision: false, reasoning: false, tool_use: false },
  context_window: 128000,
  max_output_tokens: 4096,
};

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
  const [modelFilter, setModelFilter] = useState<string>('');

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

  const handleFetchModels = async (filter?: string) => {
    if (!selectedProvider) return;
    setIsFetchingModels(true);
    setAvailableModels([]);
    setSelectedModels(new Set());
    setModelSearchQuery('');
    const activeFilter = filter ?? modelFilter;
    setShowModelSelector(true);
    try {
      const result = await providersAPI.getModels(selectedProvider.id, activeFilter || undefined);
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

  const handleSelectAllModels = (ids: string[]) => {
    setSelectedModels(new Set(ids));
  };

  const deselectAllModels = () => {
    setSelectedModels(new Set());
  };

  const handleAddSelectedModels = async () => {
    if (selectedModels.size === 0 || !selectedProvider) return;
    setShowModelSelector(false);
    setIsAddingModels(true);
    const existingIds = new Set(customModels.filter(cm => cm.provider_id === selectedProvider.id).map(cm => cm.model_id));
    const modelsToAdd = availableModels.filter(m => selectedModels.has(m.id) && !existingIds.has(m.id));
    if (modelsToAdd.length === 0) {
      setIsAddingModels(false);
      return;
    }
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
      const existingIdsSet = new Set(customModels.map(m => m.id));
      const trulyNew = newModels.filter(m => !existingIdsSet.has(m.id));
      setCustomModels([...trulyNew, ...customModels]);
    } catch (error) {
      console.error('Failed to add models:', error);
      alert('添加模型失败: ' + (error as Error).message);
      fetchCustomModels();
    } finally {
      setIsAddingModels(false);
    }
  };

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

  const handleCreateClick = useCallback(() => {
    setIsCreating(true);
    setSelectedProvider(null);
    setFormData({
      provider_name: '',
      provider_type: 'openai',
      api_key: '',
      base_url: 'https://api.openai.com/v1',
    });
  }, []);

  const handleCancelCreate = useCallback(() => {
    setIsCreating(false);
  }, []);

  const handleToggleEdit = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    if (selectedProvider) {
      setFormData({
        provider_name: selectedProvider.provider_name,
        provider_type: selectedProvider.provider_type,
        api_key: (selectedProvider as any).api_key || '',
        base_url: selectedProvider.base_url,
      });
    }
  }, [selectedProvider]);

  const handleModelIdChange = useCallback((value: string) => {
    const inferred = inferModelInfo(value);
    setModelForm(prev => ({
      ...prev,
      model_id: value,
      ...(prev.model_name ? {} : { model_name: value }),
      ...inferred,
    }));
  }, []);

  const handleModelNameChange = useCallback((value: string) => {
    setModelForm(prev => ({ ...prev, model_name: value }));
  }, []);

  const handleModelTypeChange = useCallback((value: string) => {
    setModelForm(prev => ({ ...prev, model_type: value }));
  }, []);

  const handleCapabilityChange = useCallback((capability: 'vision' | 'reasoning' | 'tool_use', checked: boolean) => {
    setModelForm(prev => ({
      ...prev,
      capabilities: { ...prev.capabilities, [capability]: checked },
    }));
  }, []);

  const handleContextWindowChange = useCallback((value: number) => {
    setModelForm(prev => ({ ...prev, context_window: value }));
  }, []);

  const handleMaxOutputTokensChange = useCallback((value: number) => {
    setModelForm(prev => ({ ...prev, max_output_tokens: value }));
  }, []);

  return (
    <>
        <div className="min-h-[calc(100vh-6rem)] bg-apple-gray-bg">
          <div className="flex gap-4 max-w-7xl mx-auto py-6 px-6">
        <ProviderList
          providers={providers}
          selectedProvider={selectedProvider}
          onSelectProvider={handleSelectProvider}
          onCreateClick={handleCreateClick}
        />

        <div className="flex-1 flex flex-col bg-white rounded-apple-lg shadow-apple-card min-h-[500px]" style={{ minHeight: 'calc(100vh - 12rem)' }}>
          <div className="flex-1 flex flex-col">
            <ProviderDetail
              selectedProvider={selectedProvider}
              isCreating={isCreating}
              isEditing={isEditing}
              formData={formData}
              testResult={testResult}
              customModels={customModels}
              customModelTestResult={customModelTestResult}
              customModelTestLoading={customModelTestLoading}
              isTesting={isTesting}
              isFetchingModels={isFetchingModels}
              showModelModal={showModelModal}
              onCancelCreate={handleCancelCreate}
              onCreate={handleCreate}
              onToggleEdit={handleToggleEdit}
              onCancelEdit={handleCancelEdit}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onTestConnection={handleTestConnection}
              onFormDataChange={setFormData}
              onFetchModels={handleFetchModels}
              onCreateModel={openCreateModelModal}
              onResetModels={handleResetCustomModels}
              onToggleCustomModel={handleToggleCustomModel}
              onTestCustomModel={handleTestCustomModel}
              onEditCustomModel={openEditModelModal}
              onDeleteCustomModel={handleDeleteCustomModel}
            />
          </div>
        </div>
      </div>
    </div>

    <ModelModal
      showModelModal={showModelModal}
      modelForm={modelForm}
      modelEditId={modelEditId}
      customModelTestResult={customModelTestResult}
      isSavingModel={isSavingModel}
      modelFormTestLoading={modelFormTestLoading}
      onClose={closeModelModal}
      onModelIdChange={handleModelIdChange}
      onModelNameChange={handleModelNameChange}
      onModelTypeChange={handleModelTypeChange}
      onCapabilityChange={handleCapabilityChange}
      onContextWindowChange={handleContextWindowChange}
      onMaxOutputTokensChange={handleMaxOutputTokensChange}
      onTestModel={handleTestModelFromForm}
      onSaveModel={handleSaveModel}
    />
    <ModelSelector
      showModelSelector={showModelSelector}
      availableModels={availableModels}
      selectedModels={selectedModels}
      modelSearchQuery={modelSearchQuery}
      isFetchingModels={isFetchingModels}
      isAddingModels={isAddingModels}
      existingModelIds={new Set(customModels.filter(cm => cm.provider_id === selectedProvider?.id).map(cm => cm.model_id))}
      modelFilter={modelFilter}
      onClose={() => setShowModelSelector(false)}
      onSearchQueryChange={setModelSearchQuery}
      onSelectAll={handleSelectAllModels}
      onDeselectAll={deselectAllModels}
      onToggleModel={toggleModelSelection}
      onAddSelectedModels={handleAddSelectedModels}
      onFilterChange={setModelFilter}
      onRefetchWithFilter={(filter) => handleFetchModels(filter)}
    />
    </>
  );
}
