/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three', '@react-three/drei', '@react-three/fiber'],
  // Note: an `images` key might be needed here if you are using next/image with external domains
  // For example:
  // images: {
  //   unoptimized: true, // or configure domains
  // },
  webpack: (config, { isServer }) => {
    // This is to prevent server-side bundling of client-side libraries.
    // 'jspdf' and 'html2canvas' are used for client-side PDF generation
    // and can cause errors during server-side build if not handled.
    if (isServer) {
      config.externals.push('jspdf', 'html2canvas');
    }
    return config;
  },
};

module.exports = nextConfig;
