module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount_sats, note } = req.body || {};
  const { OPENNODE_API_KEY } = process.env;

  if (!OPENNODE_API_KEY) {
    return res.status(500).json({ error: 'Payment service not configured' });
  }

  // Minimum 1000 sats (~€0.50)
  const sats = parseInt(amount_sats, 10);
  if (!sats || sats < 1000) {
    return res.status(400).json({ error: 'Importo minimo: 1000 sats' });
  }

  let charge;
  try {
    const openNodeRes = await fetch('https://api.opennode.com/v1/charges', {
      method: 'POST',
      headers: {
        Authorization: OPENNODE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount:        sats,
        currency:      'SATS',
        description:   note || 'Supporto a selci — Collezione SS\'26',
        callback_url:  'https://selci.org/api/btc-webhook',
        success_url:   'https://selci.org/?donated=true',
        auto_settle:   false,
      }),
    });

    const payload = await openNodeRes.json();

    if (!openNodeRes.ok) {
      console.error('OpenNode error', openNodeRes.status, payload);
      return res.status(502).json({ error: 'Errore creazione pagamento' });
    }

    charge = payload.data;
  } catch (err) {
    console.error('OpenNode fetch error:', err);
    return res.status(500).json({ error: 'Errore di rete' });
  }

  return res.status(200).json({
    charge_id:     charge.id,
    checkout_url:  charge.hosted_checkout_url,
    amount_sats:   charge.amount,
  });
};
