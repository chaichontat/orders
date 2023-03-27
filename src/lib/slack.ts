import { getTable, type OrderField } from './getter';
import { nullish } from './utils';

export const nameHook: Record<string, string> = {};

async function notify(sendTo: string, message: string) {
	if (Object.keys(nameHook).length === 0) {
		const res = await getTable('hooks');
		res.forEach((row) => {
			nameHook[row.Name] = row.URL;
		});
	}

	if (!nameHook[sendTo.split(' ')[0]]) return;

	const res = await fetch(nameHook[sendTo.split(' ')[0]], {
		method: 'POST',
		body: JSON.stringify({ text: message })
	});
	return res;
}

export async function notifyReceived(order: OrderField, location: string) {
	return await notify(
		order.Requestor.value,
		`${nullish(order.Item)} received by ${localStorage.getItem('firstName')} at ${
			location ?? '🤷'
		}.`
	);
}

export async function notifyOrdered(order: OrderField) {
	return await notify(
		order.Requestor.value,
		`${nullish(order.Item)} ordered by ${localStorage.getItem('firstName')}.`
	);
}
