<script lang="ts">
	import { classes } from '$lib/utils';
	import { createEventDispatcher } from 'svelte';

	export let label: string;
	export let type: 'text' | 'password' | 'number' = 'text';
	export let autocomplete = '';
	export let value = '';
	export let placeholder = '';
	export { cl as class };
	export let textClass = 'bg-gray-50';
	export let disabled = false;

	let _textClass =
		'bg-gray-50 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100';
	let cl = 'mb-6';

	let uid = Math.random().toString(36).slice(2, 9);

	const dispatch = createEventDispatcher();
</script>

<!-- content here -->

<div class={cl}>
	<label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white" for={uid}>
		{label}
	</label>
	{#if type === 'text'}
		<input
			type="text"
			class={classes(_textClass, textClass)}
			{autocomplete}
			name={label.toLowerCase()}
			required
			id={uid}
			bind:value
			on:blur={() => dispatch('blur')}
			on:keydown={() => dispatch('keydown')}
			on:input={() => dispatch('input')}
			on:paste={() => dispatch('paste')}
			on:keypress={() => dispatch('change', { value })}
			{placeholder}
			{disabled}
		/>
	{:else if type === 'password'}
		<input
			type="password"
			class={classes(_textClass, textClass)}
			{autocomplete}
			name={label.toLowerCase()}
			required
			id={uid}
			bind:value
			on:blur={() => dispatch('blur')}
			on:keydown={() => dispatch('keydown')}
			on:input={() => dispatch('input')}
			on:paste={() => dispatch('paste')}
			on:keypress={() => dispatch('change', { value })}
			{placeholder}
			{disabled}
		/>
	{:else if type === 'number'}
		<input
			type="number"
			class={classes(_textClass, textClass)}
			{autocomplete}
			name={label.toLowerCase()}
			required
			id={uid}
			bind:value
			on:blur={() => dispatch('blur')}
			on:keydown={() => dispatch('keydown')}
			on:input={() => dispatch('input')}
			on:paste={() => dispatch('paste')}
			on:keypress={() => dispatch('change', { value })}
			{placeholder}
			{disabled}
		/>
	{/if}
</div>
