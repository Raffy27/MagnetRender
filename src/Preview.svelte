<script>
    import Prism from './schemas/Prism.svelte';
    import Ring from './schemas/Ring.svelte';
    import Cylinder from './schemas/Cylinder.svelte';

    export let renderParams;
    export let svg;
</script>

<div class="my-12"></div>
<div class="w-full h-full">
    {#if renderParams.type == 0}
        <Prism renderParams={renderParams} bind:svg={svg} />
    {:else if renderParams.type == 1}
        <Ring renderParams={renderParams} bind:svg={svg} />
    {:else if renderParams.type == 2}
        <Cylinder renderParams={renderParams} bind:svg={svg} />
    {/if}
</div>