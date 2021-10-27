<script>
	import Select from './components/Select.svelte';
	import Input from './components/Input.svelte';
</script>

<form class="w-full min-w-sm">
	<Select label="Magnet type">
		<option value={1}>Prism</option>
		<option value={0}>Ring</option>
		<option value={2}>Cylinder</option>
	</Select>
	<Input label="Width" />
	<Input label="Height" />

	<div class="flex items-center">
		<button class="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded">
			Preview
		</button>
		<button class="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded">
			Export
		</button>
  </div>
	</form>