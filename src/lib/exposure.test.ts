import { describe, expect, it } from "vitest";

import {
	APERTURE_VALUES,
	ISO_VALUES,
	SHUTTER_VALUES,
	compensate,
	formatAperture,
	formatShutter,
	formatStops,
	parseAperture,
	parseIso,
	parseShutter,
	stopDifference,
} from "./exposure";

describe("parsing", () => {
	it("parses ISO", () => {
		expect(parseIso("640")).toBe(640);
		expect(parseIso("ISO 100")).toBe(100);
		expect(parseIso("abc")).toBeNull();
		expect(parseIso("0")).toBeNull();
	});

	it("parses shutter speed", () => {
		expect(parseShutter("1/250")).toBe(1 / 250);
		expect(parseShutter("0.5")).toBe(0.5);
		expect(parseShutter("2s")).toBe(2);
		expect(parseShutter('2"')).toBe(2);
		expect(parseShutter("1/0")).toBeNull();
		expect(parseShutter("fast")).toBeNull();
	});

	it("parses aperture", () => {
		expect(parseAperture("f/2.8")).toBe(2.8);
		expect(parseAperture("f2.8")).toBe(2.8);
		expect(parseAperture("2.8")).toBe(2.8);
		expect(parseAperture("f/")).toBeNull();
	});
});

describe("formatting", () => {
	it("formats stops as thirds when close", () => {
		expect(formatStops(0)).toBe("0");
		expect(formatStops(2)).toBe("+2");
		expect(formatStops(-1)).toBe("−1");
		expect(formatStops(4 / 3)).toBe("+1⅓");
		expect(formatStops(-2 / 3)).toBe("−⅔");
		expect(formatStops(0.5)).toBe("+0.50");
	});

	it("formats shutter and aperture", () => {
		expect(formatShutter(1 / 250)).toBe("1/250");
		expect(formatShutter(0.3)).toBe("0.3s");
		expect(formatShutter(30)).toBe("30s");
		expect(formatAperture(5.6)).toBe("f/5.6");
		expect(formatAperture(8)).toBe("f/8");
	});
});

describe("standard scales", () => {
	it("has one value per third stop", () => {
		for (const list of [ISO_VALUES, SHUTTER_VALUES, APERTURE_VALUES]) {
			expect(new Set(list).size).toBe(list.length);
		}
		expect(ISO_VALUES).toHaveLength(34);
		expect(SHUTTER_VALUES).toHaveLength(55);
		expect(APERTURE_VALUES).toHaveLength(31);
	});
});

describe("stopDifference", () => {
	const a = { iso: 100, shutter: 1 / 125, aperture: 8 };
	const b = { iso: 400, shutter: 1 / 250, aperture: 5.6 };

	it("treats standard values as exact third stops", () => {
		const diff = stopDifference(a, b);
		expect(diff.iso).toBeCloseTo(2);
		expect(diff.shutter).toBeCloseTo(-1);
		expect(diff.aperture).toBeCloseTo(1);
		expect(diff.total).toBeCloseTo(2);
	});

	it("handles 1/60 to 1/125 and f/2.8 to f/4 as one stop", () => {
		expect(stopDifference({ ...a, shutter: 1 / 60 }, a).shutter).toBeCloseTo(-1);
		expect(stopDifference({ ...a, aperture: 2.8 }, { ...a, aperture: 4 }).aperture).toBeCloseTo(-1);
	});

	it("uses raw values for non-standard entries", () => {
		expect(stopDifference(a, { ...a, iso: 141 }).iso).toBeCloseTo(Math.log2(1.41));
	});
});

describe("compensate", () => {
	const reference = { iso: 100, shutter: 1 / 125, aperture: 8 };
	const target = { iso: 400, shutter: 1 / 250, aperture: 5.6 };

	it("suggests one change per parameter", () => {
		const result = compensate(reference, target);
		expect(result.change).toBeCloseTo(-2);
		expect(result.iso.nearest).toBe(100);
		expect(result.shutter.nearest).toBe(1 / 1000);
		expect(result.aperture.nearest).toBe(11);
		expect(result.shutter.exact).toBe(1 / 1000);
		for (const s of [result.iso, result.shutter, result.aperture]) {
			expect(s.residual).toBeCloseTo(0);
			expect(s.outOfRange).toBe(false);
		}
	});

	it("reports residual for in-between results", () => {
		const result = compensate({ ...reference, iso: 141 }, { ...reference });
		expect(result.iso.exact).toBeCloseTo(141);
		expect(result.iso.nearest).toBe(125);
		expect(result.iso.residual).toBeCloseTo(Math.log2(125 / 141), 1);
	});

	it("flags values outside the scale", () => {
		const result = compensate({ ...reference, iso: 25 }, { ...reference });
		expect(result.iso.exact).toBeCloseTo(25);
		expect(result.iso.outOfRange).toBe(true);
	});
});
