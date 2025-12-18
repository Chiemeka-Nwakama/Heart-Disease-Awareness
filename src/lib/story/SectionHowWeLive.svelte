<script lang="ts">
	import LifestyleScatter from "../LifestyleScatter.svelte";
	import RiskMeter from "../RiskMeter.svelte";

	
    const { base } = $props<{ base: string }>();
</script>

<section id="lifestyleSection">
	<h2>How We Live: Do Our Habits Matter?</h2>
	<p>Exercise, food, smoking, sleep – we all know they count, but how much?</p>
	
	<div class="viz-placeholder">
		<h4>📈 Lifestyle Factors & Heart Disease Risk</h4>
		<p>Interactive visualization showing correlation between lifestyle factors and heart disease rates.</p>
		<LifestyleScatter {base}/>
	</div>

	
	<div class="viz-placeholder">
		<div class="person-card">
			<h4>Meet Sarah, 45</h4>
				<div class="details">
					<p>Sarah exercises moderately about four times a week and follows a Mediterranean-style diet low in processed foods. She has never smoked and typically gets 7–8 hours of sleep each night.</p>
				</div>
		</div>
		<RiskMeter 
			userName="Sarah"
			age={45}
			sex="Female"
			race="White only, Non-Hispanic"
			exercisePerWeek={4}
			sleepHours={7.5}
			smokerStatus="Never smoked"
			bmi={23.5}
			hasDiabetes={false}
		/>
	</div>
</section>