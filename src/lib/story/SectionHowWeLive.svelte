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
		<p>Interactive visualization showing correlation between lifestyle factors (exercise frequency, diet quality, smoking status, sleep hours) and heart disease rates. Could be scatter plots, connected dot plots, or small multiples.</p>
		<LifestyleScatter {base}/>
	</div>

	<div class="person-card">
		<h4>Meet Sarah, 45</h4>
		<div class="details">
			<p><strong>Exercise:</strong> 4x per week, moderate intensity</p>
			<p><strong>Diet:</strong> Mediterranean-style, low processed foods</p>
			<p><strong>Smoking:</strong> Never smoked</p>
			<p><strong>Sleep:</strong> 7-8 hours nightly</p>
		</div>
	</div>
	<div class="viz-placeholder">
		<h4>⚡ Sarah's Risk Meter</h4>
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
		<p>
			Gauge or meter visualization comparing Sarah's risk to
			national averages. Shows percentage reduction in risk based
			on her healthy habits.
		</p>
		<p>
			<strong>Finding:</strong> People with habits like Sarah's have
			about 35% lower risk than the national average.
		</p>
		<p>Gauge or meter visualization comparing Sarah's risk to national averages. Shows percentage reduction in risk based on her healthy habits.</p>
		<p><strong>Finding:</strong> People with habits like Sarah's have about 35% lower risk than the national average.</p>
	</div>
</section>