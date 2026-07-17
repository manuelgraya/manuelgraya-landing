/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./sobre-mi/*.html", "./proyectos/*.html", "./contacto/*.html", "./src/partials/*.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "secondary": "#006d37",
        "on-error-container": "#93000a",
        "surface": "#fff9ec",
        "tertiary-fixed-dim": "#e7bdb1",
        "primary-fixed": "#ffdcc5",
        "surface-tint": "#805533",
        "on-tertiary-fixed-variant": "#5d4037",
        "primary-container": "#8b5e3c",
        "on-tertiary": "#ffffff",
        "on-secondary-fixed": "#00210c",
        "on-tertiary-container": "#ffe1d8",
        "surface-container": "#f4eddb",
        "surface-container-highest": "#e9e2d0",
        "surface-bright": "#fff9ec",
        "surface-variant": "#e9e2d0",
        "surface-dim": "#e0dac8",
        "on-primary": "#ffffff",
        "surface-container-high": "#efe8d6",
        "on-primary-container": "#ffe3d1",
        "error-container": "#ffdad6",
        "tertiary-fixed": "#ffdbd0",
        "outline-variant": "#d5c3b8",
        "on-tertiary-fixed": "#2c160e",
        "secondary-container": "#7bf8a1",
        "on-secondary-container": "#007239",
        "on-surface": "#1e1c11",
        "on-primary-fixed-variant": "#653d1e",
        "on-primary-fixed": "#301400",
        "inverse-on-surface": "#f7f0de",
        "on-secondary": "#ffffff",
        "on-background": "#1e1c11",
        "outline": "#83746b",
        "tertiary": "#67483f",
        "on-error": "#ffffff",
        "primary-fixed-dim": "#f4bb92",
        "error": "#ba1a1a",
        "on-surface-variant": "#51443c",
        "secondary-fixed-dim": "#61de8a",
        "primary": "#6f4627",
        "surface-container-low": "#faf3e1",
        "surface-container-lowest": "#ffffff",
        "inverse-primary": "#f4bb92",
        "secondary-fixed": "#7efba4",
        "on-secondary-fixed-variant": "#005228",
        "inverse-surface": "#333024",
        "tertiary-container": "#816056",
        "background": "#fff9ec"
      },
      borderRadius: {
        DEFAULT: "0px",
        lg: "0px",
        xl: "0px",
        full: "9999px"
      },
      spacing: {
        "margin": "24px",
        "gutter": "16px",
        "unit": "4px",
        "container-max": "1120px"
      },
      fontFamily: {
        "body-md": ["VT323", "monospace"],
        "label-sm": ["JetBrains Mono", "monospace"],
        "headline-md": ["Space Mono", "monospace"],
        "body-lg": ["VT323", "monospace"],
        "headline-lg": ["Space Mono", "monospace"],
        "pixel": ["'Press Start 2P'", "cursive"]
      },
      fontSize: {
        "body-md": ["20px", { lineHeight: "28px", fontWeight: "400" }],
        "label-sm": ["14px", { lineHeight: "16px", fontWeight: "600" }],
        "headline-md": ["28px", { lineHeight: "36px", fontWeight: "700" }],
        "body-lg": ["24px", { lineHeight: "32px", fontWeight: "400" }],
        "headline-lg": ["40px", { lineHeight: "48px", letterSpacing: "-1px", fontWeight: "700" }]
      }
    }
  },
  plugins: []
};
