<script lang="ts">
	import * as d3 from 'd3';

	type ChartData = {
		category: string;
		value: number;
		color: string;
	};

	type PieSegment = {
		category: string;
		value: number;
		color: string;
		path: string;
		labelX: number;
		labelY: number;
	};

	let selectedView: 'gender' | 'race' | 'both' = 'both';
	let hoveredSegment: string | null = null;

	const genderData: ChartData[] = [
		{ category: 'Male', value: 48.35, color: '#3b82f6' },
		{ category: 'Female', value: 51.65, color: '#ec4899' }
	];

	const raceData: ChartData[] = [
		{ category: 'White, Non-Hispanic', value: 75.85, color: '#8b5cf6' },
		{ category: 'Black/African American, Non-Hispanic', value: 7.56, color: '#10b981' },
		{ category: 'Hispanic', value: 5.02, color: '#f59e0b' },
		{ category: 'Multiracial, Non-Hispanic', value: 2.26, color: '#06b6d4' },
		{ category: 'Other - Non-Hispanic', value: 9.31, color: '#6366f1' }
	];

	// const genderData2: ChartData[] = [
	// 	{ category: 'Male', value: 48.35, color: '#3b82f6' },
	// 	{ category: 'Female', value: 51.65, color: '#ec4899' }
	// ];

	// const raceData2: ChartData[] = [
	// 	{ category: 'White, Non-Hispanic', value: 75.85, color: '#8b5cf6' },
	// 	{ category: 'Black/African American, Non-Hispanic', value: 7.56, color: '#10b981' },
	// 	{ category: 'Hispanic', value: 5.02, color: '#f59e0b' },
	// 	{ category: 'Multiracial, Non-Hispanic', value: 2.26, color: '#06b6d4' },
	// 	{ category: 'Other - Non-Hispanic', value: 9.31, color: '#6366f1' }
	// ];

	function generatePieSegments(data: ChartData[], width: number, height: number): PieSegment[] {
		const radius = Math.min(width, height) / 2 - 20;
		const centerX = width / 2;
		const centerY = height / 2;

		// Use D3's pie layout to calculate angles
		const pie = d3
			.pie<ChartData>()
			.value((d) => d.value)
			.sort(null);

		// Use D3's arc generator to create path strings
		const arc = d3.arc<d3.PieArcDatum<ChartData>>().innerRadius(0).outerRadius(radius);

		const pieData = pie(data);

		return pieData.map((d) => {
			// Calculate label position using D3's centroid
			const [labelX, labelY] = arc.centroid(d);

			return {
				category: d.data.category,
				value: d.data.value,
				color: d.data.color,
				path: arc(d) || '',
				labelX: centerX + labelX,
				labelY: centerY + labelY
			};
		});
	}

	$: genderSegments = generatePieSegments(genderData, 400, 400);
	$: raceSegments = generatePieSegments(raceData, 400, 400);
</script>

