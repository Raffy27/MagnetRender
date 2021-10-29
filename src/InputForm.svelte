<script>
	import Select from './components/Select.svelte';
	import Input from './components/Input.svelte';
	let type;

	let width, height, depth, radius, inner;
	let fileName, fileType;
</script>

<form class="w-full min-w-sm">
	<Select label="Magnet Type" bind:value={type}>
		<option value={0}>Prism</option>
		<option value={1}>Ring</option>
		<option value={2}>Cylinder</option>
	</Select>
	{#if type == 0}
		<Input label="Height" unit="mm" hint="10" bind:value={height} />
		<Input label="Width" unit="mm" hint="10" bind:value={width} />
		<Input label="Depth" unit="mm" hint="10" bind:value={depth} />
	{:else if type == 1}
		<Input label="Height" unit="mm" hint="10" bind:value={height} />
		<Input label="Radius" unit="mm" hint="5" bind:value={radius} />
		<Input label="Inner Radius" unit="mm" hint="3" bind:value={inner} />
	{:else if type == 2}
		<Input label="Radius" unit="mm" hint="5" bind:value={radius} />
		<Input label="Height" unit="mm" hint="10" bind:value={height} />
	{/if}

	<div class="flex">
		<Input label="File Name" bind:value={fileName} />
		<Select label="File Type" bind:value={fileType}>
			<option value={0}>SVG</option>
			<option value={1}>JPG</option>
			<option value={2}>PNG</option>
		</Select>
	</div>

	<div class="flex justify-center space-x-2 border">
		<button class="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded">
			Export
		</button>
		<button class="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded">
			Preview
		</button>
  	</div>
</form>