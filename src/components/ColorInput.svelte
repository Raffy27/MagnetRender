<script>
    export let label, unit = null, value;
</script>

<span class="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
    {label}
    {#if unit}
        <span class="lowercase font-normal">({unit})</span>
    {/if}
</span>
<input class="appearance-none block w-full"
    bind:value={value} type="color">