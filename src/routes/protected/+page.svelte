<script lang="ts">
	import { XMark } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fade, scale } from 'svelte/transition';
	import Button from '../../components/Button.svelte';
	import Edit from '../../components/Edit.svelte';
	import Modal from '../../components/Modal.svelte';
	import TableHeader from '../../components/TableHeader.svelte';
	import {
		auth_or_logout,
		deleteRow,
		getOrders,
		updateRow,
		type OrderField
	} from '../../lib/getter';
	import { classes, nullish, today, usd } from '../../lib/utils';

	// Auth stuffs
	auth_or_logout();
	setInterval(auth_or_logout, 60000);
	onMount(() => {
		window.onunhandledrejection = (e) => {
			auth_or_logout();
			console.error(e);
		};
	});

	function sort(it: typeof items, { column, ascending }: typeof sortedBy) {
		it.sort((a, b) => {
			if (ascending) {
				return nullish(a[column]).localeCompare(nullish(b[column]));
			} else {
				return nullish(b[column]).localeCompare(nullish(a[column]));
			}
		});

		return it;
	}

	// Actual page stuffs
	let selected: 'requested' | 'ordered' | 'received' = 'requested';
	let sortedBy = { column: 'Created', ascending: false };
	$: if (selected === 'requested') {
		sortedBy = { column: 'Created', ascending: false };
	} else if (selected === 'ordered') {
		sortedBy = { column: 'Date Ordered', ascending: false };
	} else if (selected === 'received') {
		sortedBy = { column: 'Date Received', ascending: false };
	}

	let checked: boolean[] = [];
	let clicked: number | undefined | 'new';

	let resolveFirst: () => void;
	let itemsPromise: Promise<OrderField[]> = new Promise((r) => {
		resolveFirst = r;
	});
	let items: OrderField[] = [];

	async function refresh(sel: typeof selected) {
		items = await getOrders({ view: sel });
		resolveFirst();
		let res = await items;
		items = sort(items, sortedBy);
		checked = new Array(res.length).fill(false);
	}

	refresh(selected);

	$: refresh(selected);
	$: items = sort(items, sortedBy);
</script>

<svelte:head>
	<title>{selected.charAt(0).toUpperCase() + selected.slice(1)} - Orders</title>
</svelte:head>

