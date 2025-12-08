<script lang="ts">
	import { scale } from 'svelte/transition';
	import type { Person } from '../types';
	import * as d3 from 'd3';

	// define the props of the component
	type Props = {
		people: Person[];
		width?: number;
		height?: number;
	};
	
	let { people, width = 600, height = 500 }: Props = $props();

	let selectedStatus: string = $state('');
	let hoveredBar: { ageGroup: string; status: string } | null = $state(null);

	function getAgeGroupString(ageCategory: number) {
		let ageCategoryStr: string[] = [
			'18-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54',
			'55-59', '60-64', '65-69', '70-74', '75-79', '80+'
		];
		return ageCategoryStr[ageCategory];
	}

	// Calculate percentage data for stacked bars
	function getStackedPercentageData(people: Person[]) {
		let smokerStatusLabels: string[] = [
			'Never Smoked',
			'Former Smoker',
			'Current Smoker - some days',
			'Current Smoker - everyday'
		];

		// First, get counts by age group and status
		let countsByAge: { [ageGroup: string]: { [status: string]: number } } = {};
		
		people.forEach((person) => {
			let ageGroup = getAgeGroupString(person.AgeCategory);
			let status = smokerStatusLabels[person.SmokerStatus];
			
			if (!countsByAge[ageGroup]) {
				countsByAge[ageGroup] = {};
			}
			countsByAge[ageGroup][status] = (countsByAge[ageGroup][status] || 0) + 1;
		});

		// Convert to percentage and prepare for stacking
		let stackedData: Array<{
			ageGroup: string;
			statuses: Array<{ status: string; percentage: number; count: number; y0: number; y1: number }>;
			total: number;
		}> = [];

		Object.keys(countsByAge).forEach((ageGroup) => {
			let total = Object.values(countsByAge[ageGroup]).reduce((sum, count) => sum + count, 0);
			let cumulative = 0;
			let statuses = smokerStatusLabels.map((status) => {
				let count = countsByAge[ageGroup][status] || 0;
				let percentage = (count / total) * 100;
				let y0 = cumulative;
				let y1 = cumulative + percentage;
				cumulative = y1;
				return { status, percentage, count, y0, y1 };
			});
			stackedData.push({ ageGroup, statuses, total });
		});

		return stackedData;
	}

	const stackedData = $derived(getStackedPercentageData(people));

	// Chart layout
	const margin = { top: 100, bottom: 80, left: 60, right: 100 };

	let usableArea = {
		top: margin.top,
		right: width - margin.right,
		bottom: height - margin.bottom,
		left: margin.left
	};

	const xScale = $derived(
		d3
			.scaleBand()
			.domain(stackedData.map((d) => d.ageGroup))
			.range([usableArea.left, usableArea.right])
			.padding(0.2)
	);

	const yScale = $derived(
		d3
			.scaleLinear()
			.domain([0, 100])
			.range([usableArea.bottom, usableArea.top])
	);

	const colorScale = $derived(
		d3
			.scaleOrdinal()
			.domain(['Never Smoked', 'Former Smoker', 'Current Smoker - some days', 'Current Smoker - everyday'])
			.range(['#4ade80', '#60a5fa', '#fbbf24', '#f87171'])
	);

	let xAxis: any = $state();
	let yAxis: any = $state();

	function updateAxis() {
		d3.select(xAxis)
			.call(d3.axisBottom(xScale))
			.selectAll('text')
			.attr('transform', 'rotate(-45)')
			.style('text-anchor', 'end')
			.style('font-size', '11px')
			.style('fill', 'white');

		d3.select(yAxis)
			.call(d3.axisLeft(yScale).ticks(10).tickFormat((d) => d + '%'))
			.selectAll('text')
			.style('font-size', '12px')
			.style('fill', 'white');
	}

	$effect(() => {
		updateAxis();
	});
</script>

<h3 style="color: white; margin-bottom: 10px;">Smoking Status Distribution Across Age Groups</h3>
<p style="color: #888; font-size: 14px; margin-bottom: 20px;">Percentage of each smoking status within age groups</p>

