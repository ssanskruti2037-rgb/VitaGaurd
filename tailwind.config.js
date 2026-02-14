/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f5f7ff',
                    100: '#ebf0fe',
                    200: '#ced9fd',
                    300: '#adc0fc',
                    400: '#6d8bf9',
                    500: '#2d56f7',
                    600: '#294ede',
                    700: '#2241b9',
                    800: '#1b3494',
                    900: '#162b79',
                },
                health: {
                    indigo: '#4f46e5',
                    violet: '#7c3aed',
                    cyber: '#06b6d4',
                    emerald: '#10b981',
                    rose: '#f43f5e',
                    amber: '#f59e0b',
                },
                surface: {
                    glass: 'rgba(255, 255, 255, 0.7)',
                    card: '#ffffff',
                    bg: '#f8fafc',
                }
            },
            boxShadow: {
                'premium': '0 10px 40px -10px rgba(0, 0, 0, 0.05)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'glow': '0 0 20px rgba(45, 86, 247, 0.2)',
            },
            animation: {
                'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'float': 'float 6s ease-in-out infinite',
                'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(30px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-15px)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 15px rgba(45, 86, 247, 0.2)' },
                    '50%': { boxShadow: '0 0 30px rgba(45, 86, 247, 0.4)' },
                }
            }
        },
    },
    plugins: [],
}
