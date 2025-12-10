<script lang="ts">
	import type { StateData } from "../../types";
	import USCorrelationMap from "../USCorrelationMap.svelte";
	import RiskMeter from "../RiskMeter.svelte";

	export let stateData: StateData[] = [];
</script>

<section id="locationSection">
		<h2>Where We Live: Does Your State Make a Difference?</h2>
		<p>
			Heart health looks different in different corners of the country.
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

		<div class="person-card">
			<h4>Meet Maria, 52</h4>
			<div class="details">
				<p><strong>Location:</strong> Rural Mississippi</p>
				<p>
					<strong>Healthcare Access:</strong> 45 minutes to nearest
					cardiac center
				</p>
				<p>
					<strong>Environment:</strong> Limited access to fresh produce,
					few exercise facilities
				</p>
				<p>
					<strong>Lifestyle:</strong> Sedentary job, high-stress
				</p>
			</div>
		</div>

		<div class="viz-placeholder">
			<h4>📍 Maria's Geographic Risk</h4>
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
			<p>
				<strong>Finding:</strong> Maria's story mirrors what the data
				show: both access to healthcare and lifestyle factors shaped
				by location matter significantly.
			</p>
		</div>
	</section>