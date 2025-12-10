<script lang="ts">
	import type { StateData } from "../../types";
	import USCorrelationMap from "../USCorrelationMap.svelte";
	import RiskMeter from "../RiskMeter.svelte";

	export let stateData: StateData[] = [];
</script>

<section id="locationSection">
		<h2>Where We Live: Does Your State Make a Difference?</h2>
		<p>
			Heart health looks different in different corners of the country. Let's take a look at some possible connections.
		</p>

		<div class="viz-placeholder">
			<h4>🗺️ Heart Disease Mortality by State</h4>
			<p>
				A bivariate choropleth map of the United States showing heart disease
				death rates per 100,000 by state and actual death rates. We see states with high deaths but low
				mortality rates like California, Arizona, and Florida in lighter greens. This suggests that 
				the high death count is a factor of population and not a high mortality rate. Conversely,
				we see West Virgina and Oklahoma with a purple suggesting that the death rate to heart disease is 
				high but the actual death rate is low due to the lower populations of these states.
			</p>
			<USCorrelationMap data={stateData} />
		</div>

		<div class="viz-placeholder">
			<div class="person-card">
				<h4>Meet Maria, 52</h4>
					<div class="details">
						<p>Maria is a 52-year-old living in rural Mississippi. She is 45 minutes from the nearest cardiac center, has limited access to fresh produce and exercise facilities, and works a sedentary, high-stress job.</p>
					</div>
			</div>
			<RiskMeter 
				userName="Maria"
				age={52}
				sex="Female"
				race="Multiracial, Non-Hispanic"
				exercisePerWeek={1}
				sleepHours={6.5}
				smokerStatus="Never smoked"
				bmi={28.5}
				hasDiabetes={false}
				state="Mississippi"
			/>
		</div>
	</section>