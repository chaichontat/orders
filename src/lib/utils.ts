import tippy from 'tippy.js';

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

export function nullish(value: { id: number; value: string }[] | null | string): string {
	if (typeof value === 'string') {
		return value;
	}
	return !value ? '' : value[0]?.value ?? '';
}

export function clickOutside(node: HTMLElement, f?: () => void) {
	const handleClick = (event: MouseEvent) => {
		if (node && !node.contains(event.target) && !event.defaultPrevented) {
			f ? f() : node.dispatchEvent(new CustomEvent('outclick'));
		}
	};

	document.addEventListener('click', handleClick, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}

export function today(): string {
	return new Date().toISOString().slice(0, 10);
}

export function tooltip(
	node: HTMLElement,
	{ content, enabled = true }: { content: string; enabled?: boolean }
) {
	if (enabled) {
		node.setAttribute('aria-label', content);
		node.title = '';
		const tip = tippy(node, { content, delay: [50, 0] });
		return {
			update: (newmsg: string): void => tip.setContent(newmsg),
			destroy: (): void => tip.destroy()
		};
	}
}
