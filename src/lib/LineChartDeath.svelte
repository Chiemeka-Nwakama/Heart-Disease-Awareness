<script lang="ts">
  import { tick } from "svelte";
  import * as d3 from "d3";
  import type { Top5 } from "../types";

  export let data: Top5[] = [];
  export let width = 900;
  export let height = 500;

  const margin = { top: 20, right: 180, bottom: 50, left: 60 };

  let selectedCause: string = "";
  let hoveredCause: string = "";
  let hoveredPoint: { cause: string; year: number; deaths: number } | null = null;

  // Extract numeric years from data dynamically
  $: years = data.length
    ? Object.keys(data[0])
        .filter((k) => k !== "Causes" && k !== "All")
        .map(Number)
    : [];

  // Map data to series
  $: series = data.map((d) => ({
    cause: d.Causes,
    values: years.map((y) => ({
      year: y,
      deaths:
        d[y as keyof Top5] !== undefined &&
        d[y as keyof Top5] !== null &&
        d[y as keyof Top5] !== 0
          ? (d[y as keyof Top5] as number)
          : null,
    })),
  }));

  $: flatValues = series.flatMap((s) => s.values).filter((v) => v.deaths !== null);

  let xScale: d3.ScaleLinear<number, number>;
  let yScale: d3.ScaleLinear<number, number>;
  let colorScale: d3.ScaleOrdinal<string, string>;

  $: if (years.length > 0 && flatValues.length > 0) {
    xScale = d3
      .scaleLinear()
      .domain([d3.min(years)!, d3.max(years)!])
      .range([margin.left, width - margin.right - 20]); // leave room for legend

    yScale = d3
      .scaleLinear()
      .domain([0, d3.max(flatValues, (d) => d.deaths)!])
      .nice()
      .range([height - margin.bottom, margin.top]);

    colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(series.map((s) => s.cause));
  }

  let xAxis: SVGGElement;
  let yAxis: SVGGElement;

  // Update axes when scales or bound elements change
  $: if (xScale && yScale && xAxis && yAxis) {
    tick().then(() => {
      d3.select(xAxis).call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
      d3.select(yAxis).call(d3.axisLeft(yScale));
    });
  }

  const lineGenerator = d3
    .line<{ year: number; deaths: number | null }>()
    .x((d) => xScale(d.year))
    .y((d) => (d.deaths !== null ? yScale(d.deaths) : NaN))
    .defined((d) => d.deaths !== null)
    .curve(d3.curveMonotoneX);

  function toggleCause(cause: string) {
    selectedCause = selectedCause === cause ? "" : cause;
  }
</script>

<h3 style="text-align:center; font-size:24px; font-weight:bold;">
  Top Causes of Death in the U.S.
</h3>


<!-- Container to center the whole chart -->
<div style="display:flex; justify-content:center; width:100%;">
  <svg {width} {height} overflow="visible">
    <!-- Lines and points -->
    {#each series as s}
      <g class="line-group">
        {#if selectedCause === "" || selectedCause === s.cause}
          <path
            d={lineGenerator(s.values)}
            fill="none"
            stroke={colorScale(s.cause)}
            stroke-width={hoveredCause === s.cause || selectedCause === s.cause ? 3 : 2}
            opacity={hoveredCause && hoveredCause !== s.cause ? 0.2 : 1}
            class="line"
            on:mouseover={() => (hoveredCause = s.cause)}
            on:mouseout={() => (hoveredCause = "")}
            on:click={() => toggleCause(s.cause)}
          />
          {#each s.values as v}
            {#if v.deaths !== null}
              <circle
                cx={xScale(v.year)}
                cy={yScale(v.deaths)}
                r={hoveredCause === s.cause || selectedCause === s.cause ? 5 : 3}
                fill={colorScale(s.cause)}
                opacity={hoveredCause && hoveredCause !== s.cause ? 0.2 : 1}
                on:mouseover={() =>
                  (hoveredPoint = { cause: s.cause, year: v.year, deaths: v.deaths! })
                }
                on:mouseout={() => (hoveredPoint = null)}
                on:click={() => toggleCause(s.cause)}
              />
            {/if}
          {/each}
        {/if}
      </g>
    {/each}

    <!-- Axes -->
    <g bind:this={xAxis} transform={`translate(0,${height - margin.bottom})`} />
    <g bind:this={yAxis} transform={`translate(${margin.left},0)`} />

    <!-- Axis Labels -->
    <text
    x={(margin.left + width - margin.right) / 2}
    y={height - 10}
    text-anchor="middle"
    font-size="20"
    font-weight="bold"
      >
    Year
  </text>

    <text
    transform="rotate(-90)"
    x={-height / 2.3}      
    y={-margin.left + 40} 
    text-anchor="middle"
    font-size="20"
    font-weight="bold"
  >
    Deaths
  </text>


    <!-- Legend -->
    <g class="legend" transform={`translate(${width - margin.right + 20}, ${margin.top})`}>
      {#each series as s, i}
        <g
          transform={`translate(0, ${i * 25})`}
          class="legend-item"
          on:click={() => toggleCause(s.cause)}
        >
          <line
            x1="0"
            y1="0"
            x2="20"
            y2="0"
            stroke={colorScale(s.cause)}
            stroke-width="2"
            opacity={selectedCause === "" || selectedCause === s.cause ? 1 : 0.3}
          />
          <text
            x="25"
            y="4"
            font-size="12"
            fill={colorScale(s.cause)}
            opacity={selectedCause === "" || selectedCause === s.cause ? 1 : 0.3}
          >
            {s.cause}
          </text>
        </g>
      {/each}
    </g>

    <!-- Tooltip -->
    {#if hoveredPoint}
      <g transform={`translate(${xScale(hoveredPoint.year)}, ${yScale(hoveredPoint.deaths) - 15})`}>
        <rect x="-50" y="-20" width="100" height="18" fill="white" stroke={colorScale(hoveredPoint.cause)} rx="3" />
        <text x="0" y="-8" text-anchor="middle" font-size="12" font-weight="bold" fill={colorScale(hoveredPoint.cause)}>
          Deaths: {hoveredPoint.deaths}
        </text>
      </g>
    {/if}
  </svg>
</div>

<style>
  .line {
    transition: stroke-width 0.2s ease, opacity 0.2s ease;
    cursor: pointer;
  }
  circle {
    transition: r 0.2s ease, opacity 0.2s ease;
    cursor: pointer;
  }
  .legend-item {
    cursor: pointer;
  }
  .legend-item:hover line,
  .legend-item:hover text {
    opacity: 1 !important;
  }
</style>
