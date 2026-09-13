import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ffmpeg-installer/ffmpeg resolves its platform-specific binary package
  // via a computed `require(...)` at runtime, which Next.js's Server
  // Component bundler can't statically follow — it errors the build with
  // "Module not found" for the branches it can't resolve. Opting it out of
  // bundling makes Next.js use plain Node `require` for it instead, which
  // handles the dynamic path fine.
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg"],
};

export default nextConfig;
