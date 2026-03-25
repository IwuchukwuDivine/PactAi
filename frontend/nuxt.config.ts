// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },

  vite: {
    plugins: [tailwindcss()],
  },
  fonts: {
    families: [
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-ExtraLight.ttf",
        weight: 200,
      },
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-ExtraLightItalic.ttf",
        weight: 200,
        style: "italic",
      },
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-Light.ttf",
        weight: 300,
      },
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-LightItalic.ttf",
        weight: 300,
        style: "italic",
      },
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-Regular.ttf",
        weight: 400,
      },
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-Italic.ttf",
        weight: 400,
        style: "italic",
      },
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-Medium.ttf",
        weight: 500,
      },
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-MediumItalic.ttf",
        weight: 500,
        style: "italic",
      },
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-SemiBold.ttf",
        weight: 600,
      },
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-SemiBoldItalic.ttf",
        weight: 600,
        style: "italic",
      },
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-Bold.ttf",
        weight: 700,
      },
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-BoldItalic.ttf",
        weight: 700,
        style: "italic",
      },
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-ExtraBold.ttf",
        weight: 800,
      },
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-ExtraBoldItalic.ttf",
        weight: 800,
        style: "italic",
      },
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-Black.ttf",
        weight: 900,
      },
      {
        name: "Inter",
        src: "~/assets/fonts/Inter_18pt-BlackItalic.ttf",
        weight: 900,
        style: "italic",
      },
    ],
  },
  devServer: {
    host: "0.0.0.0",
  },
  typescript: {
    typeCheck: true,
  },
  app: {
    head: {
      title: "PactAI",
      titleTemplate: "%s | PactAI",
      htmlAttrs: {
        lang: "en",
      },
      meta: [
        {
          name: "description",
          content:
            "Turn informal chats into legally enforceable contracts. Pact AI converts WhatsApp, DM, and email agreements into signed, timestamped documents with built-in escrow.",
        },
        { name: "theme-color", content: "#2d0102" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          name: "keywords",
          content:
            "AI contracts, digital agreements, freelancer contracts, escrow, small business, content creator agreements, Nigeria, legal documents",
        },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Pact AI" },
        {
          property: "og:title",
          content:
            "Pact AI — Turn informal agreements into enforceable contracts",
        },
        {
          property: "og:description",
          content:
            "Paste a chat, upload a screenshot, or describe your deal — Pact AI generates clear, signed, and timestamped contracts with optional escrow for secure payments.",
        },
        { property: "og:image", content: "/og-image.png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content:
            "Pact AI — Turn informal agreements into enforceable contracts",
        },
        {
          name: "twitter:description",
          content:
            "Paste a chat, upload a screenshot, or describe your deal — Pact AI generates clear, signed, and timestamped contracts with optional escrow for secure payments.",
        },
        { name: "twitter:image", content: "/og-image.png" },
      ],
      link: [
        {
          rel: "icon",
          type: "image/png",
          href: "/logo.png",
        },
      ],
    },
  },
  modules: [
    "@nuxt/fonts",
    "@nuxt/eslint",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
    "nuxt-lucide-icons",
  ],
  components: true,
  css: ["~/assets/css/main.css"],
});
