import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Spinner from './components/ui/Spinner';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BeneficiaryList from './pages/beneficiaries/BeneficiaryList';
import BeneficiaryCreate from './pages/beneficiaries/BeneficiaryCreate';
import BeneficiaryDetail from './pages/beneficiaries/BeneficiaryDetail';
import QuickCheck from './pages/QuickCheck';
import Foundations from './pages/superadmin/Foundations';
import MapView from './pages/MapView';
import BeneficiaryEdit from './pages/beneficiaries/BeneficiaryEdit';
import Notices from './pages/Notices';
import Profile from './pages/Profile';
import AuditLog from './pages/superadmin/AuditLog';
import StaffManagement from './pages/fondadmin/StaffManagement';
import FoundationSettings from './pages/fondadmin/FoundationSettings';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import BlogLayout from './components/layout/BlogLayout';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="lists" element={<BeneficiaryList />} />
        <Route path="create" element={<BeneficiaryCreate />} />
        <Route path="beneficiaries/:id" element={<BeneficiaryDetail />} />
        <Route path="beneficiaries/:id/edit" element={<BeneficiaryEdit />} />
        <Route path="check" element={<QuickCheck />} />
        <Route path="foundations" element={<Foundations />} />
        <Route path="map" element={<MapView />} />
        <Route path="notices" element={<Notices />} />
        <Route path="profile" element={<Profile />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="settings" element={<FoundationSettings />} />
      </Route>
      {/* Blog — public, layout auto-switches based on auth */}
      <Route path="/blog" element={<BlogLayout />}>
        <Route index element={<Blog />} />
        <Route path=":id" element={<BlogDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
