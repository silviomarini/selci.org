"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Nav-background-on-scroll + scroll-reveal, lifted out of PageInteractions
 * so they run on every storefront page (not just the home page where the
 * waitlist form lives). Re-runs on pathname change since the layout that
 * mounts this persists across client-side navigations — a fresh page's
 * `.reveal` elements need a fresh IntersectionObserver scan.
 */
export function SiteScrollEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const nav = document.getElementById("nav");
    const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const revealEls = document.querySelectorAll(".reveal:not(.in)");
    const ro = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            ro.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => ro.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [pathname]);

  return null;
}
