import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const fixture = new URL('./database.mjs', import.meta.url).href;
export async function resolve(specifier, context, nextResolve) {
  const resolved = new URL(specifier, context.parentURL || import.meta.url).href;
  if (resolved.endsWith('/backend/src/db.js')) return { url: fixture, shortCircuit: true };
  if (resolved.endsWith('/backend/src/lib/supabaseClient.js')) return { url: new URL('./provider-fixture.mjs', import.meta.url).href, shortCircuit: true };
  if (resolved.endsWith('/backend/src/utils/notifications.js')) return { url: new URL('./notification-fixture.mjs', import.meta.url).href, shortCircuit: true };
  if (['express', 'jsonwebtoken', 'uuid'].includes(specifier)) {
    return { url: pathToFileURL(require.resolve(specifier)).href, shortCircuit: true };
  }
  if (resolved.includes('/backend/src/') && ![
    '/routes/caseOverview.js', '/middleware/authenticateUser.js', '/security/pilotAccess.js',
    '/routes/participants.js','/routes/caseParticipants.js','/routes/cases.js','/security/membership.js','/utils/tx.js',
    '/routes/users.js','/lib/activityLogger.js'
  ].some(suffix => resolved.endsWith(suffix))) {
    throw new Error('Unapproved application module in acceptance test');
  }
  return nextResolve(specifier, context);
}
