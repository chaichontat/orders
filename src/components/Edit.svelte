<script lang="ts">
	import {
		getGrants,
		getNameKeys,
		getRow,
		submitRow,
		updateRow,
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

	let touchedName = false;
	const dispatch = createEventDispatcher();

	let clicked: ItemField | undefined;
	let vendor: { id: number; value: string } | undefined;
	let supplier: { id: number; Name: string } | undefined;
	let supplierCat = '';
	let cat = '';
	let link = '';
	let notes = '';
	let confirmation = '';
	let vendorName = '';
	let supplierName = '';
	let grantName = '';

	onMount(async () => {
		if (typeof orderId === 'number') {
			const res = await getRow('orders', orderId);
			console.log(res);

			clicked = await getRow('items', res.Item[0].id);
			itemSearch = nullish(res.Item);
			cat = nullish(res['Cat #']);
			vendor = res.Vendor;
			vendorName = nullish(res.Vendor);
			link = nullish(res.Link);
			quantity = res.Quantity ?? '';
			unitPrice = res['Unit Price'] ?? '';
			notes = res.Notes ?? '';
			confirmation = res.Confirmation ?? '';
			supplierCat = res['Supplier Cat'] ?? '';
			supplier = res.Supplier;
			supplierName = nullish(res.Supplier);
			grantName = nullish(res.Grant);
		}
	});

	async function processClick(c: { id: number }) {
		clicked = await getRow('items', c.id);
		itemSearch = clicked.Name ?? '';
		cat = clicked['Cat #'] ?? '';
		vendor = clicked.Vendor;
		vendorName = nullish(clicked.Vendor);
		link = clicked.Link ?? '';
	}

	async function processVendor(v: { id: number; Name: string }, type: 'vendor' | 'supplier') {
		if (type === 'vendor') {
			vendor = v;
			vendorName = v.Name;
		} else {
			supplier = v;
			supplierName = v.Name;
		}
	}

	async function handleSubmit() {
		console.log(grantName);
		const grant = (await getGrants()).find((g) => g[0] === grantName);

		if (!itemSearch) {
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

		const toSend = {
			Quantity: quantity,
			'Unit Price': unitPrice,
			Notes: notes,
			Confirmation: confirmation,
			Grant: grant ? [grant[1]] : [],
			'Supplier Cat #': supplierCat,
			Requestor: req
		};

		if (clicked) {
			toSend.Item = [clicked.id];
		} else {
			if (!vendor) {
				alert('Please select a vendor');
				return;
			}

			const resp = await submitRow('items', {
				Name: itemSearch,
				'Cat #': cat,
				Vendor: [vendor.id],
				Link: link
			});
			const newItemId = resp.data.id;
			toSend.Item = [newItemId];
		}

		if (supplier?.id) {
			toSend.Supplier = [supplier.id];
		}

		if (typeof orderId === 'number') {
			toSend.id = orderId;
			await updateRow('orders', toSend);
		} else {
			await submitRow('orders', toSend);
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
			on:change={() => (touchedName = true)}
			let:item
			clicked={orderId}
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

		<Textbox bind:value={cat} label="Cat #" disabled={!touchedName} />

		<SearchItem
			label="Vendor"
			type="vendors"
			on:click={(ev) => processVendor(ev.detail, 'vendor')}
			value={vendorName}
			clicked={vendor?.id}
			let:item
			strict
			disabled={!touchedName}
		>
			<td
				class="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap py-1.5 pl-1 pr-3 text-left text-gray-900"
			>
				{item.Name}
			</td>
		</SearchItem>

		<Textbox bind:value={link} label="Link" disabled={!touchedName} />
	</div>

	<h3>Order</h3>
	<div class=" max-w-xl">
		<div class="grid grid-cols-3 items-center gap-x-2">
			<div class="col-span-2 flex items-center gap-x-2">
				<Textbox label="Quantity" type="number" bind:value={quantity} />
				×
				<Textbox label="Unit Price" type="number" bind:value={unitPrice} />
				=
			</div>
			<span class="text-xl font-medium">
				{usd(Number(quantity) * Number(unitPrice))
					? usd(Number(quantity) * Number(unitPrice))
					: '$0.00'}
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
						<option>{grant[0]}</option>
					{/each}
				{/await}
			</select>
		</div>

		<SearchItem
			label="Supplier"
			type="vendors"
			on:click={(ev) => processVendor(ev.detail, 'supplier')}
			value={supplierName}
			clicked={supplier?.id}
			let:item
			strict
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
