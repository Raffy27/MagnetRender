<script>
    export let renderParams;
    $: ({ top, left, width, height } = renderParams.dim);
    let rad_y;
    $: renderParams.perspective = 0.23;
    $: rad_y = width * renderParams.perspective;
</script>

<div class="my-12"></div>
<div class="w-full h-full">
    <svg viewBox="0 0 462 500" width="600" xmlns="http://www.w3.org/2000/svg">
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
            <clipPath id="magnet-clip">
                <path
                    d={`M${left} ${top+rad_y}a${width/2} ${rad_y} 0 0 1 ${width} 0 v${height} a${width/2} ${rad_y} 0 0 1 ${-width} 0 z`} />
            </clipPath>
            <clipPath id="north-clip">
                <path
                    d={`M${left} ${top+rad_y}a${width/2} ${rad_y} 0 0 1 ${width} 0 v${height/2} a${width/2} ${rad_y} 0 0 1 ${-width} 0 z`} />
            </clipPath>
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
        </defs>
        <g>
            <rect x={left} y={top} width={width} height={top+rad_y+height+rad_y} style="clip-path:url(#magnet-clip);fill:#36987D" />
            <rect x={left} y={top} width={width} height={top+rad_y+height+rad_y} style="clip-path:url(#north-clip);fill:#CB5959" />
        </g>
        <path d={`M${left+width+3} ${top+rad_y}h16`} class="arrow-dimension-line" />
        <path d={`M${left+width+3} ${top+rad_y+height}h16`} class="arrow-dimension-line" />
        <path d={`M${left+width+14} ${top+rad_y+10}v${height-2*10}`} class="arrow" />
        <text x={left+width+20} y={top+rad_y+height/2-10} font-size="21" font-family="Arial, Helvetica, sans-serif"
            style="fill:#999;text-anchor:left;">{height} mm</text>
        <path d={`M${left} ${top+rad_y+height+3}v${rad_y+7}`} class="arrow-dimension-line" />
        <path d={`M${left+width} ${top+rad_y+height+3}v${rad_y+7}`} class="arrow-dimension-line" />
        <path d={`M${left+10} ${top+rad_y+height+rad_y+7}h${width-2*10}`} class="arrow" />
        <text x={left+width/2} y={top+rad_y+height+rad_y+30} font-size="21" font-family="Arial, Helvetica, sans-serif"
            style="fill:#999;text-anchor:middle;">{width} mm</text>
        <ellipse cx={left+width/2} cy={top+rad_y} rx={width/2} ry={rad_y} class="border"
            fill="none" />
        <path d={`M${left} ${top+rad_y+height}a${width/2} ${rad_y} 0 0 0 ${width} 0`} class="border" fill="none" />
        <path d={`M${left} ${top+rad_y}v${height}`} class="border" />
        <path d={`M${left+width} ${top+rad_y}v${height}`} class="border" />
    </svg>
</div>