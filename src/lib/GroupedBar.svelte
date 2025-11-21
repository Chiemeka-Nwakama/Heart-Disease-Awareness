<script lang="ts">
	import { scale } from 'svelte/transition';
	import type { Person } from '../types';
	import * as d3 from 'd3';

	// define the props of the Bar component
	type Props = {
		people: Person[];
		progress?: number;
		width?: number;
		height?: number;
		filterYear?: number | null;
	};
	// progress is 100 by default unless specified
	let { people, progress = 100, width = 500, height = 400, filterYear = null }: Props = $props();

	let selectedGenre: string = $state('');

	// processing the data; $derived is used to create a reactive variable that updates whenever the dependent variables change
	//const yearRange = $derived(d3.extent(people.map((d) => d.year)));

	//   function getUpYear(yearRange: [undefined, undefined] | [Date, Date]) {
	//     if (!yearRange[0]) return new Date();
	//     const timeScale = d3.scaleTime().domain(yearRange).range([0, 100]);
	//     return timeScale.invert(progress);
	//   }
	//   const upYear: Date = $derived(getUpYear(yearRange!));

	//   function getGenreNums(movies: TMovie[], upYear: Date) {
	//     let res: { [genre: string]: number } = {};
	//     movies
	//       .filter((movie) => movie.year <= upYear)
	//       .forEach((movie) => {
	//         movie.genres.forEach((genre: string) => {
	//           res[genre] = (res[genre] || 0) + 1;
	//         });
	//       });
	//     return res;
	//   }
	function getAgeGroupString(ageCategory: number) {
		let ageCategoryStr: string[] = [
			'18-24',
			'25-29',
			'30-34',
			'35-39',
			'40-44',
			'45-49',
			'50-54',
			'55-59',
			'60-64',
			'65-69',
			'70-74',
			'75-79',
			'80+'
		];
		return ageCategoryStr[ageCategory];
	}

	function getAgeGroupNums(people: Person[]) {
		let res: { [ageCategory: string]: number } = {};
		people.forEach((person) => {
			let age = person.AgeCategory;
			if (!res[getAgeGroupString(age)]) {
				res[getAgeGroupString(age)] = 0;
			}
			res[getAgeGroupString(age)] = (res[getAgeGroupString(age)] || 0) + 1;
		});

		return res;
	}

	const ageGroupNums = $derived(getAgeGroupNums(people));

	function getSmokerNumsByAgeGroup(people: Person[]) {
		let res: { [smokerStatus: string]: { [ageGroup: string]: number } } = {};
		let smokerStatus: string[] = [
			'Never Smoked',
			'Former Smoker',
			'Current Smoker - some days',
			'Current Smoker - everyday'
		];

		people.forEach((person) => {
			let smokerStat = smokerStatus[person.SmokerStatus];
			let ageGroup = getAgeGroupString(person.AgeCategory);
			if (!res[smokerStat]) {
				res[smokerStat] = {};
			}
			if (!res[smokerStat][ageGroup]) {
				res[smokerStat][ageGroup] = 0;
			}
			res[smokerStat][ageGroup] = (res[smokerStat][ageGroup] || 0) + 1;
		});
		return res;
	}

	const smokerNumsByAgeGroup = $derived(getSmokerNumsByAgeGroup(people));

	//   function getGenreNumsByYear(movies: TMovie[], year: number) {
	//     let res: { [genre: string]: number } = {};
	//     movies
	//       .filter((movie) => movie.year.getFullYear() === year)
	//       .forEach((movie) => {
	//         movie.genres.forEach((genre: string) => {
	//           res[genre] = (res[genre] || 0) + 1;
	//         });
	//       });
	//     return res;
	//   }

	//   const genreNums = $derived(
	//     filterYear ? getGenreNumsByYear(movies, filterYear) : getGenreNums(movies, upYear)
	//   );

	// drawing the bar chart

	const margin = {
		top: 15,
		bottom: 60,
		left: 50,
		right: 10
	};

	let usableArea = {
		top: margin.top,
		right: width - margin.right,
		bottom: height - margin.bottom,
		left: margin.left
	};

	const xOutScale = $derived(
		// tip: use d3.scaleBand() to create a band scale for the x-axis
		d3
			.scaleBand()
			.domain(Object.keys(smokerNumsByAgeGroup)) // genres are keys of the object
			.range([usableArea.left, usableArea.right]) // within the chart area
			.paddingInner(0.1)
	);

	const xScale = $derived(
		d3
			.scaleBand()
			.domain(Object.keys(ageGroupNums)) // smoker statuses are keys
			.range([xOutScale.bandwidth(), 0]) // within each genre band
			.padding(0.05)
	);

	const color = $derived(
		d3.scaleOrdinal().domain(Object.keys(ageGroupNums)).range(d3.schemeCategory10)
	);

	const yScale = $derived(
		// tip: use d3.scaleLinear() to create a linear scale for the y-axis
		d3
			.scaleLinear()
			.domain([
				0,
				d3.max(Object.values(smokerNumsByAgeGroup).flatMap((d) => Object.values(d))) || 0
			]) // max count
			.range([usableArea.bottom, usableArea.top]) // invert for SVG
	);

	const xBarwidth: number = $derived(xScale.bandwidth());

	let xAxis: any = $state(),
		yAxis: any = $state();

	function updateAxis() {
		// X axis
		d3.select(xAxis)
			.call(d3.axisBottom(xOutScale))
			.selectAll('text')
			.attr('transform', 'rotate(0)')
			.style('text-anchor', 'middle');

		// tip:
		// similar to the x-axis, create a y-axis using d3.axisLeft() and bind it to the yAxis variable

		// Y-axis
		d3.select(yAxis).call(d3.axisLeft(yScale)).selectAll('text').style('font-size', '12px');
	}

	// the $effect function is used to run a function whenever the reactive variables change, also known as a side effect
	$effect(() => {
		updateAxis();
		console.log(smokerNumsByAgeGroup);
	});
</script>

<h3>The Distribution of Smokers Across Age Groups</h3>

{#if people.length > 0}
	<svg {width} {height}>
		<g class="bars">
			{#each Object.entries(smokerNumsByAgeGroup) as [smokerStatus, ageGroupCounts]}
				<g class={smokerStatus} transform={`translate(${xOutScale(smokerStatus)}, 0)`}>
					{#each Object.entries(ageGroupCounts) as [ageGroup, cnt]}
						<g class={ageGroup}>
							<rect
								width={xScale.bandwidth()}
								height={yScale(0) - yScale(cnt)}
								x={xScale(ageGroup)}
								y={yScale(cnt)}
								fill={color(ageGroup)}
								class="bar"
								opacity={selectedGenre === ageGroup || selectedGenre === '' ? 1 : 0.5}
								on:mouseover={() => (selectedGenre = ageGroup)}
								on:mouseout={() => (selectedGenre = '')}
							/>

							<text
								x={xScale(ageGroup)! + xBarwidth / 2}
								y={yScale(cnt) - 5}
								font-size="12"
								text-anchor="middle"
							>
								{selectedGenre === ageGroup ? `${ageGroup}: ${cnt}` : cnt}
							</text>
						</g>
					{/each}
				</g>
			{/each}
		</g>

		<g transform="translate(0, {usableArea.bottom})" bind:this={xAxis} />
		<g transform="translate({usableArea.left}, 0)" bind:this={yAxis} />
	</svg>
{/if}

<style>
	.bar {
		transition:
			y 0.1s ease,
			height 0.1s ease,
			width 0.1s ease; /* Smooth transition for height */
	}
</style>
