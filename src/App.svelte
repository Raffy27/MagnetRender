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
		type: 1,

		dim: {
			top: 30,
			left: 30,
			width: 389.5,
			height: 124.64,
			radius: 77.9,
		},
		perspective: 0.001,
		scale: 1,

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
			<div class="container text-center">
				<h1>{name} v{version}</h1>
			</div>
			<InputForm bind:rp={renderParams} on:render={render} />
		</div>
		<div id="right" class="md:w-1/2 pl-2">
			<Preview bind:renderParams={renderParams} />
		</div>
	</div>
</main>