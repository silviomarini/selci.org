import type { Order, OrderItem } from "@/lib/shop-types";
import { formatPriceCents } from "@/lib/format";

/** Stessa gabbia visiva (header verde + card crema) dell'email di waitlist in app/api/waitlist/route.ts. */
export function buildOrderConfirmationEmail(order: Order, items: OrderItem[]): string {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#141410;">
            ${item.product_name}<br>
            <span style="color:rgba(20,20,16,0.5);font-size:12px;">${item.variant_label} &times; ${item.quantity}</span>
          </td>
          <td style="padding:10px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#141410;text-align:right;">
            ${formatPriceCents(item.line_total_cents)}
          </td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Ordine confermato — selci</title>
</head>
<body style="margin:0;padding:0;background-color:#F2EDE0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="padding:40px 16px;background:#F2EDE0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td style="background:#2A4A1A;padding:44px 48px 40px;text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:700;letter-spacing:3.5px;text-transform:uppercase;color:rgba(242,237,224,0.45);">Ordine confermato</p>
            </td>
          </tr>
          <tr>
            <td style="background:#FAFAF5;padding:48px 48px 40px;">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#4A7030;">Ordine ${order.order_number}</p>
              <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',Times,serif;font-size:32px;font-weight:400;line-height:1.1;color:#2A4A1A;">
                Grazie per<br><span style="font-style:italic;">il tuo ordine.</span>
              </h1>
              <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:300;line-height:1.78;color:rgba(20,20,16,0.62);">
                Abbiamo ricevuto il pagamento. Ti scriveremo appena l&rsquo;ordine sarà spedito.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid rgba(42,74,26,0.12);">
                ${rows}
                <tr><td colspan="2" style="height:1px;background:rgba(42,74,26,0.12);font-size:0;">&nbsp;</td></tr>
                <tr>
                  <td style="padding-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:rgba(20,20,16,0.55);">Subtotale</td>
                  <td style="padding-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:rgba(20,20,16,0.55);text-align:right;">${formatPriceCents(order.subtotal_cents)}</td>
                </tr>
                ${
                  order.discount_cents > 0
                    ? `<tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:rgba(20,20,16,0.55);">Sconto</td>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:rgba(20,20,16,0.55);text-align:right;">-${formatPriceCents(order.discount_cents)}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:rgba(20,20,16,0.55);">Spedizione</td>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:rgba(20,20,16,0.55);text-align:right;">${order.shipping_cents === 0 ? "Gratuita" : formatPriceCents(order.shipping_cents)}</td>
                </tr>
                <tr>
                  <td style="padding-top:8px;font-family:Georgia,serif;font-size:17px;color:#2A4A1A;">Totale</td>
                  <td style="padding-top:8px;font-family:Georgia,serif;font-size:17px;color:#2A4A1A;text-align:right;">${formatPriceCents(order.total_cents)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#FAFAF5;padding:28px 48px 32px;text-align:center;">
              <p style="margin:0 0 10px;font-family:Georgia,'Times New Roman',Times,serif;font-size:18px;font-weight:400;letter-spacing:4px;color:#2A4A1A;text-transform:lowercase;">selci</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:rgba(20,20,16,0.28);">&copy; 2026 Selci. Tutti i diritti riservati.</p>
            </td>
          </tr>
          <tr><td style="background:#2A4A1A;height:4px;font-size:0;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
