import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Key,
  Server,
  Menu,
  X,
  Route,
  Package,
  Wrench,
  Eye,
  Zap
} from 'lucide-react';
import { useStore } from '@/store';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, path: '/home', label: '仪表盘' },
    { icon: Server, path: '/settings', label: '提供商管理' },
    { icon: Key, path: '/api-keys', label: 'API密钥' },
    { icon: Activity, path: '/monitor', label: '实时监控' },
    { icon: FileText, path: '/audit-logs', label: '审计日志' },
    { icon: Route, path: '/routing', label: '智能路由' },
    { icon: Package, path: '/batch', label: '批处理' },
    { icon: Wrench, path: '/tools', label: '工具管理' },
    { icon: Eye, path: '/vision', label: '视觉功能' },
    { icon: Zap, path: '/async', label: '异步任务' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentPath = location.pathname;

  return (
    <div className="flex h-screen bg-apple-gray-bg">
      <nav
        className={`fixed md:static left-0 top-0 h-full bg-white z-50 transition-all duration-300 ease-out ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex flex-col h-full border-r border-apple-border-light">
          <div className="flex items-center justify-between h-16 px-5 border-b border-apple-border-light">
            {!collapsed && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-apple-sm bg-apple-blue flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">AI</span>
                </div>
                <span className="font-semibold text-apple-text text-sm tracking-tight">API Gateway</span>
              </div>
            )}
            {collapsed && (
              <div className="w-8 h-8 mx-auto rounded-apple-sm bg-apple-blue flex items-center justify-center">
                <span className="text-white font-semibold text-xs">AI</span>
              </div>
            )}
          </div>

          <div className="flex-1 py-4 px-3 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      className={`apple-nav-item w-full ${
                        isActive ? 'apple-nav-item-active' : 'apple-nav-item-default'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="p-3 border-t border-apple-border-light">
            {!collapsed ? (
              <div className="mb-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-apple-blue-subtle flex items-center justify-center">
                    <span className="text-apple-blue font-medium text-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-apple-text truncate">{user?.email}</p>
                    <p className="text-xs text-apple-text-tertiary">已登录</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-2 flex justify-center">
                <div className="w-8 h-8 rounded-full bg-apple-blue-subtle flex items-center justify-center">
                  <span className="text-apple-blue font-medium text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className={`apple-nav-item apple-nav-item-default w-full text-red-500 hover:bg-red-50 hover:text-red-600 ${
                collapsed ? 'justify-center px-0' : ''
              }`}
              title={collapsed ? '退出登录' : undefined}
            >
              <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span>退出登录</span>}
            </button>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex apple-nav-item apple-nav-item-default w-full mt-2 justify-center px-0"
              title={collapsed ? '展开侧边栏' : '收起侧边栏'}
            >
              {collapsed ? (
                <ChevronRight className="w-[18px] h-[18px]" />
              ) : (
                <ChevronLeft className="w-[18px] h-[18px]" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-apple-border-light flex items-center justify-between px-6 flex-shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-apple-sm hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-apple-text" />
          </button>

          <div className="flex items-center">
            <span className="text-base font-semibold text-apple-text tracking-tight">
              {navItems.find(item => item.path === currentPath)?.label || 'AI API Gateway'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-apple-success animate-pulse" />
            <span className="text-xs text-apple-text-tertiary">系统正常</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="fixed top-4 right-4 z-50 p-2 bg-white rounded-full shadow-lg md:hidden"
          >
            <X className="w-5 h-5 text-apple-text" />
          </button>
        </>
      )}
    </div>
  );
}