{#if people.length > 0}
	<svg {width} {height}>
		<!-- Stacked bars -->
		<g class="bars">
			{#each stackedData as { ageGroup, statuses, total }}
				{#each statuses as { status, percentage, count, y0, y1 }}
					<rect
						width={xScale.bandwidth()}
						height={yScale(y0) - yScale(y1)}
						x={xScale(ageGroup)}
						y={yScale(y1)}
						fill={colorScale(status)}
						class="bar"
						opacity={selectedStatus === '' || selectedStatus === status ? 1 : 0.3}
						on:mouseover={() => {
							selectedStatus = status;
							hoveredBar = { ageGroup, status };
						}}
						on:mouseout={() => {
							selectedStatus = '';
							hoveredBar = null;
						}}
					/>
					
					<!-- Show percentage text only if segment is large enough -->
					{#if percentage > 8}
						<text
							x={xScale(ageGroup)! + xScale.bandwidth() / 2}
							y={yScale(y0 + (y1 - y0) / 2)}
							font-size="11"
							text-anchor="middle"
							fill="white"
							font-weight="600"
							style="pointer-events: none;"
							dominant-baseline="middle"
						>
							{percentage.toFixed(1)}%
						</text>
					{/if}
				{/each}
			{/each}
		</g>

		<!-- Axes -->
		<g transform="translate(0, {usableArea.bottom})" bind:this={xAxis} />
		<g transform="translate({usableArea.left}, 0)" bind:this={yAxis} />

		<!-- Y-axis label -->
		<text
			x={-height / 2}
			y={15}
			transform="rotate(-90)"
			text-anchor="middle"
			font-size="14"
			fill="white"
			font-weight="600"
		>
			Percentage (%)
		</text>

		<!-- Legend -->
		<g class="legend" transform="translate(10, 15)">
			<text x="0" y="0" font-size="11" font-weight="600" fill="white">Status:</text>
			<!-- First row: Never Smoked and Former Smoker -->
			<g 
				transform="translate(60, -5)"
				style="cursor: pointer;"
				on:mouseover={() => (selectedStatus = 'Never Smoked')}
				on:mouseout={() => (selectedStatus = '')}
			>
				<rect 
					width="12" 
					height="12" 
					fill={colorScale('Never Smoked')}
					opacity={selectedStatus === '' || selectedStatus === 'Never Smoked' ? 1 : 0.3}
				/>
				<text 
					x="16" 
					y="10" 
					font-size="9" 
					fill="white"
					opacity={selectedStatus === '' || selectedStatus === 'Never Smoked' ? 1 : 0.5}
				>
					Never Smoked
				</text>
			</g>
			<g 
				transform="translate(280, -5)"
				style="cursor: pointer;"
				on:mouseover={() => (selectedStatus = 'Former Smoker')}
				on:mouseout={() => (selectedStatus = '')}
			>
				<rect 
					width="12" 
					height="12" 
					fill={colorScale('Former Smoker')}
					opacity={selectedStatus === '' || selectedStatus === 'Former Smoker' ? 1 : 0.3}
				/>
				<text 
					x="16" 
					y="10" 
					font-size="9" 
					fill="white"
					opacity={selectedStatus === '' || selectedStatus === 'Former Smoker' ? 1 : 0.5}
				>
					Former Smoker
				</text>
			</g>
			<!-- Second row: Current Smoker - some days and Current Smoker - everyday -->
			<g 
				transform="translate(60, 15)"
				style="cursor: pointer;"
				on:mouseover={() => (selectedStatus = 'Current Smoker - some days')}
				on:mouseout={() => (selectedStatus = '')}
			>
				<rect 
					width="12" 
					height="12" 
					fill={colorScale('Current Smoker - some days')}
					opacity={selectedStatus === '' || selectedStatus === 'Current Smoker - some days' ? 1 : 0.3}
				/>
				<text 
					x="16" 
					y="10" 
					font-size="9" 
					fill="white"
					opacity={selectedStatus === '' || selectedStatus === 'Current Smoker - some days' ? 1 : 0.5}
				>
					Current Smoker - some days
				</text>
			</g>
			<g 
				transform="translate(280, 15)"
				style="cursor: pointer;"
				on:mouseover={() => (selectedStatus = 'Current Smoker - everyday')}
				on:mouseout={() => (selectedStatus = '')}
			>
				<rect 
					width="12" 
					height="12" 
					fill={colorScale('Current Smoker - everyday')}
					opacity={selectedStatus === '' || selectedStatus === 'Current Smoker - everyday' ? 1 : 0.3}
				/>
				<text 
					x="16" 
					y="10" 
					font-size="9" 
					fill="white"
					opacity={selectedStatus === '' || selectedStatus === 'Current Smoker - everyday' ? 1 : 0.5}
				>
					Current Smoker - everyday
				</text>
			</g>
		</g>

		<!-- Tooltip -->
		{#if hoveredBar}
			{@const data = stackedData.find((d) => d.ageGroup === hoveredBar.ageGroup)}
			{@const statusData = data?.statuses.find((s) => s.status === hoveredBar.status)}
			{#if statusData}
				<g transform="translate({xScale(hoveredBar.ageGroup)! + xScale.bandwidth() / 2}, {yScale(statusData.y0 + (statusData.y1 - statusData.y0) / 2) - 40})">
					<rect
						x="-20"
						y="-25"
						width="120"
						height="45"
						fill="rgba(0, 0, 0, 0.9)"
						stroke="white"
						stroke-width="1"
						rx="4"
					/>
					<text x="0" y="-8" text-anchor="middle" font-size="11" fill="white" font-weight="600">
						{hoveredBar.ageGroup}
					</text>
					<text x="0" y="8" text-anchor="middle" font-size="10" fill="#aaa">
						{statusData.count} people ({statusData.percentage.toFixed(1)}%)
					</text>
				</g>
			{/if}
		{/if}
	</svg>
{/if}

<style>
	.bar {
		transition: opacity 0.2s ease;
		cursor: pointer;
	}
</style>