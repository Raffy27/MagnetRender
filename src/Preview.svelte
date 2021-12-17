<script>
    export let renderParams;
    $: ({ top, left, width, height, depth } = renderParams.dim);

    let top_height, alpha_cpl;
    $: top_height = (top + depth / Math.sqrt(2)) * (renderParams.perspective + 0.3) * 2;
    //$: alpha_cpl = 
</script>

<div class="my-12"></div>
<div class="w-full h-full">
    <svg viewBox="0 0 500 191" width="600" xmlns="http://www.w3.org/2000/svg">
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
                <path d={`M${left} ${top_height}L${top+height} ${top}H${left+height+width}V${top+height/2}L${left+width} ${top_height+height/2}H${left}Z`} />
                    fill="#CB5959" />
            </clipPath>
        </defs>
        <path d={`M${left} ${top_height}L${top+height} ${top}H${left+height+width}V${top+height}L${left+width} ${top_height+height}H${left}Z`}
            fill="#36987D" />
        <path d={`M${left} ${top_height}L${top+height} ${top}H${left+height+width}V${top+height}L${left+width} ${top_height+height}H${left}Z`}
            fill="#CB5959" clip-path="url(#north-clip)" />
        <path d={`M${left} ${top_height+height+3}v16`} class="arrow-dimension-line" />
        <path d={`M${left+width} ${top_height+height+3}v16`} class="arrow-dimension-line" />
        <path d={`M${left+10} ${top_height+height+14}h${width-2*10}`} class="arrow" />
        <text x={left+width/2} y={top_height+height+34} font-size="21" font-family="Arial, Helvetica, sans-serif"
            style="fill:#999;text-anchor:middle;">{width} mm</text>
        <path d={`M${left+height+width+3} ${top}h16`} class="arrow-dimension-line" />
        <path d={`M${left+height+width+3} ${top+height}h16`} class="arrow-dimension-line" />
        <path d={`M${left+height+width+14} ${top+10}v${height-2*10}`} class="arrow" />
        <text x={left+height+width+24} y={top+height/2+10} font-size="21" font-family="Arial, Helvetica, sans-serif"
            style="fill:#999;text-anchor:left;">{height} mm</text>
        <path d="M339.82829971531 139.45573684616L351.1420082143 150.76944534514" class="arrow-dimension-line" />
        <path d="M401.62132034356 77.66271621791L412.93502884254 88.976424716895" class="arrow-dimension-line" />
        <path d="M354.67754212023 140.16284362734L402.32842712475 92.511958622828" class="arrow" />
        <text x="382.74562530961" y="135.58004181221" font-size="21" font-family="Arial, Helvetica, sans-serif"
            style="fill:#999;text-anchor:left;">{depth} mm</text>
        <path d={`M${left} ${top_height}H${left+width}V${top_height+height}H${left}Z`} fill="none" class="border" />
        <path d={`M${left} ${top_height}L${top+height} ${top}H${left+height+width}V${top+height}L${left+width} ${top_height+height}`} fill="none"
            class="border" />
        <path d={`M${left+width} ${top_height}L${left+height+width} 10`} class="border" />
    </svg>
</div>