/**
 * Site-wide facts, extracted from the clean WordPress backup
 * (Header id=37, Footer id=41). See src/data/locations.ts for provenance.
 */

export const site = {
  name: "Demiya",
  domain: "https://demiya.restaurant",

  /** Footer tagline, verbatim. */
  tagline: "Japanese comfort food · Bay Area · Est. 2016",

  /**
   * The published support line is SMS-only — the original footer read
   * "Customer support: text only at +1 (408) 499-1250". Keep the "text only"
   * qualifier wherever this appears; presenting it as a call line sends
   * people to a number that does not answer.
   */
  supportSms: "+1 (408) 499-1250",
  supportSmsHref: "sms:+14084991250",

  instagram: "https://instagram.com/demiya_inc",
  instagramHandle: "@demiya_inc",

  /**
   * Sister restaurant, linked from the original header and footer.
   * TODO: the backup only preserved the slug (bistro-demiya), not the
   * destination URL — confirm the real address before launch.
   */
  demiPaloAlto: {
    label: "DEMI Palo Alto",
    footerLabel: "Discover DEMI Palo Alto",
    url: "#",
  },

  copyright: "© 2016–2025 Demiya Inc. All rights reserved.",

  /** Contact form endpoint — `terraform output contact_form_endpoint`. */
  contactEndpoint: import.meta.env.PUBLIC_CONTACT_ENDPOINT ?? "",
} as const;

/** Header navigation, matching the original site. */
export const nav = [
  { href: "/", label: "Home" },
  { href: "/hours/", label: "Hours" },
  { href: "/locations-order/", label: "Locations & Order" },
];
