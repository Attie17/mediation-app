import express from "express";
import { supabase, pool } from "../db.js";
import { withTransaction } from "../utils/tx.js";
import { insertNotification, insertNotifications } from "../utils/notifications.js";
import { authenticateUser } from "../middleware/authenticateUser.js";

const router = express.Router();
const VALID_ROLES = new Set(["mediator", "divorcee"]);

const getCaseIdFromRequest = (req) => {
  const segments = req.baseUrl?.split("/") || [];
  const caseIdSegment = segments.length >= 2 ? segments[segments.length - 2] : null;
  const parsed = Number(caseIdSegment);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const isActiveStatus = (status) => {
  if (!status) return true;
  return status === "active";
};

const buildUnexpectedError = (message = "Failed to verify permissions") => ({
  status: 500,
  body: { error: message },
});

const buildForbiddenError = (message = "Only mediators can perform this action.") => ({
  status: 403,
  body: { error: message },
});

async function ensureMediatorAccess(req, caseId) {
  if (!req.user?.id) {
    return { status: 401, body: { error: "Authentication required" } };
  }

  try {
    const userId = req.user.id;

    const { data: caseRecord, error: caseError } = await supabase
      .from("cases")
      .select("mediator_id")
      .eq("id", caseId)
      .maybeSingle();

    if (caseError) {
      console.error("Failed to verify mediator via case record:", caseError);
      return buildUnexpectedError();
    }

    if (!caseRecord) {
      return { status: 404, body: { error: "Case not found" } };
    }

    if (caseRecord.mediator_id && caseRecord.mediator_id === userId) {
      return { status: 200 };
    }

    const { data: participantRecord, error: participantError } = await supabase
      .from("case_participants")
      .select("role, status")
      .eq("case_id", caseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error("Failed to verify mediator via participants:", participantError);
      return buildUnexpectedError();
    }

    if (participantRecord && participantRecord.role === "mediator" && isActiveStatus(participantRecord.status)) {
      return { status: 200 };
    }

    return buildForbiddenError();
  } catch (error) {
    console.error("Unexpected mediator verification error:", error);
    return buildUnexpectedError();
  }
}

async function resolveInviteTarget({ userId, email }) {
  const normalizedUserId = userId ? String(userId).trim() : null;
  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;

  if (!normalizedUserId && !normalizedEmail) {
    return { status: 400, body: { error: "userId or email is required" } };
  }

  try {
    if (normalizedUserId) {
      const { data, error } = await supabase
        .from("app_users")
        .select("id, email")
        .eq("id", normalizedUserId)
        .maybeSingle();

      if (error) {
        console.error("Error looking up app_user by id:", error);
        return { status: 500, body: { error: "Failed to look up user details" } };
      }

      if (!data) {
        return { status: 404, body: { error: `User with id "${normalizedUserId}" not found.` } };
      }

      if (normalizedEmail && data.email?.toLowerCase() !== normalizedEmail) {
        return { status: 400, body: { error: "Provided userId and email refer to different users." } };
      }

      return { status: 200, payload: { userId: data.id, email: data.email } };
    }

    const { data, error } = await supabase
      .from("app_users")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error("Error looking up app_user by email:", error);
      return { status: 500, body: { error: "Failed to look up user by email" } };
    }

    if (!data) {
      return { status: 404, body: { error: `User with email "${normalizedEmail}" not found.` } };
    }

    return { status: 200, payload: { userId: data.id, email: data.email } };
  } catch (err) {
    console.error("Unexpected error resolving invite target:", err);
    return { status: 500, body: { error: "Failed to look up user information" } };
  }
}

router.get("/participants/ping", (req, res) => {
  res.json({ ok: true });
});

router.get("/ping", (req, res) => {
  res.json({ msg: "participants router alive" });
});

