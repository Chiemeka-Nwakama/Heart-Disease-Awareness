<script lang="ts">
    import { onMount } from 'svelte';
    import * as d3 from 'd3';

    type TProps = {
        width?: number;
        height?: number;
    };
    const { width = 800, height = 500 }: TProps = $props();

    // Aggregated data structure
    interface LifestyleData {
        state: string;
        mortalityRate: number;
        deathCount: number;
        medianIncome: number;
        unemploymentRate: number;
        bachelorsRate: number;
        uninsured1934Rate: number;
        uninsured3564Rate: number;
        avgSleepHours: number;
        avgBMI: number;
        avgSmokerScore: number;
        prevalenceHeartAttack: number;
        prevalenceStroke: number;
        prevalenceDiabetes: number;
        prevalenceAlcoholDrinkers: number;
        prevalenceCOPD: number;
        prevalenceDepression: number;
    }

    let data: LifestyleData[] = $state([]);
    let stateDataMap = new Map();
    let loading = $state(true);
    let error = $state(null);
    let selectedState: LifestyleData | null = $state(null);

    // Expanded visualization options
    const lifestyleMetrics = [
        { value: 'avgBMI', label: 'Average BMI', category: 'Lifestyle' },
        { value: 'avgSleepHours', label: 'Average Sleep Hours', category: 'Lifestyle' },
        { value: 'avgSmokerScore', label: 'Smoking Status Score', category: 'Lifestyle' },
        { value: 'prevalenceAlcoholDrinkers', label: 'Alcohol Consumption Rate', category: 'Lifestyle' },
    ];
    const socioeconomicMetrics = [
        { value: 'medianIncome', label: 'Median Income', category: 'Socioeconomic' },
        { value: 'unemploymentRate', label: 'Unemployment Rate', category: 'Socioeconomic' },
        { value: 'bachelorsRate', label: 'Bachelor\'s Degree Rate', category: 'Socioeconomic' },
        { value: 'uninsured1934Rate', label: 'Uninsured Rate (19-34)', category: 'Socioeconomic' },
        { value: 'uninsured3564Rate', label: 'Uninsured Rate (35-64)', category: 'Socioeconomic' },
    ];
    const healthMetrics = [
        { value: 'prevalenceDiabetes', label: 'Diabetes Prevalence', category: 'Health' },
        { value: 'prevalenceCOPD', label: 'COPD Prevalence', category: 'Health' },
        { value: 'prevalenceDepression', label: 'Depression Prevalence', category: 'Health' },
    ];
    const outcomeMetrics = [
        { value: 'mortalityRate', label: 'Heart Disease Mortality Rate', category: 'Outcome' },
        { value: 'prevalenceHeartAttack', label: 'Heart Attack Prevalence', category: 'Outcome' },
        { value: 'prevalenceStroke', label: 'Stroke Prevalence', category: 'Outcome' },
    ];

    const allXMetrics = [...lifestyleMetrics, ...socioeconomicMetrics, ...healthMetrics];
    const allYMetrics = [...outcomeMetrics];

    let xMetric = $state('avgBMI');
    let yMetric = $state('mortalityRate');

    const margin = { top: 30, right: 30, bottom: 70, left: 70 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
    };

    // Load and process data
    async function loadData() {
        try {
            // Load state mortality data
            const stateResponse = await fetch('../State_Data.csv');
            const stateText = await stateResponse.text();
            const stateLines = stateText.trim().split('\n');
            const stateHeaders = stateLines[0].split(',');

            stateLines.slice(1).forEach(line => {
                const values = line.split(',');
                const stateObj: any = {};
                stateHeaders.forEach((header, i) => {
                    stateObj[header] = values[i];
                });

                const totalLabor = parseFloat(stateObj.TotalLaborForce) || 1;
                const unemployed = parseFloat(stateObj.InLaborForceCivUnemployed) || 0;
                const totalSchool = parseFloat(stateObj.TotalSchooling) || 1;
                const bachelors = parseFloat(stateObj.Bachelors) || 0;
                const total1934 = parseFloat(stateObj.F19to34Years) || 1;
                const uninsured1934 = parseFloat(stateObj.F19to34YearsWithNoInsurance) || 0;
                const total3564 = parseFloat(stateObj.F35to64Years) || 1;
                const uninsured3564 = parseFloat(stateObj.F35to64YearsWithNoInsurance) || 0;

                stateDataMap.set(stateObj.StateName, {
                    mortalityRate: parseFloat(stateObj.RATE),
                    deathCount: parseInt(stateObj.DEATHS),
                    medianIncome: parseFloat(stateObj.Median2022),
                    unemploymentRate: (unemployed / totalLabor) * 100,
                    bachelorsRate: (bachelors / totalSchool) * 100,
                    uninsured1934Rate: (uninsured1934 / total1934) * 100,
                    uninsured3564Rate: (uninsured3564 / total3564) * 100,
                });
            });

            // Load lifestyle data
            const lifestyleResponse = await fetch('/website_summary_data.csv');
            const lifestyleText = await lifestyleResponse.text();
            const lifestyleLines = lifestyleText.trim().split('\n');
            const lifestyleHeaders = lifestyleLines[0].split(',');

            const lifestyleData = lifestyleLines.slice(1).map(line => {
                const values = line.split(',');
                const obj: any = {};
                lifestyleHeaders.forEach((header, i) => {
                    obj[header] = values[i];
                });
                return obj;
            });

            // Aggregate by state
            const stateAggregates = new Map<string, any>();
            lifestyleData.forEach(row => {
                const state = row.State;
                if (!stateAggregates.has(state)) {
                    stateAggregates.set(state, {
                        state,
                        count: 0,
                        totalSleep: 0,
                        totalBMI: 0,
                        totalSmoker: 0,
                        totalHeartAttack: 0,
                        totalStroke: 0,
                        totalDiabetes: 0,
                        totalAlcohol: 0,
                        totalCOPD: 0,
                        totalDepression: 0,
                    });
                }

                const agg = stateAggregates.get(state);
                agg.count++;
                agg.totalSleep += parseFloat(row.Avg_SleepHours) || 0;
                agg.totalBMI += parseFloat(row.Avg_BMI) || 0;
                agg.totalSmoker += parseFloat(row.Avg_SmokerStatus_Score) || 0;
                agg.totalHeartAttack += parseFloat(row.Prevalence_HadHeartAttack) || 0;
                agg.totalStroke += parseFloat(row.Prevalence_HadStroke) || 0;
                agg.totalDiabetes += parseFloat(row.Prevalence_HadDiabetes) || 0;
                agg.totalAlcohol += parseFloat(row.Prevalence_AlcoholDrinkers) || 0;
                agg.totalCOPD += parseFloat(row.Prevalence_HadCOPD) || 0;
                agg.totalDepression += parseFloat(row.Prevalence_HadDepressiveDisorder) || 0;
            });

            // Calculate averages and combine with state data
            data = Array.from(stateAggregates.values())
                .filter(agg => stateDataMap.has(agg.state))
                .map(agg => {
                    const stateInfo = stateDataMap.get(agg.state);
                    return {
                        state: agg.state,
                        mortalityRate: stateInfo.mortalityRate,
                        deathCount: stateInfo.deathCount,
                        medianIncome: stateInfo.medianIncome,
                        unemploymentRate: stateInfo.unemploymentRate,
                        bachelorsRate: stateInfo.bachelorsRate,
                        uninsured1934Rate: stateInfo.uninsured1934Rate,
                        uninsured3564Rate: stateInfo.uninsured3564Rate,
                        avgSleepHours: agg.totalSleep / agg.count,
                        avgBMI: agg.totalBMI / agg.count,
                        avgSmokerScore: agg.totalSmoker / agg.count,
                        prevalenceHeartAttack: (agg.totalHeartAttack / agg.count) * 100,
                        prevalenceStroke: (agg.totalStroke / agg.count) * 100,
                        prevalenceDiabetes: (agg.totalDiabetes / agg.count) * 100,
                        prevalenceAlcoholDrinkers: (agg.totalAlcohol / agg.count) * 100,
                        prevalenceCOPD: (agg.totalCOPD / agg.count) * 100,
                        prevalenceDepression: (agg.totalDepression / agg.count) * 100,
                    };
                });

            loading = false;
        } catch (e: any) {
            error = e.message;
            loading = false;
        }
    }

    function getScale(metric: string, axis: 'x' | 'y') {
        if (data.length === 0) return null;

        const range = axis === 'x'
            ? [usableArea.left, usableArea.right]
            : [usableArea.bottom, usableArea.top];

        const values = data.map(d => d[metric as keyof LifestyleData] as number);
        const extent = d3.extent(values) as [number, number];

        return d3.scaleLinear()
            .domain(extent)
            .range(range)
            .nice();
    }

    let xScale = $derived(getScale(xMetric, 'x'));
    let yScale = $derived(getScale(yMetric, 'y'));

    // Calculate correlation coefficient
    function calculateCorrelation() {
        if (!data.length) return 0;

        const xValues = data.map(d => d[xMetric as keyof LifestyleData] as number);
        const yValues = data.map(d => d[yMetric as keyof LifestyleData] as number);

        const n = xValues.length;
        const sumX = d3.sum(xValues);
        const sumY = d3.sum(yValues);
        const sumXY = d3.sum(xValues.map((x, i) => x * yValues[i]));
        const sumX2 = d3.sum(xValues.map(x => x * x));
        const sumY2 = d3.sum(yValues.map(y => y * y));

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    let correlation = $derived(calculateCorrelation());
    let correlationStrength = $derived(Math.abs(correlation) > 0.7 ? 'Strong'
        : Math.abs(correlation) > 0.4 ? 'Moderate'
        : 'Weak');

    // Calculate trend line
    function getTrendLine() {
        if (!xScale || !yScale || data.length === 0) return '';

        const xValues = data.map(d => d[xMetric as keyof LifestyleData] as number);
        const yValues = data.map(d => d[yMetric as keyof LifestyleData] as number);

        const n = xValues.length;
        const sumX = d3.sum(xValues);
        const sumY = d3.sum(yValues);
        const sumXY = d3.sum(xValues.map((x, i) => x * yValues[i]));
        const sumX2 = d3.sum(xValues.map(x => x * x));

        // Slope (m) = (n * sum(xy) - sum(x) * sum(y)) / (n * sum(x^2) - sum(x)^2)
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        // Intercept (b) = (sum(y) - m * sum(x)) / n
        const intercept = (sumY - slope * sumX) / n;

        const xMin = d3.min(xValues)!;
        const xMax = d3.max(xValues)!;

        const y1 = slope * xMin + intercept;
        const y2 = slope * xMax + intercept;

        return `M ${xScale(xMin)} ${yScale(y1)} L ${xScale(xMax)} ${yScale(y2)}`;
    }

    let trendLine = $derived(getTrendLine());

    function getMetricLabel(metric: string): string {
        const allMetrics = [...allXMetrics, ...allYMetrics];
        return allMetrics.find(m => m.value === metric)?.label || metric;
    }

    function handleStateClick(state: LifestyleData) {
        selectedState = selectedState === state ? null : state;
    }

    let xAxis: any = $state();
    let yAxis: any = $state();

    function updateAxes() {
        if (!xScale || !yScale) return;

        d3.select(xAxis)
            .call(d3.axisBottom(xScale).ticks(6))
            .selectAll("text")
            .style("text-anchor", "middle");

        d3.select(yAxis)
            .call(d3.axisLeft(yScale).ticks(6));
    }

    $effect(() => {
        updateAxes();
    });

    onMount(() => {
        loadData();
    });
</script>

<div class="lifestyle-scatter-wrapper">
    {#if loading}
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading lifestyle and mortality data...</p>
        </div>
    {:else if error}
        <div class="error">
            <p>⚠️ {error}</p>
        </div>
    {:else}
        <div class="controls">
            <div class="control-section">
                <h4>📊 X-Axis Factor</h4>
                <select bind:value={xMetric}>
                    <optgroup label="Lifestyle Factors">
                        {#each lifestyleMetrics as metric}
                            <option value={metric.value}>{metric.label}</option>
                        {/each}
                    </optgroup>
                    <optgroup label="Socioeconomic Factors">
                        {#each socioeconomicMetrics as metric}
                            <option value={metric.value}>{metric.label}</option>
                        {/each}
                    </optgroup>
                    <optgroup label="Health Conditions">
                        {#each healthMetrics as metric}
                            <option value={metric.value}>{metric.label}</option>
                        {/each}
                    </optgroup>
                </select>
            </div>
            <div class="control-section">
                <h4>❤️ Y-Axis Outcome</h4>
                <select bind:value={yMetric}>
                    {#each outcomeMetrics as metric}
                        <option value={metric.value}>{metric.label}</option>
                    {/each}
                </select>
            </div>
            <div class="interpretation-inline">
                <div class="correlation-badge {Math.abs(correlation) > 0.4 ? 'significant' : ''}">
                    <div class="correlation-label">Correlation</div>
                    <div class="correlation-value">{correlation.toFixed(3)}</div>
                    <div class="correlation-strength">{correlationStrength}</div>
                </div>
                
                <div class="insight-text">
                    {#if Math.abs(correlation) > 0.6}
                        <strong>Strong relationship!</strong> States with {correlation > 0 ? 'higher' : 'lower'}
                         {getMetricLabel(xMetric).toLowerCase()} tend to have {correlation > 0 ? 'higher' : 'lower'}
                         {getMetricLabel(yMetric).toLowerCase()}.
                    {:else if Math.abs(correlation) > 0.3}
                        <strong>Moderate correlation.</strong> {getMetricLabel(xMetric)} and
                         {getMetricLabel(yMetric).toLowerCase()} are related, but other factors also play a role.
                    {:else}
                        <strong>Weak relationship.</strong> Other factors may be more influential than {getMetricLabel(xMetric).toLowerCase()}.
                    {/if}
                </div>
            </div>
        </div>

        <div class="viz-container">
            <svg {width} {height}>
                {#if trendLine}
                    <path
                        d={trendLine}
                        stroke={correlation > 0 ? "#e74c3c" : "#27ae60"}
                        stroke-width="2"
                        fill="none"
                        stroke-dasharray="5,5"
                        opacity="0.6"
                    />
                {/if}

                <g class="points">
                    {#each data as point}
                        <circle
                            cx={xScale ? xScale(point[xMetric as keyof LifestyleData] as number) : usableArea.left}
                            cy={yScale ? yScale(point[yMetric as keyof LifestyleData] as number) : usableArea.bottom}
                            r={selectedState === point ? 8 : 6}
                            fill={selectedState === point ? "#e74c3c" : "rgba(102, 126, 234, 0.7)"}
                            stroke={selectedState === point ? "#c0392b" : "#667eea"}
                            stroke-width={selectedState === point ? 3 : 2}
                            opacity={selectedState && selectedState !== point ? 0.2 : 1}
                            onclick={() => handleStateClick(point)}
                            class="data-point"
                        >
                            <title>{point.state}</title>
                        </circle>
                        {#if selectedState === point}
                            <text
                                x={xScale ? xScale(point[xMetric as keyof LifestyleData] as number) : usableArea.left}
                                y={(yScale ? yScale(point[yMetric as keyof LifestyleData] as number) : usableArea.bottom) - 15}
                                text-anchor="middle"
                                class="state-label-chart"
                            >
                                {point.state}
                            </text>
                        {/if}
                    {/each}
                </g>

                <g transform="translate(0, {usableArea.bottom})" bind:this={xAxis} />
                <g transform="translate({usableArea.left}, 0)" bind:this={yAxis} />

                <text
                    x={width / 2}
                    y={height - 15}
                    text-anchor="middle"
                    class="axis-label"
                >
                    {getMetricLabel(xMetric)}
                </text>
                <text
                    x={-height / 2}
                    y={20}
                    text-anchor="middle"
                    transform="rotate(-90)"
                    class="axis-label"
                >
                    {getMetricLabel(yMetric)}
                </text>
            </svg>
        </div>

        {#if selectedState}
            <div class="state-factsheet">
                <div class="factsheet-header">
                    <h3>{selectedState.state}</h3>
                    <button class="close-btn" onclick={() => selectedState = null}>✕</button>
                </div>

                <div class="factsheet-grid">
                    <div class="fact-section">
                        <h4>🫀 Heart Health</h4>
                        <div class="fact-items">
                            <div class="fact-item highlight">
                                <span class="label">Mortality Rate:</span>
                                <span class="value">{selectedState.mortalityRate.toFixed(1)}/100k</span>
                            </div>
                            <div class="fact-item">
                                <span class="label">Total Deaths:</span>
                                <span class="value">{selectedState.deathCount.toLocaleString()}</span>
                            </div>
                            <div class="fact-item">
                                <span class="label">Heart Attack:</span>
                                <span class="value">{selectedState.prevalenceHeartAttack.toFixed(2)}%</span>
                            </div>
                            <div class="fact-item">
                                <span class="label">Stroke:</span>
                                <span class="value">{selectedState.prevalenceStroke.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="fact-section">
                        <h4>🏃 Lifestyle</h4>
                        <div class="fact-items">
                            <div class="fact-item">
                                <span class="label">Avg Sleep:</span>
                                <span class="value">{selectedState.avgSleepHours.toFixed(1)} hrs</span>
                            </div>
                            <div class="fact-item">
                                <span class="label">Avg BMI:</span>
                                <span class="value">{selectedState.avgBMI.toFixed(1)}</span>
                            </div>
                            <div class="fact-item">
                                <span class="label">Smoking Score:</span>
                                <span class="value">{selectedState.avgSmokerScore.toFixed(2)}</span>
                            </div>
                            <div class="fact-item">
                                <span class="label">Alcohol Use:</span>
                                <span class="value">{selectedState.prevalenceAlcoholDrinkers.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="fact-section">
                        <h4>💼 Socioeconomic</h4>
                        <div class="fact-items">
                            <div class="fact-item">
                                <span class="label">Median Income:</span>
                                <span class="value">${selectedState.medianIncome.toLocaleString()}</span>
                            </div>
                            <div class="fact-item">
                                <span class="label">Unemployment:</span>
                                <span class="value">{selectedState.unemploymentRate.toFixed(1)}%</span>
                            </div>
                            <div class="fact-item">
                                <span class="label">Bachelor's+:</span>
                                <span class="value">{selectedState.bachelorsRate.toFixed(1)}%</span>
                            </div>
                            <div class="fact-item">
                                <span class="label">Uninsured (35-64):</span>
                                <span class="value">{selectedState.uninsured3564Rate.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="fact-section">
                        <h4>🏥 Other Conditions</h4>
                        <div class="fact-items">
                            <div class="fact-item">
                                <span class="label">Diabetes:</span>
                                <span class="value">{selectedState.prevalenceDiabetes.toFixed(2)}%</span>
                            </div>
                            <div class="fact-item">
                                <span class="label">COPD:</span>
                                <span class="value">{selectedState.prevalenceCOPD.toFixed(2)}%</span>
                            </div>
                            <div class="fact-item">
                                <span class="label">Depression:</span>
                                <span class="value">{selectedState.prevalenceDepression.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {:else}
            <div class="placeholder-prompt">
                <p>💡 <strong>Click any state</strong> on the chart above to see detailed statistics</p>
            </div>
        {/if}
    {/if}
</div>

<style>
    .lifestyle-scatter-wrapper {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 20px 0;
    }
    .loading, .error {
        text-align: center;
        padding: 3rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f4f6;
        border-top-color: #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .controls {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        align-items: stretch;
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 20px;
    }
    .control-section {
        flex: 0 0 calc(25% - 15px);
        min-width: 200px;
    }
    .control-section h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
    }
    .control-section select {
        width: 100%;
        padding: 10px 14px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
    }
    .control-section select:hover {
        border-color: #667eea;
    }
    .control-section select:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .interpretation-inline {
        flex: 1;
        display: flex;
        gap: 16px;
        align-items: center;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        padding: 16px;
        border-radius: 8px;
        min-width: 350px;
    }
    .correlation-badge {
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        padding: 12px 20px;
        border-radius: 8px;
        text-align: center;
        min-width: 100px;
        border: 2px solid transparent;
        transition: all 0.3s;
        flex-shrink: 0;
    }
    .correlation-badge.significant {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-color: #667eea;
    }
    .correlation-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.8;
        margin-bottom: 2px;
    }
    .correlation-value {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 2px;
    }
    .correlation-strength {
        font-size: 12px;
        opacity: 0.9;
    }
    .insight-text {
        flex: 1;
        font-size: 13px;
        line-height: 1.5;
        color: #374151;
    }
    .insight-text strong {
        color: #1f2937;
    }
    .viz-container {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
    }
    svg {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .data-point {
        cursor: pointer;
        transition: all 0.2s;
    }
    .data-point:hover {
        stroke-width: 3;
        opacity: 1 !important;
    }
    .axis-label {
        font-size: 14px;
        font-weight: 500;
        fill: #374151;
    }
    .state-label-chart {
        font-size: 12px;
        font-weight: bold;
        fill: #c0392b;
        pointer-events: none;
    }
    .placeholder-prompt {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .placeholder-prompt p {
        margin: 0;
        font-size: 16px;
    }
    .state-factsheet {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        padding: 24px;
        border: 2px solid #667eea;
    }
    .factsheet-header {
        display: flex;
        justify-content: space-between; /* Completed CSS */
        align-items: center;
        margin-bottom: 15px;
        border-bottom: 1px solid #f3f4f6;
        padding-bottom: 15px;
    }
    .factsheet-header h3 {
        margin: 0;
        color: #1f2937;
        font-size: 24px;
    }
    .close-btn {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #9ca3af;
        padding: 5px 10px;
        border-radius: 4px;
        transition: color 0.2s;
    }
    .close-btn:hover {
        color: #374151;
    }
    .factsheet-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
    }
    .fact-section {
        background: #f9fafb;
        padding: 15px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
    }
    .fact-section h4 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #4b5563;
        display: flex;
        align-items: center;
    }
    .fact-items {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .fact-item {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
    }
    .fact-item .label {
        color: #6b7280;
    }
    .fact-item .value {
        font-weight: 600;
        color: #374151;
    }
    .fact-item.highlight {
        background: #eef2ff;
        padding: 5px 8px;
        border-radius: 4px;
        margin: -5px -8px 5px; /* Adjust to slightly expand the background */
    }
</style>