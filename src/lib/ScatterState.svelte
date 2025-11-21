<script lang="ts">
    import type { StateData } from "../types";
    import * as d3 from "d3";

    type TProps = {
        data: StateData[];
        width?: number;
        height?: number;
    };
    const { data, height = 500, width = 700 }: TProps = $props();

    let selectedState: StateData | undefined = $state();
    
    // Available metrics for visualization
    const metrics: Array<{ value: keyof StateData; label: string }> = [
        { value: "MortalityRate", label: "Mortality Rate (per 100k)" },
        { value: "IncMedian2022", label: "Median Income 2022" },
        { value: "CivUNEMP", label: "Unemployed Population" },
        { value: "Bach", label: "Bachelor's Degree Holders" },
        { value: "DiplomaGED", label: "High School Diploma/GED" },
        { value: "F19To34None", label: "Uninsured Ages 19-34" },
        { value: "F35To64None", label: "Uninsured Ages 35-64" },
        { value: "F65UpNone", label: "Uninsured Ages 65+" },
        { value: "DeathCount", label: "Total Deaths" },
        { value: "Masters", label: "Master's Degree Holders" },
        { value: "SomeColl", label: "Some College Education" },
        { value: "NoSchool", label: "No Formal Schooling" },
    ];
    
    let x: keyof StateData = $state("IncMedian2022");
    let y: keyof StateData = $state("MortalityRate");

    const margin = {
        top: 20,
        bottom: 60,
        left: 60,
        right: 20,
    };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
    };
    const sizeRange = [4, 10];

    // Helper function to get readable labels
    function getLabel(attr: keyof StateData): string {
        const labels: Record<string, string> = {
            MortalityRate: "Mortality Rate (per 100k)",
            DeathCount: "Total Deaths",
            IncMedian2022: "Median Income 2022",
            IncMedian202224: "Median Income 2022-24",
            TotalSchool: "Total Population (Education)",
            NoSchool: "No School",
            ElemSchool: "Elementary School",
            MidSchool: "Middle School",
            SomeHigh: "Some High School",
            DiplomaGED: "High School Diploma/GED",
            SomeColl: "Some College",
            Assoc: "Associate Degree",
            Bach: "Bachelor's Degree",
            Masters: "Master's Degree",
            Doctorate: "Doctorate",
            TotalLaborForce: "Total Labor Force",
            CivEMP: "Civilian Employed",
            CivUNEMP: "Civilian Unemployed",
            Total_Insured: "Total Insured",
            F19To34None: "Uninsured 19-34",
            F35To64None: "Uninsured 35-64",
            F65UpNone: "Uninsured 65+"
        };
        
        return labels[attr as string] || String(attr).replace(/([A-Z])/g, ' $1').trim();
    }

    function getScale(
        attrName: keyof StateData,
        axis: "x" | "y" | "size",
        data: StateData[],
    ) {
        if (data.length === 0) {
            return null;
        }

        let range: number[] = [0, 0];
        if (axis === "x") {
            range = [usableArea.left, usableArea.right];
        } else if (axis === "y") {
            range = [usableArea.bottom, usableArea.top];
        } else if (axis === "size") {
            range = sizeRange;
        }

        const values = data.map(d => d[attrName]);
        const isNumeric = typeof values[0] === "number";
        
        if (isNumeric) {
            const extent = d3.extent(values as number[]) as [number, number];
            return d3.scaleLinear()
                .domain(extent)
                .range(range)
                .nice();
        }
        
        return null;
    }

    const xScale = $derived(getScale(x, "x", data));
    const yScale = $derived(getScale(y, "y", data));

    let xAxis: any = $state();
    let yAxis: any = $state();

    function updateAxis() {
        if (!xScale || !yScale) {
            return;
        }
        
        d3.select(xAxis)
            .call(d3.axisBottom(xScale).ticks(6))
            .selectAll("text")
            .style("text-anchor", "middle");

        d3.select(yAxis)
            .call(d3.axisLeft(yScale).ticks(6));
    }

    function handleStateClick(state: StateData) {
        if (selectedState === state) {
            selectedState = undefined;
        } else {
            selectedState = state;
        }
    }

    $effect(() => {
        updateAxis();
    });
</script>

