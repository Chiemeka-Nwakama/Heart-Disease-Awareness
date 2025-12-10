<script lang="ts">
    import RiskForm from "$lib/RiskForm.svelte";
	import RiskMeter from "$lib/RiskMeter.svelte";

	let formData: { 
		userName: any; 
		age: any; 
		sex: any; 
		race: any; 
		exercisePerWeek: any; 
		sleepHours: any; 
		smokerStatus: any; 
		bmi: any; 
		hasDiabetes: any; 
		state: any; 
	} | null = null;

	function handleFormSubmit(
		event: { 
			detail: 
				{ 
					userName: any; 
					age: any; 
					sex: any; 
					race: any; 
					exercisePerWeek: any; 
					sleepHours: any; 
					smokerStatus: any; 
					bmi: any; 
					hasDiabetes: any; 
					state: any; 
				} | null; 
			}
	) {
		formData = event.detail; // contains everything from the form
		console.log(formData)
	}

	function handleTryAgain() {
		formData = null;
	}
</script>

<style>
	.disclaimer {
		font-size: 0.85rem;
		color: #6b7280; /* gray */
		font-style: italic;
		margin-top: 0.5rem;
	}

</style>


<section>
	<h2>What If A Few Things Changed?</h2>
	<p>
		Small changes can make a big difference. Explore how different factors could impact risk.
	</p>
	<p class="disclaimer">
		This calculator is based on statistical data from a specific dataset and is intended for informational purposes only. 
		It does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional 
		for personal medical guidance.
	</p>

	<div class="viz-placeholder">
		<h4>🎛️ Risk Calculator</h4>
		{#if !formData}
			<RiskForm on:submit={handleFormSubmit} />
		{:else}
			<RiskMeter
				userName={formData.username}
				age={formData.age}
				sex={formData.sex}
				race={formData.race}
				exercisePerWeek={formData.exercisePerWeek}
				sleepHours={formData.sleepHours}
				smokerStatus={formData.smokerStatus}
				bmi={formData.bmi}
				hasDiabetes={formData.hasDiabetes}
				state={formData.state}
				tryAgain={true}
				on:tryAgain={handleTryAgain}
			/>
		{/if}
	</div>
</section>