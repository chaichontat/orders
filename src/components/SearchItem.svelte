<script lang="ts">
	import { getView, tables, type ItemField } from '$lib/getter';
	import { classes, clickOutside } from '$lib/utils';
	import { Popover, PopoverPanel } from '@rgossiaux/svelte-headlessui';
	import { throttle } from 'lodash-es';
	import { createEventDispatcher } from 'svelte';
	import Textbox from './Textbox.svelte';
	let changing = false;

	export let label: string;
	export let value = '';
	export let clicked: number | undefined = undefined;
	export let type: keyof typeof tables;
	export let red = false;

	const dispatch = createEventDispatcher();
	const searcher = throttle((name: string) => (searchResult = getView(name, type)), 50);
	let searchResult: Promise<ItemField[]> | undefined;

	function handleClick(item: ItemField) {
		changing = false;
		clicked = item.id;
		dispatch('click', clicked);
	}

	function clearClicked() {
		clicked = undefined;
	}

	$: if (changing && value) {
		searcher(value);
	} else {
		searchResult = undefined;
	}
</script>

<div class="overflow-visible">
	<Textbox
		{label}
		bind:value
		on:change={() => (changing = true)}
		textClass={red && clicked === undefined ? 'border-red-400' : ''}
	/>

	{#if changing}
		<div class="overflow-visible" use:clickOutside={() => (changing = false)}>
			<Popover as="div" class="relative overflow-visible">
				{#await searchResult then items}
					<PopoverPanel
						static
						class="absolute left-4 -top-4 z-30 flex max-h-96 w-fit flex-col overflow-y-scroll rounded-lg border-2 bg-white py-2 px-4 text-sm shadow-inner"
					>
						{#if items && items.length > 0}
							<table class="table-auto cursor-pointer">
								{#each items as item}
									<tr
										class="rounded border-b hover:bg-neutral-100"
										on:click={() => handleClick(item)}
										on:input={clearClicked}
										on:keydown={clearClicked}
										on:paste={clearClicked}
									>
										<slot {item} />
									</tr>
								{/each}
							</table>
						{:else}
							<div class="flex  items-center justify-center">No results.</div>
						{/if}
					</PopoverPanel>
				{/await}
			</Popover>
		</div>
	{/if}
</div>
