
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
  allowedDevOrigins: [
    'https://3000-firebase-studio-1749841923346.cluster-ikxjzjhlifcwuroomfkjrx437g.cloudworkstations.dev',
  ],
};

export default nextConfig;

