// Tailwind for `next build --webpack` (production). `next dev` uses the Turbopack loader in next.config.ts.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
