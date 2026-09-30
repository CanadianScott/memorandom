import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#faf7f2",
        "warm-brown": "#8B4513",
        "aged-paper": "#f5e6d3",
        ink: "#2c1810",
        "soft-gold": "#c4a265",
      },
    },
  },
  plugins: [],
};

export default config;
