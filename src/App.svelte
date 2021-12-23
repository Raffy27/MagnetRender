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
		// Save invariant properties
		let _top = dim.top, _left = dim.left;
		delete dim.top;
		delete dim.left;
		const maxVal = Object.keys(dim).reduce((acc, cur) => {
			return Math.max(acc, dim[cur]);
		}, 0);
		for(const prop in dim){
			dim[prop] = dim[prop] / maxVal * max;
		}
		rp.normalDim = dim;
		// Restore invariant properties
		rp.normalDim.top = _top;
		rp.normalDim.left = _left;
		console.log('RP', rp);
		console.log('DIM', dim);
	}

	let renderPresets = [
		{
			type: 0,

			dim: {
				top: 30,
				left: 30,
				width: 10,
				height: 2,
				depth: 3
			},
			colors: {
				first: '#d64c4c',
				second: '#4f4f4f'
			},
			perspective: 0.19,
			scale: 1,

			fileName: 'Magnet-neodim-{type}-{w}x{h}x{d}',
			fileType: 0
		},
		{
			type: 1,

			dim: {
				top: 30,
				left: 30,
				width: 15,
				height: 6,
				radius: 3,
			},
			colors: {
				first: '#d64c4c',
				second: '#4f4f4f'
			},
			perspective: 0.19,
			scale: 1,

			fileName: 'Magnet-neodim-{type}-{w}x{h}-{r}',
			fileType: 0
		},
		{
			type: 2,

			dim: {
				top: 30,
				left: 30,
				width: 15,
				height: 6,
				radius: 6,
			},
			colors: {
				first: '#d64c4c',
				second: '#4f4f4f'
			},
			perspective: 0.19,
			scale: 1,

			fileName: 'Magnet-neodim-{type}-{w}x{h}',
			fileType: 0
		}
	];

	let svg = '';
	let renderParams = Object.assign({}, renderPresets[0]);

	$: {
		console.log('Reactive normalization');
		normalizeDimensions(renderParams, 350);
	}

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
		console.log('Render presets', renderPresets);
		renderParams = Object.assign({}, renderPresets[renderParams.type]);
		console.log('Render params', renderParams);
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