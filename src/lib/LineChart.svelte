<script lang="ts">
  import { scale } from "svelte/transition";
  import type { TMovie } from "../types";
  import * as d3 from "d3";

  // define the props of the LineChart component
  type Props = {
    movies: TMovie[];
    progress?: number;
    width?: number;
    height?: number;
  };
  
  let { movies, progress = 100, width = 500, height = 400 }: Props = $props();

  let selectedGenre: string = $state("");
  let hoveredGenre: string = $state("");
  let hoveredPoint: { genre: string; year: number; count: number } | null = $state(null);

  // processing the data
  const yearRange = $derived(d3.extent(movies.map((d) => d.year)));

  function getUpYear(yearRange: [undefined, undefined] | [Date, Date]) {
    if (!yearRange[0]) return new Date();
    const timeScale = d3.scaleTime().domain(yearRange).range([0, 100]);
    return timeScale.invert(progress);
  }
  const upYear: Date = $derived(getUpYear(yearRange!));

  // Get all unique genres
  const allGenres = $derived(
    Array.from(new Set(movies.flatMap((movie) => movie.genres)))
  );

  // Process data to get counts by year and genre
  function getGenreCountsByYear(movies: TMovie[], upYear: Date) {
    const filteredMovies = movies.filter((movie) => movie.year <= upYear);
    const yearlyData = new Map<number, Map<string, number>>();

    filteredMovies.forEach((movie) => {
      const year = movie.year.getFullYear();
      if (!yearlyData.has(year)) {
        yearlyData.set(year, new Map());
      }
      const yearMap = yearlyData.get(year)!;
      
      movie.genres.forEach((genre: string) => {
        yearMap.set(genre, (yearMap.get(genre) || 0) + 1);
      });
    });

    return yearlyData;
  }

  const genreCountsByYear = $derived(getGenreCountsByYear(movies, upYear));

  // Convert to array format for line drawing having both the counts for each genere and the year it occurs
  const timeSeriesData = $derived(
    (() => {
      const data: { [genre: string]: { year: number; count: number }[] } = {};
      
      allGenres.forEach((genre) => {
        data[genre] = [];
      });

      genreCountsByYear.forEach((genreMap, year) => {
        allGenres.forEach((genre) => {
          data[genre].push({
            year: year,
            count: genreMap.get(genre) || 0,
          });
        });
      });

      // Sort data by year
      Object.keys(data).forEach((genre) => {
        data[genre].sort((a, b) => a.year - b.year);
      });

      return data;
    })()
  );

  // Gets top 3 genres by total count
  const top3Genres = $derived(
    (() => {
      const totals: { [genre: string]: number } = {};
      
      Object.entries(timeSeriesData).forEach(([genre, data]) => {
        totals[genre] = data.reduce((sum, point) => sum + point.count, 0);
      });
      
      return Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genre]) => genre);
    })()
  );

  // Filter to only show top 3 genres
  const filteredTimeSeriesData = $derived(
    (() => {
      const filtered: { [genre: string]: { year: number; count: number }[] } = {};
      top3Genres.forEach((genre) => {
        filtered[genre] = timeSeriesData[genre];
      });
      return filtered;
    })()
  );

  // Color scale for genres this makes sure each genere is a different color for readability 
  const colorScale = $derived(
    d3.scaleOrdinal(d3.schemeCategory10).domain(top3Genres)
  );

  const margin = {
    top: 15,
    bottom: 50,
    left: 50,
    right: 120,
  };

  let usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
  };

  const xScale = $derived(
    d3
      .scaleLinear()
      .domain([
        yearRange[0]?.getFullYear() || 0,
        yearRange[1]?.getFullYear() || 0,
      ])
      .range([usableArea.left, usableArea.right])
  );

  const yScale = $derived(
    (() => {
      const maxCount = d3.max(
        Object.values(filteredTimeSeriesData).flatMap((arr) => arr.map((d) => d.count))
      ) || 0;
      return d3
        .scaleLinear()
        .domain([0, maxCount])
        .range([usableArea.bottom, usableArea.top]);
    })()
  );

  // Line generator
  const lineGenerator = $derived(
    d3
      .line<{ year: number; count: number }>()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.count))
      .curve(d3.curveMonotoneX)
  );

  let xAxis: any = $state(),
    yAxis: any = $state();

  function updateAxis() {
    // X axis
    d3.select(xAxis)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")))
      .selectAll("text")
      .style("font-size", "12px");

    // Y-axis
    d3.select(yAxis)
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-size", "12px");
  }

  $effect(() => {
    updateAxis();
  });
