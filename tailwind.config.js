/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C2521",
        paper: "#F7F5F0",
        moss: "#3E5C4C",
        clay: "#B5583A",
        mist: "#DCE3DE",
        warn: "#C1421A",
        ok: "#3E7A57",
      },
      fontFamily: {
        display: ["'Zen Kaku Gothic New'", "sans-serif"],
        body: ["'Zen Kaku Gothic New'", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
