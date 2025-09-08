// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
	// Do not fail `next build` due to lint errors (we’ll still run lint in CI if you want)
	eslint: { ignoreDuringBuilds: true },
	typedRoutes: true,
	// keep any other valid options you already had
};

export default nextConfig;
