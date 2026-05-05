import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useAppStore } from './store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Monitor from './pages/Monitor';
import AuditLogs from './pages/AuditLogs';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAppStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAppStore();
  return token ? <Navigate to="/" replace /> : <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="settings" element={<Settings />} />
          <Route path="monitor" element={<Monitor />} />
          <Route path="audit" element={<AuditLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
