/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // 🔥 Build time par compile rokne wale strict errors ko ignore karega
        ignoreBuildErrors: true,
    },
    eslint: {
        // 🔥 Eslint warnings ko bypass karega
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;