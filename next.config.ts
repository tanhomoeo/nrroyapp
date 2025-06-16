
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false, // Changed to false
  },
  eslint: {
    ignoreDuringBuilds: false, // Changed to false
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
    '6000-firebase-studio-1749841923346.cluster-ikxjzjhlifcwuroomfkjrx437g.cloudworkstations.dev',
    '9000-firebase-studio-1749841923346.cluster-ikxjzjhlifcwuroomfkjrx437g.cloudworkstations.dev',
    '3000-firebase-studio-1749841923346.cluster-ikxjzjhlifcwuroomfkjrx437g.cloudworkstations.dev',
  ],
  experimental: {
  },
};

export default nextConfig;
