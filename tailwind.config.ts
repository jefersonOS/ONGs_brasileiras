import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1A3C4A",
          light: "#2E6B7A",
        },
        secondary: {
          DEFAULT: "#2D9E6B",
          dark: "#218856",
        },
        background: "#F5F7F8",
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
