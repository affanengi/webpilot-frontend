/** @type {import('tailwindcss').Config} */
import scrollbarPlugin from 'tailwind-scrollbar';

export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // MIDNIGHT PRO PALETTE
                // Main backgrounds
                background: {
                    light: '#f8fafc', // slate-50
                    dark: '#09090b',  // zinc-950 (Deep est)
                },
                surface: {
                    light: '#ffffff',
                    dark: '#18181b',  // zinc-900 (Panel/Card)
                },
                // Borders
                border: {
                    light: '#e2e8f0', // slate-200
                    dark: '#27272a',  // zinc-800
                },
                // Primary Brand (Modern Indigo/Blue)
                primary: {
                    DEFAULT: '#6366f1', // indigo-500
                    hover: '#4f46e5',   // indigo-600
                    light: '#e0e7ff',   // indigo-100 (backgrounds)
                },
                // Text
                text: {
                    primary: {
                        light: '#0f172a', // slate-900
                        dark: '#f4f4f5',  // zinc-100
                    },
                    secondary: {
                        light: '#64748b', // slate-500
                        dark: '#a1a1aa',  // zinc-400
                    }
                },
                // Status checks
                success: '#10b981', // emerald-500
                warning: '#f59e0b', // amber-500
                error: '#ef4444',   // red-500
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            }
        },
    },
    plugins: [
        scrollbarPlugin,
    ],
}
