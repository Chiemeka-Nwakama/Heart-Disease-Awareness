<script lang="ts">
    import * as d3 from "d3";
    import type { StateData } from "../types";
    import { onMount } from "svelte";
    import { feature } from "topojson-client";

    type TProps = {
        data: StateData[];
        width?: number;
        height?: number;
    };

    const { data, width = 800, height = 500 }: TProps = $props();
    
    let colorBy: "RATE" | "Median202224" | "DEATHS" = $state("DEATHS");
    let usData: any = $state(null);
    let tooltip: { x: number; y: number; content: string } | null = $state(null);
    let selectedState: StateData | null = $state(null);

    // Load US TopoJSON data
    onMount(async () => {
        try {
            const response = await fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");
            usData = await response.json();
        } catch (error) {
            console.error("Error loading US map data:", error);
        }
    });

    // Create a map from state FIPS code (string) to state data
    const stateDataMap = $derived(() => {
        const map = new Map<string, StateData>();
        data.forEach(d => {
            // Convert StateCode to 2-digit FIPS string (e.g., 1 -> "01", 6 -> "06")
            const fips = d.StateCode.toString().padStart(2, '0');
            map.set(fips, d);
        });
        return map;
    });

    // Convert TopoJSON to GeoJSON features
    const states = $derived(() => {
        if (!usData) return [];
        return feature(usData, usData.objects.states).features;
    });

    // Create projection
    const projection = $derived(() => {
        if (!usData) return d3.geoAlbersUsa();
        return d3.geoAlbersUsa().fitSize([width, height], 
            feature(usData, usData.objects.states)
        );
    });

    // Create path generator
    const path = $derived(() => d3.geoPath().projection(projection()));

    // Color scale based on selected attribute
    const colorScale = $derived(() => {
        if (!data || data.length === 0) return null;

        const values = data.map((d) => {
            if (colorBy === "RATE") return d.MortalityRate;
            if (colorBy === "Median202224") return d.IncMedian202224;
            return d.DeathCount;
        });

        const extent = d3.extent(values) as [number, number];

        if (colorBy === "RATE") {
            return d3.scaleSequential(d3.interpolateReds).domain(extent);
        } else if (colorBy === "Median202224") {
            return d3.scaleSequential(d3.interpolateGreens).domain(extent);
        } else {
            return d3.scaleSequential(d3.interpolateOranges).domain(extent);
        }
    });

    function getColorValue(stateData: StateData | undefined): number {
        if (!stateData) return 0;
        if (colorBy === "RATE") return stateData.MortalityRate;
        if (colorBy === "Median202224") return stateData.IncMedian202224;
        return stateData.DeathCount;
    }

    function handleMouseEnter(feature: any, event: MouseEvent) {
        const stateData = stateDataMap().get(feature.id.toString());
        if (!stateData) return;

        const rect = (event.currentTarget as SVGPathElement).getBoundingClientRect();
        
        tooltip = {
            x: rect.left + rect.width / 2,
            y: rect.top,
            content: `${stateData.StateName}\nDeaths: ${stateData.DeathCount.toLocaleString()}\nRate: ${stateData.MortalityRate.toFixed(1)} per 100k\nMedian Income: $${stateData.IncMedian202224.toLocaleString()}`,
        };
    }

    function handleMouseLeave() {
        tooltip = null;
    }

    function handleClick(feature: any) {
        const stateData = stateDataMap().get(feature.id.toString());
        if (!stateData) return;
        selectedState = selectedState?.StateCode === stateData.StateCode ? null : stateData;
    }

    function formatNumber(num: number): string {
        return num.toLocaleString();
    }
</script>

