export const AppRoles = ['admin', 'mediator', 'divorcee', 'lawyer'];

export function roleToPath(role) {
  return role === 'admin' ? '/admin'
    : role === 'mediator' ? '/mediator'
    : role === 'divorcee' ? '/divorcee'
    : '/lawyer';
}

export async function getSessionAndProfile() {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    let profile = null;
    if (userStr) {
      const u = JSON.parse(userStr);
      profile = {
        id: u.id,
        email: u.email,
        preferred_name: u.preferredName || u.name || null,
        role: u.role || 'divorcee',
      };
    }
    // If you want to validate with backend later, do it here.
    return { session: token ? { access_token: token } : null, profile };
  } catch {
    return { session: null, profile: null };
  }
}
