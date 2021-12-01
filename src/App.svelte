<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>

<script>
	import InputForm from './InputForm.svelte';
	import Preview from './Preview.svelte';
	export let name;
	export let version;

	let renderParams = {
		type: 2,

		dim: {
			top: 10,
			left: 10,
			width: 300,
			height: 300,
		},

		fileName: '',
		fileType: ''
	};

	function render(){
		console.log('Render params = ');
		console.log(renderParams);
	}
</script>

<main class="h-full">
	<div class="container flex flex-col md:flex-row flex-wrap md:flex-nowrap">
		<div id="left" class="flex flex-col flex-wrap space-y-6 md:w-1/2">
			<h1>{name} v{version}</h1>
			<InputForm bind:rp={renderParams} on:render={render} />
		</div>
		<div id="right" class="md:w-1/2 pl-2">
			<Preview bind:renderParams={renderParams} />
		</div>
	</div>
</main>