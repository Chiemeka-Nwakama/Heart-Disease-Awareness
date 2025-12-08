<script lang="ts">
	import LifeStyleHeat from "../LifeStyleHeat.svelte";
	import RiskMeter from "../RiskMeter.svelte";
</script>

<section id="demographicSection">
	<h2>Who We Are: Does Age or Background Change the Odds?</h2>
	<p>Let's see how things shift by risk factors. This data is a subset from the national BFSS health survey in 2022. </p>

	<div class="viz-placeholder">
		<h4>📊 Heart Disease Risk by Demographics</h4>
		<LifeStyleHeat />
	</div>

	<div class="person-card">
		<h4>Meet James, 68</h4>
		<div class="details">
			<p><strong>Age:</strong> 68 years old</p>
			<p><strong>Gender:</strong> Male</p>
			<p><strong>Race:</strong> Black/African American</p>
			<p>
				<strong>Family History:</strong> Father had heart attack
				at 62
			</p>
		</div>
	</div>

	<div class="viz-placeholder">
		<h4>⚠️ James's Risk Profile</h4>
		<RiskMeter 
			userName="James"
			age={68}
			sex="Male"
			race="Black only, Non-Hispanic"
			exercisePerWeek={0}
			sleepHours={6.5}
			smokerStatus="Former smoker"
			bmi={32.5}
			hasDiabetes={true}
		/>
		<p>
			<strong>Finding:</strong> People like James face higher risk
			due to age demographics and genetic factors, with rates 1.5x
			higher than younger populations.
		</p>
	</div>
</section>