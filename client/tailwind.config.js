/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10b981',
          dark: '#059669',
          light: '#6ee7b7',
        },
        secondary: '#14b8a6',
        accent: '#8b5cf6',
        surface: {
          DEFAULT: '#ffffff',
          light: '#f0fdf4',
          dark: '#e0f2fe',
        },
        background: '#f8fafb',
        'text-primary': '#0f172a',
        'text-secondary': '#64748b',
        'border-color': '#e2e8f0',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      boxShadow: {
        'custom': '0 2px 8px rgba(16, 185, 129, 0.08)',
        'custom-md': '0 10px 25px rgba(16, 185, 129, 0.1)',
        'custom-lg': '0 20px 40px rgba(16, 185, 129, 0.15)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