router.post("/invite", authenticateUser, async (req, res) => {
  const caseId = getCaseIdFromRequest(req);
  if (!caseId) {
    return res.status(400).json({ error: "Invalid case id" });
  }

  const permission = await ensureMediatorAccess(req, caseId);
  if (permission.status !== 200) {
    return res.status(permission.status).json(permission.body);
  }

  const { userId, email, role } = req.body ?? {};
  if (!role || !VALID_ROLES.has(role)) {
    return res.status(400).json({ error: 'role must be "mediator" or "divorcee"' });
  }

  const targetResolution = await resolveInviteTarget({ userId, email });
  if (targetResolution.status !== 200) {
    return res.status(targetResolution.status).json(targetResolution.body);
  }

  const { userId: targetUserId, email: resolvedEmail } = targetResolution.payload;
  const status = role === "mediator" ? "active" : "invited";

  try {
    const { data, error } = await supabase
      .from("case_participants")
      .upsert(
        { case_id: caseId, user_id: targetUserId, role, status },
        { onConflict: ["case_id", "user_id"] }
      )
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "User is already a participant of this case." });
      }
      console.error("Error inviting participant:", error);
      return res.status(500).json({ error: "Database error" });
    }

    try {
      await insertNotification(
        targetUserId,
        `You've been invited to case ${caseId}.`,
        "participant"
      );
    } catch (notifyError) {
      console.error("Failed to notify invited participant:", notifyError);
    }

    return res.json({ ...data, email: resolvedEmail });
  } catch (err) {
    console.error("Error inviting participant:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

router.post("/accept", authenticateUser, async (req, res) => {
  const caseId = getCaseIdFromRequest(req);
  if (!caseId) {
    return res.status(400).json({ error: "Invalid case id" });
  }

  if (!req.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role && req.user.role !== "divorcee") {
    return res.status(403).json({ error: "Only divorcees can accept invites." });
  }

  const requestedUserId = req.body?.userId;
  if (requestedUserId && requestedUserId !== req.user.id) {
    return res.status(403).json({ error: "You may only accept your own invite." });
  }

  try {
    const { data: participantRecord, error: participantError } = await supabase
      .from("case_participants")
      .select("role, status")
      .eq("case_id", caseId)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (participantError) {
      console.error("Error verifying participant before acceptance:", participantError);
      return res.status(500).json({ error: "Database error" });
    }

    if (!participantRecord) {
      return res.status(404).json({ error: "Participant not found" });
    }

    if (participantRecord.role !== "divorcee") {
      return res.status(403).json({ error: "Only divorcees can accept invites." });
    }

    if (participantRecord.status === "active") {
      return res.json({ success: true, status: "active" });
    }

    const { data, error } = await supabase
      .from("case_participants")
      .update({ status: "active" })
      .eq("case_id", caseId)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) {
      console.error("Error accepting invite:", error);
      return res.status(500).json({ error: "Database error" });
    }

    try {
      const recipients = new Set();

      const { data: caseRecord } = await supabase
        .from("cases")
        .select("mediator_id")
        .eq("id", caseId)
        .maybeSingle();

      if (caseRecord?.mediator_id && caseRecord.mediator_id !== req.user.id) {
        recipients.add(caseRecord.mediator_id);
      }

      const { data: mediatorParticipants } = await supabase
        .from("case_participants")
        .select("user_id, status")
        .eq("case_id", caseId)
        .eq("role", "mediator");

      for (const row of mediatorParticipants || []) {
        if (row?.user_id && row.user_id !== req.user.id && row.status === "active") {
          recipients.add(row.user_id);
        }
      }

      if (recipients.size > 0) {
        const displayName = req.user?.email || req.user?.id || "A participant";
        await insertNotifications(
          Array.from(recipients),
          `${displayName} accepted an invitation for case ${caseId}.`,
          "participant"
        );
      }
    } catch (notifyError) {
      console.error("Failed to notify mediators about acceptance:", notifyError);
    }

    return res.json(data);
  } catch (err) {
    console.error("Error accepting invite:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

router.get("/", authenticateUser, async (req, res) => {
  const caseId = getCaseIdFromRequest(req);
  if (!caseId) {
    return res.status(400).json({ error: "Invalid case id" });
  }

  try {
    const { data, error } = await supabase
      .from("case_participants")
      .select("*, app_users(name, email)")
      .eq("case_id", caseId);

    if (error) {
      console.error("Error fetching participants:", error.message, error.stack);
      return res.status(500).json({ error: "Database error", details: error.message });
    }

    return res.json(data);
  } catch (err) {
    console.error("Error fetching participants:", err.message, err.stack);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
});

router.patch("/:userId", authenticateUser, async (req, res) => {
  const caseId = getCaseIdFromRequest(req);
  if (!caseId) {
    return res.status(400).json({ error: "Invalid case id" });
  }

  const permission = await ensureMediatorAccess(req, caseId);
  if (permission.status !== 200) {
    return res.status(permission.status).json(permission.body);
  }

  const userId = req.params.userId;
  const { role, status } = req.body ?? {};
  if (!role && !status) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const result = await withTransaction(pool, async (client) => {
      const targetRes = await client.query(
        `SELECT role, status FROM case_participants WHERE case_id = $1 AND user_id = $2 FOR UPDATE`,
        [caseId, userId]
      );

      const target = targetRes.rows[0];
      if (!target) {
        return { status: 404, body: { error: "Participant not found" } };
      }

      if (target.role === "mediator" && target.status === "active") {
        let demoting = false;
        if (role && role !== "mediator") demoting = true;
        if (status && status !== "active") demoting = true;

        if (demoting) {
          const otherRes = await client.query(
            `SELECT 1 FROM case_participants WHERE case_id = $1 AND role = 'mediator' AND status = 'active' AND user_id <> $2 LIMIT 1`,
            [caseId, userId]
          );

          if (otherRes.rowCount === 0) {
            return { status: 400, body: { error: "Cannot demote last active mediator from case" } };
          }
        }
      }

      const updateRes = await client.query(
        `UPDATE case_participants SET role = COALESCE($1, role), status = COALESCE($2, status), updated_at = NOW() WHERE case_id = $3 AND user_id = $4 RETURNING *`,
        [role, status, caseId, userId]
      );

      return { status: 200, body: updateRes.rows[0] };
    });

    if (result.status !== 200) {
      return res.status(result.status).json(result.body);
    }

    const updatedParticipant = result.body || {};

    try {
      const statusMessage = updatedParticipant.status
        ? `Your participation status for case ${caseId} is now ${updatedParticipant.status}.`
        : `Your participation for case ${caseId} has been updated.`;

      await insertNotification(
        userId,
        statusMessage,
        "participant"
      );
    } catch (notifyError) {
      console.error("Failed to notify participant update:", notifyError);
    }

    return res.json(updatedParticipant);
  } catch (err) {
    console.error("Error updating participant:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

router.delete("/:userId", authenticateUser, async (req, res) => {
  const caseId = getCaseIdFromRequest(req);
  if (!caseId) {
    return res.status(400).json({ error: "Invalid case id" });
  }

  const permission = await ensureMediatorAccess(req, caseId);
  if (permission.status !== 200) {
    return res.status(permission.status).json(permission.body);
  }

  const userId = req.params.userId;

  try {
    const result = await withTransaction(pool, async (client) => {
      const targetRes = await client.query(
        `SELECT role, status FROM case_participants WHERE case_id = $1 AND user_id = $2 FOR UPDATE`,
        [caseId, userId]
      );

      const target = targetRes.rows[0];
      if (!target) {
        return { status: 404, body: { error: "Participant not found" } };
      }

      if (target.role === "mediator" && isActiveStatus(target.status)) {
        const otherRes = await client.query(
          `SELECT 1 FROM case_participants WHERE case_id = $1 AND role = 'mediator' AND status = 'active' AND user_id <> $2 LIMIT 1`,
          [caseId, userId]
        );

        if (otherRes.rowCount === 0) {
          return { status: 400, body: { error: "Cannot remove last active mediator from case" } };
        }
      }

      await client.query(
        `DELETE FROM case_participants WHERE case_id = $1 AND user_id = $2`,
        [caseId, userId]
      );

      return { status: 200, body: { success: true } };
    });

    if (result.status !== 200) {
      return res.status(result.status).json(result.body);
    }

    try {
      await insertNotification(
        userId,
        `Your participation in case ${caseId} has been removed.`,
        "participant"
      );
    } catch (notifyError) {
      console.error("Failed to notify participant deletion:", notifyError);
    }

    return res.json(result.body);
  } catch (err) {
    console.error("Error deleting participant:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

export default router;
