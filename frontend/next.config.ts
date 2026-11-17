import type { NextConfig } from "next";

/** Static export served by the FastAPI backend; trailing slashes emit nda/index.html. */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
