/**
 * Document Comments API Routes
 * Endpoints for adding, retrieving, updating, and deleting comments on uploaded documents
 */

import { Router } from 'express';
import { supabase, requireSupabaseOr500 } from '../lib/supabaseClient.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = Router();

// Ensure supabase client is configured
router.use((req, res, next) => {
  if (!supabase) return requireSupabaseOr500(res);
  return next();
});

// All routes require authentication
router.use(authenticateUser);

/**
 * GET /api/comments/upload/:uploadId
 * Get all comments for a specific upload
 */
router.get('/upload/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Fetch upload to check permissions
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .select('id, user_id, case_id')
      .eq('id', uploadId)
      .single();

    if (uploadError || !upload) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Upload not found' 
      });
    }

    // Check if user has access to this upload
    const isOwner = upload.user_id === userId;
    const isMediatorOrAdmin = ['mediator', 'admin'].includes(userRole);

    if (!isOwner && !isMediatorOrAdmin) {
      return res.status(403).json({ 
        ok: false, 
        error: 'Unauthorized to view comments on this document' 
      });
    }

    // Build query - filter internal comments for non-mediators
    let query = supabase
      .from('document_comments')
      .select(`
        *,
        users!inner(id, email, full_name, role)
      `)
      .eq('upload_id', uploadId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    // Non-mediators cannot see internal comments
    if (!isMediatorOrAdmin) {
      query = query.eq('is_internal', false);
    }

    const { data: comments, error: commentsError } = await query;

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to fetch comments' 
      });
    }

    return res.json({
      ok: true,
      comments: comments || [],
      uploadId
    });

  } catch (error) {
    console.error('Error in GET /comments/upload/:uploadId:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/comments
 * Create a new comment on an upload
 */
router.post('/', async (req, res) => {
  try {
    const { uploadId, commentText, commentType = 'general', isInternal = false } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validation
    if (!uploadId || !commentText || commentText.trim() === '') {
      return res.status(400).json({ 
        ok: false, 
        error: 'Upload ID and comment text are required' 
      });
    }

    // Fetch upload to check permissions
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .select('id, user_id, case_id')
      .eq('id', uploadId)
      .single();

    if (uploadError || !upload) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Upload not found' 
      });
    }

    // Check if user has access to this upload
    const isOwner = upload.user_id === userId;
    const isMediatorOrAdmin = ['mediator', 'admin'].includes(userRole);

    if (!isOwner && !isMediatorOrAdmin) {
      return res.status(403).json({ 
        ok: false, 
        error: 'Unauthorized to comment on this document' 
      });
    }

    // Only mediators/admins can create internal comments
    const finalIsInternal = isMediatorOrAdmin ? isInternal : false;

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from('document_comments')
      .insert({
        upload_id: uploadId,
        user_id: userId,
        comment_text: commentText.trim(),
        comment_type: commentType,
        is_internal: finalIsInternal
      })
      .select(`
        *,
        users!inner(id, email, full_name, role)
      `)
      .single();

    if (commentError) {
      console.error('Error creating comment:', commentError);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to create comment',
        details: commentError.message 
      });
    }

    // TODO: Send notification to upload owner and case mediators
    // (Implement notification service integration)

    return res.status(201).json({
      ok: true,
      message: 'Comment created successfully',
      comment
    });

  } catch (error) {
    console.error('Error in POST /comments:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PATCH /api/comments/:commentId
 * Update an existing comment (edit text only)
 */
router.patch('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { commentText } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validation
    if (!commentText || commentText.trim() === '') {
      return res.status(400).json({ 
        ok: false, 
        error: 'Comment text is required' 
      });
    }

    // Fetch comment
    const { data: comment, error: fetchError } = await supabase
      .from('document_comments')
      .select('*')
      .eq('id', commentId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !comment) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Comment not found' 
      });
    }

    // Check permissions - only comment author or admin can edit
    const isAuthor = comment.user_id === userId;
    const isAdmin = userRole === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ 
        ok: false, 
        error: 'Unauthorized to edit this comment' 
      });
    }

    // Update comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('document_comments')
      .update({ 
        comment_text: commentText.trim()
      })
      .eq('id', commentId)
      .select(`
        *,
        users!inner(id, email, full_name, role)
      `)
      .single();

    if (updateError) {
      console.error('Error updating comment:', updateError);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to update comment' 
      });
    }

    return res.json({
      ok: true,
      message: 'Comment updated successfully',
      comment: updatedComment
    });

  } catch (error) {
    console.error('Error in PATCH /comments/:commentId:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * DELETE /api/comments/:commentId
 * Soft delete a comment
 */
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Fetch comment
    const { data: comment, error: fetchError } = await supabase
      .from('document_comments')
      .select('*')
      .eq('id', commentId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !comment) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Comment not found' 
      });
    }

    // Check permissions - only comment author or admin can delete
    const isAuthor = comment.user_id === userId;
    const isAdmin = userRole === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ 
        ok: false, 
        error: 'Unauthorized to delete this comment' 
      });
    }

    // Soft delete comment
    const { error: deleteError } = await supabase
      .from('document_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to delete comment' 
      });
    }

    return res.json({
      ok: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /comments/:commentId:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/comments/case/:caseId
 * Get all comments for all uploads in a case (mediator/admin only)
 */
router.get('/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const userRole = req.user.role;

    // Only mediators and admins can view all case comments
    if (!['mediator', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        ok: false, 
        error: 'Unauthorized - mediator or admin access required' 
      });
    }

    // Get all uploads for this case
    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('id')
      .eq('case_id', caseId);

    if (uploadsError) {
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to fetch uploads' 
      });
    }

    const uploadIds = uploads.map(u => u.id);

    if (uploadIds.length === 0) {
      return res.json({
        ok: true,
        comments: [],
        caseId
      });
    }

    // Fetch all comments for these uploads
    const { data: comments, error: commentsError } = await supabase
      .from('document_comments')
      .select(`
        *,
        users!inner(id, email, full_name, role),
        uploads!inner(id, doc_type, file_name)
      `)
      .in('upload_id', uploadIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('Error fetching case comments:', commentsError);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to fetch comments' 
      });
    }

    return res.json({
      ok: true,
      comments: comments || [],
      caseId
    });

  } catch (error) {
    console.error('Error in GET /comments/case/:caseId:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;
