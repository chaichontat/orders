<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Field } from '../../lib/getter';
	import { getOrders, test_auth } from '../../lib/getter';
	import { classes, nullish, usd } from '../../lib/utils';

	const token = localStorage.getItem('token');
	if (!token) {
		goto('/');
	}

	test_auth(token!).catch(() => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		goto('/');
	});

	let selected: 'new' | 'ordered' | 'received' = 'new';

	let items: Field[] = [];

	$: getOrders({ view: selected }).then((res) => {
		items = res;
	});
</script>

<nav class="flex items-center gap-x-2 bg-slate-700">
	<div class="h-14 w-14 bg-orange-600" />
	<section class="flex flex-wrap p-2 text-sm text-gray-400">
		<button
			class={classes(
				'rounded-l-lg border  p-2 px-4',
				selected === 'new'
					? 'text-semibold border-neutral-200 bg-slate-500 text-white'
					: 'border-neutral-400 hover:bg-slate-600'
			)}
			on:click={() => (selected = 'new')}>New</button
		>
		<button
			class={classes(
				'border-y border-neutral-400 p-2 px-4',
				selected === 'ordered'
					? 'text-semibold border-neutral-200 bg-slate-500 text-white'
					: 'border-neutral-400 hover:bg-slate-600'
			)}
			on:click={() => (selected = 'ordered')}>Ordered</button
		>
		<button
			class={classes(
				'rounded-r-lg border border-neutral-400 p-2 px-4',
				selected === 'received'
					? 'text-semibold border-neutral-200 bg-slate-500 text-white'
					: 'border-neutral-400 hover:bg-slate-600'
			)}
			on:click={() => (selected = 'received')}>Received</button
		>
	</section>
	<button
		class=" rounded-lg bg-sky-500 px-4 py-2 text-sm text-neutral-100 transition-colors duration-100 hover:bg-sky-600 active:bg-sky-700"
	>
		Add Request
	</button>
</nav>
<!--
<aside class="fixed top-0 left-0 flex h-full w-48 flex-col bg-slate-600">
</aside> -->

<main class="bg-neutral-100">
	<section class="p-4">
		<div
			class="header text-semibold flex h-8 flex-shrink-0 items-center justify-between gap-x-3 px-1 pr-3 text-xs"
		>
			<div class="ml-2 -mr-1 flex-[1]"><input type="checkbox" /></div>
			<div class="flex-[12]">Item Name</div>
			<div class="flex-[6]">Vendor</div>
			<div class="flex-[5]">Total</div>
			<div class="flex-[6]">Grant</div>
			<div class="flex-[5]">From</div>
			<div class="flex-[4]">Submitted</div>
		</div>

		<div
			class="listing flex min-w-min flex-grow flex-col overflow-hidden rounded-lg border text-sm text-gray-700"
		>
			{#each items as item}
				<div class="row flex flex-shrink-0 items-center justify-between gap-x-3 py-5 px-1 pr-3">
					<div class="ml-2 -mr-1 flex-[1]">
						<input type="checkbox" />
					</div>
					<div class="flex-[12]">
						<div
							class="clamp cursor-pointer overflow-hidden underline decoration-sky-300 decoration-dotted underline-offset-4"
						>
							{nullish(item.Item)}
						</div>
						{#if item.Notes}
							<div class="mt-1 text-xs text-neutral-500">📌 {item.Notes}</div>
						{/if}
					</div>
					<div class="cell flex flex-[6] flex-col justify-center">
						<div class="text-sm">{nullish(item.Vendor)}</div>
						<div class="mt-1 text-xs text-neutral-500">{nullish(item['Cat #'])}</div>
					</div>
					<div class="flex-[5]">
						<div class="text-sm">{usd(item.Price)}</div>
						<div class="mt-1 text-xs text-neutral-500">
							{`${usd(item['Unit Price'])} × ${item['Quantity']} `}
						</div>
					</div>
					<div class="flex-[6] text-ellipsis whitespace-nowrap text-xs text-neutral-500">
						{nullish(item['Grant'])}
					</div>
					<div class="flex-[5] text-neutral-600">
						{item['Requestor'] ? item['Requestor'].value : ''}
					</div>
					<div class="flex-[4] text-neutral-600">{item.Created}</div>
				</div>
			{/each}
		</div>
	</section>
</main>

<style lang="postcss">
	tr:nth-child(even) {
		@apply bg-white hover:bg-neutral-50;
	}

	.listing :global(div) {
		@apply overflow-hidden text-ellipsis;
	}

	.listing > :global(:nth-child(odd)) {
		@apply bg-white;
	}
	.listing > :global(:nth-child(even)) {
		@apply bg-neutral-50;
	}

	.cell:nth-child(2) {
		@apply text-xs;
	}

	td {
		@apply py-3 font-light;
	}

	td:first-child {
		@apply pl-4;
	}

	input[type='checkbox'] {
		@apply cursor-pointer rounded bg-transparent;
	}

	.clamp {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
	}
</style>
