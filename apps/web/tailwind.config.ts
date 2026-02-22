import type { Config } from "tailwindcss";
import sharedConfig from "@pool-picks/tailwind-config";

const config: Config = {
  ...sharedConfig,
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
};

export default config;
