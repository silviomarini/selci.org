const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { OPENNODE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  const { id: chargeId, status, hashed_order, amount } = req.body || {};

  // ── Validate OpenNode HMAC signature ──────────────────────────────────────
  if (!chargeId || !hashed_order) {
    return res.status(400).end();
  }

  const expectedHash = crypto
    .createHmac('sha256', OPENNODE_API_KEY)
    .update(chargeId)
    .digest('hex');

  if (expectedHash !== hashed_order) {
    return res.status(401).end();
  }

  // ── Only persist confirmed payments ───────────────────────────────────────
  if (status !== 'paid') {
    return res.status(200).json({ ok: true, skipped: true });
  }

  // ── Save to Supabase ───────────────────────────────────────────────────────
  try {
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/donations`, {
      method: 'POST',
      headers: {
        apikey:          SUPABASE_SERVICE_KEY,
        Authorization:   `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type':  'application/json',
        Prefer:          'return=minimal',
      },
      body: JSON.stringify({
        charge_id:   chargeId,
        amount_sats: amount,
        status:      'paid',
      }),
    });

    // 409 = already recorded (duplicate webhook delivery) — safe to ignore
    if (!dbRes.ok && dbRes.status !== 409) {
      console.error('Supabase insert error', dbRes.status, await dbRes.text());
      return res.status(500).end();
    }
  } catch (err) {
    console.error('Supabase fetch error:', err);
    return res.status(500).end();
  }

  return res.status(200).json({ ok: true });
};
