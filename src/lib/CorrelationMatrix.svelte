<script lang="ts">
  import type { TMovie } from "../types";
  import * as d3 from "d3";

  type Props = {
    movies: TMovie[];
    progress?: number;
    width?: number;
    height?: number;
  };
  
  let { movies, progress = 100, width = 600, height = 600 }: Props = $props();

  let hoveredCell: { genre1: string; genre2: string; value: number } | null = $state(null);

  // processing the data
  const yearRange = $derived(d3.extent(movies.map((d) => d.year)));

  function getUpYear(yearRange: [undefined, undefined] | [Date, Date]) {
    if (!yearRange[0]) return new Date();
    const timeScale = d3.scaleTime().domain(yearRange).range([0, 100]);
    return timeScale.invert(progress);
  }
  const upYear: Date = $derived(getUpYear(yearRange!));

  // Filter movies up to current year
  const filteredMovies = $derived(
    movies.filter((movie) => movie.year <= upYear)
  );

  // Get all unique genres
  const allGenres = $derived(
    Array.from(new Set(filteredMovies.flatMap((movie) => movie.genres))).sort()
  );

  // Calculate correlation matrix
  const correlationMatrix = $derived(
    (() => {
      const matrix: { [key: string]: { [key: string]: number } } = {};
      
      // Initialize matrix
      allGenres.forEach((genre1) => {
        matrix[genre1] = {};
        allGenres.forEach((genre2) => {
          matrix[genre1][genre2] = 0;
        });
      });

      // Count co-occurrences
      filteredMovies.forEach((movie) => {
        const genres = movie.genres;
        for (let i = 0; i < genres.length; i++) {
          for (let j = 0; j < genres.length; j++) {
            matrix[genres[i]][genres[j]]++;
          }
        }
      });

      // Calculate correlation (normalized by square root of product of diagonal elements)
      const normalized: { [key: string]: { [key: string]: number } } = {};
      allGenres.forEach((genre1) => {
        normalized[genre1] = {};
        allGenres.forEach((genre2) => {
          const denom = Math.sqrt(matrix[genre1][genre1] * matrix[genre2][genre2]);
          normalized[genre1][genre2] = denom > 0 ? matrix[genre1][genre2] / denom : 0;
        });
      });

      return normalized;
    })()
  );

  const margin = {
    top: 100,
    bottom: 20,
    left: 100,
    right: 20,
  };

  let usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
  };

  const cellSize = $derived(
    Math.min(
      (usableArea.right - usableArea.left) / allGenres.length,
      (usableArea.bottom - usableArea.top) / allGenres.length
    )
  );

  // Color scale for correlation values
  const colorScale = $derived(
    d3.scaleSequential(d3.interpolateRdYlBu)
      .domain([1, 0]) // Reverse: high correlation = red, low = blue
  );

  let xAxis: any = $state(),
    yAxis: any = $state();

  function updateAxis() {
    // X axis
    d3.select(xAxis)
      .selectAll("text")
      .data(allGenres)
      .join("text")
      .attr("x", (d, i) => usableArea.left + i * cellSize + cellSize / 2)
      .attr("y", 0)
      .attr("text-anchor", "start")
      .attr("transform", (d, i) => `rotate(-45, ${usableArea.left + i * cellSize + cellSize / 2}, 0)`)
      .style("font-size", "12px")
      .text((d) => d);

    // Y axis
    d3.select(yAxis)
      .selectAll("text")
      .data(allGenres)
      .join("text")
      .attr("x", 0)
      .attr("y", (d, i) => usableArea.top + i * cellSize + cellSize / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .style("font-size", "12px")
      .text((d) => d);
  }

  $effect(() => {
    updateAxis();
  });
</script>

<h3 style="text-align: center;">
  Genre Correlation by Number of Movies Heatmap {yearRange[0]?.getFullYear()} - {yearRange[1]?.getFullYear()}
</h3>

{#if filteredMovies.length > 0}
  <svg {width} {height}>
    <g class="heatmap">
      {#each allGenres as genre1, i}
        {#each allGenres as genre2, j}
          <rect
            x={usableArea.left + j * cellSize}
            y={usableArea.top + i * cellSize}
            width={cellSize}
            height={cellSize}
            fill={colorScale(correlationMatrix[genre1][genre2])}
            stroke="#fff"
            stroke-width="1"
            class="cell"
            on:mouseover={() => {
              hoveredCell = {
                genre1,
                genre2,
                value: correlationMatrix[genre1][genre2]
              };
            }}
            on:mouseout={() => {
              hoveredCell = null;
            }}
          />
        {/each}
      {/each}
    </g>

    <g transform="translate(0, {usableArea.top - 10})" bind:this={xAxis} />
    <g transform="translate({usableArea.left - 10}, 0)" bind:this={yAxis} />

    <!-- Color legend -->
    <g class="legend" transform="translate({usableArea.right - 100}, {margin.top / 2})">
      <text x="0" y="-10" font-size="12" font-weight="bold">Correlation</text>
      {#each Array(11) as _, i}
        {@const value = 1 - i * 0.1}
        <rect
          x="0"
          y={i * 15}
          width="20"
          height="15"
          fill={colorScale(value)}
          stroke="#fff"
        />
        <text
          x="25"
          y={i * 15 + 12}
          font-size="10"
        >
          {value.toFixed(1)}
        </text>
      {/each}
    </g>

    <!-- Tooltip -->
    {#if hoveredCell}
      <g
        class="tooltip"
        transform="translate({width / 2}, {height - 40})"
      >
        <rect
          x="-100"
          y="-25"
          width="200"
          height="30"
          fill="white"
          stroke="#333"
          stroke-width="2"
          rx="5"
        />
        <text
          x="0"
          y="-5"
          text-anchor="middle"
          font-size="12"
          font-weight="bold"
        >
          {hoveredCell.genre1} ↔ {hoveredCell.genre2}
        </text>
        <text
          x="0"
          y="10"
          text-anchor="middle"
          font-size="11"
        >
          Correlation: {hoveredCell.value.toFixed(3)}
        </text>
      </g>
    {/if}
  </svg>
{/if}

<style>
  .cell {
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .cell:hover {
    opacity: 0.8;
    stroke: #000;
    stroke-width: 2;
  }

  .tooltip {
    pointer-events: none;
  }
</style>