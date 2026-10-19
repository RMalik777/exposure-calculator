import { createContext, useContext, useEffect, useState } from "react";
import { ScriptOnce } from "@tanstack/react-router";

export type Theme = "light" | "dark" | "system";

export const THEMES: readonly Theme[] = ["light", "dark", "system"];

const STORAGE_KEY = "theme";

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

function isTheme(value: unknown): value is Theme {
	return THEMES.some((theme) => theme === value);
}

// Runs before first paint so the page never flashes the wrong theme.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}var e=document.documentElement;e.classList.add(t);e.style.colorScheme=t}catch(e){}})();`;

function applyTheme(theme: Theme) {
	const resolved =
		theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;
	const root = document.documentElement;
	root.classList.remove("light", "dark");
	root.classList.add(resolved);
	root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { readonly children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>("system");
	const [mounted, setMounted] = useState(false);

	// localStorage only exists in the browser, so read it after hydration.
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (isTheme(stored)) setThemeState(stored);
		setMounted(true);
	}, []);

	useEffect(() => {
		if (mounted) applyTheme(theme);
	}, [theme, mounted]);

	useEffect(() => {
		if (!mounted || theme !== "system") return;
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => applyTheme("system");
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, [theme, mounted]);

	function setTheme(next: Theme) {
		localStorage.setItem(STORAGE_KEY, next);
		setThemeState(next);
	}

	return (
		<ThemeProviderContext value={{ theme, setTheme }}>
			<ScriptOnce>{THEME_SCRIPT}</ScriptOnce>
			{children}
		</ThemeProviderContext>
	);
}

export function useTheme() {
	const context = useContext(ThemeProviderContext);
	if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
	return context;
}
