<script>
    export let svg;
    export let renderParams;
    $: ({ top, left, width, height, depth } = renderParams.dim);

    let alpha, top_height, top_width, ll_h, ll_w;
    $: alpha = renderParams.perspective * Math.PI/2 /0.3;
    $: if(alpha < Math.PI/12) alpha = Math.PI/12;
    $: top_height = depth * Math.sin(alpha);
    $: top_width = depth * Math.cos(alpha);
    $: ll_h = 16 * Math.cos(alpha);
    $: ll_w = 16 * Math.sin(alpha);
</script>

<svg bind:this={svg} viewBox={`0 0 ${640/renderParams.scale} ${640/renderParams.scale}`} xmlns="http://www.w3.org/2000/svg">
    <style>
        .arrow-marker {
            fill: #999;
        }

        .arrow-dimension-line {
            fill: none;
            stroke-width: 0.75;
            stroke: #999;
        }

        .arrow,
        .arrow-inverted-start,
        .arrow-inverted-end {
            fill: none;
            stroke-width: 1.5;
            stroke: #999;
        }

        .arrow {
            marker-start: url(#arrow-start);
            marker-end: url(#arrow-end);
        }

        .arrow-inverted-start {
            marker-end: url(#arrow-inverted-start);
        }

        .arrow-inverted-end {
            marker-start: url(#arrow-inverted-end);
        }

        .border {
            stroke-width: 2;
            stroke: black;
        }
    </style>
    <defs>
        <marker id="arrow-start" orient="auto" markerWidth="10" markerHeight="5" refX="6.6666666666667" refY="2.5">
            <path d="M10 0V5L0 2.5Z" class="arrow-marker" />
        </marker>
        <marker id="arrow-end" orient="auto" markerWidth="10" markerHeight="5" refX="3.3333333333333" refY="2.5">
            <path d="M0 0V5L10 2.5Z" class="arrow-marker" />
        </marker>
        <marker id="arrow-inverted-start" orient="auto" markerWidth="10" markerHeight="5" refX="3.3333333333333"
            refY="2.5">
            <path d="M0 0V5L10 2.5Z" class="arrow-marker" />
        </marker>
        <marker id="arrow-inverted-end" orient="auto" markerWidth="10" markerHeight="5" refX="6.6666666666667"
            refY="2.5">
            <path d="M10 0V5L0 2.5Z" class="arrow-marker" />
        </marker>
        <clipPath id="north-clip">
            <path d={`M${left} ${top_height}L${left+top_width} ${top}H${left+top_width+width}V${top+height/2}L${left+width} ${top_height+height/2}H${left}Z`}
                fill="#CB5959" />
        </clipPath>
    </defs>
    <path d={`M${left} ${top_height}L${left+top_width} ${top}H${left+top_width+width}V${top+height}L${left+width} ${top_height+height}H${left}Z`}
        fill="#36987D" />
    <path d={`M${left} ${top_height}L${left+top_width} ${top}H${left+top_width+width}V${top+height}L${left+width} ${top_height+height}H${left}Z`}
        fill="#CB5959" clip-path="url(#north-clip)" />
    <path d={`M${left} ${top_height+height+3}v16`} class="arrow-dimension-line" />
    <path d={`M${left+width} ${top_height+height+3}v16`} class="arrow-dimension-line" />
    <path d={`M${left+10} ${top_height+height+14}h${width-2*10}`} class="arrow" />
    <text x={left+width/2} y={top_height+height+34} font-size="21" font-family="Arial, Helvetica, sans-serif"
        style="fill:#999;text-anchor:middle;">{width} mm</text>
    <path d={`M${left+top_width+width+3} ${top}h16`} class="arrow-dimension-line" />
    <path d={`M${left+top_width+width+3} ${top+height}h16`} class="arrow-dimension-line" />
    <path d={`M${left+top_width+width+14} ${top+10}v${height-2*10}`} class="arrow" />
    <text x={left+top_width+width+24} y={top+height/2+10} font-size="21" font-family="Arial, Helvetica, sans-serif"
        style="fill:#999;text-anchor:left;">{height} mm</text>
    <path d={`M${left+width+3} ${top_height+height+3}l${ll_w} ${ll_h}`} class="arrow-dimension-line" />
    <path d={`M${left+top_width+width+3} ${top+height+3}l${ll_w} ${ll_h}`} class="arrow-dimension-line" />
    <path d={`M${left+width+ll_w/2+3+Math.cos(alpha)*10} ${top_height+height+ll_h/2+3-Math.sin(alpha)*10}L${left+top_width+width+ll_w/2+3-Math.cos(alpha)*10} ${top+height+ll_h/2+3+Math.sin(alpha)*10}`} class="arrow"/>
    <text x={left+width+top_width/2} y={top+height+top_height/2+21} font-size="21" font-family="Arial, Helvetica, sans-serif"
        style="fill:#999;text-anchor:left;" transform="translate(15, 15)">{depth} mm</text>
    <path d={`M${left} ${top_height}H${left+width}V${top_height+height}H${left}Z`} fill="none" class="border" />
    <path d={`M${left} ${top_height}L${left+top_width} ${top}H${left+top_width+width}V${top+height}L${left+width} ${top_height+height}`} fill="none"
        class="border" />
    <path d={`M${left+width} ${top_height}L${left+top_width+width} ${top}`} class="border" />
</svg>