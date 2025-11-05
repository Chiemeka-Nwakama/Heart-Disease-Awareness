<script lang="ts">
    import * as d3 from "d3";
    import { onMount } from "svelte";
    import type { Person } from "../types";

    // Props
    export let width: number = 800;
    export let height: number = 800;
    // Accept data passed from parent; fallback to empty array (will try to load CSV if empty)
    export let data: Person[] = [];

    // SAMPLING CONFIGURATION
    const SAMPLE_SIZE = 10000; // Adjust this to control performance
    const USE_SAMPLING = true; // Set to false to use all data

    let loading = true;
    let hierarchyConfig = "age-sex-condition";
    let selectedCondition = "HadHeartAttack";
    let tooltip: { x: number; y: number; content: string } | null = null;
    let hoveredPath: string[] = [];
    let sampledData: Person[] = [];
    let displayMessage = "";

    // Decode mappings
    const sexMap: Record<number, string> = { 0: "Male", 1: "Female" };
    const smokerMap: Record<number, string> = { 
        0: "Never smoked", 
        1: "Former smoker", 
        2: "Current: some days", 
        3: "Current: every day" 
    };
    const ageMap: Record<number, string> = {
        0: "80+", 1: "55-59", 2: "40-44", 3: "70-74", 4: "65-69",
        5: "60-64", 6: "75-79", 7: "50-54", 8: "45-49", 9: "35-39",
        10: "30-34", 11: "25-29", 12: "18-24"
    };

    function applySampling(fullData: Person[]): Person[] {
        if (!USE_SAMPLING || fullData.length <= SAMPLE_SIZE) {
            displayMessage = `Using all ${fullData.length.toLocaleString()} rows`;
            return fullData;
        }

        // Stratified sampling to maintain state distribution
        const stateGroups = d3.group(fullData, d => d.State);
        const sampled: Person[] = [];
        const samplesPerState = Math.ceil(SAMPLE_SIZE / stateGroups.size);

        stateGroups.forEach((stateData, state) => {
            // Shuffle and take samples from each state
            const shuffled = [...stateData].sort(() => Math.random() - 0.5);
            sampled.push(...shuffled.slice(0, samplesPerState));
        });

        const finalSample = sampled.slice(0, SAMPLE_SIZE);
        displayMessage = `Using ${finalSample.length.toLocaleString()} samples from ${fullData.length.toLocaleString()} total rows`;
        console.log(displayMessage);
        return finalSample;
    }

    onMount(async () => {
        // If parent provided data, use it. Otherwise attempt to load from static CSV.
        if (data.length === 0) {
            try {
                // CSV is placed in /static/ so serve from root in dev/build
                const csvData = await d3.csv("/transformed_heart_data_to_numerical.csv", (row) => ({
                    State: row.State?.trim() || "",
                    Sex: Number(row.Sex),
                    SleepHours: Number(row.SleepHours),
                    HadHeartAttack: Number(row.HadHeartAttack),
                    HadAngina: Number(row.HadAngina),
                    HadStroke: Number(row.HadStroke),
                    HadCOPD: Number(row.HadCOPD),
                    CovidPos: Number(row.CovidPos),
                    AlcoholDrinkers: Number(row.AlcoholDrinkers),
                    HadDiabetes: Number(row.HadDiabetes),
                    HadDepressiveDisorder: Number(row.HadDepressiveDisorder),
                    SmokerStatus: Number(row.SmokerStatus),
                    ECigaretteUsage: Number(row.ECigaretteUsage),
                    AgeCategory: Number(row.AgeCategory),
                    RaceEthnicityCategory: Number(row.RaceEthnicityCategory),
                    BMI: Number(row.BMI),
                    WeightInKilograms: Number(row.WeightInKilograms),
                    HeightInMeters: Number(row.HeightInMeters),
                }));
                data = csvData as Person[];
            } catch (error) {
                console.error("Error loading data:", error);
            }
        }
        
        // Apply sampling after data is loaded
        sampledData = applySampling(data);
        loading = false;
    });

    // Watch for data changes and re-sample
    $: if (data.length > 0 && !loading) {
        sampledData = applySampling(data);
    }

    interface HierarchyNode {
        name: string;
        children?: HierarchyNode[];
        value?: number;
        percentage?: number;
    }

    function buildHierarchy(): HierarchyNode {
        // Use sampledData instead of data for hierarchy building
        if (hierarchyConfig === "age-sex-condition") {
            return buildAgeGenderConditionHierarchy(sampledData);
        } else if (hierarchyConfig === "smoking-age-condition") {
            return buildSmokingAgeConditionHierarchy(sampledData);
        } else if (hierarchyConfig === "condition-age-smoking") {
            return buildConditionAgeSmokingHierarchy(sampledData);
        } else {
            return buildBMIAgeConditionHierarchy(sampledData);
        }
    }

    function buildAgeGenderConditionHierarchy(sampleData: Person[]): HierarchyNode {
        const hierarchy: HierarchyNode = { name: "Population", children: [] };
        const ageGroups: Record<string, HierarchyNode> = {};

        sampleData.forEach((person: any) => {
            const ageLabel = ageMap[person.AgeCategory] || "Unknown";
            const sexLabel = sexMap[person.Sex] || "Unknown";
            const hasCondition = person[selectedCondition] === 1;
            const conditionLabel = hasCondition ? "Has Condition" : "No Condition";

            if (!ageGroups[ageLabel]) {
                ageGroups[ageLabel] = { name: ageLabel, children: [] };
            }

            let sexNode = ageGroups[ageLabel].children?.find(c => c.name === sexLabel);
            if (!sexNode) {
                sexNode = { name: sexLabel, children: [] };
                ageGroups[ageLabel].children?.push(sexNode);
            }

            let conditionNode = sexNode.children?.find(c => c.name === conditionLabel);
            if (!conditionNode) {
                conditionNode = { name: conditionLabel, value: 0 };
                sexNode.children?.push(conditionNode);
            }
            conditionNode.value = (conditionNode.value || 0) + 1;
        });

        hierarchy.children = Object.values(ageGroups);
        return hierarchy;
    }

    function buildSmokingAgeConditionHierarchy(sampleData: Person[]): HierarchyNode {
        const hierarchy: HierarchyNode = { name: "Population", children: [] };
        const smokingGroups: Record<string, HierarchyNode> = {};

        sampleData.forEach((person: any) => {
            const smokerLabel = smokerMap[person.SmokerStatus] || "Unknown";
            const ageLabel = ageMap[person.AgeCategory] || "Unknown";
            const hasCondition = person[selectedCondition] === 1;
            const conditionLabel = hasCondition ? "Has Condition" : "No Condition";

            if (!smokingGroups[smokerLabel]) {
                smokingGroups[smokerLabel] = { name: smokerLabel, children: [] };
            }

            let ageNode = smokingGroups[smokerLabel].children?.find(c => c.name === ageLabel);
            if (!ageNode) {
                ageNode = { name: ageLabel, children: [] };
                smokingGroups[smokerLabel].children?.push(ageNode);
            }

            let conditionNode = ageNode.children?.find(c => c.name === conditionLabel);
            if (!conditionNode) {
                conditionNode = { name: conditionLabel, value: 0 };
                ageNode.children?.push(conditionNode);
            }
            conditionNode.value = (conditionNode.value || 0) + 1;
        });

        hierarchy.children = Object.values(smokingGroups);
        return hierarchy;
    }

    function buildConditionAgeSmokingHierarchy(sampleData: Person[]): HierarchyNode {
        const hierarchy: HierarchyNode = { name: "Population", children: [] };
        const conditionGroups: Record<string, HierarchyNode> = {
            "Has Condition": { name: "Has Condition", children: [] },
            "No Condition": { name: "No Condition", children: [] }
        };

        sampleData.forEach((person: any) => {
            const hasCondition = person[selectedCondition] === 1;
            const conditionLabel = hasCondition ? "Has Condition" : "No Condition";
            const ageLabel = ageMap[person.AgeCategory] || "Unknown";
            const smokerLabel = smokerMap[person.SmokerStatus] || "Unknown";

            let ageNode = conditionGroups[conditionLabel].children?.find(c => c.name === ageLabel);
            if (!ageNode) {
                ageNode = { name: ageLabel, children: [] };
                conditionGroups[conditionLabel].children?.push(ageNode);
            }

            let smokerNode = ageNode.children?.find(c => c.name === smokerLabel);
            if (!smokerNode) {
                smokerNode = { name: smokerLabel, value: 0 };
                ageNode.children?.push(smokerNode);
            }
            smokerNode.value = (smokerNode.value || 0) + 1;
        });

        hierarchy.children = Object.values(conditionGroups);
        return hierarchy;
    }

    function buildBMIAgeConditionHierarchy(sampleData: Person[]): HierarchyNode {
        const hierarchy: HierarchyNode = { name: "Population", children: [] };
        const bmiGroups: Record<string, HierarchyNode> = {};

        sampleData.forEach((person: any) => {
            let bmiCategory = "Unknown";
            if (person.BMI < 18.5) bmiCategory = "Underweight";
            else if (person.BMI < 25) bmiCategory = "Normal";
            else if (person.BMI < 30) bmiCategory = "Overweight";
            else if (person.BMI >= 30) bmiCategory = "Obese";

            const ageLabel = ageMap[person.AgeCategory] || "Unknown";
            const hasCondition = person[selectedCondition] === 1;
            const conditionLabel = hasCondition ? "Has Condition" : "No Condition";

            if (!bmiGroups[bmiCategory]) {
                bmiGroups[bmiCategory] = { name: bmiCategory, children: [] };
            }

            let ageNode = bmiGroups[bmiCategory].children?.find(c => c.name === ageLabel);
            if (!ageNode) {
                ageNode = { name: ageLabel, children: [] };
                bmiGroups[bmiCategory].children?.push(ageNode);
            }

            let conditionNode = ageNode.children?.find(c => c.name === conditionLabel);
            if (!conditionNode) {
                conditionNode = { name: conditionLabel, value: 0 };
                ageNode.children?.push(conditionNode);
            }
            conditionNode.value = (conditionNode.value || 0) + 1;
        });

        hierarchy.children = Object.values(bmiGroups);
        return hierarchy;
    }

    // Reactive derived values
    let sunburstData: any = null;
    $: if (sampledData.length > 0) {
        const hierarchyData = buildHierarchy();
        const root = d3.hierarchy(hierarchyData)
            .sum((d: any) => d.value || 0)
            .sort((a, b) => (b.value || 0) - (a.value || 0));

        const radius = Math.min(width, height) / 2;
        const partition = d3.partition<HierarchyNode>()
            .size([2 * Math.PI, radius]);

        sunburstData = partition(root as any);
    } else {
        sunburstData = null;
    }

    $: arc = (() => {
        const radius = Math.min(width, height) / 2;
        return d3.arc<any>()
            .startAngle((d: any) => d.x0)
            .endAngle((d: any) => d.x1)
            .innerRadius((d: any) => d.y0)
            .outerRadius((d: any) => d.y1);
    })();

    const colorScale = d3.scaleOrdinal()
        .range([
            "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
            "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981",
            "#14b8a6", "#06b6d4", "#0ea5e9", "#6366f1", "#a855f7"
        ]);

    function handleMouseEnter(event: MouseEvent, d: any) {
        const total = sunburstData?.value ?? 0;
        const nodeValue = (d && typeof d.value === "number") ? d.value : 0;
        const percentage = total > 0 ? ((nodeValue / total) * 100).toFixed(2) : "0.00";
        const path = getPath(d);
        hoveredPath = path;
        
        tooltip = {
            x: event.clientX,
            y: event.clientY,
            content: `${path.join(" → ")}\nCount: ${nodeValue.toLocaleString()}\nPercentage: ${percentage}%`
        };
    }

    function handleMouseLeave() {
        tooltip = null;
        hoveredPath = [];
    }

    function getPath(node: any): string[] {
        const path: string[] = [];
        let current = node;
        while (current.parent) {
            path.unshift(current.data.name);
            current = current.parent;
        }
        return path;
    }

    function getColor(d: any): string {
        while (d.depth > 1) d = d.parent;
        return colorScale(d.data.name) as string;
    }
