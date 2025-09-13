import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      // Augmente le délai d'attente à 2 minutes pour la génération de vidéos.
      timeout: 120,
    },
  },
  // Autorise les requêtes cross-origin depuis l'environnement de développement.
  allowedDevOrigins: [
    'https://6000-firebase-studio-1757249485337.cluster-fbfjltn375c6wqxlhoehbz44sk.cloudworkstations.dev',
  ],
};

export default nextConfig;
