<script lang="ts">
	import type { Person } from "../../types";
	import GroupedBar from "../GroupedBar.svelte";

	export let people: Person[] = [];
</script>

<section>
	<h2>What If They Changed a Few Things?</h2>
	<p>
		A few small changes can make a big difference. See how modifying
		lifestyle factors could impact risk.
	</p>

	<div class="viz-placeholder">
		<h4>🎛️ Risk Calculator</h4>
		<p>
			Interactive tool with sliders/toggles to adjust:<br />
			• Exercise frequency (0-7 days/week)<br />
			• Smoking status (current/former/never)<br />
			• Diet quality (poor/fair/good/excellent)<br />
			• Sleep hours (4-10 hours)<br />
			• BMI range<br /><br />
			Real-time risk score updates as user adjusts factors, showing
			percentage change from baseline.
		</p>
	</div>
	<div class="viz-placeholder">
		<h4>Smoker Status By Age Group</h4>
		<p>
			Side-by-side bar charts showing prevalence of smoking status
			across different age groups.
		</p>
		<GroupedBar {people} />
	</div>
</section>