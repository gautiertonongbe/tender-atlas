import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy:    "#0F172A",
        indigo:  "#1E3A8A",
        royal:   "#1D4ED8",
        brand: "#2563EB",
        sky:     "#3B82F6",
        pale:    "#DBEAFE",
        softbg:  "#F8FAFC",
        gold:    "#F59E0B",
        mute:    "#334155",
        subtle:  "#475569",
        rule:    "#CBD5E1",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
