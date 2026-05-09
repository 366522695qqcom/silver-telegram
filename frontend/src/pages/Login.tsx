import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/services/api';
import { useStore } from '@/store';
import { Lock, Mail, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated, setError } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoadingLocal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoadingLocal(true);
    setError(null);

    try {
      const result = isLogin
        ? await authAPI.login({ email, password })
        : await authAPI.register({ email, password });

      localStorage.setItem('token', result.token);
      setUser(result.user);
      setIsAuthenticated(true);
      setError(null);
      navigate('/home');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoadingLocal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-apple-gray-bg to-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] animate-apple-slide-up">
        <div className="bg-white rounded-apple-lg p-10 shadow-apple-modal">
          <div className="text-center mb-10">
            <div className="w-14 h-14 mx-auto mb-6 rounded-apple-md bg-apple-blue flex items-center justify-center shadow-lg shadow-apple-blue/20">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-apple-text tracking-tight">
              {isLogin ? '欢迎回来' : '创建账户'}
            </h1>
            <p className="text-apple-text-secondary mt-3 text-sm leading-relaxed">
              {isLogin ? '登录您的 AI API Gateway 账户' : '开始使用统一的 AI API 管理平台'}
            </p>
          </div>

          {useStore.getState().error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-apple-sm text-red-600 text-sm animate-apple-fade-in">
              {useStore.getState().error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-apple-text-secondary mb-2 uppercase tracking-wide">
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-text-tertiary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="apple-input pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-apple-text-secondary mb-2 uppercase tracking-wide">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-text-tertiary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="apple-input pl-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-apple-text-tertiary hover:text-apple-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="animate-apple-slide-up">
                <label className="block text-xs font-medium text-apple-text-secondary mb-2 uppercase tracking-wide">
                  确认密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-text-tertiary" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="apple-input pl-11"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="apple-btn-primary w-full py-3 mt-6 text-base font-semibold tracking-tight"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  处理中...
                </span>
              ) : (
                isLogin ? '登录' : '创建账户'
              )}
            </button>
          </form>

          <p className="text-center text-apple-text-secondary text-sm mt-8">
            {isLogin ? '还没有账户？' : '已有账户？'}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-apple-blue hover:text-apple-blue-hover font-medium ml-1 transition-colors"
            >
              {isLogin ? '立即注册' : '立即登录'}
            </button>
          </p>
        </div>

        <p className="text-center text-apple-text-tertiary text-xs mt-8">
          AI API Gateway — 统一管理所有 AI 提供商
        </p>
      </div>
    </div>
  );
}
