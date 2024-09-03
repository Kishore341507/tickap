/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'cdn.discordapp.com',
            port: '',
            pathname: '/**',
          },
          {
            protocol: 'https',
            hostname: 'tickap.com',
            port: '',
            pathname: '/**',
          },
        ],
    },
    logging : {
      fetches : {
        fullUrl : true

      }
    }
};

export default nextConfig;
