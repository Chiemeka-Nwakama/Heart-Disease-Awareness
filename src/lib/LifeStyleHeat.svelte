<script lang="ts">
	import * as d3 from "d3";
	import { crossfade } from "svelte/transition";

	let [send, receive] = crossfade({
		duration: 400,
	});

	// Correlation data
	const correlationData = {
		variables: [
			"AgeCategory",
			"BMI",
			"HadDepressiveDisorder",
			"HadDiabetes",
			"CovidPos",
			"Heart Disease"
		],
		labels: {
			AgeCategory: "Age",
			BMI: "BMI",
			HadDepressiveDisorder: "Depression",
			HadDiabetes: "Diabetes",
			CovidPos: "COVID-19",
			"Heart Disease": "Heart Disease"
		},
		matrix: [
			[1.000000, -0.026596,-0.114859, 0.147451,-0.174950,0.287559],
			[-0.026596,	1.000000,	0.103362,	0.171439,	0.063094,	0.055309],
			[-0.114859,	0.103362,	1.000000, 0.051338,	0.040540,	0.089250],
			[0.147451,	0.171439,	0.051338,	1.000000,	-0.003036,	0.145988],
			[ -0.174950,	0.063094,	0.040540,	-0.003036,	1.000000,	-0.037894],
			[0.287559,	0.055309,	0.089250,	0.145988,	-0.037894,	1.000000]
		]
	};

	// Settings
	const cellSize = 60;
	const margin = { top: 60, right: 10, bottom: 20, left: 70 };
	const width = cellSize * correlationData.variables.length + margin.left + margin.right;
	const height = cellSize * correlationData.variables.length + margin.top + margin.bottom;

	let hoveredCell = null;
	let selectedFactor: string | null = null;

	// Color scale
	const colorScale = d3.scaleLinear()
		.domain([-1, -0.5, 0, 0.5, 1])
		.range(["#b91c1c", "#fca5a5", "#f8fafc", "#93c5fd", "#1d4ed8"]);

	// Create flattened data
	const flatData = correlationData.variables.flatMap((rowVar, i) => 
		correlationData.variables.map((colVar, j) => ({
			row: i,
			col: j,
			rowVar,
			colVar,
			value: correlationData.matrix[i][j],
			rowLabel: correlationData.labels[rowVar] || rowVar,
			colLabel: correlationData.labels[colVar] || colVar
		}))
	);

	// Get Heart Disease column index
	const heartDiseaseCol = correlationData.variables.indexOf("Heart Disease");

	// Get explanations for each factor's correlation with Heart Disease
	function getExplanations() {
		const explanations: Record<string, {
		value: number;
		strength: string;
		direction: string;
		text: string;
		source?: string;
		sourceUrl?: string;
		}> = {};		correlationData.variables.forEach((variable, i) => {
			if (variable !== "Heart Disease") {
				const value = correlationData.matrix[i][heartDiseaseCol];
				const abs = Math.abs(value);
				let strength = "";
				if (abs >= 0.7) strength = "very strong";
				else if (abs >= 0.5) strength = "strong";
				else if (abs >= 0.3) strength = "moderate";
				else if (abs >= 0.1) strength = "weak";
				else strength = "very weak";

				const direction = Math.abs(value) < 0.01 ? "no" : (value > 0 ? "positive" : "negative");

				const details: Record<string, { text: string; source?: string; sourceUrl?: string }> = {
					AgeCategory: {
						text: "Heart disease becomes more prevalent with age, aligning with clinical expectations.",
						source: "American Heart Association",
						sourceUrl: "https://www.heart.org/en/healthy-living/healthy-lifestyle/how-to-help-prevent-heart-disease-at-any-age"
					},
					HadDepressiveDisorder: {
						text: "Depression and heart disease can occur together. There is a higher risk through chronic stress and behavioral changes.",
						source: "John Hopkins Medicine",
						sourceUrl: "https://www.hopkinsmedicine.org/health/conditions-and-diseases/depression-and-heart-disease"
					},
					HadDiabetes: {
						text: "Diabetes contributes to long-term vascular damage. According to the CDC, people with diabetes have twice the risk of developing heart disease.",
						source: "CDC - Diabetes and Heart Disease",
						sourceUrl: "https://www.cdc.gov/diabetes/diabetes-complications/diabetes-and-your-heart.html"
					},
					BMI: {
						text: "BMI shows a weak correlation in this dataset. However, a higher BMI can be a health risk. Weight alone may not capture metabolic health factors.",
						source: "National Library of Medicine",
						sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6378495/#section2-1559827618812395"
					},
					CovidPos: {
						text: "COVID-19 history shows only a very weak relationship with heart disease in this dataset. However, heart problems can arise post-infection.",
						source: "Cleveland Clinic",
						sourceUrl: "https://my.clevelandclinic.org/health/articles/heart-problems-after-covid"
					}
				};

				explanations[variable] = {
					value,
					strength,
					direction,
					text: details[variable]?.text || "",
					source: details[variable]?.source,
					sourceUrl: details[variable]?.sourceUrl
				};
			}
		});

		return explanations;
	}

	const explanations = getExplanations();

	function getCorrelationStrength(value: number): string {
		const abs = Math.abs(value);
		if (abs >= 0.7) return "Very Strong";
		if (abs >= 0.5) return "Strong";
		if (abs >= 0.3) return "Moderate";
		if (abs >= 0.1) return "Weak";
		return "Very Weak";
	}

	function getCorrelationDirection(value: number): string {
		if (Math.abs(value) < 0.01) return "No";
		return value > 0 ? "Positive" : "Negative";
	}

	function handleCellClick(cell: any) {
		// Only allow clicking on Heart Disease column (not diagonal)
		if (cell.col === heartDiseaseCol && cell.row !== heartDiseaseCol) {
			selectedFactor = selectedFactor === cell.rowVar ? null : cell.rowVar;
		}
	}

	function isHeartDiseaseColumn(col: number): boolean {
		return col === heartDiseaseCol;
	}
