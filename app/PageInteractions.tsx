"use client";

import { useState } from "react";

/** Waitlist form submit — nav-scroll/reveal effects live in SiteScrollEffects (shared across all storefront pages). */
export default function PageInteractions() {
  const [waitlistState, setWaitlistState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleWaitlistSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const emailInput = form.querySelector<HTMLInputElement>('input[type="email"]');
    const email = emailInput?.value.trim();
    if (!email) return;

    setWaitlistState("sending");
    if (emailInput) emailInput.style.borderColor = "";

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setWaitlistState("sent");
      } else {
        throw new Error(data.error || "Errore");
      }
    } catch {
      setWaitlistState("error");
      if (emailInput) emailInput.style.borderColor = "rgba(180,60,60,.5)";
    }
  }

  return (
    <>
      <form
        className="waitlist-form reveal"
        id="wl-form"
        noValidate
        onSubmit={handleWaitlistSubmit}
        style={waitlistState === "sent" ? { display: "none" } : undefined}
      >
        <input type="email" name="email" placeholder="La tua email" required autoComplete="email" />
        <button type="submit" className="btn-solid" disabled={waitlistState === "sending"}>
          {waitlistState === "sending" ? "Invio…" : (
            <>
              Iscriviti <span className="arr">&#x2192;</span>
            </>
          )}
        </button>
      </form>
      <div className={`waitlist-ok${waitlistState === "sent" ? " show" : ""}`} id="wl-ok" role="status">
        <span className="check">&#x2713;</span>
        Sei nella lista &mdash; ti contatteremo presto!
      </div>
      {waitlistState === "error" && (
        <p style={{ marginTop: ".75rem", fontSize: ".8rem", color: "rgba(160,50,50,.85)", textAlign: "center" }}>
          Qualcosa è andato storto. Riprova.
        </p>
      )}
    </>
  );
}
