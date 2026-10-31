/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f5ff",
          100: "#e0ebff",
          500: "#2563eb",
          800: "#1e3a8a",
          900: "#172554",
          950: "#0b132b"
        },
        brightloop: {
          primary: "#172554",
          secondary: "#2563EB",
          bg: "#F8FAFC",
          card: "#FFFFFF",
          success: "#16A34A",
          warning: "#F59E0B",
          danger: "#DC2626"
        }
      }
    }
  },
  plugins: []
};

