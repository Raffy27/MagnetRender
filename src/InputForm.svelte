<script>
	import Select from './components/Select.svelte';
	import Input from './components/Input.svelte';
	import NumInput from './components/NumInput.svelte';
	import RangeInput from './components/RangeInput.svelte';
	import ColorInput from './components/ColorInput.svelte';
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
		<NumInput label="Height" unit="mm" hint="10" bind:value={rp.dim.height} />
		<NumInput label="Width" unit="mm" hint="10" bind:value={rp.dim.width} />
		<NumInput label="Depth" unit="mm" hint="10" bind:value={rp.dim.depth} />
	{:else if rp.type == 1}
		<NumInput label="Width" unit="mm" hint="5" bind:value={rp.dim.width} />
		<NumInput label="Height" unit="mm" hint="10" bind:value={rp.dim.height} />
		<NumInput label="Inner Radius" unit="mm" hint="3" bind:value={rp.dim.radius} />
	{:else if rp.type == 2}
		<NumInput label="Width" unit="mm" hint="300" bind:value={rp.dim.width} />
		<NumInput label="Height" unit="mm" hint="300" bind:value={rp.dim.height} />
	{/if}

	<div class="flex flex-wrap -mx-2">
		<div class="w-full md:w-1/2 px-2">
			<RangeInput label="Perspective" bind:value={rp.perspective} min="0.001" max="0.3" step="0.001" />
		</div>
		<div class="w-full md:w-1/2 px-2">
			<RangeInput label="Scale" bind:value={rp.scale} min="0.001" max="2" step="0.001" />
		</div>
	</div>

	<div class="flex flex-wrap -mx-2 mb-2">
		<div class="w-full md:w-1/2 px-2">
			<NumInput label="Left Margin" unit="px" hint="10" bind:value={rp.dim.left} />
		</div>
		<div class="w-full md:w-1/2 px-2">
			<NumInput label="Top Margin" unit="px" hint="10" bind:value={rp.dim.top} />
		</div>
	</div>

	<div class="flex flex-wrap -mx-2 mb-2">
		<div class="w-full md:w-1/2 px-2">
			<ColorInput label="First Color" unit="hex" bind:value={rp.colors.first} />
		</div>
		<div class="w-full md:w-1/2 px-2">
			<ColorInput label="Second Color" unit="hex" hint="10" bind:value={rp.colors.second} />
		</div>
	</div>

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
		<button class="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
			on:click|preventDefault={() => dispatch('exportimg')}>
			Export
		</button>
		<button class="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
			on:click|preventDefault={() => dispatch('save')}>
			Save Preset
		</button>
  	</div>
</form>