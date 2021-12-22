<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>

<script>
	import InputForm from './InputForm.svelte';
	import Preview from './Preview.svelte';
	const { ipcRenderer } = require('electron');
	export let name;
	export let version;

	const renderPresets = [
		{
			type: 0,

			dim: {
				top: 10,
				left: 30,
				width: 330,
				height: 60,
				depth: 120,
				radius: 77.9,
			},
			perspective: 0.19,
			scale: 1,

			fileName: '',
			fileType: ''
		},
		{
			type: 1,

			dim: {
				top: 30,
				left: 30,
				width: 330,
				height: 60,
				depth: 120,
				radius: 77.9,
			},
			perspective: 0.19,
			scale: 1,

			fileName: '',
			fileType: ''
		},
		{
			type: 2,

			dim: {
				top: 30,
				left: 30,
				width: 330,
				height: 60,
				depth: 120,
				radius: 77.9,
			},
			perspective: 0.19,
			scale: 1,

			fileName: '',
			fileType: ''
		}
	];

	let renderParams = renderPresets[0];

	function save(){
		console.log('Render params = ');
		console.log(renderParams);
		const data = JSON.stringify(renderParams);
		ipcRenderer.send('save-rp', data);
	}

	function exportImg(svg){
		ipcRenderer.send('export-img', svg);
	}
</script>

<main class="h-full">
	<div class="container flex flex-col md:flex-row flex-wrap md:flex-nowrap">
		<div id="left" class="flex flex-col flex-wrap space-y-6 md:w-1/2">
			<div class="container text-center">
				<h1>{name} v{version}</h1>
			</div>
			<InputForm bind:rp={renderParams} on:save={save} />
		</div>
		<div id="right" class="md:w-1/2 pl-2">
			<Preview bind:renderParams={renderParams} />
		</div>
	</div>
</main>