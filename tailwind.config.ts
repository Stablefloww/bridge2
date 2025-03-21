import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#FFFFFF",
          dark: "#121212",
        },
        surface: {
          DEFAULT: "#F8F9FA",
          dark: "#1E1E1E",
        },
        primary: {
          DEFAULT: "#3B48DF",
          dark: "#5865F2",
        },
        secondary: {
          DEFAULT: "#10B981",
          dark: "#10B981",
        },
        warning: {
          DEFAULT: "#F59E0B",
          dark: "#F59E0B",
        },
        error: {
          DEFAULT: "#EF4444",
          dark: "#EF4444",
        },
        text: {
          primary: {
            DEFAULT: "#171717",
            dark: "#F3F4F6",
          },
          secondary: {
            DEFAULT: "#6B7280",
            dark: "#9CA3AF",
          },
        },
        border: {
          DEFAULT: "#E5E7EB",
          dark: "#374151",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Mono", "monospace"],
      },
      fontSize: {
        h1: ["32px", { lineHeight: "40px", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "32px", fontWeight: "600" }],
        h3: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        body: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-small": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "400" }],
        code: ["14px", { lineHeight: "20px", fontWeight: "400", fontFamily: "Mono" }],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
    },
  },
  plugins: [],
};
export default config; 