import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '@/store';
import { authAPI } from '@/services/api';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Settings from '@/pages/Settings';
import ApiKeys from '@/pages/ApiKeys';
import Monitor from '@/pages/Monitor';
import AuditLogs from '@/pages/AuditLogs';
import RoutingRules from '@/pages/RoutingRules';
import BatchTasks from '@/pages/BatchTasks';
import Tools from '@/pages/Tools';
import Vision from '@/pages/Vision';
import AsyncTasks from '@/pages/AsyncTasks';
import Layout from '@/components/Layout';

export default function App() {
  const { setUser, setIsAuthenticated, isAuthenticated, setIsLoading } = useStore();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoading(true);
      authAPI.me()
        .then(user => {
          setUser(user);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        })
        .finally(() => {
          setCheckingAuth(false);
          setIsLoading(false);
        });
    } else {
      setCheckingAuth(false);
    }
  }, [setUser, setIsAuthenticated, setIsLoading]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  );
}
