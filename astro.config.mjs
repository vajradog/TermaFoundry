import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  base: '/', // Set the base path to root
  server: { port: 4321, host: '0.0.0.0' },
  site: "https://termafoundry.com",
  integrations: [tailwind(), mdx(), sitemap(), icon()],

  image: {
    domains: ["chakrishar.com"],
  },
});
