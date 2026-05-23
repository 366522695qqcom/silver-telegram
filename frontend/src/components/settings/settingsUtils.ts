export interface ModelFormState {
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

export function inferModelInfo(modelId: string): Partial<ModelFormState> {
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
