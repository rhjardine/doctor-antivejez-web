import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				'50': 'rgb(240, 249, 255)',
  				'100': 'rgb(224, 242, 254)',
  				'500': 'rgb(35, 188, 239)',
  				'600': 'rgb(31, 169, 215)',
  				'700': 'rgb(28, 150, 191)',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			'primary-dark': '#293B64',
  			background: 'hsl(var(--background))',
  			'text-primary': '#343A40',
  			'status-green': {
  				'50': 'rgb(240, 253, 244)',
  				'100': 'rgb(220, 252, 231)',
  				'500': 'rgb(22, 163, 74)',
  				DEFAULT: 'rgb(22, 163, 74)'
  			},
  			'status-yellow': {
  				'50': 'rgb(254, 252, 232)',
  				'100': 'rgb(254, 249, 195)',
  				'500': 'rgb(234, 179, 8)',
  				DEFAULT: 'rgb(234, 179, 8)'
  			},
  			'status-red': {
  				'50': 'rgb(254, 242, 242)',
  				'100': 'rgb(254, 226, 226)',
  				'500': 'rgb(220, 38, 38)',
  				DEFAULT: 'rgb(220, 38, 38)'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			foreground: 'hsl(var(--foreground))',
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		borderRadius: {
  			DEFAULT: '0.5rem',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  			'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

export default config