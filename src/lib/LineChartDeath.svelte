<script lang="ts">
  import { tick } from "svelte";
  import * as d3 from "d3";
  import type { Top5 } from "../types";
  
  export let data: Top5[] = [];
  export let width = 700;
  export let height = 500;
  
  // Chart margins
  const margin = { top: 20, right: 200, bottom: 60, left:50 };
  
  // State for selected and hovered lines/points
  let selectedCause = "";
  let hoveredCause = "";
  let hoveredPoint: { cause: string; year: number; deaths: number } | null = null;


  
  // Extract years dynamically from data
  $: years = data.length
    ? Object.keys(data[0]).filter((k) => k !== "Causes" && k !== "All").map(Number)
    : [];
  
  // Map data into series of {cause, values}
  $: series = data.map((d) => ({
    cause: d.Causes,
    values: years.map((y) => ({
      year: y,
      deaths:
        d[y as keyof Top5] !== undefined && d[y as keyof Top5] !== null && d[y as keyof Top5] !== 0
          ? (d[y as keyof Top5] as number)
          : null,
    })),
  }));
  
  // Flatten all death values to calculate y-scale domain
  $: flatValues = series.flatMap((s) => s.values).filter((v) => v.deaths !== null);

    // Compute legend item positions based on wrapped lines
  $: legendPositions = series.map((s) => {
    const lines = splitLegendText(s.cause, 14);
    return { cause: s.cause, lines, height: lines.length * 12 + 8 }; // 12px per line + padding
  });

  
  // Compute cumulative y positions
  let cumulativeY: number[] = [];
  $: {
    cumulativeY = [];
    let y = 0;
    for (let item of legendPositions) {
      cumulativeY.push(y);
      y += item.height;
    }
  }

  
  let xScale;
  let yScale;
  let colorScale;
  
  // Explicit color assignment to ensure Heart Disease is red and swap Chronic Respiratory Disease
  function getColor(cause: string) {
    if (cause === "Heart disease") return "#ff0000"; // red
    if (cause === "Chronic respiratory disease") return "#1f77b4"; // blue
    return colorScale(cause);
  }
    // Split legend text into lines of max length n for easier readablility
  function splitLegendText(text: string, maxChars: number) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (let word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxChars) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  
  // Initialize scales when data is available
  $: if (years.length && flatValues.length) {
    xScale = d3.scaleLinear().domain([d3.min(years), d3.max(years)]).range([margin.left, width - margin.right]);
    yScale = d3.scaleLinear().domain([0, d3.max(flatValues, (d) => d.deaths)]).nice().range([height - margin.bottom, margin.top]);
    colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(series.map((s) => s.cause));
  }
  
  let xAxis;
  let yAxis;
  
  // Render axes when scales and SVG elements are ready
  $: if (xScale && yScale && xAxis && yAxis) {
    tick().then(() => {
      d3.select(xAxis).call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(years.length).tickValues(years));
      d3.select(yAxis).call(d3.axisLeft(yScale));
    });
  }
  
  // D3 line generator
  const lineGenerator = d3.line().x((d) => xScale(d.year)).y((d) => (d.deaths !== null ? yScale(d.deaths) : NaN)).defined((d) => d.deaths !== null).curve(d3.curveMonotoneX);
  
  // Toggle selection of cause
  function toggleCause(cause) {
    selectedCause = selectedCause === cause ? "" : cause;
  }
  </script>
  
  <h3 style="text-align:center; font-size:24px; font-weight:bold;">Top Causes of Death in the U.S.</h3>
  <div style="display:flex; justify-content:center; width:100%;">
  <svg {width} {height} overflow="visible" on:click={() => (selectedCause = "")}>
    <g transform="translate(40, 0)">
    <!-- Lines and points -->
    {#each series as s}
      <g class="line-group">
        {#if selectedCause === "" || selectedCause === s.cause}
          <path d={lineGenerator(s.values)} fill="none" stroke={getColor(s.cause)} stroke-width={hoveredCause === s.cause || selectedCause === s.cause ? 3 : 2} opacity={hoveredCause && hoveredCause !== s.cause ? 0.2 : 1} class="line" on:mouseover={() => (hoveredCause = s.cause)} on:mouseout={() => (hoveredCause = "")} on:click={(e) => { e.stopPropagation(); toggleCause(s.cause); }} />
          {#each s.values as v}
            {#if v.deaths !== null}
              <circle cx={xScale(v.year)} cy={yScale(v.deaths)} r={hoveredCause === s.cause || selectedCause === s.cause ? 5 : 3} fill={getColor(s.cause)} opacity={hoveredCause && hoveredCause !== s.cause ? 0.2 : 1} on:mouseover={() => (hoveredPoint = { cause: s.cause, year: v.year, deaths: v.deaths })} on:mouseout={() => (hoveredPoint = null)} on:click={(e) => { e.stopPropagation(); toggleCause(s.cause); }} />
            {/if}
          {/each}
        {/if}
      </g>
    {/each}
  
    <!-- Axes -->
    <g bind:this={xAxis} transform={`translate(0,${height - margin.bottom})`} />
    <g bind:this={yAxis} transform={`translate(${margin.left},0)`} />
  
    <text x={(margin.left + width - margin.right) / 1.9} y={height - 15} text-anchor="middle" font-size="18" fill="white">Year</text>
    <text transform="rotate(-90)" x={-height / 2.2} y={-10} text-anchor="middle" font-size="18" fill="white">Deaths</text>
  </g>
    <!-- Right Legend -->
    <g class="legend" transform={`translate(${width - margin.right + 50}, ${margin.top})`}>
      <rect width="130" height={cumulativeY[cumulativeY.length-1]  + 60} fill="white" stroke="#000" stroke-width="1.2" rx="8" />
      
      {#each legendPositions as item, i}
        <g transform={`translate(15, ${cumulativeY[i] + 15})`} class="legend-item" on:click={(e) => { e.stopPropagation(); toggleCause(item.cause); }}>
          <rect width="14" height="4" fill={getColor(item.cause)} />
          <text x="20" y="4" font-size="10" font-weight="600" fill="#000">
            {#each item.lines as line, j}
              <tspan x="20" dy={j === 0 ? 0 : 12}>{line}</tspan>
            {/each}
          </text>
        </g>
      {/each}
    </g>
    

  
    <!-- Tooltip -->
    {#if hoveredPoint}
      <g transform={`translate(${xScale(hoveredPoint.year)}, ${yScale(hoveredPoint.deaths) - 15})`}>
        <rect x="-60" y="-20" width="120" height="18" fill="white" stroke="#000" rx="3" />
        <text x="0" y="-8" text-anchor="middle" font-size="12" font-weight="bold" fill="#000">Deaths: {hoveredPoint.deaths.toLocaleString()}</text>
      </g>
    {/if}
  </svg>
  </div>
  
  <style>
  /* Line animation */
  .line {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: draw 2s ease forwards;
    transition: stroke-width 0.2s ease, opacity 0.2s ease;
  }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  
  circle { transition: r 0.2s ease, opacity 0.2s ease; cursor: pointer; }
  .legend-item { cursor: pointer; }
  </style>
