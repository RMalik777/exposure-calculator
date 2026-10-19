import { useState } from "react";

import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "#/components/ui/combobox";

type StopValueComboboxProps = {
	id: string;
	items: readonly number[];
	value: number | null;
	onValueChange: (value: number | null) => void;
	format: (value: number) => string;
	parse: (text: string) => number | null;
	placeholder?: string;
	"aria-describedby"?: string;
	"aria-labelledby"?: string;
};

/** Pick a standard value from the list, or type any value the parser accepts. */
export function StopValueCombobox({
	id,
	items,
	value,
	onValueChange,
	format,
	parse,
	placeholder,
	"aria-describedby": describedBy,
	"aria-labelledby": labelledBy,
}: StopValueComboboxProps) {
	const [text, setText] = useState(() => (value === null ? "" : format(value)));
	const [syncedValue, setSyncedValue] = useState(value);

	// Follow changes made outside this input (e.g. swapping A and B) without
	// rewriting text the user is still typing.
	if (value !== syncedValue) {
		setSyncedValue(value);
		if (value !== null && value !== parse(text)) setText(format(value));
	}

	const selected = items.find((item) => item === value) ?? null;
	const invalid = text.trim() !== "" && parse(text) === null;

	return (
		<Combobox
			items={items}
			filter={null}
			value={selected}
			onValueChange={(item) => {
				if (item === null) return;
				setText(format(item));
				setSyncedValue(item);
				onValueChange(item);
			}}
			inputValue={text}
			onInputValueChange={(next, details) => {
				// Only follow typing. On blur Base UI sends "input-clear" for text that is
				// not a list item, which would wipe free-entry values like 1/37.
				if (details.reason !== "input-change") return;
				const parsed = parse(next);
				setText(next);
				setSyncedValue(parsed);
				onValueChange(parsed);
			}}
			itemToStringLabel={format}
		>
			<ComboboxInput
				id={id}
				placeholder={placeholder}
				aria-invalid={invalid || text.trim() === ""}
				aria-describedby={describedBy}
				aria-labelledby={labelledBy}
				autoComplete="off"
				onFocus={(event) => {
					// Select all so a new value can be typed straight over the old one.
					// Deferred so a mouse click's caret placement doesn't undo it.
					const input = event.currentTarget;
					requestAnimationFrame(() => input.select());
				}}
				onBlur={() => {
					const parsed = parse(text);
					// Tidy the text (e.g. "f2.8" to "f/2.8") only when that keeps the same value.
					if (parsed !== null && parse(format(parsed)) === parsed) setText(format(parsed));
				}}
			/>
			<ComboboxContent>
				<ComboboxList>
					{(item: number) => (
						<ComboboxItem key={item} value={item}>
							{format(item)}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}
