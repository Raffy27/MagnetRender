<script>
    export let label, unit = null, value = 0;
    export let step = 1, min = 0, max = 100;
</script>

<span class="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
    {label}
    {#if unit}
        <span class="lowercase font-normal">({unit})</span>
    {/if}
</span>
<input type="range" bind:value={value} step={step} min={min} max={max} class="block w-full py-3 px-4 mb-3 leading-tight">