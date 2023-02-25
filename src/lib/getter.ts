import { browser } from '$app/environment';
import { Fetcher } from 'openapi-typescript-fetch';
import type { paths } from './api';

let fetcher: ReturnType<typeof Fetcher.for<paths>>;

if (browser) {
	fetcher = Fetcher.for<paths>();
	fetcher.configure({ baseUrl: 'https://baserow.gofflab.org' });
}

const tables = { orders: 419, vendors: 421, items: 420, grants: 426 };
const views = { new: 1780, ordered: 1781, received: 1783 };
const fields: Record<string, string> = {};

type StrNull = string | null;
type LinkNull = { id: number; value: string }[] | null;
export type Field = {
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

export async function getOrders({
	view = 'new',
	size = 50,
	page = 1
}: {
	size: number;
	view: keyof typeof views;
	page: number;
}) {
	if (!Object.keys(fields).length) {
		await getFields();
	}
	const rowsGetter = fetcher.path('/api/database/views/grid/{view_id}/').method('get').create();
	const res = await rowsGetter({ view_id: views[view], page, size });
	const out = res.data.results;
	console.log(out[0]);
	console.log(fields);

	for (const row of out) {
		for (const [id, name] of Object.entries(fields)) {
			row[name] = row[id];
			delete row[id];
		}
	}
	return out as unknown as Field[];
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

async function getFields() {
	const getFields = fetcher.path('/api/database/fields/table/{table_id}/').method('get').create();
	const res = await getFields({ table_id: tables.orders });

	for (const field of res.data) {
		fields[`field_${field.id}`] = field.name;
	}
}
