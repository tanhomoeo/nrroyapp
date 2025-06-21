

const nextConfig = {
  typescript: {
    ignoreBuildErrors: false, // Ensure this is false for production
  },
  eslint: {
    ignoreDuringBuilds: false, // Ensure this is false for production
  },
  experimental: {
    serverComponentsExternalPackages: ['@opentelemetry/instrumentation', 'handlebars'],
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
};

export default nextConfig;
