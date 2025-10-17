import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider } from './contexts/SessionContext';

import PrivateRoute from './components/PrivateRoute';
import RegistrationForm from './pages/RegistrationForm';
import RegisterForm from './pages/RegisterForm';
import RoleSetupForm from './pages/RoleSetupForm';
import SignInPage from './pages/SignInPage';
import SignInForm from './pages/SignInForm';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import Layout from './components/Layout';
import CaseDetailPage from './pages/CaseDetailPage';
import UploadsPage from './pages/UploadsPage';
import UserManagementPage from './pages/UserManagementPage';
import NotFoundPage from './pages/NotFoundPage';
import PlasmicPage from './pages/PlasmicPage';
import HomeLayout from './components/HomeLayout';
import PlasmicHost from './pages/PlasmicHost';
import HomeDescription from './pages/HomeDescription';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import MediatorPage from './routes/mediator';
import DivorceePage from './routes/divorcee';
import LawyerPage from './routes/lawyer';
import AdminPage from './routes/admin';
import DashboardRedirect from './routes/DashboardRedirect';
import RoleBoundary from './routes/RoleBoundary';
import { saveLastRoute } from './lib/storage';
import CaseOverviewPage from './components/case/CaseOverviewPage';
import DashboardShowcase from './pages/DashboardShowcase';
import DivorceWizardPage from './pages/DivorceWizardPage';
import FAQ from './pages/FAQ';
import WhatToExpect from './pages/WhatToExpect';
import PrivacyPolicy from './pages/PrivacyPolicy';

// AuthSetup no longer needed - AuthContext handles 401 via event listener

const App = () => (
  <AuthProvider>
    <SessionProvider>
      <BrowserRouter>
        <RouteChangeSaver />
        <ForceHomeOnLoad />
        <Routes>
          <Route path="/plasmic-host" element={<PlasmicHost />} />
          <Route path="/dashboard-showcase" element={<DashboardShowcase />} />
          <Route path="/test-home-layout" element={
            <HomeLayout
              left={<p>Left content placeholder</p>}
              right={<p>Right content placeholder</p>}
            />
          } />
          {/* Render the HomePage directly at root; nested routes render into its right frame via Outlet */}
          <Route path="/" element={<HomePage />}>
            <Route index element={<HomeDescription />} />
            <Route path="register" element={<RegisterForm />} />
            <Route path="signin" element={<SignInForm />} />
            <Route path="profile" element={<ProfileSetup />} />
            <Route path="dashboard" element={<DashboardRedirect />} />
            <Route path="mediator" element={<RoleBoundary role="mediator"><MediatorPage /></RoleBoundary>} />
            <Route path="divorcee" element={<RoleBoundary role="divorcee"><DivorceePage /></RoleBoundary>} />
            <Route path="case/:caseId" element={
              <PrivateRoute>
                <CaseOverviewPage />
              </PrivateRoute>
            } />
            <Route path="lawyer" element={<RoleBoundary role="lawyer"><LawyerPage /></RoleBoundary>} />
            <Route path="admin" element={<RoleBoundary role="admin"><AdminPage /></RoleBoundary>} />
            <Route path="admin/roles" element={
              <PrivateRoute>
                <AdminPage />
              </PrivateRoute>
            } />
            <Route path="faq" element={<FAQ />} />
            <Route path="what-to-expect" element={<WhatToExpect />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
          </Route>
          <Route element={<Layout />}>
            <Route path="/landing" element={<LandingPage />} />
            {/* Auth setup routes within app layout (kept as-is); homepage register/signin are nested above */}
            <Route path="/register-legacy" element={<RegistrationForm />} />
            <Route path="/setup" element={<RoleSetupForm />} />
            <Route path="/signin-legacy" element={<SignInPage />} />
            {/* Redirect /home to root to avoid duplicate sources */}
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/cases/:id" element={
              <PrivateRoute>
                <CaseDetailPage />
              </PrivateRoute>
            } />
            <Route path="/cases/:id/uploads" element={
              <PrivateRoute>
                <UploadsPage />
              </PrivateRoute>
            } />
            <Route path="/admin/users" element={
              <PrivateRoute>
                <UserManagementPage />
              </PrivateRoute>
            } />
            <Route path="/plasmic" element={<PlasmicPage />} />
            <Route path="/wizard" element={<DivorceWizardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  </AuthProvider>
);

export default App;

// On initial page load (full reload), ensure we land on HomePage ('/')
function ForceHomeOnLoad() {
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
    // Run only once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If another tab logs out (localStorage cleared), bounce to home
  React.useEffect(() => {
    const handler = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        navigate('/', { replace: true });
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [navigate]);

  return null;
}

function RouteChangeSaver() {
  const location = useLocation();
  React.useEffect(() => {
    saveLastRoute(location.pathname);
  }, [location.pathname]);
  return null;
}


