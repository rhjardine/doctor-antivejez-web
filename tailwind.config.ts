import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores principales
        'primary': {
          DEFAULT: 'rgb(35, 188, 239)',
          50: 'rgb(240, 249, 255)',
          100: 'rgb(224, 242, 254)',
          500: 'rgb(35, 188, 239)',
          600: 'rgb(31, 169, 215)',
          700: 'rgb(28, 150, 191)',
        },
        'primary-dark': '#293B64',
        'background': '#F8F9FA',
        'text-primary': '#343A40',
        
        // Estados de salud
        'status-green': {
          DEFAULT: 'rgb(22, 163, 74)',
          50: 'rgb(240, 253, 244)',
          100: 'rgb(220, 252, 231)',
          500: 'rgb(22, 163, 74)',
        },
        'status-yellow': {
          DEFAULT: 'rgb(234, 179, 8)',
          50: 'rgb(254, 252, 232)',
          100: 'rgb(254, 249, 195)',
          500: 'rgb(234, 179, 8)',
        },
        'status-red': {
          DEFAULT: 'rgb(220, 38, 38)',
          50: 'rgb(254, 242, 242)',
          100: 'rgb(254, 226, 226)',
          500: 'rgb(220, 38, 38)',
        },

        // Colores adicionales para componentes
        'card': '#FFFFFF',
        'border': '#E2E8F0',
        'input': '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'DEFAULT': '0.5rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}

export default config