/** @type {import('tailwindcss').Config} */

// Convierte una variable CSS "R G B" en un color usable por Tailwind,
// respetando opacidad (ej. bg-canvas/60). Así el tema queda centralizado
// en variables CSS (app/globals.css) y listo para un modo oscuro futuro:
// solo habría que redefinir las variables, no volver a tocar cada clase.
function withOpacity(variable) {
  return ({ opacityValue }) =>
    opacityValue === undefined
      ? `rgb(var(${variable}))`
      : `rgb(var(${variable}) / ${opacityValue})`;
}

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: withOpacity("--color-canvas"),
        surface: withOpacity("--color-surface"),
        ink: withOpacity("--color-ink"),
        muted: withOpacity("--color-muted"),
        line: withOpacity("--color-line"),
        brand: {
          DEFAULT: withOpacity("--color-accent"),
          dark: withOpacity("--color-accent-dark"),
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(42,33,28,0.04), 0 8px 24px -8px rgba(42,33,28,0.12)",
      },
      transitionTimingFunction: {
        // Ease-out con más carácter que el por defecto de Tailwind/CSS.
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
      },
    },
  },
  plugins: [],
};
