<script lang="ts">
	import LifeStyleHeat from "../LifeStyleHeat.svelte";
	import RiskMeter from "../RiskMeter.svelte";
	import PieChart from "../PieChart.svelte";
</script>

<section id="demographicSection">
	<h2>
		Who We Are: Do Biological and Health Factors Change the Odds?
	</h2>
	<p>
		Let's see how things shift by risk factors. These are a subset of
		predisposed risk factors an individual may have. This is based on a
		100k subset of data from the national BFSS health survey in 2022,
		openly available on Kaggle.
	</p>

	<div class="viz-placeholder">
		<!-- <h4>📊 Heart Disease Risk by Demographics</h4> -->
		<PieChart />
		<LifeStyleHeat />
	</div>

	<div class="viz-placeholder">
		<div class="person-card">
			<h4>Meet James, 68</h4>
				<div class="details">
					<p>James is a 68-year-old Black/African American man with a family history of heart disease—his father had a heart attack at 62. He is a former smoker, has diabetes, and does not currently exercise.</p>
				</div>
		</div>

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
	</div>
</section>
