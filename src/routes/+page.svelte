<script lang="ts">
	import { goto } from '$app/navigation';
	import { login } from '$lib/getter';
	import { onMount } from 'svelte';

	onMount(() => {
		if (localStorage.getItem('token')) {
			goto('/protected');
		}
	});

	function handleSubmit(ev: SubmitEvent) {
		const data = new FormData(ev.target as HTMLFormElement);
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		login(email, password)
			.then((response) => {
				localStorage.setItem('email', email);
				localStorage.setItem('token', response.data.access_token!);
				goto('/protected');
			})
			.catch(() => {
				alert('Invalid credentials');
			});
	}
</script>

<div class="mt-16 flex w-full items-center justify-center">
	<form class="flex w-96 flex-col" on:submit|preventDefault={handleSubmit}>
		<div class="mb-6">
			<label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white" for="email"
				>Email</label
			>
			<input
				type="text"
				class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
				autocomplete="current-email"
				name="email"
				id="email"
				required
			/>
		</div>
		<div class="mb-6">
			<label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white" for="password"
				>Password</label
			>
			<input
				type="password"
				class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
				autocomplete="current-password"
				name="password"
				id="password"
				required
			/>
		</div>
		<button
			type="submit"
			class="rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 sm:w-auto"
			>Login</button
		>
	</form>
</div>
