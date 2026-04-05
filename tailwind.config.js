/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#1e1e2e',
        mantle: '#181825',
        crust: '#11111b',
        surface: '#313244',
        overlay: '#45475a',
        muted: '#6c7086',
        text: '#cdd6f4',
        blue: '#89b4fa',
        purple: '#cba6f7',
        green: '#a6e3a1',
        red: '#f38ba8',
        peach: '#fab387',
      },
    },
  },
  plugins: [],
}
