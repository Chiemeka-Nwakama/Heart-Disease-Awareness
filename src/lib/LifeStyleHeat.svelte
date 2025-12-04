<script lang="ts">
	import * as d3 from "d3";

	// Correlation data
	const correlationData = {
		variables: [
			"AgeCategory",
			"SleepHours",
			"HadDepressiveDisorder",
			"HadDiabetes",
			"SmokerStatus",
			"BMI",
			"AlcoholDrinkers",
			"CovidPos",
			"Heart Disease"
		],
		labels: {
			AgeCategory: "Age Category",
			SleepHours: "Sleep Hours",
			HadDepressiveDisorder: "Depression",
			HadDiabetes: "Diabetes",
			SmokerStatus: "Smoking Status",
			BMI: "Body Mass Index",
			AlcoholDrinkers: "Alcohol Use",
			CovidPos: "COVID-19",
			"Heart Disease": "Heart Disease"
		},
		matrix: [
			[1, 0.123431413, -0.11397264, 0.148483494, 0.046156517, -0.017289875, -0.13262566, -0.177545067, 0.284503355],
			[0.123431413, 1, -0.046650744, -0.006339026, -0.050861699, -0.054495115, -0.006458462, -0.046173077, 0.005730431],
			[-0.11397264, -0.046650744, 1, 0.051195951, 0.117338167, 0.104779684, -0.031348434, 0.038095127, 0.090491391],
			[0.148483494, -0.006339026, 0.051195951, 1, 0.029481719, 0.175715775, -0.120993669, -0.004085989, 0.141712112],
			[0.046156517, -0.050861699, 0.117338167, 0.029481719, 1, 0.000631842, 0.000638415, -0.050816832, 0.185291307],
			[-0.017289875, -0.054495115, 0.104779684, 0.175715775, 0.000631842, 1, -0.069047672, 0.060383547, 0.061257768],
			[-0.13262566, -0.006458462, -0.031348434, -0.120993669, 0.000638415, -0.069047672, 1, 0.051884478, -0.122616206],
			[-0.177545067, -0.046173077, 0.038095127, -0.004085989, -0.050816832, 0.060383547, 0.051884478, 1, -0.03879833],
			[0.284503355, 0.005730431, 0.090491391, 0.141712112, 0.185291307, 0.061257768, -0.122616206, -0.03879833, 1]
		]
	};

	// Settings
	const cellSize = 60;
	const margin = { top: 120, right: 20, bottom: 60, left: 140 };
	const width = cellSize * correlationData.variables.length + margin.left + margin.right;
	const height = cellSize * correlationData.variables.length + margin.top + margin.bottom;

	let hoveredCell = null;
	let selectedCell = null;
	let explanation: {
		factor: string;
		value: number;
		direction: string;
		strength: string;
		text: string;
	} | null = null;

	// Color scale
	const colorScale = d3.scaleLinear()
		.domain([-1, -0.5, 0, 0.5, 1])
		.range(["#b91c1c", "#fca5a5", "#ffffff", "#93c5fd", "#1d4ed8"]);

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

	function getExplanationText(factor: string, value: number): string {
		const direction = getCorrelationDirection(value);
		const strength = getCorrelationStrength(value).toLowerCase();

		const base = `This factor has a ${strength} ${direction.toLowerCase()} correlation with heart disease.`;

		const details: Record<string, string> = {
			AgeCategory: " Heart disease becomes more common with increasing age, which aligns with clinical expectations.",
			SleepHours: " Sleep duration has a very weak association, meaning it does not strongly predict heart disease in this dataset.",
			HadDepressiveDisorder: " Depression is associated with increased cardiovascular risk, likely due to chronic stress and behavioral changes.",
			HadDiabetes: " Diabetes contributes to long-term vascular damage, increasing heart disease likelihood.",
			SmokerStatus: " Smoking harms blood vessels and increases inflammation, a known major cardiovascular risk factor.",
			BMI: " BMI shows a weak correlation—weight alone may not capture metabolic factors well.",
			AlcoholDrinkers: " The negative correlation may reflect moderate drinkers having lower measured heart risk, a pattern sometimes seen in survey data.",
			CovidPos: " COVID history shows only a very weak relationship with heart disease in this dataset."
		};

		return base + (details[factor] || "");
	}

	function handleCellClick(cell: any) {
		selectedCell = cell;
		
		// Only show explanation when clicking on Heart Disease column (not the diagonal)
		if (cell.colLabel === "Heart Disease" && cell.rowLabel !== "Heart Disease") {
			explanation = {
				factor: cell.rowLabel,
				value: cell.value,
				direction: getCorrelationDirection(cell.value),
				strength: getCorrelationStrength(cell.value),
				text: getExplanationText(cell.rowVar, cell.value)
			};
		} else if (cell.rowLabel === "Heart Disease" && cell.colLabel !== "Heart Disease") {
			explanation = {
				factor: cell.colLabel,
				value: cell.value,
				direction: getCorrelationDirection(cell.value),
				strength: getCorrelationStrength(cell.value),
				text: getExplanationText(cell.colVar, cell.value)
			};
		} else {
			explanation = null;
		}
	}
</script>

