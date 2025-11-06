const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authenticateUser = require('../middleware/authenticateUser');

/**
 * Calculate IPV (Intimate Partner Violence) risk flags
 * Based on NABFAM/AFCC screening standards
 * Returns count of high-risk indicators
 */
function calculateIPVFlags(safetyData) {
  let flags = 0;
  
  // Flag 1: Fear during conflicts (often/always)
  if (safetyData.safetyFearDuringConflict === 'often' || safetyData.safetyFearDuringConflict === 'always') {
    flags++;
  }
  
  // Flag 2: Physical violence (ongoing or recent)
  if (safetyData.safetyPhysicalViolence === 'ongoing') {
    flags += 2; // Weighted higher for ongoing violence
  } else if (safetyData.safetyPhysicalViolence === 'past') {
    flags++;
  }
  
  // Flag 3: Threats/intimidation (frequently)
  if (safetyData.safetyThreatsOrIntimidation === 'frequently') {
    flags++;
  }
  
  // Flag 4: Financial control (yes, significantly)
  if (safetyData.safetyFinancialControl === 'yes, significantly') {
    flags++;
  }
  
  // Flag 5: Social isolation (frequently)
  if (safetyData.safetySocialIsolation === 'frequently') {
    flags++;
  }
  
  // Flag 6: Decision control (most of the time/always)
  if (safetyData.safetyDecisionControl === 'most of the time' || safetyData.safetyDecisionControl === 'always') {
    flags++;
  }
  
  // Flag 7: Emotional abuse (often/very often)
  if (safetyData.safetyEmotionalAbuse === 'often' || safetyData.safetyEmotionalAbuse === 'very often') {
    flags++;
  }
  
  // Flag 8: Children witness violence (several times/frequently)
  if (safetyData.safetyChildrenWitness === 'several times' || safetyData.safetyChildrenWitness === 'frequently') {
    flags++;
  }
  
  // Flag 9: Currently unsafe
  if (safetyData.safetyCurrentlySafe === 'sometimes unsafe' || safetyData.safetyCurrentlySafe === 'no, i do not feel safe') {
    flags += 2; // Weighted higher for current danger
  }
  
  return flags;
}

/**
 * Calculate power imbalance score
 * Combines financial control and decision-making autonomy
 * Returns score 0-10 (0 = balanced, 10 = severe imbalance)
 */
function calculatePowerImbalance(safetyData) {
  let score = 0;
  
  // Financial control contribution (0-5 points)
  switch (safetyData.safetyFinancialControl) {
    case 'yes, significantly':
      score += 5;
      break;
    case 'sometimes':
      score += 2;
      break;
  }
  
  // Decision control contribution (0-5 points)
  switch (safetyData.safetyDecisionControl) {
    case 'always':
      score += 5;
      break;
    case 'most of the time':
      score += 3;
      break;
    case 'sometimes':
      score += 1;
      break;
  }
  
  return score;
}

/**
 * Determine mediation suitability based on risk assessment
 * Returns recommendation for mediation process adaptation
 */
function determineSuitability(ipvFlags, powerImbalance) {
  // High risk: 5+ IPV flags OR ongoing physical violence OR power imbalance >= 8
  if (ipvFlags >= 5 || powerImbalance >= 8) {
    return {
      level: 'high_risk',
      recommendation: 'shuttle_mediation',
      processAdaptations: [
        'Conduct separate intake sessions',
        'Use shuttle mediation (no joint sessions)',
        'Allow support person to attend',
        'Provide extended interview time',
        'Consider referral to specialized DV mediator',
        'Ensure safety planning before any contact'
      ],
      supportResources: [
        'GBV Command Centre: 0800 428 428',
        'POWA (People Opposing Women Abuse): 011 642 4345',
        'Families SA: 0861 435 787',
        'Legal Aid SA: 0800 110 110'
      ]
    };
  }
  
  // Moderate risk: 3-4 IPV flags OR power imbalance 5-7
  if (ipvFlags >= 3 || powerImbalance >= 5) {
    return {
      level: 'moderate_risk',
      recommendation: 'adapted_mediation',
      processAdaptations: [
        'Conduct separate intake sessions',
        'Monitor power dynamics closely',
        'Allow breaks if either party requests',
        'Provide clear ground rules for respectful communication',
        'Consider caucusing (separate meetings) if tensions arise'
      ],
      supportResources: [
        'FAMSA counseling services',
        'Legal Aid SA: 0800 110 110'
      ]
    };
  }
  
  // Low risk: 0-2 IPV flags AND power imbalance < 5
  return {
    level: 'standard',
    recommendation: 'standard_mediation',
    processAdaptations: [
      'Standard joint mediation appropriate',
      'Monitor communication patterns',
      'Provide standard ground rules'
    ],
    supportResources: []
  };
}

