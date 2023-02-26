import { browser } from '$app/environment';
import { Fetcher } from 'openapi-typescript-fetch';
import type { paths } from './api';

let fetcher: ReturnType<typeof Fetcher.for<paths>>;

if (browser) {
	fetcher = Fetcher.for<paths>();
	fetcher.configure({ baseUrl: 'https://baserow.gofflab.org' });
}

export const tables = { orders: 419, vendors: 421, items: 420, grants: 426 };
const fields: Record<keyof typeof tables, Record<string, string>> = {
	orders: {},
	vendors: {},
	items: {},
	grants: {}
};
let nameKey: Record<string, number> = {};

const views = { new: 1780, ordered: 1781, received: 1783 };
let grants: [string, number][] = [];

export type StrNull = string | null;
export type LinkNull = { id: number; value: string }[] | null;
export type OrderField = {
	id: number;
	order: number;
	Index: StrNull;
	Notes: StrNull;
	'Unit Price': StrNull;
	Confirmation: StrNull;
	Quantity: StrNull;
	Created: StrNull;
	'Date Ordered': StrNull;
	'Date Received': StrNull;
	Item: LinkNull;
	Price: StrNull;
	'Cat #': LinkNull;
	Link: LinkNull;
	Unit: LinkNull;
	Requestor: { id: number; value: string };
	Vendor: LinkNull;
	Grant: LinkNull;
	'Supplier Cat': StrNull;
	Supplier: LinkNull;
};

export type ItemField = {
	[x: string]: number;
	id: number;
	order: number;
	Name: StrNull;
	Notes: StrNull;
	Active: StrNull;
	'Cat #': StrNull;
	Unit: StrNull;
	Vendor: LinkNull;
	Ordering: StrNull;
	Link: StrNull;
	Type: StrNull;
	Project: StrNull;
	Created: StrNull;
	Old: StrNull;
	Supplier: LinkNull;
	Modified: StrNull;
};

async function convertFields(out: any[], type: keyof typeof tables) {
	if (!Object.keys(fields[type]).length) {
		await getFields(type);
	}

	for (const row of out) {
		for (const [id, name] of Object.entries(fields[type])) {
			row[name] = row[id];
			delete row[id];
		}
	}
	return out as unknown as typeof type extends 'orders' ? OrderField[] : ItemField[];
}

export async function getOrders({
	view = 'new',
	size = 50,
	page = 1
}: {
	size: number;
	view: keyof typeof views;
	page: number;
}) {
	const rowsGetter = fetcher.path('/api/database/views/grid/{view_id}/').method('get').create();
	const res = await rowsGetter({ view_id: views[view], page, size });
	const out = res.data.results;
	return convertFields(out, 'orders');
}

export async function login(email: string, password: string) {
	const getAuth = fetcher.path('/api/user/token-auth/').method('post').create();
	return await getAuth({ email, password });
}

export async function test_auth(token: string) {
	fetcher.configure({
		baseUrl: 'https://baserow.gofflab.org',
		init: { headers: { Authorization: `JWT ${token}` } }
	});
	return await fetcher.path('/api/user/dashboard/').method('get').create()({});
}

async function getFields(table: keyof typeof tables) {
	const getFields = fetcher.path('/api/database/fields/table/{table_id}/').method('get').create();
	const res = await getFields({ table_id: tables[table] });

	if (table === 'orders') {
		console.log(res.data);

		const nameList = res.data.find((x: any) => x.name === 'Requestor')!.select_options as {
			id: number;
			value: string;
		}[];
		console.log(nameList);

		nameKey = Object.fromEntries(nameList.map((x) => [x.value, x.id]));
	}

	for (const field of res.data) {
		fields[table][`field_${field.id}`] = field.name;
	}
}

async function convertBack(row: Partial<OrderField>, type: keyof typeof tables) {
	console.log(row);

	const out: Record<string, any> = {};
	for (const [id, name] of Object.entries(fields[type])) {
		if (row[name] === undefined) continue;
		out[id] = row[name];
	}
	console.log(out);

	return out;
}

export async function getView(search: string, type: keyof typeof tables) {
	const getItems = fetcher.path('/api/database/rows/table/{table_id}/').method('get').create();
	const res = await getItems({ table_id: tables[type], search, size: 20 });
	return convertFields(res.data.results, type);
}

export async function getRow(table: 'orders', id: number): Promise<OrderField>;
export async function getRow(table: 'items', id: number): Promise<ItemField>;
export async function getRow(
	table: keyof typeof tables,
	id: number
): Promise<OrderField | ItemField> {
	const getRow = fetcher
		.path('/api/database/rows/table/{table_id}/{row_id}/')
		.method('get')
		.create();
	const res = await getRow({ table_id: tables[table], row_id: id, user_field_names: true });
	return res.data as unknown as typeof table extends 'orders' ? OrderField : ItemField;
}

export async function submitOrder(order: Partial<OrderField>) {
	const submitOrder = fetcher
		.path('/api/database/rows/table/{table_id}/')
		.method('post')
		.create({});

	return await submitOrder({
		table_id: tables.orders,
		...(await convertBack(order, 'orders'))
	});
}

export async function updateOrder(order: Partial<OrderField>) {
	const updateOrder = fetcher
		.path('/api/database/rows/table/{table_id}/{row_id}/')
		.method('patch')
		.create({});
	return await updateOrder({
		table_id: tables.orders,
		row_id: order.id,
		...(await convertBack(order, 'orders'))
	});
}

export async function getGrants() {
	if (Object.keys(grants).length) return grants;

	const getGrants = fetcher.path('/api/database/rows/table/{table_id}/').method('get').create();
	const res = await getGrants({ table_id: tables.grants, size: 100, user_field_names: true });
	grants = res.data.results.map((grant: any) => [grant.Name, grant.id] as [string, number]);

	return grants;
}

export async function getNameKeys() {
	if (Object.keys(nameKey).length) return nameKey;
	await getFields('orders');
	return nameKey;
}
