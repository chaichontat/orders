<script lang="ts">
	export let showModal: number | 'new' | undefined; // boolean
	import { XMark } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';

	let dialog: HTMLDialogElement; // HTMLDialogElement

	$: if (dialog) {
		showModal ? dialog.showModal() : dialog.close();
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<dialog
	bind:this={dialog}
	on:close={() => (showModal = undefined)}
	on:click|self={() => dialog.close()}
	class="overflow-visible"
>
	<div class="relative" on:click|stopPropagation>
		<slot name="header" />
		<hr />
		<slot />
		<hr />
		<!-- svelte-ignore a11y-autofocus -->
		<button
			autofocus
			class="absolute top-4 right-4 border-none opacity-80 hover:opacity-100"
			on:click={() => dialog.close()}><Icon class="h-6 w-6 stroke-[1.5]" src={XMark} /></button
		>
	</div>
</dialog>

<style lang="postcss">
	dialog {
		@apply max-w-lg rounded-lg border-none p-0;
	}
	dialog::backdrop {
		@apply bg-black bg-opacity-70;
	}
	dialog > div {
		@apply p-1;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	button {
		@apply block;
	}
</style>
