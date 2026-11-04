// POST /api/staff/credentials
//
// Updates the login credentials of a staff account: email, password and/or
// access level. Changing another user's password is impossible from the
// browser SDK, so it is done here with the Admin SDK.
//
// Auth: "Authorization: Bearer <firebase-id-token>". The caller must be a
// superadmin, or an admin of the gym the staff member belongs to.
//
// Body: { gymId, staffId, authUid, email?, password?, accessLevel? }
// Returns: { ok: true, email, accessLevel }
import { getDb, verifyIdToken } from '../_lib/firebaseAdmin.js';
import { getAuth } from 'firebase-admin/auth';

const ACCESS_LEVELS = ['staff', 'admin'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let uid;
  try {
    ({ uid } = await verifyIdToken(req.headers.authorization));
  } catch (e) {
    return res.status(401).json({ error: e.message || 'Unauthorized' });
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body || {};
  const { gymId, staffId, authUid, email, password, accessLevel } = body;

  if (!gymId || !authUid) return res.status(400).json({ error: 'gymId and authUid are required' });
  if (!email && !password && !accessLevel) return res.status(400).json({ error: 'Nothing to update' });
  if (password && String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (accessLevel && !ACCESS_LEVELS.includes(accessLevel)) {
    return res.status(400).json({ error: 'Invalid access level' });
  }

  const db = getDb();

  // ── Authorize: superadmin, or an admin of this gym ────────────────────────
  let caller;
  try {
    caller = (await db.doc(`users/${uid}`).get()).data();
  } catch {
    return res.status(500).json({ error: 'Could not read your user profile' });
  }
  if (!caller) return res.status(403).json({ error: 'No user profile' });

  const callerGyms = caller.gymIds?.length ? caller.gymIds : caller.gymId ? [caller.gymId] : [];
  const isSuper = caller.role === 'superadmin';
  if (!isSuper && !(caller.role === 'admin' && callerGyms.includes(gymId))) {
    return res.status(403).json({ error: 'Only a gym admin can change staff credentials' });
  }

  // ── The target account must belong to this gym ────────────────────────────
  const targetSnap = await db.doc(`users/${authUid}`).get();
  const target = targetSnap.data();
  if (!target) return res.status(404).json({ error: 'That login account no longer exists' });

  const targetGyms = target.gymIds?.length ? target.gymIds : target.gymId ? [target.gymId] : [];
  if (!isSuper && !targetGyms.includes(gymId)) {
    return res.status(403).json({ error: 'That login belongs to another gym' });
  }
  if (target.role === 'superadmin') {
    return res.status(403).json({ error: 'A superadmin account cannot be edited here' });
  }
  if (authUid === uid && accessLevel && accessLevel !== caller.role) {
    return res.status(400).json({ error: 'You cannot change your own access level' });
  }

  // ── Apply ─────────────────────────────────────────────────────────────────
  const authPatch = {};
  if (email) authPatch.email = String(email).trim();
  if (password) authPatch.password = String(password);

  if (Object.keys(authPatch).length) {
    try {
      await getAuth().updateUser(authUid, authPatch);
    } catch (e) {
      const code = e?.errorInfo?.code || e?.code || '';
      const message = code.includes('email-already-exists')
        ? 'That email is already used by another account'
        : code.includes('invalid-email')
          ? 'That email address is not valid'
          : code.includes('invalid-password')
            ? 'Password must be at least 6 characters'
            : e?.message || 'Could not update the login account';
      return res.status(400).json({ error: message });
    }
  }

  const userPatch = {};
  if (email) userPatch.email = String(email).trim();
  if (accessLevel) userPatch.role = accessLevel;
  if (Object.keys(userPatch).length) await db.doc(`users/${authUid}`).set(userPatch, { merge: true });

  if (staffId) {
    const staffPatch = {};
    if (email) { staffPatch.email = String(email).trim(); staffPatch.loginEmail = String(email).trim(); }
    if (accessLevel) staffPatch.accessLevel = accessLevel;
    if (Object.keys(staffPatch).length) {
      await db.doc(`gyms/${gymId}/staff/${staffId}`).set(staffPatch, { merge: true });
    }
  }

  return res.status(200).json({
    ok: true,
    email: userPatch.email || target.email || '',
    accessLevel: accessLevel || target.role || 'staff',
  });
}

function safeJson(raw) {
  try { return JSON.parse(raw); } catch { return {}; }
}
