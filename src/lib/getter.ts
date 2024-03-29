import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import {
	PUBLIC_BASEROW_URL,
	PUBLIC_GRANTS_TABLE,
	PUBLIC_HOOKS_TABLE,
	PUBLIC_ITEMS_TABLE,
	PUBLIC_ORDERS_TABLE,
	PUBLIC_VENDORS_TABLE
} from '$env/static/public';
import { Fetcher } from 'openapi-typescript-fetch';
import type { paths } from './api';
let fetcher: ReturnType<typeof Fetcher.for<paths>>;

if (browser) {
	fetcher = Fetcher.for<paths>();
	fetcher.configure({ baseUrl: PUBLIC_BASEROW_URL });
}

export const tables = {
	orders: PUBLIC_ORDERS_TABLE,
	vendors: PUBLIC_VENDORS_TABLE,
	items: PUBLIC_ITEMS_TABLE,
	grants: PUBLIC_GRANTS_TABLE,
	hooks: PUBLIC_HOOKS_TABLE
};
const fields: Record<keyof typeof tables, Record<string, string>> = {
	orders: {},
	vendors: {},
	items: {},
	grants: {},
	hooks: {}
};

let nameKey: Record<string, number> = {};

const views = { requested: null, ordered: null, received: null };
let grants: [string, number][] = [];
const vendors: Record<string, number> = {};
const suppliers: Record<string, number> = {};

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
	'Cat #': StrNull;
	Link: StrNull;
	Unit: StrNull;
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

export async function listViews(table_id: number | string) {
	const viewGetter = fetcher.path('/api/database/views/table/{table_id}/').method('get').create();
	const res = await viewGetter({ table_id });
	const out = {};
	for (const v of res.data) {
		out[v.name] = v.id;
	}
	views['ordered'] = out['Ordered'];
	views['received'] = out['Received'];
	views['requested'] = out['Requested'];
}

export async function getOrders({
	view = 'requested',
	size = 50,
	page = 1
}: {
	size: number;
	view: keyof typeof views;
	page: number;
}) {
	await getFields('orders');
	if (views[view] === null) {
		await listViews(tables.orders);
	}

	const rowsGetter = fetcher.path('/api/database/views/grid/{view_id}/').method('get').create();
	const res = await rowsGetter({ view_id: views[view], page, size });
	const out = res.data.results;
	return convertFields(out, 'orders');
}

export async function getTable(table: keyof typeof tables, size = 200, page = 1) {
	const rowsGetter = fetcher.path('/api/database/rows/table/{table_id}/').method('get').create();
	const res = await rowsGetter({ table_id: tables[table], page, size });
	const out = res.data.results;
	return convertFields(out, table);
}

export async function getVendors(supplierOnly = false) {
	if (!Object.keys(vendors).length) {
		const out = await getTable('vendors');
		console.log(out);

		for (const row of out) {
			if (!row.Name) continue;
			if (row.Supplier) suppliers[row.Name] = row.id;
			vendors[row.Name] = row.id;
		}
	}

	return supplierOnly ? suppliers : vendors;
}

export async function login(email: string, password: string) {
	const getAuth = fetcher.path('/api/user/token-auth/').method('post').create();
	return await getAuth({ email, password });
}

export async function refreshToken(refresh: string) {
	const getToken = fetcher.path('/api/user/token-refresh/').method('post').create();
	return await (
		await getToken({ refresh_token: refresh })
	).data.access_token;
}

export async function test_auth(access_token: string | null) {
	fetcher = Fetcher.for<paths>();
	fetcher.configure({
		baseUrl: PUBLIC_BASEROW_URL,
		init: { headers: { Authorization: `JWT ${access_token}` } }
	});
	try {
		await fetcher.path('/api/user/dashboard/').method('get').create()({});
	} catch (e) {
		const newToken = await refreshToken(localStorage.getItem('refresh_token')!);
		if (newToken) {
			localStorage.setItem('access_token', newToken);
			fetcher = Fetcher.for<paths>();
			fetcher.configure({
				baseUrl: PUBLIC_BASEROW_URL,
				init: { headers: { Authorization: `JWT ${newToken}` } }
			});
		}
	}
}

async function getFields(table: keyof typeof tables) {
	const getFields = fetcher.path('/api/database/fields/table/{table_id}/').method('get').create();
	const res = await getFields({ table_id: tables[table] });

	if (table === 'orders') {
		const nameList = res.data.find((x: any) => x.name === 'Requestor')!.select_options as {
			id: number;
			value: string;
		}[];

		nameKey = Object.fromEntries(nameList.map((x) => [x.value, x.id]));
	}

	for (const field of res.data) {
		fields[table][`field_${field.id}`] = field.name;
	}
}

async function convertBack(row: Partial<OrderField>, type: keyof typeof tables) {
	if (!Object.keys(fields[type]).length) {
		await getFields(type);
	}

	const out: Record<string, unknown> = {};
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

export async function submitRow(table: keyof typeof tables, order: Partial<OrderField>) {
	const submitOrder = fetcher
		.path('/api/database/rows/table/{table_id}/')
		.method('post')
		.create({});

	return await submitOrder({
		table_id: tables[table],
		...(await convertBack(order, table))
	});
}

export async function updateRow(table: 'orders', order: Partial<OrderField>);
export async function updateRow(table: 'items', order: Partial<ItemField>);
export async function updateRow(
	table: keyof typeof tables,
	field: Partial<OrderField> | Partial<ItemField>
) {
	const _update = fetcher
		.path('/api/database/rows/table/{table_id}/{row_id}/')
		.method('patch')
		.create({});
	return await _update({
		table_id: tables[table],
		row_id: field.id,
		...(await convertBack(field, table))
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

export async function postNameKeys(value: string) {
	await getFields('orders');
	const req = Object.entries(fields.orders).find(([, name]) => name === 'Requestor')![0];

	const field_id = Number(req.split('_')[1]);
	console.log(field_id);

	const nameKeys = await fetcher
		.path('/api/database/fields/{field_id}/')
		.method('get')
		.create()({ field_id })
		.then((res) => res.data.select_options as { id: number; value: string; color: string }[]);

	if (nameKeys.find((x) => x.value === value)) return;

	const pnk = fetcher.path('/api/database/fields/{field_id}/').method('patch').create();
	await pnk({
		field_id,
		name: 'Requestor',
		type: 'single_select',
		select_options: [...nameKeys, { value, id: -(nameKeys.length + 1), color: 'gray' }]
	});
	await getNameKeys();
}

export async function deleteRow(table: keyof typeof tables, id: number) {
	const deleteRow = fetcher
		.path('/api/database/rows/table/{table_id}/{row_id}/')
		.method('delete')
		.create();
	return await deleteRow({ table_id: tables[table], row_id: id });
}

export async function auth_or_logout(redirect = true) {
	try {
		await test_auth(localStorage.getItem('access_token'));
		return true;
	} catch {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		localStorage.removeItem('access_token');
		localStorage.removeItem('refresh_token');
		if (redirect) goto('/');
		return false;
	}
}
