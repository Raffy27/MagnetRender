<script>
	import Select from './components/Select.svelte';
	import Input from './components/Input.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let rp;
</script>

<form class="w-full min-w-sm">
	<Select label="Magnet Type" bind:value={rp.type}>
		<option value={0}>Prism</option>
		<option value={1}>Ring</option>
		<option value={2}>Cylinder</option>
	</Select>
	{#if rp.type == 0}
		<Input label="Height" unit="mm" hint="10" bind:value={rp.dim.height} />
		<Input label="Width" unit="mm" hint="10" bind:value={rp.dim.width} />
		<Input label="Depth" unit="mm" hint="10" bind:value={rp.dim.depth} />
	{:else if rp.type == 1}
		<Input label="Height" unit="mm" hint="10" bind:value={rp.dim.height} />
		<Input label="Radius" unit="mm" hint="5" bind:value={rp.dim.radius} />
		<Input label="Inner Radius" unit="mm" hint="3" bind:value={rp.dim.inner} />
	{:else if rp.type == 2}
		<Input label="Radius" unit="mm" hint="5" bind:value={rp.dim.width} />
		<Input label="Height" unit="mm" hint="10" bind:value={rp.dim.height} />
	{/if}

	<div class="flex flex-wrap -mx-2 mb-2">
		<div class="w-full md:w-2/3 px-2">
			<Input label="File Name" bind:value={rp.fileName} />
		</div>
		<div class="w-full md:w-1/3 px-2">
			<Select label="File Type" bind:value={rp.fileType}>
				<option value={0}>SVG</option>
				<option value={1}>JPG</option>
				<option value={2}>PNG</option>
			</Select>
		</div>
	</div>

	<div class="flex justify-center space-x-2 mb-2">
		<button class="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded">
			Export
		</button>
		<button class="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
			on:click|preventDefault={() => dispatch('render')}>
			Preview
		</button>
  	</div>
</form>