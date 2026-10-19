import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { POST_EXPOSURE_LIMIT, formatEv } from "#/lib/exposure";

type PostAdjustmentProps = {
	/** Stops the target must shift to match the reference. */
	change: number;
	referenceSide: string;
	targetSide: string;
};

export function PostAdjustment({ change, referenceSide, targetSide }: PostAdjustmentProps) {
	const beyondSlider = Math.abs(change) > POST_EXPOSURE_LIMIT;

	return (
		<Card>
			<CardHeader>
				<CardTitle>In post</CardTitle>
				<CardDescription>Exposure slider in Lightroom, Camera Raw or Capture One.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col gap-3">
				<div>
					<p className="text-sm text-muted-foreground">Set Exposure on {targetSide} to</p>
					<p className="font-heading text-4xl font-medium tabular-nums">{formatEv(change)}</p>
				</div>
				{beyondSlider && <Badge variant="destructive">Beyond Lightroom's ±{POST_EXPOSURE_LIMIT} range</Badge>}
				<p className="text-sm text-muted-foreground">
					Or set {referenceSide} to {formatEv(-change)} to match the other way.
				</p>
			</CardContent>
			<CardFooter>
				<p className="text-xs text-muted-foreground">
					Works best on raw files. Darkening can't restore clipped highlights, and brightening adds noise.
				</p>
			</CardFooter>
		</Card>
	);
}
