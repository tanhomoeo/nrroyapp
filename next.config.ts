
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false, // Ensure this is false for production
  },
  eslint: {
    ignoreDuringBuilds: false, // Ensure this is false for production
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: [ // This is for development, not directly related to production deployment
    '6000-firebase-studio-1749841923346.cluster-ikxjzjhlifcwuroomfkjrx437g.cloudworkstations.dev',
    '9000-firebase-studio-1749841923346.cluster-ikxjzjhlifcwuroomfkjrx437g.cloudworkstations.dev',
    '3000-firebase-studio-1749841923346.cluster-ikxjzjhlifcwuroomfkjrx437g.cloudworkstations.dev',
  ],
  experimental: {
  },
};

export default nextConfig;
