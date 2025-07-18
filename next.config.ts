import type {NextConfig} from 'next';
import * as dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env
dotenv.config({ path: './.env' });

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
