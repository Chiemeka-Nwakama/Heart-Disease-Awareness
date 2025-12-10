<script lang="ts">
  import RiskMeter from '$lib/RiskMeter.svelte';

  // Options
  const sexOptions = ["Female", "Male"];
  const races = [
    "White only, Non-Hispanic",
    "Black only, Non-Hispanic",
    "Other race only, Non-Hispanic",
    "Multiracial, Non-Hispanic",
    "Hispanic"
  ];
  const smokerOptions = [
    "Never smoked",
    "Former smoker",
    "Current smoker - now smokes some days",
    "Current smoker - now smokes every day"
  ];

  let showRiskMeter = false;

  let formData = {
    username: '',
    age: null,
    sex: '',
    race: '',
    exercisePerWeek: null,
    sleepHours: null,
    smokerStatus: '',
    bmi: null,
    hasDiabetes: false,
    state: ''
  };

  function submitForm() {
    const {
      username, age, sex, race,
      exercisePerWeek, sleepHours, smokerStatus,
      bmi, state
    } = formData;

    if (
      !username ||
      !age ||
      !sex ||
      !race ||
      exercisePerWeek === null ||
      sleepHours === null ||
      !smokerStatus ||
      !bmi ||
      !state
    ) {
      alert("Please fill out all required fields.");
      return;
    }

    showRiskMeter = true;
  }

  function handleTryAgain() {
    showRiskMeter = false;
  }
</script>

{#if !showRiskMeter}
  <div class="form-container">
    <div class="form-grid">

      <div>
        <label>Name *</label>
        <input bind:value={formData.username} placeholder="Enter name" />
      </div>

      <div>
        <label>Age *</label>
        <input type="number" bind:value={formData.age} min="1" />
      </div>

      <div>
        <label>Sex *</label>
        <select bind:value={formData.sex}>
          <option value="" disabled selected>Select sex</option>
          {#each sexOptions as sex}
            <option value={sex}>{sex}</option>
          {/each}
        </select>
      </div>

      <div>
        <label>Race *</label>
        <select bind:value={formData.race}>
          <option value="" disabled selected>Select race</option>
          {#each races as race}
            <option value={race}>{race}</option>
          {/each}
        </select>
      </div>

      <div>
        <label>Hours of Exercise per Week *</label>
        <input type="number" bind:value={formData.exercisePerWeek} min="0" />
      </div>

      <div>
        <label>Hours of Sleep per Day *</label>
        <input type="number" bind:value={formData.sleepHours} min="0" step="0.1" />
      </div>

      <div>
        <label>Smoker Status *</label>
        <select bind:value={formData.smokerStatus}>
          <option value="" disabled selected>Select status</option>
          {#each smokerOptions as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
      </div>

      <div>
        <label>BMI *</label>
        <input type="number" bind:value={formData.bmi} min="10" max="60" step="0.1" />
      </div>

      <div>
        <label>Diagnosed with Diabetes</label>
        <input type="checkbox" bind:checked={formData.hasDiabetes} />
      </div>

      <div>
        <label>State *</label>
        <input bind:value={formData.state} placeholder="e.g. MN" />
      </div>

    </div>

    <button on:click={submitForm}>Submit</button>
  </div>
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

<style>
  .form-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    background: #f7f7f7;
    border-radius: 12px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: 600;
  }

  input, select {
    width: 100%;
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid #ccc;
  }

  button {
    margin-top: 1.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    background: #3b82f6;
    color: white;
    font-weight: 600;
    cursor: pointer;
  }
</style>
