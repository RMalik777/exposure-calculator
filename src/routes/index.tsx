import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { CompensationTable } from "#/components/compensation-table";
import { PostAdjustment } from "#/components/post-adjustment";
import { SettingsComparison, complete, otherSide } from "#/components/settings-comparison";
import type { DraftSettings, Side } from "#/components/settings-comparison";
import { compensate, formatStops, stopUnit } from "#/lib/exposure";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const [drafts, setDrafts] = useState<Record<Side, DraftSettings>>({
		A: { iso: 100, shutter: 1 / 125, aperture: 8 },
		B: { iso: 400, shutter: 1 / 250, aperture: 5.6 },
	});
	const [referenceSide, setReferenceSide] = useState<Side>("A");
	const targetSide = otherSide(referenceSide);

	const reference = complete(drafts[referenceSide]);
	const target = complete(drafts[targetSide]);
	const compensation = reference && target ? compensate(reference, target) : null;
	const matched = compensation !== null && Math.abs(compensation.change) < 0.005;

	return (
		<main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-6 md:px-8 md:py-12">
			<h1 className="font-heading text-lg font-medium">Exposure stop calculator</h1>

			<SettingsComparison
				drafts={drafts}
				referenceSide={referenceSide}
				onReferenceChange={setReferenceSide}
				onSwap={() => setDrafts(({ A, B }) => ({ A: B, B: A }))}
				onChange={(side, parameter, value) =>
					setDrafts((previous) => ({ ...previous, [side]: { ...previous[side], [parameter]: value } }))
				}
			/>

			{compensation && target && (
				<section aria-labelledby="match-heading" className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<h2 id="match-heading" className="font-heading text-base font-medium">
							Match {targetSide} to {referenceSide}
						</h2>
						<p className="text-sm text-muted-foreground">
							{matched
								? `No change needed. ${targetSide} already matches ${referenceSide}.`
								: `Shift ${targetSide} by ${formatStops(compensation.change)} ${stopUnit(compensation.change)}, in camera or in post.`}
						</p>
					</div>
					{!matched && (
						<div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
							<CompensationTable compensation={compensation} target={target} targetSide={targetSide} />
							<PostAdjustment change={compensation.change} referenceSide={referenceSide} targetSide={targetSide} />
						</div>
					)}
				</section>
			)}
		</main>
	);
}
