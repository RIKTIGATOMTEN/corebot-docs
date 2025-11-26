import { defineConfig } from "vitepress";
import fs from 'fs';
import path from 'path';

const discordJsSvg = fs.readFileSync(
  path.resolve(__dirname, '../assets/discordjs.svg'), 
  'utf-8'
);

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "RiktigaTomten's Core",
  description: "Documentation for Core's adaptive framework",
  cleanUrls: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    // Top navigation bar
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/docs/getting-started" },
      { text: "API Reference", link: "/reference/api" },
    ],

    // Sidebar navigation
    sidebar: {
      "/docs/": [
        {
          text: "Introduction",
          items: [
            { text: "Why Core?", link: "/docs/why-core" },
            { text: "Getting Started", link: "/docs/getting-started" },
            { text: "How Core Works", link: "/docs/how-core-works" },
          ],
        },
        {
          text: "Building Addons",
          items: [
            { text: "Creating Addons", link: "/docs/creating-addons" },
            { text: "Extensions System", link: "/docs/extensions" },
            { text: "Addon Architecture", link: "/docs/addon-architecture" },
          ],
        },
        {
          text: "Core Features",
          items: [
            { text: "Event System", link: "/docs/events" },
            { text: "Database Integration", link: "/docs/database" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "API Reference",
          items: [
            { text: "Core API", link: "/reference/api" },
            { text: "Configuration", link: "/reference/configuration" },
            { text: "Error Codes", link: "/reference/error-codes" },
          ],
        },
      ],
    },

    // GitHub link in top right
    socialLinks: [
      { icon: "github", link: "https://github.com/riktigatomten/corebot" },
      { icon: { svg: discordJsSvg }, link: 'https://discord.js.org' }
    ],

    // Footer
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025 RiktigaTomten",
    },

    // Search (comes built-in with VitePress)
    search: {
      provider: "local",
    },
  },
});
