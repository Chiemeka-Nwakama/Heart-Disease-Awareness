<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as d3 from "d3";
  import type { Top5 } from "../types";

  export let data: Top5[] = [];

  let leftColumn: HTMLDivElement;
  let svgElement: SVGSVGElement;
  let scrollyRoot: HTMLDivElement;
  let tooltip: HTMLDivElement;

  let allowScrollUpdates = false;


  let selectedCause = "";
  let hoveredCause = "";
  let currentYearIndex = 0;
  let scrollPercent = 0; // 0..100

  

  // small right margin so chart fills space up to legend
  const margin = { top: 40, right: 100, bottom: 60, left: 50 };


  // --------------------------
  // Data processing
  // --------------------------
  $: years = data.length
    ? Object.keys(data[0]).filter(k => k !== "Causes" && k !== "All").map(Number)
    : [];
    $: series = data.map(d => {
  let causeName = d.Causes;

  // Rename Malignant neoplasms → Cancer
  if (causeName === "Malignant neoplasms") {
    causeName = "Cancer";
  }

  return {
    cause: causeName,
    values: years.map(y => ({
      year: y,
      deaths: d[y as keyof Top5] ?? null
    }))
  };
});




  $: flatValues = series.flatMap(s => s.values).filter(v => v.deaths !== null);

  const yearInsights: Record<number, { leader: string; insight: string }> = {
  2017: { 
    leader: "Heart disease", 
    insight: 
      "Heart disease remains the nation's leading killer, with mortality staying well above all other causes. Cancer follows as the second-leading cause with stable levels." 
  },

  2018: { 
    leader: "Heart disease", 
    insight: 
      "Heart disease and cancer deaths continue their gradual upward trend. Chronic lower respiratory disease, accidents, and stroke remain consistent middle of the range causes."
  },

  2019: { 
    leader: "Heart disease", 
    insight: 
      "Pre-pandemic mortality patterns hold steady. Heart disease and cancer stay dominant, while influenza/pneumonia trends dip and accidents show a small increase."
  },

  2020: { 
    leader: "Heart disease", 
    insight: 
      "The emergence of COVID-19 dramatically reshapes national mortality. COVID-19 becomes a top cause of death, surpassing cancer temporarily." 
  },

  2021: { 
    leader: "Heart disease", 
    insight: 
    "Despite the vaccine's release in late 2020, COVID-19 reaches peak mortality. Deaths from accidents, diabetes, Alzheimer’s, and liver disease also rise, contributing to higher overall mortality."
  },

 


    2022: {
      leader: "Heart disease",
      insight:
      "While Covid finally declines following the rollout of vaccines, heart disease remains the leading cause of death, affecting hundreds of thousands."
    }
  };

  // adjusted palette for lines
  const palette = [
    "#e41a1c", // Heart disease - red
    "#377eb8", // blue
    "#4daf4a", // green
    "#984ea3", // purple
    "#ff7f00", // orange
    "#a65628", // brown
    "#f781bf", // pink
    "#999999", // gray
    "#66c2a5", // teal
    "#8dd3c7"  // light teal
  ];

  // explicit special colors
  const specialColors: Record<string, string> = {
    "Heart disease": "#e41a1c", // always red for Heart disease
    "Suicide": "#ffff00"        // Suicide - yellow
  };

  function getColor(cause: string, index: number) {
    if (specialColors[cause]) return specialColors[cause];

    // Influenza (including "Influenza and pneumonia") - bright green
    if (cause.includes("Influenza")) return "#32cd32";

    // for all other causes, use the palette but skip the first color (Heart disease red)
    const basePalette = palette.slice(1);
    return basePalette[index % basePalette.length];
  }

  function getRankForYear(cause: string, year: number) {
  // Build a list of { cause, deaths } for that year
  const ranked = series
    .map(s => ({
      cause: s.cause,
      deaths: s.values.find(v => v.year === year)?.deaths ?? 0
    }))
    .sort((a, b) => b.deaths - a.deaths); // high → low

  const index = ranked.findIndex(r => r.cause === cause);
  return index >= 0 ? index + 1 : null;
}


  // --------------------------
  // Interactivity / scrolling
  // --------------------------
  function toggleCause(cause: string) {
    // click again to clear selection
    selectedCause = selectedCause === cause ? "" : cause;
    hoveredCause = "";
    drawChart();
  }

  function clearSelection() {
    selectedCause = "";
    hoveredCause = "";
    drawChart();
  }

  // Snap left column to a specific year index
  function snapToYear(idx: number) {
    const cards = leftColumn?.querySelectorAll<HTMLElement>(".year-card");
    if (!cards || !cards[idx]) return;
    cards[idx].scrollIntoView({ behavior: "smooth", block: "start" });
    currentYearIndex = idx;
    drawChart();
  }

  // Handle left column scroll: update scrollPercent and active year
  let scrollAnimFrame: number | null = null;
  function onLeftScroll() {
    if (!allowScrollUpdates) return;
    if (!leftColumn) return;
    if (scrollAnimFrame != null) cancelAnimationFrame(scrollAnimFrame);
    scrollAnimFrame = requestAnimationFrame(() => {
      const el = leftColumn;
      const max = el.scrollHeight - el.clientHeight;
      scrollPercent =
        max > 0 ? Math.max(0, Math.min(100, (el.scrollTop / max) * 100)) : 0;

      // When at very top, force year 2017 (index 0)
      if (el.scrollTop === 0) {
        if (currentYearIndex !== 0) {
          currentYearIndex = 0;
          drawChart();
        }
        return;
      }

      const refY = el.scrollTop + el.clientHeight * 0.35;
      const cards = Array.from(el.querySelectorAll<HTMLElement>(".year-card"));
      if (cards.length === 0) return;

      let bestIdx = 0;
      let bestDist = Infinity;
      cards.forEach((c, i) => {
        const top = c.offsetTop;
        const dist = Math.abs(top - refY);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });

      if (bestIdx !== currentYearIndex) {
        currentYearIndex = bestIdx;
        drawChart();
      }
    });
  }

  function onSvgClick(event: MouseEvent) {
    // only clear when clicking on empty SVG background, not on points/paths
    if (event.target === svgElement) {
      clearSelection();
    }
  }

  // --------------------------
  // D3 drawing
  // --------------------------
  let resizeObserver: ResizeObserver | null = null;

  function drawChart() {
    if (!svgElement || years.length === 0) return;

    


    if (!years || years.length === 0) return;


    if (!series || series.length === 0) return;

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    const box = svgElement.getBoundingClientRect();
    if (box.width < 50 || box.height < 50) return;
    const width = Math.max(400, box.width);
    const height = Math.max(320, box.height);

    const minYear = d3.min(years)!;
    const maxYear = d3.max(years)!;

    // add small padding so first/last ticks aren't right on edge
    const x = d3.scaleLinear()
      .domain([minYear - 0.3, maxYear + 0.3])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(flatValues, d => d.deaths)!])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3.line()
      .x((d: any) => x(d.year))
      .y((d: any) => y(d.deaths))
      .defined((d: any) => d.deaths !== null)
      .curve(d3.curveMonotoneX);

    // Add chart title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "700")
      .style("fill", "#0f172a")
      .text("Top Leading Causes of Death in the US (2017–2022)");


    // axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")).tickValues(years))
      .selectAll("text").style("font-size", "12px");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickFormat(d => (d as number / 1000) + "k"))
      .selectAll("text").style("font-size", "12px");

    const visibleYears = years.slice(0, currentYearIndex + 1);

    // draw series lines & points
    series.forEach((s, sIdx) => {
      // when a cause is selected, only draw that one
      if (selectedCause && selectedCause !== s.cause) return;

      const valid = s.values.filter(v => visibleYears.includes(v.year) && v.deaths !== null);
      if (!valid.length) return;

      // line
      svg.append("path")
        .datum(valid)
        .attr("d", line as any)
        .attr("fill", "none")
        .attr("stroke", getColor(s.cause, sIdx))
        .attr("stroke-width", (hoveredCause === s.cause || selectedCause === s.cause) ? 3.5 : 2.5)
        .attr("opacity", (hoveredCause && hoveredCause !== s.cause) ? 0.25 : 1);

      // points
      valid.forEach(v => {
        const idxYear = years.indexOf(v.year);
        svg.append("circle")
          .attr("cx", x(v.year))
          .attr("cy", y(v.deaths!))
          .attr("r", (hoveredCause === s.cause || selectedCause === s.cause) ? 5.5 : 4.5)
          .attr("fill", getColor(s.cause, sIdx))
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.6)
          .style("cursor", "pointer")
          .style("opacity", (hoveredCause && hoveredCause !== s.cause) ? 0.25 : 1)
          .on("click", () => snapToYear(idxYear))
          .on("mouseover", (event) => {
            hoveredCause = s.cause;
            tooltip.style.display = "block";
            const rank = getRankForYear(s.cause, v.year);

          tooltip.innerHTML = `
            <strong>${rank ? `#${rank} — ` : ""}${s.cause}</strong><br>
            ${v.year}: ${v.deaths!.toLocaleString()} deaths
          `;


            const svgRect = svgElement.getBoundingClientRect();
            tooltip.style.left = (event.clientX - svgRect.left + 120) + "px";
            tooltip.style.top = (event.clientY - svgRect.top - 28) + "px";

          
          })
          .on("mousemove", (event) => {
            const svgRect = svgElement.getBoundingClientRect();
            tooltip.style.left = (event.clientX - svgRect.left + 120) + "px";
            tooltip.style.top = (event.clientY - svgRect.top - 28) + "px";
            
          })
          .on("mouseout", () => {
            hoveredCause = "";
            tooltip.style.display = "none";
       
          });
      });
    });
  }

  // --------------------------
  // Lifecycle handlers
  // --------------------------
  onMount(() => {
  if (svgElement) {
    resizeObserver = new ResizeObserver(() => drawChart());
    resizeObserver.observe(svgElement);
  }
  if (leftColumn) {
    leftColumn.addEventListener("scroll", onLeftScroll, { passive: true });
  }

  // Set default year
  currentYearIndex = 0;

  

  // Ensure 2017 dot is visible
  setTimeout(() => {
    snapToYear(0);
    drawChart();

    // NOW allow scroll to update the year
    allowScrollUpdates = true;
  }, 5000);
});


  onDestroy(() => {
    if (resizeObserver && svgElement) {
      resizeObserver.unobserve(svgElement);
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (leftColumn) leftColumn.removeEventListener("scroll", onLeftScroll);
    if (scrollAnimFrame != null) cancelAnimationFrame(scrollAnimFrame);
  });
</script>

<div class="scrolly-root" bind:this={scrollyRoot}>
  <div class="scroll-progress">
    <div class="scroll-bar" style="height: {scrollPercent}%"></div>
  </div>

  <div class="content-grid">
    <div class="left-column" bind:this={leftColumn} tabindex="0" aria-label="Years list">
      {#if years.length === 0}
        <div class="empty"></div>
      {:else}
        {#each years as year, i}
          <div
            class="year-card {i === currentYearIndex ? 'active' : ''}"
            data-index={i}
            on:click={() => snapToYear(i)}
          >
            <div class="accent"></div>
            <div class="year-body">
              <div class="year-top">
                <div class="year-badge">{year}</div>
                <div class="leader-name">{yearInsights[year]?.leader ?? ""}</div>
              </div>
              <div class="year-insight">
                <p>{yearInsights[year]?.insight ?? ""}</p>
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <div class="chart-column">
      <div class="chart-card">
        <svg bind:this={svgElement} class="chart-svg" on:click={onSvgClick} />
        <div class="chart-legend">
          {#each series as s, i}
            <button
              type="button"
              class="legend-item {selectedCause === s.cause ? 'active' : ''}"
              style={`--legend-color: ${getColor(s.cause, i)}`}
              on:click|stopPropagation={() => toggleCause(s.cause)}
              on:mouseenter={() => {
                hoveredCause = s.cause;
                drawChart();
              }}
              on:mouseleave={() => {
                hoveredCause = "";
                drawChart();
              }}
            >
              <span class="legend-swatch"></span>
              <span class="legend-label">{s.cause}</span>
            </button>
          {/each}
          {#if selectedCause}
            <button
              type="button"
              class="legend-reset"
              on:click|stopPropagation={clearSelection}
            >
              Show all causes
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div class="chart-tooltip" bind:this={tooltip}></div>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto,
      "Helvetica Neue", Arial;
    color: #111827;
  }

  .scrolly-root {
    width: 100%;
    height: 100vh;
    position: relative;
    overflow: hidden;
    background: linear-gradient(180deg, #f8fafc, #f3f4f6);
    padding: 20px;
    box-sizing: border-box;
  }

  .scroll-progress {
    position: absolute;
    top: 20px;
    left: 12px;
    width: 6px;
    height: calc(100vh - 40px);
    background: #e6eefc;
    border-radius: 6px;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.02);
  }

  .scroll-bar {
    width: 100%;
    height: 0%;
    background: linear-gradient(180deg, #3b82f6, #6366f1);
    border-radius: 6px;
    transform-origin: top;
    transition: height 120ms linear;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 0px 200px 1fr;
    gap: 18px;
    height: 100%;
    align-items: start;
    max-width: 1400px;
    margin: 0 auto;
    padding-left: 0px;
    box-sizing: border-box;
  }

  .left-column {
    grid-column: 2 / 3;
    height: calc(100vh - 40px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-right: 8px;
    box-sizing: border-box;
    scroll-behavior: smooth;
  }

  .empty {
    color: #6b7280;
    padding: 12px;
  }

  .year-card {
    position: relative;
    background: white;
    border-radius: 10px;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
    padding: 14px;
    min-height: 21rem;
    display: flex;
    align-items: flex-start;
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 160ms ease;
    border-left: 6px solid transparent;
    width: 100%;
  }

  .year-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
  }

  .year-card .accent {
    width: 6px;
    height: 100%;
    border-radius: 6px 0 0 6px;
    background: transparent;
    margin-right: 10px;
    flex-shrink: 0;
  }

  .year-card.active .accent {
    background: linear-gradient(180deg, #3b82f6, #6366f1);
  }

  .year-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .year-top {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .year-badge {
    font-weight: 800;
    color: #2446c7;
    font-size: 1.1rem;
  }

  .leader-name {
    font-weight: 700;
    color: #0f172a;
    font-size: 1rem;
  }

  .year-insight p {
    margin: 0;
    color: #4b5563;
    font-size: 0.95rem;
    line-height: 1.3;
  }

  .chart-column {
    grid-column: 3 / 4;
    height: calc(100vh - 40px);
    display: flex;
    align-items: center;
  }

  .chart-card {
    position: sticky;
    top: 20px;
    width: 100%;
    height: calc(100vh - 80px);
    background: white;
    border-radius: 12px;
    padding:  0px 25px 0px 0px; 
    box-shadow: 0 16px 36px rgba(15,23,42,0.06);
    box-sizing: border-box;
    display: block;   /* FIX */
}


  .chart-svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  .chart-tooltip {
    position: absolute;
    background: white;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.8rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    pointer-events: none;
    display: none;
    color: #0f172a;
    z-index: 999;
  }

  .chart-legend {
    position: absolute;
    right: 0px;
    top: 30px;
    bottom: 30px;
    width: 120px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
    overflow-y: auto;
    padding: 6px 8px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    border-radius: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 11px;
    text-align: left;
  }

  .legend-item:hover {
    background: #eff6ff;
  }

  .legend-item.active {
    background: #dbeafe;
  }

  .legend-swatch {
    width: 14px;
    height: 8px;
    border-radius: 4px;
    background: var(--legend-color);
    flex-shrink: 0;
  }

  .legend-label {
    line-height: 1.2;
    color: #111827;
    word-break: break-word;
  }

  .legend-reset {
    margin-top: 4px;
    border: none;
    border-radius: 8px;
    padding: 4px 6px;
    font-size: 11px;
    cursor: pointer;
    background: #f3f4f6;
    color: #374151;
  }

  .legend-reset:hover {
    background: #e5e7eb;
  }

  @media (max-width: 1100px) {
    .content-grid {
      grid-template-columns: 28px 140px 1fr;
      gap: 12px;
    }

    .year-card {
      min-height: 16rem;
    }
  }

  @media (max-width: 760px) {
    .content-grid {
      grid-template-columns: 1fr;
      grid-auto-rows: auto;
      gap: 12px;
    }

    .scroll-progress {
      display: none;
    }

    .left-column {
      grid-column: 1 / -1;
      height: auto;
      max-height: none;
      overflow: visible;
    }

    .chart-column {
      grid-column: 1 / -1;
      position: relative;
    }

    .chart-card {
      position: relative;
      height: 420px;
      padding-right: 18px;
    }

    .chart-legend {
      position: static;
      width: 100%;
      margin-top: 10px;
      display: flex;
      flex-wrap: wrap;
      right: 0px;
      gap: 6px;
      max-height: 110px;
    }

    .legend-item {
      flex: 0 0 calc(50% - 6px);
    }
  }
</style>
