// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://demiya.restaurant",

  // Default static output: no adapter, no server, no runtime. This is the
  // property that removes the attack surface the WordPress site had.
  output: "static",

  // Emits about/index.html. The CloudFront viewer-request function resolves
  // directory URLs to the index document — see infra/functions/router.js.tftpl.
  build: { format: "directory" },

  // A real sitemap matters here: the domain is recovering from spam-SEO
  // injection and needs a legitimate one submitted to Search Console.
  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});
