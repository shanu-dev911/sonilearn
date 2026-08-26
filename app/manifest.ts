import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'SoniLearn - Daily Practice & Battleground',
        short_name: 'SoniLearn',
        description: 'Daily Challenges, Current Affairs, PYQ, Weak Practice, Warrior Battleground & Live Leaderboard.',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#2563eb',
        icons: [
            {
                src: '/logo.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
    };
}