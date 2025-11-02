-- Document Comments System
-- Allows mediators and participants to comment on uploaded documents

-- Main comments table (using bigint for upload_id to match uploads.id)
CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id BIGINT NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'general' CHECK (comment_type IN ('general', 'issue', 'question', 'approval', 'rejection')),
    is_internal BOOLEAN DEFAULT FALSE, -- True if comment is only visible to mediators
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ -- Soft delete
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_document_comments_upload 
ON document_comments(upload_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_document_comments_user 
ON document_comments(user_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Comments for notifications/mentions
CREATE INDEX IF NOT EXISTS idx_document_comments_type 
ON document_comments(comment_type, created_at DESC)
WHERE deleted_at IS NULL;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_comments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.comment_text != OLD.comment_text THEN
        NEW.edited_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_document_comments_timestamp ON document_comments;

CREATE TRIGGER update_document_comments_timestamp
BEFORE UPDATE ON document_comments
FOR EACH ROW
EXECUTE FUNCTION update_document_comments_timestamp();

-- Add comment count to uploads table (denormalized for performance)
ALTER TABLE uploads 
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Function to update comment count
CREATE OR REPLACE FUNCTION update_upload_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
        UPDATE uploads 
        SET comment_count = comment_count + 1 
        WHERE id = NEW.upload_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            -- Comment was soft deleted
            UPDATE uploads 
            SET comment_count = comment_count - 1 
            WHERE id = NEW.upload_id;
        ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
            -- Comment was restored
            UPDATE uploads 
            SET comment_count = comment_count + 1 
            WHERE id = NEW.upload_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE uploads 
        SET comment_count = comment_count - 1 
        WHERE id = OLD.upload_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_upload_comment_count_trigger ON document_comments;

CREATE TRIGGER update_upload_comment_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON document_comments
FOR EACH ROW
EXECUTE FUNCTION update_upload_comment_count();

-- Initial comment count update (for existing data)
UPDATE uploads u
SET comment_count = (
    SELECT COUNT(*)
    FROM document_comments c
    WHERE c.upload_id = u.id 
    AND c.deleted_at IS NULL
)
WHERE comment_count IS NULL OR comment_count = 0;

-- Comments
COMMENT ON TABLE document_comments IS 'Comments and notes on uploaded documents';
COMMENT ON COLUMN document_comments.comment_type IS 'Type of comment: general, issue, question, approval, rejection';
COMMENT ON COLUMN document_comments.is_internal IS 'If true, only visible to mediators';
COMMENT ON COLUMN document_comments.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN uploads.comment_count IS 'Cached count of active comments on this upload';
