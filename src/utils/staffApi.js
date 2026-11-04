import { auth } from '../firebase/config';

// Calls the staff credential endpoint (api/staff/credentials).
//
// NOTE: like the PhonePe and WhatsApp helpers, this only works on the deployed
// Vercel site (or under `vercel dev`). Plain `npm run dev` does not serve /api.

/**
 * Change a staff member's login email, password and/or access level.
 * Returns { ok, email, accessLevel }.
 */
export async function updateStaffCredentials({ gymId, staffId, authUid, email, password, accessLevel }) {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in');
  const token = await user.getIdToken();

  let res;
  try {
    res = await fetch('/api/staff/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ gymId, staffId, authUid, email, password, accessLevel }),
    });
  } catch (err) {
    console.error('Staff credential request failed:', err);
    throw new Error('Could not reach the server');
  }

  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch { /* not JSON */ }

  if (!res.ok) {
    throw new Error(res.status === 404
      ? 'Credential service is not deployed on this site'
      : data.error || `Request failed (HTTP ${res.status})`);
  }
  if (!data.ok) throw new Error(data.error || 'Credential update failed');
  return data;
}
