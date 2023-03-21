<script lang="ts">
	import {
		getGrants,
		getNameKeys,
		getRow,
		getVendors,
		postNameKeys,
		submitRow,
		updateRow,
		type ItemField,
		type OrderField
	} from '$lib/getter';
	import { nullish, today, tooltip, usd } from '$lib/utils';
	import { XMark } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';

	import { createEventDispatcher, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import SearchItem from './SearchItem.svelte';
	import Textbox from './Textbox.svelte';

	export let orderId: number | undefined;

	let itemSearch: string;
	let quantity = '1';
	let unitPrice = '0';

	const dispatch = createEventDispatcher();

	let itemClicked: ItemField | undefined;
	let supplierCat = '';
	let cat = '';
	let unit = '';
	let link = '';
	let notes = '';
	let confirmation = '';
	let vendorName = '';
	let supplierName = '';
	let grantName = '';
	let res: OrderField | undefined;

	onMount(async () => {
		if (typeof orderId === 'number') {
			res = await getRow('orders', orderId);
			console.log(res);

			itemClicked = await getRow('items', res.Item[0].id);
			itemSearch = nullish(res.Item);
			cat = nullish(res['Cat #']);
			vendorName = nullish(res.Vendor);
			link = nullish(res.Link);
			quantity = res.Quantity ?? '';
			unitPrice = res['Unit Price'] ?? '';
			unit = res.Unit ?? '';
			notes = res.Notes ?? '';
			confirmation = res.Confirmation ?? '';
			supplierCat = res['Supplier Cat'] ?? '';
			supplierName = nullish(res.Supplier);
			grantName = nullish(res.Grant);
		}
	});

	async function processClick(c: { id: number }) {
		itemClicked = await getRow('items', c.id);
		itemSearch = itemClicked.Name ?? '';
		cat = itemClicked['Cat #'] ?? '';
		console.log(itemClicked.Vendor);

		vendorName = nullish(itemClicked.Vendor);
		link = itemClicked.Link ?? '';
	}

	async function handleSubmit() {
		const grant = (await getGrants()).find((g) => g[0] === grantName);

		if (!itemSearch) {
			alert('Please select an item or name one.');
			return;
		}

		const nameKeys = await getNameKeys();

		const toSend: Record<string, unknown> = {
			Quantity: quantity,
			'Unit Price': unitPrice,
			Unit: unit,
			Notes: notes,
			Confirmation: confirmation,
			Grant: grant ? [grant[1]] : [],
			'Supplier Cat': supplierCat
		};

		// Only add requestor if first
		if (!res?.Requestor) {
			let req =
				nameKeys[
					Object.keys(nameKeys).find((k) =>
						k.includes(localStorage.getItem('firstName') as string)
					) as string
				];

			if (!req) {
				await postNameKeys(localStorage.getItem('firstName') as string);
				req =
					nameKeys[
						Object.keys(nameKeys).find((k) =>
							k.includes(localStorage.getItem('firstName') as string)
						) as string
					];
			}
			toSend['Requestor'] = req;
		}

		if (!vendorName) {
			alert('Please select a vendor');
			return;
		}

		const itemupdate = {
			Name: itemSearch,
			'Cat #': cat,
			Vendor: [(await getVendors())[vendorName]],
			Link: link
		};

		if (itemClicked) {
			toSend.Item = [itemClicked.id];
			itemupdate.id = itemClicked.id;
			console.log(itemupdate);

			await updateRow('items', itemupdate);
		} else {
			// Create new item
			const resp = await submitRow('items', itemupdate);
			const newItemId = resp.data.id;
			toSend.Item = [newItemId];
		}

		if (supplierName) {
			toSend.Supplier = [(await getVendors())[supplierName]];
		}

		if (!res?.['Date Ordered'] && confirmation) {
			toSend['Date Ordered'] = today();
		}

		if (typeof orderId === 'number') {
			toSend.id = orderId;
			await updateRow('orders', toSend);
		} else {
			await submitRow('orders', toSend);

			fetch('https://hooks.slack.com/services/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', {
				method: 'POST',
				body: JSON.stringify({
					text: `New order created for ${itemSearch} from ${localStorage.getItem('firstName')}.`
				})
			});
		}
		dispatch('submit');
	}
</script>

<div class="relative rounded">
	{#if orderId && !res}
		<div class="absolute z-50 h-full w-full bg-neutral-50/90" out:fade />
	{/if}
	<div class="p-8">
		<div class="flex items-start">
			<h3>Item</h3>

			<div class="mt-1 ml-4 flex items-center font-mono text-orange-700">
				{#if itemClicked}
					<button
						on:click={() => {
							itemClicked = undefined;
							itemSearch = '';
							cat = '';
							link = '';
							vendorName = '';
						}}
						use:tooltip={{ content: 'Editing existing item. Click this to create a new item.' }}
					>
						<Icon
							src={XMark}
							class="h-5 w-5 -translate-x-1 cursor-pointer stroke-2 transition-all hover:stroke-[3]"
						/>
					</button>
					ID: {itemClicked?.id}
				{:else}
					New item
				{/if}
			</div>
		</div>

		<div class="grid max-w-xl grid-cols-2 gap-x-3">
			<SearchItem
				label="Name"
				type="items"
				bind:value={itemSearch}
				on:click={(ev) => processClick(ev.detail)}
				let:item
				clicked={itemClicked}
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

			<Textbox bind:value={link} label="Link" type="textarea">
				<span slot="label">
					<a
						href={link}
						target="_blank"
						rel="noreferrer"
						class="ml-2 text-blue-700 hover:underline"
					>
						Open link
					</a>
				</span>
			</Textbox>

			<div class="flex flex-col">
				<span class="mb-2 text-sm font-medium">Manufacturer</span>
				<select class="h-auto" bind:value={vendorName}>
					<option />
					{#await getVendors() then ss}
						{#each Object.keys(ss).sort() as s}
							<option>{s}</option>
						{/each}
					{/await}
				</select>
			</div>

			<Textbox bind:value={cat} label="Cat #" />
		</div>

		<h3>Order</h3>
		<div class=" max-w-xl">
			<div class="grid grid-cols-3 items-center gap-x-2">
				<div class="col-span-2 flex items-center gap-x-2">
					<Textbox label="Quantity" type="number" bind:value={quantity} />
					<Textbox label="Unit" type="text" bind:value={unit} />
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

		<h3>Administrative</h3>
		<div class="grid max-w-xl grid-cols-2 gap-x-3">
			<div class="mb-4 flex flex-col">
				<span class="mb-2 text-sm font-medium">Grant</span>
				<select class="h-auto" bind:value={grantName}>
					{#await getGrants() then grants}
						<option />
						{#each grants.sort((a, b) => a[0].localeCompare(b[0])) as grant}
							<option>{grant[0]}</option>
						{/each}
					{/await}
				</select>
			</div>

			<div class="flex flex-col">
				<span class="mb-2 text-sm font-medium">Supplier</span>
				<select class="h-auto" bind:value={supplierName}>
					<option />
					{#await getVendors() then ss}
						{#each Object.keys(ss).sort() as s}
							<option>{s}</option>
						{/each}
					{/await}
				</select>
			</div>

			<Textbox label="Supplier Cat" bind:value={supplierCat} />
			<Textbox label="Order Confirmation" bind:value={confirmation} />
		</div>

		<button class="button blue max-w-xl" on:click={handleSubmit}>Save</button>
	</div>
</div>

<style lang="postcss">
	h3 {
		@apply mb-3 text-lg font-semibold text-gray-700;
	}

	h3:not(:first-child) {
		@apply mt-8;
	}

	h3::after {
		@apply mt-0.5 block h-0.5 w-16 bg-sky-400/50;
		content: '';
	}
</style>
