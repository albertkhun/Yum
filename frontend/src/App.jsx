import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar  from './components/layout/Navbar';
import Footer  from './components/layout/Footer';

import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage     from './pages/HomePage';
import ListingsPage from './pages/listings/ListingsPage';
import ListingDetail from './pages/listings/ListingDetail';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import CreateListing  from './pages/owner/CreateListing';
import EditListing    from './pages/owner/EditListing';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminListings  from './pages/admin/AdminListings';
import AdminUsers     from './pages/admin/AdminUsers';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
};

const OwnerRoute = ({ children }) => {
  const { user, loading, isOwner } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isOwner) return <Navigate to="/" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Spinner />;
  if (!user)    return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

const AppShell = () => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1">
      <Routes>
        <Route path="/"             element={<HomePage />} />
        <Route path="/listings"     element={<ListingsPage />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/register"     element={<RegisterPage />} />
        <Route path="/owner"        element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
        <Route path="/owner/create" element={<OwnerRoute><CreateListing /></OwnerRoute>} />
        <Route path="/owner/edit/:id" element={<OwnerRoute><EditListing /></OwnerRoute>} />
        <Route path="/admin"          element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/listings" element={<AdminRoute><AdminListings /></AdminRoute>} />
        <Route path="/admin/users"    element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="*" element={
          <div className="page-wrapper text-center py-24">
            <h1 className="section-title mb-4">404 — Page Not Found</h1>
            <a href="/" className="btn-primary inline-block">Go Home</a>
          </div>
        } />
      </Routes>
    </main>
    <Footer />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px' },
          }}
        />
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
