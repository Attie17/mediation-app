import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrandingProvider } from './context/BrandingContext';
import { SessionProvider } from './contexts/SessionContext';
import DevAutoLogin from './components/DevAutoLogin';
import ErrorBoundary from './components/ErrorBoundary';

// Core components (loaded immediately)
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import SignInForm from './pages/SignInForm';
import RegisterForm from './pages/RegisterForm';
import HomeDescription from './pages/HomeDescription';
import DashboardRedirect from './routes/DashboardRedirect';
import RoleBoundary from './routes/RoleBoundary';
import { saveLastRoute } from './lib/storage';
import LoadingScreen from './components/LoadingScreen';

// Lazy-loaded pages (code splitting)
const RegistrationForm = lazy(() => import('./pages/RegistrationForm'));
const RoleSetupForm = lazy(() => import('./pages/RoleSetupNew'));
const ComprehensiveIntakeForm = lazy(() => import('./pages/ComprehensiveIntakeForm'));
const AssetsDeclarationForm = lazy(() => import('./pages/AssetsDeclarationForm'));
const LiabilitiesDeclarationForm = lazy(() => import('./pages/LiabilitiesDeclarationForm'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Layout = lazy(() => import('./components/Layout'));
const CaseDetailPage = lazy(() => import('./pages/CaseDetailPage'));
const UploadsPage = lazy(() => import('./pages/UploadsPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const SystemHealthPage = lazy(() => import('./pages/admin/SystemHealthPage'));
const InviteUserPage = lazy(() => import('./pages/admin/InviteUserPage'));
const RolesPermissionsPage = lazy(() => import('./pages/admin/RolesPermissionsPage'));
const SystemSettingsPage = lazy(() => import('./pages/admin/SystemSettingsPage'));
const OrganizationManagementPage = lazy(() => import('./routes/admin/OrganizationManagementPage'));
const OrganizationDetailPage = lazy(() => import('./routes/admin/OrganizationDetailPage'));
const CaseAssignmentPage = lazy(() => import('./routes/admin/CaseAssignmentPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const PlasmicPage = lazy(() => import('./pages/PlasmicPage'));
const HomeLayout = lazy(() => import('./components/HomeLayout'));
const PlasmicHost = lazy(() => import('./pages/PlasmicHost'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AcceptInvitationPage = lazy(() => import('./pages/AcceptInvitationPage'));
const MediatorPage = lazy(() => import('./routes/mediator'));
const MediatorDocumentReview = lazy(() => import('./routes/mediator/DocumentReview'));
const MediatorDocuments = lazy(() => import('./routes/mediator/Documents'));
const MediatorSessionScheduler = lazy(() => import('./routes/mediator/SessionScheduler'));
const MediatorCasesList = lazy(() => import('./routes/mediator/CasesList'));
const MediatorSessionsList = lazy(() => import('./routes/mediator/SessionsList'));
const MediatorContacts = lazy(() => import('./routes/mediator/Contacts'));
const MediatorParticipantProgress = lazy(() => import('./routes/mediator/ParticipantProgress'));
const MediatorInvite = lazy(() => import('./routes/mediator/invite'));
const MediatorReports = lazy(() => import('./routes/mediator/reports'));
const DivorceePage = lazy(() => import('./routes/divorcee'));
const MessagesPage = lazy(() => import('./pages/divorcee/MessagesPage'));
const LawyerPage = lazy(() => import('./routes/lawyer'));
const AdminPage = lazy(() => import('./routes/admin'));
const CaseOverviewPage = lazy(() => import('./components/case/CaseOverviewPage'));
const DashboardShowcase = lazy(() => import('./pages/DashboardShowcase'));
const DivorceWizardPage = lazy(() => import('./pages/DivorceWizardPage'));
const FAQ = lazy(() => import('./pages/FAQ'));
const WhatToExpect = lazy(() => import('./pages/WhatToExpect'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const DivorceeIntakeForm = lazy(() => import('./components/DivorceeIntakeForm'));

// AuthSetup no longer needed - AuthContext handles 401 via event listener

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <BrandingProvider>
        <SessionProvider>
          <BrowserRouter>
            <DevAutoLogin />
            <RouteChangeSaver />
            <ForceHomeOnLoad />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid #334155',
                  borderRadius: '0.5rem',
                },
              }}
            />
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/plasmic-host" element={<PlasmicHost />} />
          <Route path="/dashboard-showcase" element={<DashboardShowcase />} />
          <Route path="/test-home-layout" element={
            <HomeLayout
              left={<p>Left content placeholder</p>}
              right={<p>Right content placeholder</p>}
            />
          } />
          {/* Public invitation acceptance route */}
          <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />
          {/* Render the HomePage directly at root; nested routes render into its right frame via Outlet */}
          <Route path="/" element={<HomePage />}>
            <Route index element={<HomeDescription />} />
            <Route path="register" element={<RegisterForm />} />
            <Route path="signin" element={<SignInForm />} />
            <Route path="profile" element={<ProfileSetup />} />
            <Route path="dashboard" element={<DashboardRedirect />} />
            <Route path="mediator" element={<RoleBoundary role="mediator"><MediatorPage /></RoleBoundary>} />
            <Route path="mediator/cases" element={<RoleBoundary role="mediator"><MediatorCasesList /></RoleBoundary>} />
            <Route path="mediator/sessions" element={<RoleBoundary role="mediator"><MediatorSessionsList /></RoleBoundary>} />
            <Route path="mediator/contacts" element={<RoleBoundary role="mediator"><MediatorContacts /></RoleBoundary>} />
            <Route path="mediator/progress/:caseId" element={<RoleBoundary role="mediator"><MediatorParticipantProgress /></RoleBoundary>} />
            <Route path="mediator/documents" element={<RoleBoundary role="mediator"><MediatorDocuments /></RoleBoundary>} />
            <Route path="mediator/review" element={<RoleBoundary role="mediator"><MediatorDocumentReview /></RoleBoundary>} />
            <Route path="mediator/schedule" element={<RoleBoundary role="mediator"><MediatorSessionScheduler /></RoleBoundary>} />
            <Route path="mediator/invite" element={<RoleBoundary role="mediator"><MediatorInvite /></RoleBoundary>} />
            <Route path="mediator/reports" element={<RoleBoundary role="mediator"><MediatorReports /></RoleBoundary>} />
            <Route path="divorcee" element={<RoleBoundary role="divorcee"><DivorceePage /></RoleBoundary>} />
            <Route path="divorcee/messages" element={<RoleBoundary role="divorcee"><MessagesPage /></RoleBoundary>} />
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
            <Route path="intake" element={
              <PrivateRoute>
                <DivorceeIntakeForm />
              </PrivateRoute>
            } />
            <Route path="cases/:id" element={
              <PrivateRoute>
                <CaseDetailPage />
              </PrivateRoute>
            } />
            <Route path="cases/:id/uploads" element={
              <PrivateRoute>
                <UploadsPage />
              </PrivateRoute>
            } />
          </Route>
          
          {/* Full-page admin routes (no Layout wrapper) */}
          <Route path="/admin/organizations" element={
            <PrivateRoute>
              <OrganizationManagementPage />
            </PrivateRoute>
          } />
          <Route path="/admin/organizations/:id" element={
            <PrivateRoute>
              <OrganizationDetailPage />
            </PrivateRoute>
          } />
          <Route path="/admin/case-assignments" element={
            <PrivateRoute>
              <CaseAssignmentPage />
            </PrivateRoute>
          } />
          
          {/* Setup routes - standalone without Layout wrapper */}
          <Route path="/setup" element={<ComprehensiveIntakeForm />} />
          <Route path="/intake" element={<ComprehensiveIntakeForm />} />
          <Route path="/assets" element={<AssetsDeclarationForm />} />
          <Route path="/liabilities" element={<LiabilitiesDeclarationForm />} />
          <Route path="/role-setup" element={<RoleSetupForm />} />
          
          <Route element={<Layout />}>
            <Route path="/landing" element={<LandingPage />} />
            {/* Auth setup routes within app layout (kept as-is); homepage register/signin are nested above */}
            <Route path="/register-legacy" element={<RegistrationForm />} />
            {/* Redirect /home to root to avoid duplicate sources */}
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/admin/users" element={
              <PrivateRoute>
                <UserManagementPage />
              </PrivateRoute>
            } />
            <Route path="/admin/system-health" element={
              <PrivateRoute>
                <SystemHealthPage />
              </PrivateRoute>
            } />
            <Route path="/admin/invites" element={
              <PrivateRoute>
                <InviteUserPage />
              </PrivateRoute>
            } />
            <Route path="/admin/roles" element={
              <PrivateRoute>
                <RolesPermissionsPage />
              </PrivateRoute>
            } />
            <Route path="/admin/settings" element={
              <PrivateRoute>
                <SystemSettingsPage />
              </PrivateRoute>
            } />
            <Route path="/plasmic" element={<PlasmicPage />} />
            <Route path="/wizard" element={<DivorceWizardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
            </Routes>
          </Suspense>
      </BrowserRouter>
    </SessionProvider>
  </BrandingProvider>
  </AuthProvider>
  </ErrorBoundary>
);

export default App;

// Redirect legacy /home route to the root shell, but allow direct deep links
function ForceHomeOnLoad() {
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (location.pathname === '/home') {
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

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


