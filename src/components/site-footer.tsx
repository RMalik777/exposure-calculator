import { buttonVariants } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";

const REPO_URL = "https://github.com/RMalik777/exposure-calculator";

// Inline with the footer text, so drop the button's height and padding.
const LINK_CLASS = buttonVariants({ variant: "link", className: "h-auto p-0" });

export function SiteFooter() {
	return (
		<footer className="mx-auto w-full max-w-4xl px-4 pb-6 md:px-8 md:pb-12">
			<Separator />
			<div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pt-4 text-sm text-muted-foreground">
				<p>
					© 2026 Rafli Malik. Released under the{" "}
					<a href={`${REPO_URL}/blob/main/LICENSE`} className={LINK_CLASS}>
						MIT License
					</a>
					.
				</p>
				<div className="flex gap-4">
					<a href={REPO_URL} className={LINK_CLASS}>
						GitHub
					</a>
					<a href="https://raflimalik.com" className={LINK_CLASS}>
						raflimalik.com
					</a>
				</div>
			</div>
		</footer>
	);
}
