import type { NextConfig } from "next";

const storageOrigin = (() => {
  const raw =
    process.env.NEXT_PUBLIC_STORAGE_URL ?? "http://localhost:8000/storage";
  try {
    return new URL(raw.replace(/\/storage\/?$/, "") || raw);
  } catch {
    return new URL("http://localhost:8000");
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: storageOrigin.protocol.replace(":", "") as "http" | "https",
        hostname: storageOrigin.hostname,
        ...(storageOrigin.port ? { port: storageOrigin.port } : {}),
        pathname: "/storage/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
