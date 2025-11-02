/**
 * Tenant Isolation Middleware
 * 
 * Ensures data isolation between organizations (multi-tenant security)
 * Automatically filters queries by organization_id
 */

/**
 * Middleware to ensure tenant isolation
 * Attaches organization_id to request object from authenticated user
 * 
 * Must be used AFTER authentication middleware
 */
function ensureTenantIsolation(req, res, next) {
  // Skip for admin users viewing all organizations
  if (req.user?.role === 'admin' && req.query.viewAll === 'true') {
    req.skipTenantFilter = true;
    return next();
  }
  
  // Get organization_id from authenticated user
  const organizationId = req.user?.organization_id;
  
  if (!organizationId) {
    // User doesn't have an organization - might be a new user
    console.warn(`User ${req.user?.user_id} has no organization_id`);
    
    // Allow admins without org for initial setup
    if (req.user?.role === 'admin') {
      req.skipTenantFilter = true;
      return next();
    }
    
    return res.status(403).json({
      ok: false,
      error: 'User not associated with an organization'
    });
  }
  
  // Attach organization_id to request for use in route handlers
  req.organizationId = organizationId;
  req.skipTenantFilter = false;
  
  next();
}

/**
 * Add organization filter to SQL WHERE clause
 * 
 * Usage in queries:
 *   const filter = addOrgFilter(req, 'table_alias');
 *   const query = `SELECT * FROM cases c WHERE ${filter}`;
 */
function addOrgFilter(req, tableAlias = '') {
  if (req.skipTenantFilter) {
    return '1=1'; // No filter for admins viewing all
  }
  
  const prefix = tableAlias ? `${tableAlias}.` : '';
  return `${prefix}organization_id = '${req.organizationId}'`;
}

/**
 * Ensure organization_id is set on INSERT/UPDATE
 * 
 * Usage:
 *   const data = ensureOrgId(req, { name: 'John', email: 'john@example.com' });
 *   // Returns: { name: 'John', email: 'john@example.com', organization_id: '...' }
 */
function ensureOrgId(req, data) {
  if (req.skipTenantFilter) {
    return data; // Don't add org_id for cross-org operations
  }
  
  return {
    ...data,
    organization_id: req.organizationId
  };
}

/**
 * Verify user has access to a specific resource
 * 
 * Usage:
 *   await verifyOrgAccess(req, pool, 'cases', caseId);
 */
async function verifyOrgAccess(req, pool, tableName, resourceId) {
  if (req.skipTenantFilter) {
    return true; // Admins can access all
  }
  
  const result = await pool.query(
    `SELECT organization_id FROM ${tableName} WHERE id = $1`,
    [resourceId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Resource not found');
  }
  
  if (result.rows[0].organization_id !== req.organizationId) {
    throw new Error('Access denied: Resource belongs to different organization');
  }
  
  return true;
}

/**
 * Get organization details for current request
 */
async function getOrganization(req, pool) {
  if (!req.organizationId) {
    return null;
  }
  
  const result = await pool.query(
    'SELECT * FROM organizations WHERE id = $1 AND deleted_at IS NULL',
    [req.organizationId]
  );
  
  return result.rows[0] || null;
}

/**
 * Check if organization has reached resource limit
 * 
 * Usage:
 *   const canCreate = await checkResourceLimit(req, pool, 'cases', 'max_active_cases');
 */
async function checkResourceLimit(req, pool, resourceType, limitField) {
  const org = await getOrganization(req, pool);
  
  if (!org) {
    return false;
  }
  
  const limit = org[limitField];
  
  // NULL means unlimited (enterprise tier)
  if (limit === null) {
    return true;
  }
  
  // Count current resources
  let count = 0;
  
  switch (resourceType) {
    case 'cases':
      const casesResult = await pool.query(
        'SELECT COUNT(*) FROM cases WHERE organization_id = $1 AND status != $2',
        [req.organizationId, 'resolved']
      );
      count = parseInt(casesResult.rows[0].count);
      break;
      
    case 'mediators':
      const mediatorsResult = await pool.query(
        'SELECT COUNT(*) FROM app_users WHERE organization_id = $1 AND role = $2',
        [req.organizationId, 'mediator']
      );
      count = parseInt(mediatorsResult.rows[0].count);
      break;
      
    case 'storage':
      const storageResult = await pool.query(
        'SELECT storage_used_mb FROM organizations WHERE id = $1',
        [req.organizationId]
      );
      count = storageResult.rows[0]?.storage_used_mb || 0;
      break;
  }
  
  return count < limit;
}

module.exports = {
  ensureTenantIsolation,
  addOrgFilter,
  ensureOrgId,
  verifyOrgAccess,
  getOrganization,
  checkResourceLimit
};