</script>

<style>
	.container {
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.05);
		max-width: 100%;
		margin: 0 auto;
		overflow: visible;
	}

	h2 {
		font-size: 20px;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
		padding: 1.5rem 1.5rem 0 1.5rem;
	}

	.subtitle {
		color: #6b7280;
		font-size: 13px;
		margin-bottom: 1.5rem;
		padding: 0 1.5rem;
	}

	.main-layout {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 2rem;
		padding: 0 1.5rem 1.5rem 1.5rem;
		align-items: center;
	}

	.explanation-sidebar {
		position: sticky;
		top: 20px;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.card-wrapper {
		position: relative;
	}

	.explanation-card {
		background: #f9fafb;
		border-radius: 8px;
		padding: 1rem;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.1s ease;
		position: absolute;
		width: 90%;
	}

	.explanation-card:hover {
		background: #f3f4f6;
		border-color: #e5e7eb;
	}

	.explanation-card.selected {
		background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
		border-color: #3b82f6;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
	}

	.card-collapsed {
		height: 48px;
	}

	.card-expanded {
		min-height: 180px;
	}

	.exp-title {
		font-size: 14px;
		font-weight: 700;
		color: #1f2937;
	}

	.exp-content {
		margin-top: 0.75rem;
	}

	.exp-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.exp-value {
		font-size: 13px;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 4px;
		background: white;
	}

	.exp-value.positive {
		color: #1d4ed8;
	}

	.exp-value.negative {
		color: #b91c1c;
	}

	.exp-meta {
		font-size: 11px;
		color: #6b7280;
		margin-bottom: 0.5rem;
		text-transform: capitalize;
	}

	.exp-text {
		font-size: 11px;
		color: #374151;
		line-height: 1.4;
		margin-bottom: 0.5rem;
	}

	.exp-source {
		font-size: 10px;
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.exp-source a {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 600;
		transition: color 0.2s ease;
	}

	.exp-source a:hover {
		color: #1d4ed8;
		text-decoration: underline;
	}

	.viz-wrapper {
		display: flex;
		justify-content: center;
		background: white;
		border-radius: 8px;
		padding: 1rem;
		overflow-x: auto;
	}

	svg {
		font-family: system-ui, sans-serif;
		overflow: visible;
	}

	.cell {
		transition: all 0.15s ease;
	}

	.cell.clickable {
		cursor: pointer;
	}

	.cell.clickable:hover {
		stroke: #1f2937;
		stroke-width: 2;
	}

	.cell.selected {
		stroke: #3b82f6;
		stroke-width: 3;
	}

	.cell.heart-disease-col {
		stroke: red;
		stroke-width: 1.5;
	}

	.axis-label {
		font-size: 11px;
		font-weight: 600;
		fill: #1f2937;
	}

	.axis-label.highlight {
		fill: #3b82f6;
		font-weight: 700;
	}

	.cell-value {
		font-size: 10px;
		font-weight: 600;
		pointer-events: none;
		user-select: none;
	}

	.tooltip {
		position: fixed;
		background: rgba(17, 24, 39, 0.95);
		color: white;
		padding: 10px 14px;
		border-radius: 6px;
		font-size: 12px;
		pointer-events: none;
		z-index: 1000;
		box-shadow: 0 4px 12px rgba(0,0,0,0.3);
		max-width: 240px;
		line-height: 1.5;
	}

	.tooltip-title {
		font-weight: 700;
		margin-bottom: 6px;
		color: #60a5fa;
		font-size: 13px;
	}

	.tooltip-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 3px;
		font-size: 11px;
	}

	.legend {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		margin-top: 1rem;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 8px;
	}

	.legend-title {
		font-weight: 600;
		color: #1f2937;
		font-size: 12px;
	}

	.gradient-bar {
		width: 200px;
		height: 16px;
		border-radius: 4px;
		background: linear-gradient(to right, 
			#b91c1c 0%, 
			#fca5a5 25%, 
			#f8fafc 50%, 
			#93c5fd 75%, 
			#1d4ed8 100%);
		border: 1px solid #e5e7eb;
	}

	.gradient-labels {
		display: flex;
		justify-content: space-between;
		width: 200px;
		font-size: 10px;
		color: #6b7280;
		font-weight: 500;
		margin-top: 4px;
	}

	@media (max-width: 1024px) {
		.main-layout {
			grid-template-columns: 1fr;
		}

		.explanation-sidebar {
			position: static;
			flex-direction: row;
			overflow-x: auto;
			gap: 1rem;
			margin-bottom: 1rem;
			
		}
	}
</style>

<div class="container">
	<h2>Heart Disease Risk Factor Correlations</h2>
	<div class="subtitle">
		Click cells in the highlighted Heart Disease column to explore correlations
	</div>

	<div class="main-layout">
		<!-- Left sidebar with animated cards -->
		<div class="explanation-sidebar">

			{#each Object.entries(explanations) as [variable, exp]}
				<div class="card-wrapper" style="height: {selectedFactor === variable ? '190px' : '72px'}">
					{#if selectedFactor !== variable}
						<!-- Collapsed card -->
						<div
							class="explanation-card card-collapsed"
							on:click={() => selectedFactor = variable}
							in:receive={{ key: variable }}
							out:send={{ key: variable }}
						>
							<div 
								class="exp-title"
								in:receive={{ key: `${variable}-title` }}
								out:send={{ key: `${variable}-title` }}
							>
								{correlationData.labels[variable]}
							</div>
						</div>
					{:else}
						<!-- Expanded card -->
						<div
							class="explanation-card card-expanded selected"
							on:click={() => selectedFactor = null}
							in:receive={{ key: variable }}
							out:send={{ key: variable }}
						>
							<div class="exp-header">
								<div 
									class="exp-title"
									in:receive={{ key: `${variable}-title` }}
									out:send={{ key: `${variable}-title` }}
								>
									{correlationData.labels[variable]}
								</div>
								<div 
									class="exp-value"
									class:positive={exp.value > 0}
									class:negative={exp.value < 0}
								>
									{exp.value.toFixed(2)}
								</div>
							</div>
							<div class="exp-content">
								<div class="exp-meta">
									{exp.strength} {exp.direction} correlation
								</div>
								<div class="exp-text">{exp.text}</div>
							{#if exp.sourceUrl}
								<div class="exp-source">
									<a href={exp.sourceUrl} target="_blank" rel="noopener noreferrer">
										{exp.source || "Source"} →
									</a>
								</div>
							{/if}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Right side with heatmap -->
		<div>
			<div class="viz-wrapper">
				<svg {width} {height}>
					<g transform="translate({margin.left}, {margin.top})">
						<!-- Row labels -->
						{#each correlationData.variables as variable, i}
							<text
								class="axis-label"
								class:highlight={selectedFactor === variable}
								x="-10"
								y={i * cellSize + cellSize / 2}
								text-anchor="end"
								dominant-baseline="middle"
							>
								{correlationData.labels[variable] || variable}
							</text>
						{/each}

						<!-- Column labels -->
						{#each correlationData.variables as variable, j}
							<text
								class="axis-label"
								class:highlight={j === heartDiseaseCol}
								x={j * cellSize + cellSize / 2}
								y="-10"
								text-anchor="start"
								transform="rotate(-45, {j * cellSize + cellSize / 2}, -10)"
							>
								{correlationData.labels[variable] || variable}
							</text>
						{/each}

						<!-- Cells -->
						{#each flatData as cell}
							{@const isClickable = cell.col === heartDiseaseCol && cell.row !== heartDiseaseCol}
							{@const isSelected = selectedFactor === cell.rowVar && cell.col === heartDiseaseCol}
							<g>
								<rect
									class="cell"
									class:clickable={isClickable}
									class:selected={isSelected}
									class:heart-disease-col={cell.col === heartDiseaseCol}
									x={cell.col * cellSize}
									y={cell.row * cellSize}
									width={cellSize}
									height={cellSize}
									fill={colorScale(cell.value)}
									stroke="#e5e7eb"
									stroke-width="1"
									on:mouseenter={(e) => {
										hoveredCell = {
											...cell,
											x: e.clientX,
											y: e.clientY
										};
									}}
									on:mouseleave={() => {
										hoveredCell = null;
									}}
									on:click={() => handleCellClick(cell)}
								/>
								
								<!-- Value text -->
								<text
									class="cell-value"
									x={cell.col * cellSize + cellSize / 2}
									y={cell.row * cellSize + cellSize / 2}
									text-anchor="middle"
									dominant-baseline="middle"
									fill={Math.abs(cell.value) > 0.5 ? "white" : "#1f2937"}
								>
									{cell.value.toFixed(2)}
								</text>
							</g>
						{/each}
					</g>
				</svg>
			</div>

			<div class="legend">
				<div class="legend-title">Scale:</div>
				<div>
					<div class="gradient-bar"></div>
					<div class="gradient-labels">
						<span>-1.0</span>
						<span>0</span>
						<span>1.0</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	{#if hoveredCell}
		<div class="tooltip" style="left: {hoveredCell.x + 10}px; top: {hoveredCell.y - 10}px;">
			<div class="tooltip-title">
				{hoveredCell.rowLabel} × {hoveredCell.colLabel}
			</div>
			<div class="tooltip-row">
				<span>Value:</span>
				<strong>{hoveredCell.value.toFixed(3)}</strong>
			</div>
			<div class="tooltip-row">
				<span>Type: </span>
				<strong>{getCorrelationDirection(hoveredCell.value)}, {getCorrelationStrength(hoveredCell.value)}</strong>
			</div>
		</div>
	{/if}
</div>