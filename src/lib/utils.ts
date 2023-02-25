export function classes(...classes: (false | null | undefined | string)[]): string {
	return classes.filter(Boolean).join(' ');
}

export function usd(value: number | string | null): string {
	if (!value) {
		return '';
	}
	if (typeof value === 'string') {
		value = parseFloat(value);
	}
	return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function nullish(value: { id: number; value: string }[] | null): string {
	return !value ? '' : value[0]?.value ?? '';
}
