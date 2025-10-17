import { Router } from 'express';

const router = Router();

// Create a new settlement session
router.post('/', async (req, res) => {
  try {
    const { 
      mode, 
      party1_name, 
      party2_name, 
      mediator_name, 
      case_reference, 
      case_id,
      current_party = 'party1' 
    } = req.body;

    // Generate session ID
    const sessionId = `DW-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    const { data, error } = await req.supabase
      .from('settlement_sessions')
      .insert({
        id: sessionId,
        mode: mode || 'individual',
        party1_name,
        party2_name: party2_name || null,
        mediator_name: mediator_name || null,
        case_reference: case_reference || null,
        case_id: case_id || null,
        current_party,
        status: 'active',
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating settlement session:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error creating settlement session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});// Get settlement sessions for a case
router.get('/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const { data, error } = await req.supabase
      .from('settlement_sessions')
      .select(`
        *,
        party_a:profiles!settlement_sessions_party_a_id_fkey(id, email, full_name),
        party_b:profiles!settlement_sessions_party_b_id_fkey(id, email, full_name),
        case:cases(id, title)
      `)
      .eq('case_id', caseId);

    if (error) {
      console.error('Error fetching settlement sessions:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching settlement sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific settlement session
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const { data, error } = await req.supabase
      .from('settlement_sessions')
      .select(`
        *,
        party_a:profiles!settlement_sessions_party_a_id_fkey(id, email, full_name),
        party_b:profiles!settlement_sessions_party_b_id_fkey(id, email, full_name),
        case:cases(id, title)
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching settlement session:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching settlement session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update settlement session status
router.patch('/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;
    
    const { data, error } = await req.supabase
      .from('settlement_sessions')
      .update({ status })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating settlement session status:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating settlement session status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update settlement session (general update)
router.patch('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updates = req.body;
    
    const { data, error } = await req.supabase
      .from('settlement_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating settlement session:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating settlement session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save form section data
router.post('/:sessionId/form-section', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { section_name, section_data, party_id } = req.body;
    
    const { data, error } = await req.supabase
      .from('session_form_sections')
      .upsert({
        session_id: sessionId,
        section_name,
        section_data,
        party_id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving form section:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error saving form section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get form sections for a session
router.get('/:sessionId/form-sections', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const { data, error } = await req.supabase
      .from('session_form_sections')
      .select('*')
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error fetching form sections:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching form sections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced endpoint: Get form sections for a session
router.get('/:sessionId/sections', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const { data, error } = await req.supabase
      .from('session_form_sections')
      .select('*')
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error fetching form sections:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching form sections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced endpoint: Save form section data
router.post('/:sessionId/sections', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { section_name, form_data } = req.body;
    
    const { data, error } = await req.supabase
      .from('session_form_sections')
      .upsert({
        session_id: sessionId,
        section_name,
        form_data,
        updated_by: req.user.id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving form section:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error saving form section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle approvals
router.post('/:sessionId/approve', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { section_name, party_id } = req.body;
    
    const { data, error } = await req.supabase
      .from('section_approvals')
      .upsert({
        session_id: sessionId,
        section_name,
        party_id,
        approved: true,
        approved_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving approval:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error saving approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced endpoint: Handle approvals
router.post('/:sessionId/approvals', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { section_name, party, approved, notes } = req.body;
    
    const { data, error } = await req.supabase
      .from('section_approvals')
      .upsert({
        session_id: sessionId,
        section_name,
        party,
        approved,
        approved_at: approved ? new Date().toISOString() : null,
        notes: notes || null,
        approved_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving approval:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error saving approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced endpoint: Get approvals for a session
router.get('/:sessionId/approvals', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const { data, error } = await req.supabase
      .from('section_approvals')
      .select('*')
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error fetching approvals:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle conflicts
router.post('/:sessionId/conflict', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { section_name, party_id, conflict_details } = req.body;
    
    const { data, error } = await req.supabase
      .from('section_conflicts')
      .insert({
        session_id: sessionId,
        section_name,
        party_id,
        conflict_details,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving conflict:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error saving conflict:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced endpoint: Handle conflicts
router.post('/:sessionId/conflicts', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { section_name, conflict_reason, party1_position, party2_position } = req.body;
    
    const { data, error } = await req.supabase
      .from('section_conflicts')
      .insert({
        session_id: sessionId,
        section_name,
        conflict_reason,
        party1_position: party1_position || null,
        party2_position: party2_position || null,
        reported_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving conflict:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error saving conflict:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced endpoint: Get conflicts for a session
router.get('/:sessionId/conflicts', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const { data, error } = await req.supabase
      .from('section_conflicts')
      .select('*')
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error fetching conflicts:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching conflicts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat functionality
router.post('/:sessionId/chat', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, sender_id } = req.body;
    
    const { data, error } = await req.supabase
      .from('session_chat_logs')
      .insert({
        session_id: sessionId,
        message,
        sender_id,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving chat message:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chat history
router.get('/:sessionId/chat', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const { data, error } = await req.supabase
      .from('session_chat_logs')
      .select(`
        *,
        sender:profiles(id, email, full_name)
      `)
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;