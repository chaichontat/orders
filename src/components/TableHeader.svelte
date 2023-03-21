<script lang="ts">
	import type { OrderField } from '$lib/getter';
	import { nullish } from '$lib/utils';

	export let sortedBy: { column: string; ascending: boolean };
	export let name: string;
	export let displayName: string | undefined = undefined;
	let cl = '';
	export { cl as class };
	export let items: OrderField[];
</script>

<button
	class={cl}
	on:click={() => {
		if (sortedBy.column === name) {
			sortedBy.ascending = !sortedBy.ascending;
		} else {
			sortedBy = { column: name, ascending: true };
		}

		items.sort((a, b) => {
			if (sortedBy.ascending) {
				return nullish(a[name]).localeCompare(nullish(b[name]));
			} else {
				return nullish(b[name]).localeCompare(nullish(a[name]));
			}
		});
		items = items;
	}}
>
	{displayName ?? name}
</button>
