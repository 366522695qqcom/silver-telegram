import { useState, useEffect } from 'react';
import { Image, Upload, Eye, Send, Sparkles } from 'lucide-react';
import { api } from '@/services/api';

interface Provider {
  id: string;
  provider_name: string;
}

export default function Vision() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [prompt, setPrompt] = useState('描述这张图片');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'analyze' | 'generate'>('analyze');
  const [genOptions, setGenOptions] = useState({
    model: 'dall-e-3',
    size: '1024x1024',
    quality: 'standard'
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const res = await api.get('/providers');
      setProviders(res.providers);
      if (res.providers.length > 0) {
        setSelectedProvider(res.providers[0].id);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedProvider || !imageUrl) return;
    try {
      setLoading(true);
      const res = await api.post('/vision/analyze', {
        image_url: imageUrl,
        prompt,
        provider_id: selectedProvider
      });
      setResult(res);
    } catch (error) {
      console.error('Failed to analyze image:', error);
      alert('分析失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedProvider || !prompt) return;
    try {
      setLoading(true);
      const res = await api.post('/images/generations', {
        prompt,
        provider_id: selectedProvider,
        options: genOptions
      });
      setResult(res);
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert('生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-apple-text">视觉功能</h1>
        <p className="text-apple-text-secondary mt-1">图像分析与生成</p>
      </div>

      <div className="apple-card">
        <div className="flex gap-4 mb-6 border-b border-apple-border pb-4">
          <button
            onClick={() => setMode('analyze')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              mode === 'analyze' ? 'bg-apple-blue text-white' : 'hover:bg-apple-gray-bg'
            }`}
          >
            <Eye size={20} />
            图像分析
          </button>
          <button
            onClick={() => setMode('generate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              mode === 'generate' ? 'bg-apple-blue text-white' : 'hover:bg-apple-gray-bg'
            }`}
          >
            <Sparkles size={20} />
            图像生成
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1">选择提供商</label>
            <select
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value)}
              className="apple-input"
            >
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.provider_name}</option>
              ))}
            </select>
          </div>

          {mode === 'analyze' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">图片 URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="apple-input"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">提示词</label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  className="apple-input"
                  rows={4}
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="apple-btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={20} />
                )}
                分析
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1">提示词</label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  className="apple-input"
                  rows={4}
                  placeholder="一只可爱的猫咪在花园里"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-apple-text mb-1">模型</label>
                  <select
                    value={genOptions.model}
                    onChange={e => setGenOptions({ ...genOptions, model: e.target.value })}
                    className="apple-input"
                  >
                    <option value="dall-e-3">DALL-E 3</option>
                    <option value="dall-e-2">DALL-E 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-apple-text mb-1">尺寸</label>
                  <select
                    value={genOptions.size}
                    onChange={e => setGenOptions({ ...genOptions, size: e.target.value })}
                    className="apple-input"
                  >
                    <option value="1024x1024">1024x1024</option>
                    <option value="1024x1792">1024x1792</option>
                    <option value="1792x1024">1792x1024</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-apple-text mb-1">质量</label>
                  <select
                    value={genOptions.quality}
                    onChange={e => setGenOptions({ ...genOptions, quality: e.target.value })}
                    className="apple-input"
                  >
                    <option value="standard">标准</option>
                    <option value="hd">高清</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="apple-btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles size={20} />
                )}
                生成
              </button>
            </>
          )}

          {result && (
            <div className="mt-6 pt-6 border-t border-apple-border">
              <h3 className="font-medium text-apple-text mb-3">结果</h3>
              {mode === 'generate' && result.result?.data ? (
                <div className="space-y-3">
                  {result.result.data.map((item: any, idx: number) => (
                    <img
                      key={idx}
                      src={item.url || item.b64_json ? `data:image/png;base64,${item.b64_json}` : ''}
                      alt="Generated"
                      className="max-w-full rounded-lg"
                    />
                  ))}
                </div>
              ) : (
                <pre className="apple-input font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
