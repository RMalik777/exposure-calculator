import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { THEMES, useTheme } from "#/components/theme-provider";
import type { Theme } from "#/components/theme-provider";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";

const OPTIONS: Record<Theme, { label: string; icon: typeof SunIcon }> = {
	light: { label: "Light", icon: SunIcon },
	dark: { label: "Dark", icon: MoonIcon },
	system: { label: "System", icon: MonitorIcon },
};

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<ToggleGroup
			aria-label="Theme"
			variant="outline"
			size="sm"
			spacing={0}
			value={[theme]}
			onValueChange={(value) => {
				const next = THEMES.find((t) => t === value[0]);
				if (next) setTheme(next);
			}}
		>
			{THEMES.map((option) => {
				const { label, icon: Icon } = OPTIONS[option];
				return (
					<ToggleGroupItem key={option} value={option} aria-label={label} title={label}>
						<Icon />
					</ToggleGroupItem>
				);
			})}
		</ToggleGroup>
	);
}
