import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/services/api';
import { useStore } from '@/store';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated, setError, setIsLoading } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-apple-blue flex items-center justify-center">
              <span className="text-white text-2xl font-bold">AI</span>
            </div>
            <h1 className="text-2xl font-semibold text-apple-text">
              {isLogin ? '欢迎回来' : '创建账户'}
            </h1>
            <p className="text-apple-text-secondary mt-2">
              {isLogin ? '登录您的 AI API Gateway 账户' : '开始使用统一的 AI API 管理平台'}
            </p>
          </div>

          {useStore.getState().error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {useStore.getState().error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-apple-text mb-2">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue transition-all bg-gray-50 hover:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-apple-text mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue transition-all bg-gray-50 hover:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-apple-text mb-2">确认密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue transition-all bg-gray-50 hover:bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={useStore.getState().isLoading}
              className="w-full py-3 bg-apple-blue hover:bg-apple-blue-hover text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-apple-blue/25"
            >
              {useStore.getState().isLoading ? '加载中...' : (isLogin ? '登录' : '注册')}
            </button>
          </form>

          <p className="text-center text-apple-text-secondary mt-6">
            {isLogin ? '还没有账户？' : '已有账户？'}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-apple-blue hover:text-apple-blue-hover font-medium ml-1"
            >
              {isLogin ? '立即注册' : '立即登录'}
            </button>
          </p>
        </div>

        <p className="text-center text-apple-text-secondary text-sm mt-6">
          AI API Gateway - 统一管理所有 AI 提供商
        </p>
      </div>
    </div>
  );
}