<div class="container">
	<div class="header">
		<h1>Heart Disease Demographics</h1>
		<p>Distribution of heart disease cases by gender and race/ethnicity</p>
	</div>

	<!-- <div class="button-group">
		<button
			class="btn"
			class:active={selectedView === 'both'}
			on:click={() => (selectedView = 'both')}
		>
			Both Charts
		</button>
		<button
			class="btn"
			class:active={selectedView === 'gender'}
			on:click={() => (selectedView = 'gender')}
		>
			Gender Only
		</button>
		<button
			class="btn"
			class:active={selectedView === 'race'}
			on:click={() => (selectedView = 'race')}
		>
			Race/Ethnicity Only
		</button>
	</div> -->

	<div class="charts-container">
		{#if selectedView === 'gender' || selectedView === 'both'}
			<div class="chart-card">
				<h2>Gender Distribution</h2>
				<svg width="400" height="400" viewBox="0 0 400 400">
					<g transform="translate(200, 200)">
						{#each genderSegments as segment}
							<path
								d={segment.path}
								fill={segment.color}
								stroke="white"
								stroke-width="2"
								class="pie-segment"
								class:hovered={hoveredSegment === segment.category}
								on:mouseenter={() => (hoveredSegment = segment.category)}
								on:mouseleave={() => (hoveredSegment = null)}
							/>
							<text
								x={segment.labelX - 200}
								y={segment.labelY - 200}
								text-anchor="middle"
								dominant-baseline="middle"
								fill="white"
								font-size="18"
								font-weight="bold"
								pointer-events="none"
							>
								{segment.value}%
							</text>
						{/each}
					</g>
				</svg>
				<div class="legend">
					{#each genderData as item}
						<div class="legend-item">
							<div class="legend-color" style="background-color: {item.color}"></div>
							<span>{item.category} ({item.value}%)</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if selectedView === 'race' || selectedView === 'both'}
			<div class="chart-card">
				<h2>Race/Ethnicity Distribution</h2>
				<svg width="400" height="400" viewBox="0 0 400 400">
					<g transform="translate(200, 200)">
						{#each raceSegments as segment}
							<path
								d={segment.path}
								fill={segment.color}
								stroke="white"
								stroke-width="2"
								class="pie-segment"
								class:hovered={hoveredSegment === segment.category}
								on:mouseenter={() => (hoveredSegment = segment.category)}
								on:mouseleave={() => (hoveredSegment = null)}
							/>
							<text
								x={segment.labelX - 200}
								y={segment.labelY - 200}
								text-anchor="middle"
								dominant-baseline="middle"
								fill="white"
								font-size="16"
								font-weight="bold"
								pointer-events="none"
							>
								{segment.value}%
							</text>
						{/each}
					</g>
				</svg>
				<div class="legend">
					{#each raceData as item}
						<div class="legend-item">
							<div class="legend-color" style="background-color: {item.color}"></div>
							<span>{item.category} ({item.value}%)</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Duplicate to test layout with four charts nad other dummy values -->
		<!-- {#if selectedView === 'gender' || selectedView === 'both'}
			<div class="chart-card">
				<h2>Gender Distribution</h2>
				<svg width="400" height="400" viewBox="0 0 400 400">
					<g transform="translate(200, 200)">
						{#each genderSegments as segment}
							<path
								d={segment.path}
								fill={segment.color}
								stroke="white"
								stroke-width="2"
								class="pie-segment"
								class:hovered={hoveredSegment === segment.category}
								on:mouseenter={() => (hoveredSegment = segment.category)}
								on:mouseleave={() => (hoveredSegment = null)}
							/>
							<text
								x={segment.labelX - 200}
								y={segment.labelY - 200}
								text-anchor="middle"
								dominant-baseline="middle"
								fill="white"
								font-size="18"
								font-weight="bold"
								pointer-events="none"
							>
								{segment.value}%
							</text>
						{/each}
					</g>
				</svg>
				<div class="legend">
					{#each genderData as item}
						<div class="legend-item">
							<div class="legend-color" style="background-color: {item.color}"></div>
							<span>{item.category} ({item.value}%)</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if selectedView === 'race' || selectedView === 'both'}
			<div class="chart-card">
				<h2>Race/Ethnicity Distribution</h2>
				<svg width="400" height="400" viewBox="0 0 400 400">
					<g transform="translate(200, 200)">
						{#each raceSegments as segment}
							<path
								d={segment.path}
								fill={segment.color}
								stroke="white"
								stroke-width="2"
								class="pie-segment"
								class:hovered={hoveredSegment === segment.category}
								on:mouseenter={() => (hoveredSegment = segment.category)}
								on:mouseleave={() => (hoveredSegment = null)}
							/>
							<text
								x={segment.labelX - 200}
								y={segment.labelY - 200}
								text-anchor="middle"
								dominant-baseline="middle"
								fill="white"
								font-size="16"
								font-weight="bold"
								pointer-events="none"
							>
								{segment.value}%
							</text>
						{/each}
					</g>
				</svg>
				<div class="legend">
					{#each raceData as item}
						<div class="legend-item">
							<div class="legend-color" style="background-color: {item.color}"></div>
							<span>{item.category} ({item.value}%)</span>
						</div>
					{/each}
				</div>
			</div>
		{/if} -->
	</div>

	<div class="footer">
		<p>Hover over pie slices to highlight them</p>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			sans-serif;
	}

	.container {
		min-height: auto;
		/* background: linear-gradient(to bottom right, #eff6ff, #faf5ff); */
		padding: 0;
		border-radius: 1rem;
		margin-bottom: 2rem;
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.header h1 {
		font-size: 2.5rem;
		font-weight: bold;
		color: #2563eb;
		margin: 0 0 0.5rem 0;
	}

	.header p {
		color: #19397e;
		margin: 0;
	}

	.button-group {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.btn {
		padding: 0.5rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
		background-color: white;
		color: #2564eb;
	}

	.btn:hover {
		background-color: #f3f4f6;
	}

	.btn.active {
		background-color: #2563eb;
		color: white;
	}

	.charts-container {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.chart-card {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
	}

	.chart-card h2 {
		text-align: center;
		font-size: 1.25rem;
		font-weight: bold;
		color: #1f2937;
		margin: 0 0 1rem 0;
	}

	.pie-segment {
		cursor: pointer;
		transition:
			opacity 0.2s,
			transform 0.2s;
	}

	.pie-segment:hover,
	.pie-segment.hovered {
		opacity: 0.8;
		transform: scale(1.05);
		transform-origin: left top;
	}

	.legend {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.legend-color {
		width: 1rem;
		height: 1rem;
		border-radius: 0.25rem;
	}

	.legend-item span {
		font-size: 1rem;
		color: #374151;
	}

	.footer {
		text-align: center;
		margin-top: 1rem;
		font-size: 1rem;
	}

	.footer p {
		margin: 0;
		color: #f3f4f6;
		background: #2563eb;
		border-radius: 0.4rem;
	}
</style>
