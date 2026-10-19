import { Fragment } from "react";
import { ArrowLeftRightIcon } from "lucide-react";

import { StopValueCombobox } from "#/components/stop-value-combobox";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Field, FieldDescription } from "#/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import {
	FORMATTERS,
	PARAMETERS,
	PARAMETER_LABELS,
	PARSERS,
	STANDARD_VALUES,
	formatEv,
	formatStops,
	stopDifference,
	stopPosition,
	stopUnit,
} from "#/lib/exposure";
import type { Parameter, Settings } from "#/lib/exposure";

export type Side = "A" | "B";

export type DraftSettings = Record<Parameter, number | null>;

export const SIDES: readonly Side[] = ["A", "B"];

export function otherSide(side: Side): Side {
	return side === "A" ? "B" : "A";
}

export function complete(draft: DraftSettings): Settings | null {
	const { iso, shutter, aperture } = draft;
	return iso === null || shutter === null || aperture === null ? null : { iso, shutter, aperture };
}

const FIELDS: Record<Parameter, { placeholder: string; hint: string }> = {
	iso: { placeholder: "100", hint: "Enter a number, e.g. 640." },
	shutter: { placeholder: "1/125", hint: "Enter a fraction or seconds, e.g. 1/250 or 2s." },
	aperture: { placeholder: "f/8", hint: "Enter an f-number, e.g. f/5.6." },
};

function describe(total: number, targetSide: Side, referenceSide: Side) {
	if (Math.abs(total) < 0.005) return `${targetSide} and ${referenceSide} have the same exposure.`;
	const amount = formatStops(Math.abs(total)).replace("+", "");
	return `${targetSide} is ${amount} ${stopUnit(total)} ${total > 0 ? "brighter" : "darker"} than ${referenceSide}.`;
}

type SettingsComparisonProps = {
	drafts: Record<Side, DraftSettings>;
	referenceSide: Side;
	onReferenceChange: (side: Side) => void;
	onSwap: () => void;
	onChange: (side: Side, parameter: Parameter, value: number | null) => void;
};

export function SettingsComparison({
	drafts,
	referenceSide,
	onReferenceChange,
	onSwap,
	onChange,
}: SettingsComparisonProps) {
	const targetSide = otherSide(referenceSide);
	const reference = complete(drafts[referenceSide]);
	const target = complete(drafts[targetSide]);
	const total = reference && target ? stopDifference(reference, target).total : null;

	function rowDifference(parameter: Parameter) {
		const from = drafts[referenceSide][parameter];
		const to = drafts[targetSide][parameter];
		return from === null || to === null ? null : stopPosition(parameter, to) - stopPosition(parameter, from);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Compare settings</CardTitle>
				<CardDescription>Pick a value or type your own.</CardDescription>
				<CardAction className="flex items-center gap-2">
					<span id="reference-label" className="hidden text-sm text-muted-foreground sm:inline">
						Reference
					</span>
					<ToggleGroup
						aria-labelledby="reference-label"
						variant="outline"
						spacing={0}
						value={[referenceSide]}
						onValueChange={(value) => {
							const side = SIDES.find((s) => s === value[0]);
							if (side) onReferenceChange(side);
						}}
					>
						{SIDES.map((side) => (
							<ToggleGroupItem key={side} value={side}>
								{side}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
					<Button variant="outline" onClick={onSwap} aria-label="Swap A and B">
						<ArrowLeftRightIcon data-icon="inline-start" />
						<span className="hidden sm:inline">Swap</span>
					</Button>
				</CardAction>
			</CardHeader>

			<CardContent>
				<div className="grid grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 md:grid-cols-[7rem_minmax(0,1fr)_5rem_minmax(0,1fr)] md:gap-y-4">
					<div className="hidden md:block" />
					{SIDES.map((side, index) => (
						<Fragment key={side}>
							{index === 1 && (
								<div className="flex h-7 items-center justify-center self-end text-xs text-muted-foreground">
									{targetSide} vs {referenceSide}
								</div>
							)}
							<div id={`${side}-heading`} className="flex h-7 items-center gap-2 self-end">
								<span className="font-heading text-base font-medium">{side}</span>
								{side === referenceSide && <Badge>Reference</Badge>}
							</div>
						</Fragment>
					))}

					{PARAMETERS.map((parameter) => {
						const difference = rowDifference(parameter);
						return (
							<Fragment key={parameter}>
								<div
									id={`${parameter}-label`}
									className="col-span-3 pt-2 text-sm font-medium md:col-span-1 md:flex md:h-8 md:items-center md:pt-0"
								>
									{PARAMETER_LABELS[parameter]}
								</div>
								{SIDES.map((side, index) => {
									const id = `${side}-${parameter}`;
									const invalid = drafts[side][parameter] === null;
									return (
										<Fragment key={side}>
											{index === 1 && (
												<div className="flex h-8 items-center justify-center text-sm tabular-nums">
													<span className={difference === 0 || difference === null ? "text-muted-foreground" : ""}>
														{difference === null ? "—" : formatStops(difference)}
													</span>
												</div>
											)}
											<Field data-invalid={invalid || undefined}>
												<StopValueCombobox
													id={id}
													items={STANDARD_VALUES[parameter]}
													value={drafts[side][parameter]}
													onValueChange={(value) => onChange(side, parameter, value)}
													format={FORMATTERS[parameter]}
													parse={PARSERS[parameter]}
													placeholder={FIELDS[parameter].placeholder}
													aria-labelledby={`${parameter}-label ${side}-heading`}
													aria-describedby={invalid ? `${id}-hint` : undefined}
												/>
												{invalid && <FieldDescription id={`${id}-hint`}>{FIELDS[parameter].hint}</FieldDescription>}
											</Field>
										</Fragment>
									);
								})}
							</Fragment>
						);
					})}
				</div>
			</CardContent>

			<CardFooter className="flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
				{total === null ? (
					<p className="text-sm text-muted-foreground">Fill in all six settings to compare.</p>
				) : (
					<>
						<p className="font-heading text-3xl font-medium tabular-nums">
							{formatStops(total)} <span className="text-base text-muted-foreground">{stopUnit(total)}</span>
						</p>
						<p className="text-sm text-muted-foreground">
							{describe(total, targetSide, referenceSide)} {formatEv(total)} EV.
						</p>
					</>
				)}
			</CardFooter>
		</Card>
	);
}