<nav class="fixed top-0 left-0 flex w-full items-center gap-x-2 bg-slate-700">
	<div class="h-14 w-14 bg-pink-600" />
	<section class="flex flex-wrap p-2 text-sm text-gray-400">
		<button
			class={classes(
				'rounded-l-lg border  p-2 px-4',
				selected === 'requested'
					? 'text-semibold border-neutral-200 bg-slate-500 text-white'
					: 'border-neutral-400 hover:bg-slate-600'
			)}
			on:click={() => (selected = 'requested')}
			>New
		</button>
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
	<button class="button blue" on:click={() => (clicked = 'new')}> Add Request </button>
	<!-- <div class="flex-grow" /> -->

	{#if checked.some((c) => c) && selected === 'requested'}
		<button
			class="button mr-4 bg-purple-500 text-white transition-colors duration-75 hover:bg-purple-600 focus:ring-purple-300"
			on:click={async () => {
				const orderConfirmation = prompt('Order Confirmation #');
				if (orderConfirmation === null) {
					return;
				} else if (orderConfirmation === '') {
					alert('Order Confirmation # cannot be empty');
					return;
				}

				for (const [i, item] of (await items).entries()) {
					if (checked[i]) {
						await updateRow('orders', {
							id: item.id,
							Confirmation: orderConfirmation,
							'Date Ordered': today()
						});
					}
				}
				refresh(selected);
			}}
			in:scale={{ duration: 150 }}>Mark Ordered</button
		>
	{/if}

	{#if checked.some((c) => c) && selected === 'ordered'}
		<button
			class="button mr-4 bg-purple-500 text-white transition-colors duration-75 hover:bg-purple-600 focus:ring-purple-300"
			on:click={async () => {
				const location = prompt('Receiving location');
				for (const [i, item] of (await items).entries()) {
					if (checked[i]) {
						await updateRow('orders', {
							id: item.id,
							'Date Received': today(),
							'Received By': localStorage.getItem('firstName'),
							Location: location
						});
					}
				}
				refresh(selected);
			}}
			in:scale={{ duration: 150 }}>Mark Received</button
		>
	{/if}

	{#if checked.some((c) => c) && selected === 'received'}
		<button
			class="button mr-4 bg-red-500 text-white transition-colors duration-75 hover:bg-red-600 focus:ring-red-300"
			on:click={async () => {
				for (const [i, item] of (await items).entries()) {
					if (checked[i]) {
						await updateRow('orders', { id: item.id, 'Date Received': '' });
					}
				}
				refresh(selected);
			}}
			in:scale={{ duration: 150 }}>Mark NOT Received</button
		>
	{/if}
</nav>

<main class="mt-16 bg-neutral-100">
	<section class="relative p-4">
		<div
			class="header text-semibold flex h-8 flex-shrink-0 items-center justify-between gap-x-3 px-1 pr-3 text-xs"
		>
			<div class="ml-2 -mr-1 flex-[1]" />
			<TableHeader class="flex-[12] text-left" name="Item" bind:sortedBy bind:items />
			<TableHeader
				class="flex-[6] text-left"
				name="Vendor"
				displayName="Manufacturer"
				bind:sortedBy
				bind:items
			/>
			<div class="flex-[5]">Total</div>
			<TableHeader
				class="flex-[6] text-left"
				name={selected === 'received' ? 'Received By' : 'Grant'}
				bind:sortedBy
				bind:items
			/>
			<TableHeader class="flex-[5] text-left" name="Requestor" bind:sortedBy bind:items />
			<TableHeader
				class="flex-[4] text-left"
				name={selected === 'ordered'
					? 'Date Ordered'
					: selected === 'received'
					? 'Date Received'
					: 'Created'}
				displayName={selected === 'ordered'
					? 'Ordered'
					: selected === 'received'
					? 'Received'
					: 'Submitted'}
				bind:sortedBy
				bind:items
			/>
			<div class="flex-[1]" />
		</div>

		{#await itemsPromise}
			<div
				class="absolute left-1/2 mt-4 flex -translate-x-1/2 flex-col items-center justify-center text-center leading-relaxed"
				out:fade
			>
				<span class="animate-pulse text-3xl font-extralight tracking-wider"> Loading. </span>
			</div>
		{:then}
			{#if items.length}
				<div
					class="listing flex min-w-min flex-grow flex-col overflow-hidden rounded-lg border text-sm text-gray-700"
				>
					{#each items as item, i (item.id)}
						<div
							class="row flex flex-shrink-0 items-center justify-between gap-x-3 py-5 px-1 pr-3"
							transition:fade={{ duration: 200 }}
							animate:flip={{ duration: 200 }}
						>
							<div class="ml-2 -mr-1 flex-[1]">
								<input type="checkbox" bind:checked={checked[i]} />
							</div>
							<div class="flex-[12]">
								<div
									class="clamp cursor-pointer underline decoration-sky-300 decoration-dotted underline-offset-4"
									on:click={() => (clicked = item.id)}
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
							<div class="flex-[6] text-ellipsis whitespace-nowrap">
								{#if selected === 'received'}
									{nullish(item['Received By'])}<br />
									<span class="text-xs text-neutral-500">{nullish(item['Location'])}</span>
								{:else}
									<span class="text-xs text-neutral-500">{nullish(item['Grant'])}</span>
								{/if}
							</div>
							<div class="flex-[5] text-neutral-600">
								{item['Requestor'] ? item['Requestor'].value : ''}
							</div>
							<div class="flex-[4] text-neutral-600">
								{#if selected === 'ordered'}
									{item['Date Ordered']}
								{:else if selected === 'received'}
									{item['Date Received']}
								{:else}
									{item.Created}
								{/if}
							</div>
							<button
								class="flex-[1]"
								on:click={async () => {
									if (!confirm('Are you sure you want to delete this item?')) return;
									await deleteRow('orders', item.id);
									refresh(selected);
								}}
							>
								<Icon
									src={XMark}
									class="h-4 w-4 cursor-pointer stroke-gray-700 stroke-[1.5] hover:stroke-2"
								/>
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<div
					class="mt-4 flex flex-col items-center justify-center text-center leading-relaxed"
					transition:fade
				>
					<span class="text-3xl font-extralight tracking-wider"> It's empty. </span>
					<span class="mt-2 text-xl">Congratulations! 🎉</span>
				</div>
			{/if}
		{/await}
	</section>
</main>

<Modal bind:showModal={clicked}>
	{#if clicked}
		<Edit
			on:submit={() => {
				clicked = undefined;
				refresh(selected);
			}}
			orderId={clicked === 'new' ? undefined : clicked}
		/>
	{/if}
</Modal>

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
</style>
