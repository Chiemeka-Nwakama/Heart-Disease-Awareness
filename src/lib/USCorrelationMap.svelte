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

    // Bivariate color scheme (3x3 grid)
    // Rows = Mortality Rate (low to high, bottom to top)
    // Cols = Deaths (low to high, left to right)
    const bivariateColors = [
        ['#e8e8e8', '#b8d6be', '#73ae80'], // Low mortality
        ['#b8b3d2', '#90b2b3', '#5a9178'], // Medium mortality
        ['#8b62ac', '#7c7088', '#567867']  // High mortality
    ];

    // Get quantile class (0, 1, or 2) for a value
    const getQuantileClass = (value: number, values: number[]): number => {
        const sorted = [...values].sort((a, b) => a - b);
        const q1 = d3.quantile(sorted, 0.33) || 0;
        const q2 = d3.quantile(sorted, 0.67) || 0;
        if (value <= q1) return 0;
        if (value <= q2) return 1;
        return 2;
    };

    // Get all values for classification
    const deathValues = $derived(() => data.map(d => d.DeathCount));
    const rateValues = $derived(() => data.map(d => d.MortalityRate));

    // Get bivariate color for a state
    function getBivariateColor(stateData: StateData | undefined): string {
        if (!stateData) return '#e0e0e0';
        
        const deathClass = getQuantileClass(stateData.DeathCount, deathValues());
        const rateClass = getQuantileClass(stateData.MortalityRate, rateValues());
        
        return bivariateColors[rateClass][deathClass];
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
                        fill={getBivariateColor(stateData)}
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

    <!-- Bivariate Legend -->
    <div class="legend">
        <div class="legend-title">
            Bivariate Legend
        </div>
        <div class="legend-content">
            <div class="legend-grid-container">
                <div class="y-axis-label">
                    <span>High</span>
                    <span class="axis-title">Mortality Rate</span>
                    <span>Low</span>
                </div>
                <div class="legend-main">
                    <div class="legend-grid">
                        {#each bivariateColors.slice().reverse() as row, i}
                            {#each row as color, j}
                                <div class="legend-cell" style="background-color: {color};"></div>
                            {/each}
                        {/each}
                    </div>
                    <div class="x-axis-label">
                        <span>Low</span>
                        <span class="axis-title">Total Deaths</span>
                        <span>High</span>
                    </div>
                </div>
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

    .bivariate-label {
        font-weight: bold;
        font-size: 18px;
        color: #333;
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
        margin-bottom: 15px;
        font-weight: bold;
        font-size: 16px;
    }

    .legend-content {
        display: flex;
        justify-content: center;
        margin-bottom: 10px;
    }

    .legend-grid-container {
        display: flex;
        gap: 10px;
        align-items: center;
    }

    .y-axis-label {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        font-size: 11px;
        color: #666;
        height: 120px;
        text-align: right;
    }

    .y-axis-label .axis-title {
        font-weight: bold;
        font-size: 12px;
        color: #333;
        writing-mode: vertical-rl;
        text-orientation: mixed;
        transform: rotate(180deg);
    }

    .legend-main {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .legend-grid {
        display: grid;
        grid-template-columns: repeat(3, 40px);
        grid-template-rows: repeat(3, 40px);
        gap: 1px;
        border: 1px solid #999;
    }

    .legend-cell {
        width: 100%;
        height: 100%;
    }

    .x-axis-label {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #666;
        padding: 0 5px;
    }

    .x-axis-label .axis-title {
        font-weight: bold;
        font-size: 12px;
        color: #333;
    }

    .legend-note {
        margin-top: 10px;
        font-size: 12px;
        color: #888;
        font-style: italic;
    }
</style>