<style>
	.container {
		padding: 2rem;
		background: #ffffff;
		border-radius: 16px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
		max-width: 100%;
		margin: 0 auto;
		overflow: visible;
	}

	h2 {
		font-size: 24px;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
		text-align: center;
	}

	.subtitle {
		text-align: center;
		color: #6b7280;
		font-size: 14px;
		margin-bottom: 1.5rem;
	}

	.viz-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		background: white;
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 1.5rem;
		overflow-x: auto;
		overflow-y: visible;
	}

	svg {
		font-family: system-ui, sans-serif;
		overflow: visible;
	}

	.cell {
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cell:hover {
		stroke: #1f2937;
		stroke-width: 2;
	}

	.cell.selected {
		stroke: #3b82f6;
		stroke-width: 3;
	}

	.axis-label {
		font-size: 12px;
		font-weight: 600;
		fill: #1f2937;
		cursor: default;
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
		padding: 12px 16px;
		border-radius: 8px;
		font-size: 13px;
		pointer-events: none;
		z-index: 1000;
		box-shadow: 0 4px 12px rgba(0,0,0,0.3);
		max-width: 280px;
		line-height: 1.6;
	}

	.tooltip-title {
		font-weight: 700;
		margin-bottom: 8px;
		color: #60a5fa;
		font-size: 14px;
	}

	.tooltip-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 4px;
	}

	.legend {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 12px;
		flex-wrap: wrap;
	}

	.legend-title {
		font-weight: 600;
		color: #1f2937;
		font-size: 14px;
	}

	.legend-gradient {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.gradient-bar {
		width: 250px;
		height: 20px;
		border-radius: 6px;
		background: linear-gradient(to right, 
			#b91c1c 0%, 
			#fca5a5 25%, 
			#ffffff 50%, 
			#93c5fd 75%, 
			#1d4ed8 100%);
		border: 1px solid #e5e7eb;
	}

	.gradient-labels {
		display: flex;
		justify-content: space-between;
		width: 250px;
		font-size: 11px;
		color: #6b7280;
		font-weight: 500;
	}

	.info-box {
		background: #dbeafe;
		padding: 1rem;
		border-radius: 8px;
		margin-top: 1rem;
		font-size: 14px;
		color: #1e40af;
		border-left: 4px solid #3b82f6;
	}

	.info-box strong {
		color: #1e3a8a;
	}

	.explanation-panel {
		background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
		border-left: 4px solid #3b82f6;
		padding: 1.5rem;
		border-radius: 12px;
		margin: 1.5rem 0;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.explanation-panel h3 {
		margin: 0 0 1rem 0;
		font-size: 18px;
		font-weight: 700;
		color: #1e3a8a;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.explanation-panel h3::before {
		content: "📊";
		font-size: 20px;
	}

	.exp-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 8px;
		font-size: 14px;
		color: #1e40af;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 6px;
	}

	.exp-row strong {
		color: #1e3a8a;
		font-weight: 700;
	}

	.exp-text {
		margin-top: 1rem;
		padding: 1rem;
		font-size: 14px;
		color: #1e3a8a;
		line-height: 1.6;
		background: rgba(255, 255, 255, 0.8);
		border-radius: 8px;
		border: 1px solid #bfdbfe;
	}

	.close-btn {
		float: right;
		background: none;
		border: none;
		font-size: 20px;
		cursor: pointer;
		color: #6b7280;
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.close-btn:hover {
		background: rgba(0, 0, 0, 0.1);
		color: #1f2937;
	}
</style>

<div class="container">
	<h2>Heart Disease Risk Factor Correlations</h2>
	<div class="subtitle">
		Click on Heart Disease row/column cells to see detailed explanations
	</div>

	{#if explanation}
	<div class="explanation-panel">
		<button class="close-btn" on:click={() => explanation = null}>×</button>
		<h3>{explanation.factor}</h3>
		<div class="exp-row">
			<span>Correlation:</span>
			<strong>{explanation.value.toFixed(3)}</strong>
		</div>
		<div class="exp-row">
			<span>Direction:</span>
			<strong>{explanation.direction}</strong>
		</div>
		<div class="exp-row">
			<span>Strength:</span>
			<strong>{explanation.strength}</strong>
		</div>
		<p class="exp-text">{explanation.text}</p>
	</div>
	{/if}

	<div class="viz-wrapper">
		<svg {width} {height}>
			<g transform="translate({margin.left}, {margin.top})">
				<!-- Row labels -->
				{#each correlationData.variables as variable, i}
					<text
						class="axis-label"
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
					<g>
						<rect
							class="cell"
							class:selected={selectedCell?.row === cell.row && selectedCell?.col === cell.col}
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

	{#if hoveredCell}
		<div class="tooltip" style="left: {hoveredCell.x + 10}px; top: {hoveredCell.y - 10}px;">
			<div class="tooltip-title">
				{hoveredCell.rowLabel} × {hoveredCell.colLabel}
			</div>
			<div class="tooltip-row">
				<span>Correlation:</span>
				<strong>{hoveredCell.value.toFixed(3)}</strong>
			</div>
			<div class="tooltip-row">
				<span>Direction:</span>
				<strong>{getCorrelationDirection(hoveredCell.value)}</strong>
			</div>
			<div class="tooltip-row">
				<span>Strength:</span>
				<strong>{getCorrelationStrength(hoveredCell.value)}</strong>
			</div>
		</div>
	{/if}

	<div class="legend">
		<div class="legend-title">Correlation Scale:</div>
		<div class="legend-gradient">
			<div>
				<div class="gradient-bar"></div>
				<div class="gradient-labels">
					<span>-1.0</span>
					<span>-0.5</span>
					<span>0</span>
					<span>0.5</span>
					<span>1.0</span>
				</div>
			</div>
		</div>
	</div>

	<div class="info-box">
		<strong>How to read:</strong> Correlation values range from -1 to +1. 
		<strong>Positive values</strong> (blue) mean factors increase together. 
		<strong>Negative values</strong> (red) mean when one increases, the other decreases. 
		Values closer to 0 (white) indicate weak or no relationship.
	</div>
</div>