module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email non valida' });
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, FROM_EMAIL } = process.env;

  // ── Save to Supabase ───────────────────────────────────────────────────────
  let dbRes;
  try {
    dbRes = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email }),
    });
  } catch (err) {
    console.error('Supabase fetch error:', err);
    return res.status(500).json({ error: 'Errore di rete verso il database' });
  }

  if (!dbRes.ok && dbRes.status !== 409) {
    console.error('Supabase error', dbRes.status, await dbRes.text());
    return res.status(500).json({ error: 'Errore salvataggio' });
  }

  const alreadyRegistered = dbRes.status === 409;

  // ── Send confirmation email ────────────────────────────────────────────────
  if (!alreadyRegistered && RESEND_API_KEY) {
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL || 'selci <noreply@selci.org>',
          to: [email],
          subject: 'Sei nella lista — selci',
          html: buildEmail(email),
        }),
      });

      if (!emailRes.ok) {
        console.error('Resend error', emailRes.status, await emailRes.text());
        // Don't block the response — email is secondary to saving the record
      }
    } catch (err) {
      console.error('Resend fetch error:', err);
    }
  }

  return res.status(200).json({ ok: true });
};

// ── Email template ─────────────────────────────────────────────────────────
function buildEmail() {
  return `<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Sei nella lista — selci</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F2EDE0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="padding:40px 16px;background:#F2EDE0;">

        <!-- Card wrapper -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
               style="max-width:560px;margin:0 auto;">

          <!-- ── Header ── -->
          <tr>
            <td style="background:#2A4A1A;padding:44px 48px 40px;text-align:center;">
              <!-- Logo lockup -->
              <img src="https://selci.org/assets/images/logo-full-black.png"
                   alt="selci" width="120" height="auto"
                   style="display:block;margin:0 auto 16px;filter:brightness(0) invert(1);opacity:0.9;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:700;letter-spacing:3.5px;text-transform:uppercase;color:rgba(242,237,224,0.45);">Nati Selvatici &nbsp;&middot;&nbsp; Fatti per Durare</p>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="background:#FAFAF5;padding:48px 48px 40px;">

              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#4A7030;">Lista d'Attesa</p>

              <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',Times,serif;font-size:36px;font-weight:400;line-height:1.08;color:#2A4A1A;">
                Sei dentro.<br><span style="font-style:italic;">Benvenuto.</span>
              </h1>

              <!-- Divider rule -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
                <tr><td style="width:38px;height:1px;background:#4A7030;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>

              <p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:300;line-height:1.78;color:rgba(20,20,16,0.62);">
                Ciao! Sei ufficialmente nella lista d'attesa di <strong style="color:#2A4A1A;font-weight:500;">selci</strong>.
              </p>

              <p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:300;line-height:1.78;color:rgba(20,20,16,0.62);">
                Sarai tra i primissimi a sapere quando la nostra collezione sarà disponibile. Ti contatteremo con <strong style="color:#2A4A1A;font-weight:500;">accesso prioritario</strong>, prezzi dedicati e le ultime novità dal brand.
              </p>

              <p style="margin:0 0 40px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:300;line-height:1.78;color:rgba(20,20,16,0.62);">
                Grazie per esserti unito a noi — ci vediamo presto.
              </p>

              <!-- Highlight box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                     style="background:#F2EDE0;border:1px solid rgba(42,74,26,0.14);border-left:3px solid #2A4A1A;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#4A7030;">In arrivo</p>
                    <p style="margin:0;font-family:Georgia,'Times New Roman',Times,serif;font-size:19px;font-weight:400;color:#2A4A1A;font-style:italic;">Prima Collezione &mdash; SS&thinsp;'26</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── Divider ── -->
          <tr>
            <td style="background:#FAFAF5;padding:0 48px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr><td style="height:1px;background:rgba(42,74,26,0.08);font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background:#FAFAF5;padding:28px 48px 32px;text-align:center;">
              <p style="margin:0 0 10px;font-family:Georgia,'Times New Roman',Times,serif;font-size:18px;font-weight:400;letter-spacing:4px;color:#2A4A1A;text-transform:lowercase;">selci</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:rgba(20,20,16,0.28);letter-spacing:0.3px;">
                Hai ricevuto questa email perché hai richiesto l'accesso alla lista d'attesa.<br>
                &copy; 2026 Selci. Tutti i diritti riservati.
              </p>
            </td>
          </tr>

          <!-- ── Bottom bar ── -->
          <tr>
            <td style="background:#2A4A1A;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

        </table>
        <!-- /Card wrapper -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}
