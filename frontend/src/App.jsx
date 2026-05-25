import AppLoader from './components/loaders/AppLoader';
import { lazy, Suspense, useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage     from './pages/HomePage';
import ListingsPage from './pages/listings/ListingsPage';

// Auth pages — moderate priority
const LoginPage    = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
 

// Detail page — high-traffic but needs carousel/map, worth splitting
const ListingDetail   = lazy(() => import('./pages/listings/ListingDetail'));
const WriteReviewPage = lazy(() => import('./pages/listings/WriteReviewPage'));

// Owner pages — authenticated, low initial traffic
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard'));
const CreateListing  = lazy(() => import('./pages/owner/CreateListing'));
const EditListing    = lazy(() => import('./pages/owner/EditListing'));

// Admin pages — rare, definitely split
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminListings  = lazy(() => import('./pages/admin/AdminListings'));
const AdminUsers     = lazy(() => import('./pages/admin/AdminUsers'));
const AdminSettings  = lazy(() => import('./pages/admin/AdminSettings'));

// Misc
const RoleSelectPage     = lazy(() => import('./pages/auth/RoleSelectPage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));
const WishlistPage       = lazy(() => import('./pages/WishlistPage'));
const TermsPage          = lazy(() => import('./pages/TermsPage.jsx'));

// ── Inline spinner — tiny, no extra bundle ──────────────────────────────
const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
  </div>
);

// ── Route guards ─────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
};

const OwnerRoute = ({ children }) => {
  const { user, loading, isOwner, needsRole } = useAuth();
  if (loading) return <Spinner />;
  if (!user)     return <Navigate to="/login" replace />;
  if (needsRole) return <Navigate to="/select-role" replace />;
  if (!isOwner)  return <Navigate to="/" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Spinner />;
  if (!user)    return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

// ── Shell ─────────────────────────────────────────────────────────────────
const AppShell = () => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1">
      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* Public — critical path, no lazy */}
          <Route path="/"             element={<HomePage />} />
          <Route path="/listings"     element={<ListingsPage />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/listings/:id/review" element={<WriteReviewPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Auth */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/select-role" element={<PrivateRoute><RoleSelectPage /></PrivateRoute>} />

          {/* User */}
          <Route path="/settings"        element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="/change-password" element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} />
          <Route path="/wishlist"        element={<PrivateRoute><WishlistPage /></PrivateRoute>} />

          {/* Owner */}
          <Route path="/owner"          element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
          <Route path="/owner/create"   element={<OwnerRoute><CreateListing /></OwnerRoute>} />
          <Route path="/owner/edit/:id" element={<OwnerRoute><EditListing /></OwnerRoute>} />

          {/* Admin */}
          <Route path="/admin"                 element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/listings"        element={<AdminRoute><AdminListings /></AdminRoute>} />
          <Route path="/admin/users"           element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/settings"        element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="/admin/change-password" element={<AdminRoute><ChangePasswordPage adminMode /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={
            <div className="page-wrapper text-center py-24">
              <h1 className="section-title mb-4">404 — Page Not Found</h1>
              <a href="/" className="btn-primary inline-block">Go Home</a>
            </div>
          } />
        </Routes>
      </Suspense>
    </main>
    <Footer />
  </div>
);

// ── Backend wakeup — ONLY shown on the home page '/' ─────────────────────
// On any other route we let the app render immediately.
// The backend check still runs in the background so warm-up happens,
// but it doesn't gate the UI on non-home pages.
const BACKEND_URL = import.meta.env.VITE_API_URL || '';

function useBackendWakeup() {
  const [ready, setReady] = useState(false);

  const check = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      if (res.ok) return true;
    } catch {
      /* backend still sleeping */
    }
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let interval;

    const run = async () => {
      const ok = await check();
      if (cancelled) return;
      if (ok) {
        // Minimum 2 s so the loader animation completes gracefully
        setTimeout(() => { if (!cancelled) setReady(true); }, 2000);
        return;
      }
      interval = setInterval(async () => {
        const ok2 = await check();
        if (ok2 && !cancelled) {
          clearInterval(interval);
          setTimeout(() => { if (!cancelled) setReady(true); }, 2000);
        }
      }, 2000);
    };

    run();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [check]);

  return ready;
}

// ── Home-only loader wrapper ──────────────────────────────────────────────
// We need to read the location, so this must live inside <BrowserRouter>
const AppWithLoader = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const backendReady = useBackendWakeup();

  // Only block render on the home page while the backend wakes up.
  // On every other route, show the app immediately.
  if (isHome && !backendReady) {
    return <AppLoader visible />;
  }

  return (
    <AuthProvider>
      <WishlistProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '14px',
            },
          }}
        />
        <AppShell />
      </WishlistProvider>
    </AuthProvider>
  );
};

// ── Root export ───────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AppWithLoader />
    </BrowserRouter>
  );
}
