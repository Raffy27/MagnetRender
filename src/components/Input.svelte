<script>
    export let label;
    export let value;
    export let unit;
    export let hint;
</script>

<span class="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
    {label}
    {#if unit}
        <span class="lowercase font-normal">({unit})</span>
    {/if}
</span>
<input class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
    bind:value={value} type="text" placeholder={hint}>