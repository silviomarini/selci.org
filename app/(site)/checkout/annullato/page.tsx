export default function CheckoutCancelledPage() {
  return (
    <section className="waitlist" style={{ paddingTop: "8rem" }}>
      <div className="waitlist-inner">
        <p className="section-tag">Checkout</p>
        <h1 className="section-title">
          Ordine
          <br />
          <em>annullato.</em>
        </h1>
        <div className="rule" style={{ margin: "1.4rem auto" }} />
        <p className="waitlist-desc">
          Il pagamento non è stato completato. Il carrello è ancora disponibile — puoi riprovare quando vuoi.
        </p>
        <a href="/" className="btn-solid" style={{ alignSelf: "center" }}>
          Torna alla home <span className="arr">&#x2192;</span>
        </a>
      </div>
    </section>
  );
}
