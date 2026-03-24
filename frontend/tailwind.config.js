/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#CC0000",
        secundary: "#D8BF00",
        light: "#E2A8A8",
        contrast: "#EBEBEB",
        brandDark: "#6E0303",
        secundaryDark: "#BCAA28",
        lightDark: "#B44141",
        contrastDark: "#9C9C9C",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        inter: ["Inter", "ui-sans-serif", "system-ui"],
        "istok-web": ['"Istok Web"', "serif"],
        "long-cang": ['"Long Cang"', "serif"],
        orienta: ["Orienta", "serif"],
      },
    },
  },
  plugins: [],
};
