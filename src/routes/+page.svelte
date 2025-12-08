<script lang="ts">
	import { onMount } from "svelte";
	import type { Person, StateData, Top5 } from "../types";
	import { loadTop5Csv, loadKaggleCsv, loadStateData } from "../dataLoaders";
	import "../app.css";
	import SectionIntro from "../lib/story/SectionIntro.svelte";
    import SectionHowWeLive from "$lib/story/SectionHowWeLive.svelte";
    import SectionWhoWeAre from "$lib/story/SectionWhoWeAre.svelte";
    import SectionConclusion from "$lib/story/SectionConclusion.svelte";
    import SectionInteractive from "$lib/story/SectionInteractive.svelte";
    import SectionWhereWeLive from "$lib/story/SectionWhereWeLive.svelte";

	// Reactive variable for storing the data
	let people: Person[] = [];
	let stateData: StateData[] = [];
	let cause_Of_Death: Top5[] = [];

	onMount(async () => {
		// Load all data in parallel
		[cause_Of_Death, people, stateData] = await Promise.all([
			loadTop5Csv(),
			loadKaggleCsv(),
			loadStateData(),
		]);
	});
</script>

<div class="container">
	<header>
		<h1>THE STATES OF OUR HEARTS</h1>
	</header>

	<!-- Introduction (line chart, leading cause of deaths) -->
	<SectionIntro {cause_Of_Death} />

    <!-- How We Live Section (scatter plot, correlation between lifestyle factors) -->
    <SectionHowWeLive />

	<!-- Who We Are Section (heatmap) -->
	<SectionWhoWeAre />

	<!-- Where We Live Section (us map)-->
	<SectionWhereWeLive {stateData} />

	<!-- Interactive Section (calculator, bar chart?)-->
	<SectionInteractive {people}/>

	<!-- Conclusion (what we learned, conclusion, footer) -->
	<SectionConclusion />
</div>
