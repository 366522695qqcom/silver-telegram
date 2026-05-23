import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { authAPI } from '@/services/api';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

const Settings = lazy(() => import('@/pages/Settings'));
const ApiKeys = lazy(() => import('@/pages/ApiKeys'));
const Monitor = lazy(() => import('@/pages/Monitor'));
const AuditLogs = lazy(() => import('@/pages/AuditLogs'));
const RoutingRules = lazy(() => import('@/pages/RoutingRules'));
const BatchTasks = lazy(() => import('@/pages/BatchTasks'));
const Tools = lazy(() => import('@/pages/Tools'));
const Vision = lazy(() => import('@/pages/Vision'));
const AsyncTasks = lazy(() => import('@/pages/AsyncTasks'));

export default function App() {
  const setUser = useAuthStore(s => s.setUser);
  const setIsAuthenticated = useAuthStore(s => s.setIsAuthenticated);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const setIsLoading = useAuthStore(s => s.setIsLoading);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let cancelled = false;
    if (token) {
      setIsLoading(true);
      authAPI.me()
        .then(user => {
          if (!cancelled) {
            setUser(user);
            setIsAuthenticated(true);
          }
        })
        .catch(() => {
          if (!cancelled) {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setCheckingAuth(false);
            setIsLoading(false);
          }
        });
    } else {
      setCheckingAuth(false);
    }
    return () => { cancelled = true; };
  }, [setUser, setIsAuthenticated, setIsLoading]);

  if (checkingAuth) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <ErrorBoundary>
        <Routes>
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/home" /> : <Login />
        } />
        <Route path="/home" element={
          isAuthenticated ? (
            <Layout>
              <Home />
            </Layout>
          ) : (
            <Navigate to="/" />
          )
        } />
        <Route path="/settings" element={
          isAuthenticated ? (
            <Layout>
              <Settings />
            </Layout>
          ) : (
            <Navigate to="/" />
          )
        } />
        <Route path="/api-keys" element={
          isAuthenticated ? (
            <Layout>
              <ApiKeys />
            </Layout>
          ) : (
            <Navigate to="/" />
          )
        } />
        <Route path="/monitor" element={
          isAuthenticated ? (
            <Layout>
              <Monitor />
            </Layout>
          ) : (
            <Navigate to="/" />
          )
        } />
        <Route path="/audit-logs" element={
          isAuthenticated ? (
            <Layout>
              <AuditLogs />
            </Layout>
          ) : (
            <Navigate to="/" />
          )}
      />
      <Route path="/routing" element={
          isAuthenticated ? (
            <Layout>
              <RoutingRules />
            </Layout>
          ) : (
            <Navigate to="/" />
          )}
      />
      <Route path="/batch" element={
          isAuthenticated ? (
            <Layout>
              <BatchTasks />
            </Layout>
          ) : (
            <Navigate to="/" />
          )}
      />
      <Route path="/tools" element={
          isAuthenticated ? (
            <Layout>
              <Tools />
            </Layout>
          ) : (
            <Navigate to="/" />
          )}
      />
      <Route path="/vision" element={
          isAuthenticated ? (
            <Layout>
              <Vision />
            </Layout>
          ) : (
            <Navigate to="/" />
          )}
      />
      <Route path="/async" element={
          isAuthenticated ? (
            <Layout>
              <AsyncTasks />
            </Layout>
          ) : (
            <Navigate to="/" />
          )}
      />
      <Route path="*" element={
          isAuthenticated ? (
            <Layout>
              <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <h1 className="text-6xl font-bold text-apple-text mb-4">404</h1>
                <p className="text-lg text-apple-text-secondary mb-8">页面不存在</p>
                <Link to="/home" className="px-6 py-3 bg-apple-blue text-white rounded-apple-lg hover:bg-apple-blue-hover transition-colors">
                  返回首页
                </Link>
              </div>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
      </ErrorBoundary>
      </Suspense>
    </BrowserRouter>
  );
}
