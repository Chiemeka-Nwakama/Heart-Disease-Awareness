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
				Choropleth map of the United States showing heart disease
				death rates per 100,000 by state. Southern states
				(Mississippi, Alabama, Oklahoma, Louisiana) highlighted in
				darker reds; Western/Northern states (Minnesota, Colorado,
				Hawaii, Massachusetts) in lighter shades.
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