<div class="container">
    
    <div class="controls">
        <label>
            <span>Color by:</span>
            <select bind:value={colorBy}>
                <option value="DEATHS">Total Deaths</option>
                <option value="RATE">Mortality Rate</option>
                <option value="Median202224">Median Income (Adjusted for inflation to 2024 Dollars) </option>
            </select>
        </label>
    </div>

    {#if usData}
        <div class="map-container">
            <svg {width} {height} viewBox="0 0 {width} {height}">
            <g class="states">
                {#each states() as feature}
                    {@const stateData = stateDataMap().get(feature.id.toString())}
                    {@const isSelected = selectedState?.StateCode.toString().padStart(2, '0') === feature.id.toString()}
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <path
                        class="state"
                        d={path()(feature)}
                        fill={stateData ? colorScale()(getColorValue(stateData)) : "#e0e0e0"}
                        stroke={isSelected ? "#000" : "#fff"}
                        stroke-width={isSelected ? 2 : 0.5}
                        opacity={stateData ? (isSelected ? 1 : 0.85) : 0.3}
                        onmouseenter={(e) => stateData && handleMouseEnter(feature, e)}
                        onmouseleave={handleMouseLeave}
                        onclick={() => handleClick(feature)}
                    />
                {/each}
            </g>
        </svg>
        </div>
    {:else}
        <div class="loading">Loading map...</div>
    {/if}

    <!-- Tooltip -->
    {#if tooltip}
        <div
            class="tooltip"
            style="left: {tooltip.x}px; top: {tooltip.y - 10}px;"
        >
            {#each tooltip.content.split('\n') as line}
                <div>{line}</div>
            {/each}
        </div>
    {/if}

    <!-- Selected State Info -->
    {#if selectedState}
        <div class="selected-info">
            <h3>{selectedState.StateName}</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">Total Deaths:</span>
                    <span class="value">{formatNumber(selectedState.DeathCount)}</span>
                </div>
                <div class="info-item">
                    <span class="label">Mortality Rate:</span>
                    <span class="value">{selectedState.MortalityRate.toFixed(1)} per 100k</span>
                </div>
                <div class="info-item">
                    <span class="label">Median Income:</span>
                    <span class="value">${formatNumber(selectedState.IncMedian202224)}</span>
                </div>
                <div class="info-item">
                    <span class="label">Bachelor's Degree+:</span>
                    <span class="value">{((selectedState.Bach / selectedState.TotalSchool) * 100).toFixed(1)}%</span>
                </div>
                <div class="info-item">
                    <span class="label">Uninsured (19-34):</span>
                    <span class="value">{((selectedState.F19To34None / selectedState.F19To34) * 100).toFixed(1)}%</span>
                </div>
                <div class="info-item">
                    <span class="label">Unemployment Rate:</span>
                    <span class="value">{((selectedState.CivUNEMP / selectedState.TotalLaborForce) * 100).toFixed(1)}%</span>
                </div>
            </div>
        </div>
    {/if}

    <!-- Legend -->
    <div class="legend">
        <div class="legend-title">
            {#if colorBy === "RATE"}
                Mortality Rate (per 100,000)
            {:else if colorBy === "Median202224"}
                Median Income (2022-2024)
            {:else}
                Total Deaths
            {/if}
        </div>
        <div class="legend-gradient">
            <svg width="300" height="30">
                <defs>
                    <linearGradient id="legendGradient">
                        {#if colorScale()}
                            {@const minVal = d3.min(data.map(d => colorBy === "RATE" ? d.MortalityRate : colorBy === "Median202224" ? d.IncMedian202224 : d.DeathCount)) || 0}
                            {@const maxVal = d3.max(data.map(d => colorBy === "RATE" ? d.MortalityRate : colorBy === "Median202224" ? d.IncMedian202224 : d.DeathCount)) || 0}
                            <stop offset="0%" stop-color={colorScale()(minVal)} />
                            <stop offset="100%" stop-color={colorScale()(maxVal)} />
                        {/if}
                    </linearGradient>
                </defs>
                <rect width="300" height="20" fill="url(#legendGradient)" stroke="#ccc" />
            </svg>
            <div class="legend-labels">
                <span>
                    {#if colorBy === "RATE"}
                        {d3.min(data.map(d => d.MortalityRate))?.toFixed(1)}
                    {:else if colorBy === "Median202224"}
                        ${formatNumber(d3.min(data.map(d => d.IncMedian202224)) || 0)}
                    {:else}
                        {formatNumber(d3.min(data.map(d => d.DeathCount)) || 0)}
                    {/if}
                </span>
                <span>
                    {#if colorBy === "RATE"}
                        {d3.max(data.map(d => d.MortalityRate))?.toFixed(1)}
                    {:else if colorBy === "Median202224"}
                        ${formatNumber(d3.max(data.map(d => d.IncMedian202224)) || 0)}
                    {:else}
                        {formatNumber(d3.max(data.map(d => d.DeathCount)) || 0)}
                    {/if}
                </span>
            </div>
        </div>
        <div class="legend-note">
            Click a state to see detailed information. Hover for quick stats.
        </div>
    </div>
</div>

<style>
    .container {
        position: relative;
        font-family: Arial, sans-serif;
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
    }

    .title {
        text-align: center;
        margin-bottom: 20px;
        font-size: 24px;
        color: #333;
    }

    .controls {
        text-align: center;
        margin-bottom: 20px;
    }

    .controls label {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-weight: bold;
        font-size: 16px;
    }

    .controls select {
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
    }

    .map-container {
        display: flex;
        justify-content: center;
        margin: 0 auto;
    }

    svg {
        display: block;
        margin: 0 auto;
    }

    .state {
        cursor: pointer;
        transition: opacity 0.2s, stroke-width 0.2s;
    }

    .state:hover {
        opacity: 1 !important;
        stroke: #333 !important;
        stroke-width: 1.5 !important;
    }

    .loading {
        text-align: center;
        padding: 40px;
        color: #666;
        font-style: italic;
    }

    .tooltip {
        position: fixed;
        transform: translate(-50%, -100%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        pointer-events: none;
        font-size: 13px;
        line-height: 1.6;
        z-index: 1000;
        white-space: nowrap;
    }

    .selected-info {
        margin-top: 20px;
        padding: 20px;
        background: #f9f9f9;
        border: 2px solid #333;
        border-radius: 8px;
    }

    .selected-info h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #333;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
    }

    .info-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #ddd;
    }

    .info-item .label {
        font-weight: 600;
        color: #666;
    }

    .info-item .value {
        font-weight: bold;
        color: #333;
    }

    .legend {
        margin-top: 30px;
        text-align: center;
    }

    .legend-title {
        margin-bottom: 10px;
        font-weight: bold;
        font-size: 14px;
    }

    .legend-gradient {
        display: inline-block;
    }

    .legend-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 5px;
        font-size: 12px;
        color: #666;
    }

    .legend-note {
        margin-top: 10px;
        font-size: 12px;
        color: #888;
        font-style: italic;
    }
</style>