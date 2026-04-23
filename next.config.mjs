/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['onnxruntime-web', '@imgly/background-removal'],
  swcMinify: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Configure Terser to treat inputs as ES modules so `import.meta`
      // inside onnxruntime-web bundles doesn't trip parsing.
      if (Array.isArray(config.optimization?.minimizer)) {
        config.optimization.minimizer = config.optimization.minimizer.map((plugin) => {
          if (plugin?.constructor?.name === 'TerserPlugin' && plugin.options) {
            plugin.options.terserOptions = {
              ...plugin.options.terserOptions,
              module: true,
              parse: { ...(plugin.options.terserOptions?.parse || {}), ecma: 2020 },
              compress: { ...(plugin.options.terserOptions?.compress || {}), module: true },
            };
          }
          return plugin;
        });
      }
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
