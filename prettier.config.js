//  @ts-check

/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
	useTabs: true,
	printWidth: 120,
	tabWidth: 2,
	plugins: ["prettier-plugin-tailwindcss"],
	tailwindStylesheet: "./src/styles.css",
	tailwindFunctions: ["cva", "cn", "clsx", "tw", "tv"],
};

export default config;