/**
 * POST /api/users/risk-assessment
 * Store safety assessment data and calculate risk scores
 * Requires authentication
 */
router.post('/risk-assessment', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const safetyData = req.body;

  try {
    // Calculate risk indicators
    const ipvFlags = calculateIPVFlags(safetyData);
    const powerImbalance = calculatePowerImbalance(safetyData);
    const suitability = determineSuitability(ipvFlags, powerImbalance);

    // Prepare risk assessment object
    const riskAssessment = {
      safetyData,
      ipvFlags,
      powerImbalance,
      suitability: suitability.level,
      recommendation: suitability.recommendation,
      processAdaptations: suitability.processAdaptations,
      supportResources: suitability.supportResources,
      assessedAt: new Date().toISOString(),
      version: '1.0' // For future algorithm updates
    };

    // Store in app_users.risk_assessment JSONB column
    const query = `
      UPDATE app_users 
      SET risk_assessment = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, risk_assessment
    `;
    
    const result = await pool.query(query, [JSON.stringify(riskAssessment), userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'User not found' 
      });
    }

    // Return assessment results (excluding raw safety data for privacy)
    res.json({
      ok: true,
      assessment: {
        ipvFlags,
        powerImbalance,
        suitability: suitability.level,
        recommendation: suitability.recommendation,
        processAdaptations: suitability.processAdaptations,
        supportResources: suitability.supportResources
      }
    });

  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to process risk assessment',
      details: error.message 
    });
  }
});

/**
 * GET /api/users/risk-assessment
 * Retrieve stored risk assessment for authenticated user
 */
router.get('/risk-assessment', authenticateUser, async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
      SELECT risk_assessment 
      FROM app_users 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0 || !result.rows[0].risk_assessment) {
      return res.json({ 
        ok: true, 
        assessment: null 
      });
    }

    const riskAssessment = result.rows[0].risk_assessment;

    // Return assessment (excluding raw safety data for privacy)
    res.json({
      ok: true,
      assessment: {
        ipvFlags: riskAssessment.ipvFlags,
        powerImbalance: riskAssessment.powerImbalance,
        suitability: riskAssessment.suitability,
        recommendation: riskAssessment.recommendation,
        processAdaptations: riskAssessment.processAdaptations,
        supportResources: riskAssessment.supportResources,
        assessedAt: riskAssessment.assessedAt
      }
    });

  } catch (error) {
    console.error('Risk assessment retrieval error:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to retrieve risk assessment',
      details: error.message 
    });
  }
});

/**
 * GET /api/users/:userId/risk-assessment
 * Retrieve risk assessment for a specific user (mediator/admin access)
 * Returns redacted version for privacy
 */
router.get('/:userId/risk-assessment', authenticateUser, async (req, res) => {
  const requestingUser = req.user;
  const targetUserId = req.params.userId;

  try {
    // Only mediators and admins can view other users' risk assessments
    if (requestingUser.role !== 'mediator' && requestingUser.role !== 'admin') {
      return res.status(403).json({ 
        ok: false, 
        error: 'Insufficient permissions' 
      });
    }

    const query = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.risk_assessment,
        cp.case_id
      FROM app_users u
      LEFT JOIN case_participants cp ON u.id = cp.user_id
      WHERE u.id = $1
    `;
    
    const result = await pool.query(query, [targetUserId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'User not found' 
      });
    }

    const user = result.rows[0];
    const riskAssessment = user.risk_assessment;

    if (!riskAssessment) {
      return res.json({ 
        ok: true, 
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          caseId: user.case_id
        },
        assessment: null 
      });
    }

    // Return redacted assessment (NO raw safety data for privacy)
    res.json({
      ok: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        caseId: user.case_id
      },
      assessment: {
        ipvFlags: riskAssessment.ipvFlags,
        powerImbalance: riskAssessment.powerImbalance,
        suitability: riskAssessment.suitability,
        recommendation: riskAssessment.recommendation,
        processAdaptations: riskAssessment.processAdaptations,
        supportResources: riskAssessment.supportResources,
        assessedAt: riskAssessment.assessedAt,
        // Include ONLY if user explicitly requested support
        needsSupport: riskAssessment.safetyData?.safetyNeedSupport === 'yes, please'
      }
    });

  } catch (error) {
    console.error('Risk assessment retrieval error:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to retrieve risk assessment',
      details: error.message 
    });
  }
});

module.exports = router;
