import React from "react";
import { useNavigate, Outlet, useParams, useLocation } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import NavigationArrows from "../components/NavigationArrows";
import { useAuth } from "../context/AuthContext";
import { getPersonalWelcome } from "../utils/messages";

function LeftDropdownMenu({ user, navigate }) {
  const caseId = localStorage.getItem('activeCaseId') || '4';
  const location = useLocation();
  
  // ALWAYS call hooks in the same order (Rules of Hooks)
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  
  React.useEffect(() => {
    function handleDown(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('mousedown', handleDown); document.removeEventListener('keydown', handleKey); };
  }, []);
  
  React.useEffect(() => { setOpen(false); }, [location.pathname]);
  
  // Auth-only menu items (when not signed in)
  const authItems = [
    { label: 'Sign In', path: '/signin', icon: '🔑' },
    { label: 'Register', path: '/register', icon: '📝' },
  ];
  
  // Show simplified menu if not signed in
  if (!user) {
    return (
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 100 }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="px-4 py-2 rounded-md bg-white/15 hover:bg-white/25 text-sm font-medium border border-white/30 backdrop-blur-sm text-white"
        >
          Menu
        </button>
        {open && (
          <div style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: '#2452b3',
            zIndex: 99,
            padding: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start'
          }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 mb-6 rounded-md bg-white/15 hover:bg-white/25 text-sm font-medium border border-white/30 backdrop-blur-sm text-white"
            >
              ✕ Close Menu
            </button>
            <div className="w-full max-w-sm">
              <div className="px-3 py-2 text-xs font-semibold text-white/70 uppercase tracking-wider">
                Get Started
              </div>
              {authItems.map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="w-full text-left px-4 py-3 text-base transition rounded-sm flex items-center gap-3 hover:bg-white/10 text-white cursor-pointer mb-2"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Comprehensive menu items with all pages in the system (when signed in)
  const menuSections = [
    {
      title: 'Dashboards',
      items: [
        { label: 'My Dashboard', path: user ? `/${user.role}` : '/signin', roles: ['divorcee','mediator','lawyer','admin'], icon: '🏠' },
        { label: 'Divorcee Dashboard', path: '/divorcee', roles: ['divorcee','admin'], icon: '👤' },
        { label: 'Mediator Dashboard', path: '/mediator', roles: ['mediator','admin'], icon: '⚖️' },
        { label: 'Lawyer Dashboard', path: '/lawyer', roles: ['lawyer','admin'], icon: '👔' },
        { label: 'Admin Dashboard', path: '/admin', roles: ['admin'], icon: '👨‍💼' },
      ]
    },
    {
      title: 'Cases',
      items: [
        { label: 'Case Overview', path: `/case/${caseId}`, roles: ['divorcee','mediator','lawyer','admin'], icon: '📋' },
        { label: 'Case Details', path: `/cases/${caseId}`, roles: ['divorcee','mediator','lawyer','admin'], icon: '📄' },
        { label: 'Case Uploads', path: `/cases/${caseId}/uploads`, roles: ['divorcee','mediator','lawyer','admin'], icon: '📎' },
      ]
    },
    {
      title: 'Admin',
      items: [
        { label: 'User Management', path: '/admin/users', roles: ['admin'], icon: '👥' },
        { label: 'Role Management', path: '/admin/roles', roles: ['admin'], icon: '🔐' },
      ]
    },
    {
      title: 'Account',
      items: [
        { label: 'Profile Setup', path: '/profile', roles: ['divorcee','mediator','lawyer','admin'], icon: '⚙️' },
      ]
    }
  ];
  
  // Hooks already called at the top of the function
  // No duplicate hook calls here
  
  return (
    <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 100 }} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="px-4 py-2 rounded-md bg-white/15 hover:bg-white/25 text-sm font-medium border border-white/30 backdrop-blur-sm text-white"
        aria-haspopup="true"
        aria-expanded={open}
      >
        Menu
      </button>
      {open && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: '#2452b3',
          zIndex: 99,
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          overflowY: 'auto'
        }}>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 mb-6 rounded-md bg-white/15 hover:bg-white/25 text-sm font-medium border border-white/30 backdrop-blur-sm text-white"
          >
            ✕ Close Menu
          </button>
          <div className="w-full max-w-md">
            {menuSections.map((section, sectionIdx) => (
              <div key={section.title} className={sectionIdx > 0 ? 'border-t border-white/10 mt-4 pt-4' : 'mb-4'}>
                <div className="px-3 py-2 text-xs font-semibold text-white/70 uppercase tracking-wider">
                  {section.title}
                </div>
                {section.items.map(item => {
                  const allowed = user && item.roles.includes(user.role);
                  const active = location.pathname === item.path;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      disabled={!allowed}
                      onClick={() => { if (allowed) { navigate(item.path); setOpen(false); } }}
                      className={`w-full text-left px-4 py-3 text-base transition rounded-md flex items-center gap-3 mb-1 ${
                        active ? 'bg-white/20 text-white font-semibold ring-1 ring-inset ring-white/30' : ''
                      } ${allowed ? 'hover:bg-white/10 text-white cursor-pointer' : 'text-white/30 cursor-not-allowed opacity-50'}`}
                      title={!allowed ? 'Access restricted to: ' + item.roles.join(', ') : ''}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                      {!allowed && <span className="ml-auto text-sm">🔒</span>}
                    </button>
                  );
                })}
              </div>
            ))}
            {user && (
              <div className="border-t border-white/10 mt-4 pt-4 px-3">
                <div className="text-sm text-white/70">
                  Signed in as: <span className="text-white font-semibold">{user.role}</span>
                </div>
                {user.email && (
                  <div className="text-sm text-white/50 mt-1">{user.email}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#0f1a2b', // darkest background
        // Use uniform padding to create equal spacing to top/bottom/left/right edges
        padding: '48px',
        boxSizing: 'border-box'
      }}
    >
      {/* Two-column container with gap to ensure space between halves */}
      <div
        style={{
          width: '100%',
          maxWidth: '1600px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          // Make the center gap equal to outer padding for consistent spacing
          gap: '48px',
          // Ensure full height between top and bottom padding
          height: 'calc(100vh - 96px)'
        }}
      >
        {/* LEFT PARENT CONTAINER */}
        <div
          style={{
            backgroundColor: '#1b2a45', // lighter than bg
            borderRadius: '14px',
            border: '1px solid rgba(96,165,250,0.25)', // subtle border
            padding: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Fill available height so top/bottom spacing equals outer padding
            height: '100%',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)'
          }}
        >
          {/* LEFT INNER FRAME */}
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#2452b3', // even lighter
              borderRadius: '12px',
              border: '1.5px solid rgba(147,197,253,0.45)',
              boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
              padding: '48px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              boxSizing: 'border-box',
              position: 'relative'
            }}
          >
            {/* Left dropdown menu */}
            <LeftDropdownMenu user={user} navigate={navigate} />
            {/* Back + Forward arrows moved to top-right of LEFT inner frame */}
            <div style={{ position: 'absolute', top: 12, right: 12 }}>
              <LogoutButton />
            </div>
            <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
              <NavigationArrows />
            </div>
            <div style={{ maxWidth: '560px', width: '100%' }}>
              <h1 style={{ fontSize: '3.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>
                ACCORD
              </h1>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, opacity: 0.95, margin: '0 0 24px 0' }}>
                Mediation
              </h2>
              <blockquote style={{ fontSize: '1rem', lineHeight: 1.7, margin: '0 auto 28px', opacity: 0.95 }}>
                In South Africa, Rule 41A requires divorcing spouses to formally consider mediation
                before the courts will hear their case — a requirement now reinforced by Gauteng's 2025
                directive that no trial date will be set without a mediator's report.
              </blockquote>
              {/* Welcome/CTA area replaces buttons if we detect a user (more personal), else show buttons */}
              {user ? (
                <div className="mt-6 text-center">
                  <p className="opacity-95 max-w-md mx-auto text-base sm:text-lg leading-relaxed">
                    {getPersonalWelcome({ role: user.role, name: user.preferredName || user.name })}
                  </p>
                </div>
              ) : (
                <div className="mt-6 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="rounded-full bg-white text-blue-700 font-semibold px-5 py-2 hover:bg-blue-50 transition"
                  >
                    Register
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/signin')}
                    className="rounded-full border border-white/70 text-white px-5 py-2 hover:bg-white/10 transition"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PARENT CONTAINER */}
        <div
          style={{
            backgroundColor: '#1b2a45',
            borderRadius: '14px',
            border: '1px solid rgba(96,165,250,0.25)',
            padding: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)'
          }}
        >
          {/* RIGHT INNER FRAME now hosts routed content via Outlet */}
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#2452b3',
              borderRadius: '12px',
              border: '1.5px solid rgba(147,197,253,0.45)',
              boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
              position: 'relative',
              padding: '48px'
            }}
            className="text-white"
          >
            {/* Duplicate arrows in RIGHT inner frame top-right */}
            <div style={{ position: 'absolute', top: 12, right: 12 }}>
              <NavigationArrows />
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
