export type Parameter = "iso" | "shutter" | "aperture";

export type Settings = Record<Parameter, number>;

export const PARAMETERS: readonly Parameter[] = ["iso", "shutter", "aperture"];

export const PARAMETER_LABELS: Record<Parameter, string> = {
	iso: "ISO",
	shutter: "Shutter speed",
	aperture: "Aperture",
};

export const PARAMETER_SHORT_LABELS: Record<Parameter, string> = {
	iso: "ISO",
	shutter: "Shutter",
	aperture: "Aperture",
};

// Marked (nominal) camera values in 1/3-stop steps. Cameras label these with
// rounded numbers; internally each one sits exactly on a third-stop position.
export const ISO_VALUES: readonly number[] = [
	50, 64, 80, 100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6400,
	8000, 10000, 12800, 16000, 20000, 25600, 32000, 40000, 51200, 64000, 80000, 102400,
];

export const SHUTTER_VALUES: readonly number[] = [
	...[
		8000, 6400, 5000, 4000, 3200, 2500, 2000, 1600, 1250, 1000, 800, 640, 500, 400, 320, 250, 200, 160, 125, 100, 80,
		60, 50, 40, 30, 25, 20, 15, 13, 10, 8, 6, 5, 4,
	].map((denominator) => 1 / denominator),
	0.3,
	0.4,
	0.5,
	0.6,
	0.8,
	1,
	1.3,
	1.6,
	2,
	2.5,
	3.2,
	4,
	5,
	6,
	8,
	10,
	13,
	15,
	20,
	25,
	30,
];

export const APERTURE_VALUES: readonly number[] = [
	1, 1.1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 14, 16, 18, 20,
	22, 25, 29, 32,
];

export const STANDARD_VALUES: Record<Parameter, readonly number[]> = {
	iso: ISO_VALUES,
	shutter: SHUTTER_VALUES,
	aperture: APERTURE_VALUES,
};

// Exposure position in stops, relative to ISO 100, 1s, f/1. Higher = brighter.
const toRawStops: Record<Parameter, (value: number) => number> = {
	iso: (iso) => Math.log2(iso / 100),
	shutter: (seconds) => Math.log2(seconds),
	aperture: (fNumber) => -2 * Math.log2(fNumber),
};

const fromStops: Record<Parameter, (stops: number) => number> = {
	iso: (stops) => 100 * 2 ** stops,
	shutter: (stops) => 2 ** stops,
	aperture: (stops) => 2 ** (-stops / 2),
};

function isStandard(parameter: Parameter, value: number) {
	return STANDARD_VALUES[parameter].some((standard) => Math.abs(value / standard - 1) < 1e-9);
}

export function stopPosition(parameter: Parameter, value: number) {
	const raw = toRawStops[parameter](value);
	return isStandard(parameter, value) ? Math.round(raw * 3) / 3 : raw;
}

export type StopDifference = Record<Parameter | "total", number>;

/** Stops of `b` relative to `a`. Positive means `b` is brighter. */
export function stopDifference(a: Settings, b: Settings): StopDifference {
	const iso = stopPosition("iso", b.iso) - stopPosition("iso", a.iso);
	const shutter = stopPosition("shutter", b.shutter) - stopPosition("shutter", a.shutter);
	const aperture = stopPosition("aperture", b.aperture) - stopPosition("aperture", a.aperture);
	return { iso, shutter, aperture, total: iso + shutter + aperture };
}

export type Suggestion = {
	exact: number;
	nearest: number;
	/** Stops the nearest standard value ends up over (+) or under (−) the reference. */
	residual: number;
	outOfRange: boolean;
};

export function snapToStandard(parameter: Parameter, value: number) {
	const target = toRawStops[parameter](value);
	let nearest = STANDARD_VALUES[parameter][0];
	for (const standard of STANDARD_VALUES[parameter]) {
		if (Math.abs(stopPosition(parameter, standard) - target) < Math.abs(stopPosition(parameter, nearest) - target)) {
			nearest = standard;
		}
	}
	return nearest;
}

function suggest(parameter: Parameter, position: number): Suggestion {
	const nearest = snapToStandard(parameter, fromStops[parameter](position));
	const residual = stopPosition(parameter, nearest) - position;
	const positions = STANDARD_VALUES[parameter].map((standard) => stopPosition(parameter, standard));
	const halfStep = 1 / 6;
	return {
		// On a third stop, show the marked value (1/1000) rather than the true one (1/1024).
		exact: Math.abs(residual) < 1e-6 ? nearest : fromStops[parameter](position),
		nearest,
		residual,
		outOfRange: position < Math.min(...positions) - halfStep || position > Math.max(...positions) + halfStep,
	};
}

