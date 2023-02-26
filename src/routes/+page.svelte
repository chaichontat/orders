<script lang="ts">
	import { goto } from '$app/navigation';
	import { login } from '$lib/getter';
	import { onMount } from 'svelte';
	import Textbox from '../components/Textbox.svelte';

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
				localStorage.setItem('firstName', response.data.user.first_name);
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
		<Textbox label="Email" type="text" autocomplete="current-username" />
		<Textbox label="Password" type="password" autocomplete="current-password" />
		<button type="submit" class="button blue">Login</button>
	</form>
</div>
