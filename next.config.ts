import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Prints de balança/cardápio. Abaixo do limite de 4,5 MB da Vercel.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
};

export default nextConfig;
