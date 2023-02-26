<script lang="ts">
	import {
		getGrants,
		getNameKeys,
		getRow,
		submitOrder,
		updateOrder,
		type ItemField
	} from '$lib/getter';
	import { nullish, usd } from '$lib/utils';

	import { createEventDispatcher, onMount } from 'svelte';
	import SearchItem from './SearchItem.svelte';
	import Textbox from './Textbox.svelte';

	export let orderId: number | undefined;

	let itemSearch: string;
	let quantity = '1';
	let unitPrice = '0';

	const dispatch = createEventDispatcher();

	let clicked: ItemField | undefined;
	let vendor = '';
	let supplier: { id: number; Name: string } | undefined;
	let supplierCat = '';
	let cat = '';
	let link = '';
	let notes = '';
	let confirmation = '';
	let supplierName = '';
	let grantName = '';

	onMount(async () => {
		if (typeof orderId === 'number') {
			const res = await getRow('orders', orderId);
			console.log(res);

			clicked = await getRow('items', res.Item[0].id);
			itemSearch = nullish(res.Item);
			cat = nullish(res['Cat #']);
			vendor = nullish(res.Vendor);
			link = nullish(res.Link);
			quantity = res.Quantity ?? '';
			unitPrice = res['Unit Price'] ?? '';
			notes = res.Notes ?? '';
			confirmation = res.Confirmation ?? '';
			supplierCat = res['Supplier Cat'] ?? '';
			supplierName = nullish(res.Supplier);
		}
	});

	async function processClick(c: number) {
		clicked = await getRow('items', c);
		itemSearch = clicked.Name ?? '';
		cat = clicked['Cat #'] ?? '';
		vendor = nullish(clicked.Vendor);
		link = clicked.Link ?? '';
	}

	async function processVendor(v: { id: number; Name: string }) {
		console.log(v);

		supplier = v;
		supplierName = v.Name;
	}

	async function handleSubmit() {
		console.log(grantName);
		const grant = (await getGrants()).find((g) => g[0] === grantName);

		if (!clicked) {
			alert('Please select an item');
			return;
		}
		const nameKeys = await getNameKeys();
		const req =
			nameKeys[
				Object.keys(nameKeys).find((k) =>
					k.includes(localStorage.getItem('firstName') as string)
				) as string
			];

		if (typeof orderId === 'number') {
			await updateOrder({
				id: orderId,
				Item: [clicked.id],
				Quantity: quantity,
				'Unit Price': unitPrice,
				Notes: notes,
				Confirmation: confirmation,
				Grant: grant ? [grant[1]] : [],
				Supplier: supplier ? [supplier.id] : [],
				'Supplier Cat #': supplierCat
			});
		} else {
			await submitOrder({
				// @ts-ignore
				Item: [clicked.id],
				Quantity: quantity,
				'Unit Price': unitPrice,
				Notes: notes,
				Confirmation: confirmation,
				Grant: grant ? [grant[1]] : [],
				Supplier: supplier ? [supplier.id] : [],
				'Supplier Cat #': supplierCat,
				Requestor: [req]
			});
		}
		dispatch('submit');
	}
</script>

<div class="rounded p-8">
	<h3>Item</h3>
	<div class="grid max-w-xl grid-cols-2 gap-x-3">
		<!-- <div class="" /> -->

		<SearchItem
			label="Name"
			type="items"
			bind:value={itemSearch}
			on:click={(ev) => processClick(ev.detail)}
			let:item
			clicked={orderId}
			red
		>
			<th
				scope="row"
				class="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap py-1.5 pl-1 pr-3 text-left font-medium text-gray-900"
			>
				{item['Cat #']}
			</th>

			<td class="clamp w-[250px] py-1 pr-2 text-sm text-gray-700">{item.Name}</td>

			<td
				class="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-700"
				>{nullish(item.Vendor)}</td
			>
		</SearchItem>

		<Textbox bind:value={cat} label="Cat #" />
		<Textbox bind:value={vendor} label="Vendor" />
		<Textbox bind:value={link} label="Link" />
	</div>

	<h3>Order</h3>
	<div class=" max-w-xl">
		<div class="flex items-center gap-x-2">
			<Textbox label="Quantity" type="number" bind:value={quantity} />
			×
			<Textbox label="Unit Price" type="number" bind:value={unitPrice} />
			=
			<span class="text-xl font-medium">
				{usd(Number(quantity) * Number(unitPrice))}
			</span>
		</div>

		<Textbox label="Notes" bind:value={notes} />
	</div>

	<h3>Rachel</h3>
	<div class="grid max-w-xl grid-cols-2 gap-x-3">
		<div class="flex flex-col">
			<span class="mb-2 text-sm font-medium">Grant</span>
			<select class="h-auto" bind:value={grantName}>
				{#await getGrants() then grants}
					<option />
					{#each grants as grant}
						<!-- content here -->
						<option>{grant[0]}</option>
					{/each}
				{/await}
			</select>
		</div>

		<SearchItem
			label="Supplier"
			type="vendors"
			on:click={(ev) => processVendor(ev.detail)}
			bind:value={supplierName}
			let:item
			red
		>
			<td
				class="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap py-1.5 pl-1 pr-3 text-left text-gray-900"
			>
				{item.Name}
			</td>
		</SearchItem>

		<Textbox label="Supplier Cat" bind:value={supplierCat} />
		<Textbox label="Order Confirmation" bind:value={confirmation} />
	</div>

	<button class="button blue max-w-xl" on:click={handleSubmit}>Submit</button>
</div>

<style lang="postcss">
	h3 {
		@apply mb-3 text-lg font-semibold text-gray-700;
	}

	h3::after {
		@apply mt-0.5 block h-0.5 w-16 bg-sky-400/50;
		content: '';
	}
</style>
