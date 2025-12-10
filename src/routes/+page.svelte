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
<header class="title-column">
	<h1>THE STATES OF OUR HEARTS</h1>

	<div class="ekg-row">

		<div class="ekg-box">
			<svg class="ekg" viewBox="0 0 600 120">
				<path class="ekg-line" d="M0 60 L80 60 L100 40 L120 90 L140 60 L220 60 L240 50 L260 70 L280 60 L360 60 L380 40 L400 90 L420 60 L600 60"/>
			</svg>
	
			
			<svg class="heart-icon beating-heart" viewBox="0 0 24 24">
				<path d="
					M12 21
					C5 14, 2 10, 2 6.5
					C2 4, 4 2.5, 6.2 2.5
					C8 2.5, 9.5 3.7, 12 6
					C14.5 3.7, 16 2.5, 17.8 2.5
					C20 2.5, 22 4, 22 6.5
					C22 10, 19 14, 12 21
				" />

			</svg>
	
		</div>
	
	</div>
	


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
