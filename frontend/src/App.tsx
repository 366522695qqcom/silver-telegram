import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '@/store';
import { authAPI } from '@/services/api';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Layout from '@/components/Layout';

const Settings = React.lazy(() => import('@/pages/Settings'));
const ApiKeys = React.lazy(() => import('@/pages/ApiKeys'));
const Monitor = React.lazy(() => import('@/pages/Monitor'));
const AuditLogs = React.lazy(() => import('@/pages/AuditLogs'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
  </div>
);

const CHECKING_AUTH_LOADER = (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
  </div>
);

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
    return CHECKING_AUTH_LOADER;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
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
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