</script>

<!--Centers title-->
<h3 style="text-align: center;">
  Top 3 Movie Genres Over Time {yearRange[0]?.getFullYear()} - {yearRange[1]?.getFullYear()}
</h3>

{#if movies.length > 0}
  <svg {width} {height}>
    <g class="lines">
      {#each Object.entries(filteredTimeSeriesData) as [genre, data]}
        <g class="line-group">
          <path
            d={lineGenerator(data) || ""}
            fill="none"
            stroke={colorScale(genre)}
            stroke-width={selectedGenre === genre || hoveredGenre === genre ? 3 : 2}
            opacity={selectedGenre === "" || selectedGenre === genre ? 1 : 0.2}
            class="line"
            on:mouseover={() => (hoveredGenre = genre)}
            on:mouseout={() => (hoveredGenre = "")}
            on:click={() => (selectedGenre = selectedGenre === genre ? "" : genre)}
          />
          
          <!-- Data points -->
          {#each data as point}
            <circle
              cx={xScale(point.year)}
              cy={yScale(point.count)}
              r={selectedGenre === genre || hoveredGenre === genre || 
                 (hoveredPoint?.genre === genre && hoveredPoint?.year === point.year) ? 5 : 3}
              fill={colorScale(genre)}
              opacity={selectedGenre === "" || selectedGenre === genre ? 1 : 0.2}
              class="data-point"
              on:mouseover={() => {
                hoveredGenre = genre;
                hoveredPoint = { genre, year: point.year, count: point.count };
              }}
              on:mouseout={() => {
                hoveredGenre = "";
                hoveredPoint = null;
              }}
              on:click={() => (selectedGenre = selectedGenre === genre ? "" : genre)}
            />
          {/each}
        </g>
      {/each}
    </g>

    <g transform="translate(0, {usableArea.bottom})" bind:this={xAxis} />
    <g transform="translate({usableArea.left}, 0)" bind:this={yAxis} />

    <!-- Y-axis Label -->
    <text
    transform="rotate(-90)"
    x={-height / 2}
    y={margin.left / 4}
    text-anchor="middle"
    font-size="14"
    font-weight="bold"
    >
    Number of Movies by Genre
    </text>


    <!-- Legend -->
    <g class="legend" transform="translate({usableArea.right + 10}, {usableArea.top})">
      {#each top3Genres as genre, i}
        <g
          transform="translate(0, {i * 20})"
          class="legend-item"
          on:mouseover={() => (hoveredGenre = genre)}
          on:mouseout={() => (hoveredGenre = "")}
          on:click={() => (selectedGenre = selectedGenre === genre ? "" : genre)}
        >
          <line
            x1="0"
            x2="20"
            y1="0"
            y2="0"
            stroke={colorScale(genre)}
            stroke-width="2"
            opacity={selectedGenre === "" || selectedGenre === genre ? 1 : 0.3}
          />
          <text
            x="25"
            y="4"
            font-size="12"
            fill={colorScale(genre)}
            opacity={selectedGenre === "" || selectedGenre === genre ? 1 : 0.3}
          >
            {genre}
          </text>
        </g>
      {/each}
    </g>

    <!-- Tooltip -->
    {#if hoveredPoint}
      <g
        class="tooltip"
        transform="translate({xScale(hoveredPoint.year)}, {yScale(hoveredPoint.count) - 15})"
      >
        <rect
          x="-40"
          y="-20"
          width="80"
          height="18"
          fill="white"
          stroke={colorScale(hoveredPoint.genre)}
          stroke-width="1"
          rx="3"
        />
        <text
          x="0"
          y="-8"
          text-anchor="middle"
          font-size="12"
          font-weight="bold"
          fill={colorScale(hoveredPoint.genre)}
        >
          {hoveredPoint.year}: {hoveredPoint.count}
        </text>
      </g>
    {/if}
  </svg>
{/if}

<style>
  .line {
    transition: stroke-width 0.2s ease, opacity 0.2s ease;
    cursor: pointer;
  }

  .data-point {
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

  .tooltip {
    pointer-events: none;
  }
</style>