export type Compensation = Record<Parameter, Suggestion> & {
	/** Stops the target must shift to match the reference. */
	change: number;
};

/** Ways to change a single setting on `target` so it matches `reference`. */
export function compensate(reference: Settings, target: Settings): Compensation {
	const change = -stopDifference(reference, target).total;
	return {
		change,
		iso: suggest("iso", stopPosition("iso", target.iso) + change),
		shutter: suggest("shutter", stopPosition("shutter", target.shutter) + change),
		aperture: suggest("aperture", stopPosition("aperture", target.aperture) + change),
	};
}

function positiveOrNull(value: number) {
	return Number.isFinite(value) && value > 0 ? value : null;
}

const NUMBER = String.raw`(\d+(?:\.\d+)?|\.\d+)`;
const ISO_PATTERN = new RegExp(String.raw`^(?:iso\s*)?${NUMBER}$`, "i");
const FRACTION_PATTERN = new RegExp(String.raw`^${NUMBER}\s*/\s*${NUMBER}$`);
const SECONDS_PATTERN = new RegExp(String.raw`^${NUMBER}\s*(?:s|sec|"|″)?$`, "i");
const APERTURE_PATTERN = new RegExp(String.raw`^(?:[fƒ]\s*/?\s*)?${NUMBER}$`, "i");

export function parseIso(text: string) {
	const match = ISO_PATTERN.exec(text.trim());
	return match ? positiveOrNull(Number(match[1])) : null;
}

export function parseShutter(text: string) {
	const trimmed = text.trim();
	const fraction = FRACTION_PATTERN.exec(trimmed);
	if (fraction) return positiveOrNull(Number(fraction[1]) / Number(fraction[2]));
	const seconds = SECONDS_PATTERN.exec(trimmed);
	return seconds ? positiveOrNull(Number(seconds[1])) : null;
}

export function parseAperture(text: string) {
	const match = APERTURE_PATTERN.exec(text.trim());
	return match ? positiveOrNull(Number(match[1])) : null;
}

function trimDecimals(value: number, digits: number) {
	return String(Number(value.toFixed(digits)));
}

export function formatIso(iso: number) {
	return String(Math.round(iso));
}

export function formatShutter(seconds: number) {
	// Below ~0.3s cameras show reciprocals (1/4, 1/5, ...); above, decimal seconds.
	if (seconds < 0.29) return `1/${Math.round(1 / seconds)}`;
	return `${trimDecimals(seconds, seconds < 10 ? 2 : 0)}s`;
}

export function formatAperture(fNumber: number) {
	return `f/${trimDecimals(fNumber, 1)}`;
}

export const FORMATTERS: Record<Parameter, (value: number) => string> = {
	iso: formatIso,
	shutter: formatShutter,
	aperture: formatAperture,
};

export const PARSERS: Record<Parameter, (text: string) => number | null> = {
	iso: parseIso,
	shutter: parseShutter,
	aperture: parseAperture,
};

const THIRDS = ["", "⅓", "⅔"];

/** `+1⅓`, `−2`, `0`; falls back to two decimals when not on a third stop. */
export function formatStops(stops: number) {
	const thirds = Math.round(stops * 3);
	const sign = stops > 0 ? "+" : "−";
	if (Math.abs(stops * 3 - thirds) < 0.05) {
		if (thirds === 0) return "0";
		const whole = Math.floor(Math.abs(thirds) / 3);
		const fraction = THIRDS[Math.abs(thirds) % 3];
		return `${sign}${whole === 0 ? "" : whole}${fraction}`;
	}
	return `${sign}${Math.abs(stops).toFixed(2)}`;
}

/** Decimal EV, e.g. `+1.33`. */
export function formatEv(stops: number) {
	if (Math.abs(stops) < 0.005) return "0.00";
	return `${stops > 0 ? "+" : "−"}${Math.abs(stops).toFixed(2)}`;
}

export function stopUnit(stops: number) {
	return Math.abs(stops) < 1.005 ? "stop" : "stops";
}

/** Exposure slider range in Lightroom Classic and Adobe Camera Raw, in stops. */
export const POST_EXPOSURE_LIMIT = 5;
