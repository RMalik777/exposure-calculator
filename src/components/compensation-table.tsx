import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#/components/ui/table";
import { FORMATTERS, PARAMETERS, PARAMETER_SHORT_LABELS, formatStops } from "#/lib/exposure";
import type { Compensation, Settings } from "#/lib/exposure";

type CompensationTableProps = {
	compensation: Compensation;
	target: Settings;
	targetSide: string;
};

export function CompensationTable({ compensation, target, targetSide }: CompensationTableProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>In camera</CardTitle>
				<CardDescription>Change any one setting on {targetSide}.</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Setting</TableHead>
							<TableHead className="hidden sm:table-cell">Now</TableHead>
							<TableHead>Set to</TableHead>
							<TableHead className="hidden lg:table-cell">Exact</TableHead>
							<TableHead className="text-right">Off by</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{PARAMETERS.map((parameter) => {
							const format = FORMATTERS[parameter];
							const suggestion = compensation[parameter];
							return (
								<TableRow key={parameter}>
									<TableCell>{PARAMETER_SHORT_LABELS[parameter]}</TableCell>
									<TableCell className="hidden text-muted-foreground sm:table-cell">
										{format(target[parameter])}
									</TableCell>
									<TableCell>
										{suggestion.outOfRange ? (
											<Badge variant="destructive">Out of range</Badge>
										) : (
											<span className="font-heading text-base font-medium">{format(suggestion.nearest)}</span>
										)}
									</TableCell>
									<TableCell className="hidden text-muted-foreground tabular-nums lg:table-cell">
										{format(suggestion.exact)}
									</TableCell>
									<TableCell className="text-right text-muted-foreground tabular-nums">
										{suggestion.outOfRange ? "—" : formatStops(suggestion.residual)}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