</script>

<div class="container">
    {#if loading}
        <div class="loading">Loading heart disease data...</div>
    {:else}
        <div class="header">
            <h1>Heart Disease Sunburst Explorer</h1>
            <p>Hierarchical visualization of {data.length.toLocaleString()} individuals</p>
            {#if displayMessage}
                <p class="sample-info">📊 {displayMessage}</p>
            {/if}
            
            <div class="controls">
                <div class="control-group">
                    <label>
                        <span>Hierarchy Structure</span>
                        <select bind:value={hierarchyConfig}>
                            <option value="age-sex-condition">Age → Gender → Condition</option>
                            <!-- <option value="smoking-age-condition">Smoking → Age → Condition</option>
                            <option value="condition-age-smoking">Condition → Age → Smoking</option>
                            <option value="bmi-age-condition">BMI Category → Age → Condition</option> -->
                        </select>
                    </label>
                </div>
                
                <div class="control-group">
                    <label>
                        <span>Condition to Track</span>
                        <select bind:value={selectedCondition}>
                            <option value="HadHeartAttack">Heart Attack</option>
                            <!-- <option value="HadAngina">Angina</option>
                            <option value="HadStroke">Stroke</option>
                            <option value="HadCOPD">COPD</option>
                            <option value="HadDiabetes">Diabetes</option> -->
                        </select>
                    </label>
                </div>
            </div>

            <div class="info">
                <strong>How to read:</strong> Each ring represents a level in the hierarchy. 
                The size of each segment is proportional to the population size. 
                Hover over segments to see details and the path through the hierarchy.
            </div>
        </div>

        {#if sunburstData}
            <div class="viz-container">
                <svg {width} {height} viewBox="0 0 {width} {height}">
                    <g transform="translate({width / 2}, {height / 2})">
                        {#each sunburstData.descendants() as node}
                            {#if node.depth > 0}
                                {@const pathStr = arc(node)}
                                {@const isHovered = hoveredPath.length > 0 && getPath(node).join() === hoveredPath.join()}
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <path
                                    d={pathStr}
                                    fill={getColor(node)}
                                    stroke="#fff"
                                    stroke-width="2"
                                    opacity={hoveredPath.length === 0 || isHovered ? 0.9 : 0.3}
                                    style="cursor: pointer; transition: opacity 0.2s;"
                                    onmouseenter={(e) => handleMouseEnter(e, node)}
                                    onmouseleave={handleMouseLeave}
                                />
                            {/if}
                        {/each}
                        
                        <!-- Center label -->
                        <text text-anchor="middle" class="center-label" y="-10">
                            {hierarchyConfig.split('-').join(' → ').replace(/\b\w/g, l => l.toUpperCase())}
                        </text>
                        <text text-anchor="middle" class="center-sublabel" y="15">
                            {selectedCondition.replace('Had', '')}
                        </text>
                    </g>
                </svg>
            </div>
        {/if}

        {#if tooltip}
            <div
                class="tooltip"
                style="left: {tooltip.x}px; top: {tooltip.y}px;"
            >
                {#each tooltip.content.split('\n') as line}
                    <div>{line}</div>
                {/each}
            </div>
        {/if}
<!-- 
        <div class="legend">
            <h3>Understanding the Visualization</h3> -->
            <!-- <div class="legend-content">
                <div class="legend-item">
                    <strong>Inner Ring:</strong> First level of categorization (varies by hierarchy)
                </div>
                <div class="legend-item">
                    <strong>Middle Ring:</strong> Second level breakdown
                </div>
                <div class="legend-item">
                    <strong>Outer Ring:</strong> Condition presence (Has Condition vs No Condition)
                </div>
                <div class="legend-item">
                    <strong>Segment Size:</strong> Proportional to the number of individuals
                </div>
            </div>
        </div> -->

    {/if}
</div>

<style>
    .container {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
        background: #f9fafb;
        min-height: 100vh;
        font-family: Arial, sans-serif;
    }

    .loading {
        padding: 32px;
        text-align: center;
        font-size: 18px;
        color: #666;
    }

    .header {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 24px;
        margin-bottom: 24px;
    }

    h1 {
        font-size: 28px;
        font-weight: bold;
        color: #1f2937;
        margin: 0 0 8px 0;
    }

    .header > p {
        color: #6b7280;
        margin: 0 0 8px 0;
    }

    .sample-info {
        color: #059669;
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 16px 0;
        padding: 8px 12px;
        background: #d1fae5;
        border-radius: 6px;
        border-left: 4px solid #059669;
    }

    .controls {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
        margin-bottom: 16px;
    }

    .control-group label {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .control-group span {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
    }

    .control-group select {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        background: white;
        cursor: pointer;
    }

    .info {
        background: #dbeafe;
        padding: 12px;
        border-radius: 6px;
        font-size: 14px;
        color: #1e40af;
        line-height: 1.6;
    }

    .viz-container {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 24px;
        margin-bottom: 24px;
        display: flex;
        justify-content: center;
    }

    .center-label {
        font-size: 16px;
        font-weight: bold;
        fill: #1f2937;
    }

    .center-sublabel {
        font-size: 14px;
        fill: #6b7280;
    }

    .tooltip {
        position: fixed;
        transform: translate(10px, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        pointer-events: none;
        font-size: 13px;
        line-height: 1.6;
        z-index: 1000;
        white-space: nowrap;
        max-width: 300px;
    }

    .legend {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 24px;
        margin-bottom: 24px;
    }

    .legend h3 {
        font-size: 18px;
        font-weight: bold;
        color: #1f2937;
        margin: 0 0 16px 0;
    }

    .legend-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 12px;
    }

    .legend-item {
        padding: 12px;
        background: #f3f4f6;
        border-radius: 6px;
        font-size: 14px;
        color: #374151;
    }

    .legend-item strong {
        color: #1f2937;
    }

    .insights {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 24px;
    }

    .insights h3 {
        font-size: 18px;
        font-weight: bold;
        color: #1f2937;
        margin: 0 0 12px 0;
    }

    .insights ul {
        list-style: disc;
        padding-left: 20px;
        margin: 0;
    }

    .insights li {
        color: #374151;
        margin-bottom: 8px;
        line-height: 1.5;
    }

    .insights strong {
        color: #1f2937;
    }
</style>