<div class="scatter-wrapper">
    <div class="controls">
        <div class="control-group">
            <label for="x-select">X-Axis:</label>
            <select id="x-select" bind:value={x}>
                {#each metrics as metric}
                    <option value={metric.value}>{metric.label}</option>
                {/each}
            </select>
        </div>
        
        <div class="control-group">
            <label for="y-select">Y-Axis:</label>
            <select id="y-select" bind:value={y}>
                {#each metrics as metric}
                    <option value={metric.value}>{metric.label}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="scatter-container">
    <svg {width} {height}>
        <g class="points">
            {#each data as state}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <circle
                    cx={xScale ? xScale(state[x]) : usableArea.left}
                    cy={yScale ? yScale(state[y]) : usableArea.bottom}
                    r={6}
                    fill={state === selectedState ? "#e74c3c" : "rgba(52, 152, 219, 0.6)"}
                    stroke={state === selectedState ? "#c0392b" : "#2980b9"}
                    stroke-width={state === selectedState ? 2.5 : 1.5}
                    opacity={selectedState && state !== selectedState ? 0.2 : 0.8}
                    onclick={() => handleStateClick(state)}
                >
                <title>{state.StateName}</title>
                </circle>
                {#if state === selectedState}
                    <text
                        x={xScale ? xScale(state[x]) : usableArea.left}
                        y={(yScale ? yScale(state[y]) : usableArea.bottom) - 12}
                        text-anchor="middle"
                        class="state-label"
                    >
                        {state.StateAbv}
                    </text>
                {/if}
            {/each}
        </g>
        <g transform="translate(0, {usableArea.bottom})" bind:this={xAxis} />
        <g transform="translate({usableArea.left}, 0)" bind:this={yAxis} />
        
        <!-- Axis Labels -->
        <text
            x={width / 2}
            y={height - 10}
            text-anchor="middle"
            class="axis-label"
        >
            {getLabel(x)}
        </text>
        <text
            x={-height / 2}
            y={15}
            text-anchor="middle"
            transform="rotate(-90)"
            class="axis-label"
        >
            {getLabel(y)}
        </text>
    </svg>
</div>
<div class="selectedInfo">
        {#if selectedState}
            <h4>{selectedState.StateName}</h4>
            <div class="detail-grid">
                <div class="highlight"><strong>Mortality Rate:</strong> {selectedState.MortalityRate.toFixed(1)} per 100k</div>
                <div><strong>Total Deaths:</strong> {selectedState.DeathCount.toLocaleString()}</div>
                <div><strong>Median Income:</strong> ${selectedState.IncMedian2022.toLocaleString()}</div>
                <div><strong>Unemployment Rate:</strong> {((selectedState.CivUNEMP / selectedState.TotalLaborForce) * 100).toFixed(1)}%</div>
                <div><strong>Bachelor's Degree+:</strong> {((selectedState.Bach / selectedState.TotalSchool) * 100).toFixed(1)}%</div>
                <div><strong>Uninsured 19-34:</strong> {selectedState.F19To34None.toLocaleString()}</div>
                <div><strong>Uninsured 35-64:</strong> {selectedState.F35To64None.toLocaleString()}</div>
            </div>
        {:else}
            <p class="placeholder-text">Click on a state to see details</p>
            <p class="hint-text">Each point represents a U.S. state. Explore how different factors relate to each other.</p>
        {/if}
    </div>
</div>

<style>
    .scatter-wrapper {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin: 20px 0;
    }

    .controls {
        display: flex;
        gap: 30px;
        align-items: center;
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        flex-wrap: wrap;
    }

    .control-group {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .control-group label {
        font-weight: 600;
        color: #333;
        font-size: 14px;
        min-width: 60px;
    }

    .control-group select {
        padding: 8px 16px;
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        background: white;
        font-size: 14px;
        color: #333;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 250px;
    }

    .control-group select:hover {
        border-color: #667eea;
    }

    .control-group select:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .scatter-container {
        display: flex;
        gap: 20px;
        align-items: flex-start;
        margin: 20px 0;
    }

    .points circle {
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .points circle:hover {
        stroke-width: 3;
        opacity: 1 !important;
    }

    svg {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
    }

    .axis-label {
        font-size: 14px;
        font-weight: 500;
        fill: #333;
    }

    .selectedInfo {
        flex: 0 0 300px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-height: 500px;
        overflow-y: auto;
    }

    .selectedInfo h4 {
        margin: 0 0 15px 0;
        font-size: 20px;
        font-weight: bold;
        border-bottom: 2px solid rgba(255, 255, 255, 0.3);
        padding-bottom: 10px;
    }

    .detail-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
        font-size: 14px;
    }

    .detail-grid div {
        background: rgba(255, 255, 255, 0.1);
        padding: 8px 12px;
        border-radius: 6px;
        backdrop-filter: blur(10px);
    }

    .detail-grid .highlight {
        background: rgba(231, 76, 60, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .state-label {
        font-size: 12px;
        font-weight: bold;
        fill: #c0392b;
        pointer-events: none;
    }

    .placeholder-text {
        text-align: center;
        opacity: 0.9;
        font-style: italic;
        margin-top: 30px;
        font-size: 16px;
    }

    .hint-text {
        text-align: center;
        opacity: 0.7;
        font-size: 13px;
        margin-top: 15px;
        line-height: 1.5;
    }

    /* Scrollbar styling */
    .selectedInfo::-webkit-scrollbar {
        width: 8px;
    }

    .selectedInfo::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }

    .selectedInfo::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
    }

    .selectedInfo::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
    }
</style>