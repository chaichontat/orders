<script lang="ts">
	import { goto } from '$app/navigation';
	import { slide } from 'svelte/transition';
	import Edit from '../../components/Edit.svelte';
	import Modal from '../../components/Modal.svelte';
	import type { OrderField } from '../../lib/getter';
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

	let items: OrderField[] = [];
	let checked: boolean[] = [];
	let clicked: number | undefined | 'new';

	function refresh(sel: typeof selected) {
		getOrders({ view: sel }).then((res) => {
			checked = new Array(res.length).fill(false);
			items = res;
		});
	}

	$: refresh(selected);

	$: isOpen = clicked !== undefined;
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
			on:click={() => (selected = 'new')}
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
	<div class="flex-grow" />

	{#if checked.some((c) => c)}
		<button
			class="button mr-4 bg-purple-500 text-white transition-colors duration-75 hover:bg-purple-600 focus:ring-purple-300"
			transition:slide>Mark Received</button
		>
	{/if}
</nav>
<!--
<aside class="fixed top-0 left-0 flex h-full w-48 flex-col bg-slate-600">
</aside> -->

<main class="bg-neutral-100">
	<section class="p-4">
		<div
			class="header text-semibold flex h-8 flex-shrink-0 items-center justify-between gap-x-3 px-1 pr-3 text-xs"
		>
			<div class="ml-2 -mr-1 flex-[1]" />
			<div class="flex-[12]">Item Name</div>
			<div class="flex-[6]">Vendor</div>
			<div class="flex-[5]">Total</div>
			<div class="flex-[6]">Grant</div>
			<div class="flex-[5]">From</div>
			<div class="flex-[4]">
				{#if selected === 'ordered'}
					Ordered
				{:else if selected === 'received'}
					Received
				{:else}
					Submitted
				{/if}
			</div>
		</div>

		<div
			class="listing flex min-w-min flex-grow flex-col overflow-hidden rounded-lg border text-sm text-gray-700"
		>
			{#each items as item, i}
				<div class="row flex flex-shrink-0 items-center justify-between gap-x-3 py-5 px-1 pr-3">
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
					<div class="flex-[6] text-ellipsis whitespace-nowrap text-xs text-neutral-500">
						{nullish(item['Grant'])}
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
				</div>
			{/each}
		</div>
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

<!-- <Transition
	show={isOpen}
	enter="transition duration-100 ease-out"
	enterFrom="transform scale-95 opacity-0"
	enterTo="transform scale-100 opacity-100"
	leave="transition duration-75 ease-out"
	leaveFrom="transform scale-100 opacity-100"
	leaveTo="transform scale-95 opacity-0"
>
	<Dialog open={isOpen} on:close={() => (isOpen = false)}>
		<DialogOverlay
			style={'position: fixed; top: 0; left: 0; background-color: rgb(0 0 0); opacity: 0.3;'}
		/>

		<span class="inline-block h-screen align-middle" aria-hidden="true">​</span>
		<div
			class="my-8 inline-block w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
		>
			<DialogTitle>Deactivate account</DialogTitle>
			<DialogDescription>This will permanently deactivate your account</DialogDescription>
			<p>
				Are you sure you want to deactivate your account? All of your data will be permanently
				removed. This action cannot be undone.
			</p>

			<button on:click={() => (isOpen = false)}>Deactivate</button>
			<button on:click={() => (isOpen = false)}>Cancel</button>
		</div>
	</Dialog>
</Transition> -->
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
