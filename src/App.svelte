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

	function normalizeDimensions(rp, max) {
		let dim = Object.assign({}, rp.dim);
		const maxVal = Object.keys(dim).reduce((acc, cur) => {
			return Math.max(acc, dim[cur]);
		}, 0);
		for(const prop in dim){
			dim[prop] = dim[prop] / maxVal * max;
		}
		rp.normalDim = dim;
	}

	let renderPresets = [
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
			colors: {
				first: '#CB5959',
				second: '#36987D'
			},
			perspective: 0.19,
			scale: 1,

			fileName: '',
			fileType: 0
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
			colors: {
				first: '#CB5959',
				second: '#36987D'
			},
			perspective: 0.19,
			scale: 1,

			fileName: '',
			fileType: 0
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
			colors: {
				first: '#CB5959',
				second: '#36987D'
			},
			perspective: 0.19,
			scale: 1,

			fileName: 'Magnet-neodim-disc-{w}x{h}',
			fileType: 0
		}
	];

	let svg = '';
	let renderParams = renderPresets[0];

	$: normalizeDimensions(renderParams, 350);

	function save(){
		ipcRenderer.send('save-rp', renderParams);
	}

	function load(){
		ipcRenderer.send('load-rp');
	}

	ipcRenderer.on('rp', (e, args) => {
		renderParams = args;
	});

	function exportImg(){
		ipcRenderer.send('export-img', {
			renderParams,
			svg: svg.outerHTML
		});
	}

	function newType(){
		console.log('New type', renderParams.type);
		console.log('Render params', renderParams);
		renderParams = renderPresets[renderParams.type];
	}
</script>

<main class="h-full">
	<div class="flex flex-col md:flex-row flex-wrap md:flex-nowrap">
		<div id="left" class="flex flex-col flex-wrap space-y-6 md:w-1/3">
			<div class="container text-center">
				<h1>{name} v{version}</h1>
			</div>
			<InputForm bind:rp={renderParams} on:save={save} on:exportimg={exportImg} on:load={load} on:newtype={newType} />
		</div>
		<div id="right" class="md:w-2/3 pl-2">
			<Preview bind:renderParams={renderParams} bind:svg={svg} />
		</div>
	</div>
</main>