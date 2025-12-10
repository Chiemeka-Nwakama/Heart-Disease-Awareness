<script lang="ts">
	import type { Top5 } from "../../types";
	import LineChartDeath from "../LineChartDeath.svelte";

	export let cause_Of_Death: Top5[] = [];
</script>

<section id="deathCauseSection">
	<h2 style="text-align: center;">
		Heart Disease has been the leading cause of death in the U.S. for
		the last decade.
	</h2>
	<div class="viz-placeholder">
		<!-- <h4> Top 10 Leading Causes of Death in the U.S.</h4>	 -->

		<LineChartDeath data={cause_Of_Death} />

	</div>
</section>

<p class="intro-text">
	We looked at data on
	<a href="#lifestyleSection">lifestyle</a>,
	<a href="#demographicSection">demographics</a>, and
	<a href="#locationSection">location</a>
	to see what really connects to heart disease across the U.S.
</p>
