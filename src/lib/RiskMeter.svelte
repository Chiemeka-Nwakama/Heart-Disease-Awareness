<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from "svelte";
  import * as d3 from 'd3'; 
  
  // Props for user profile
  export let userName = "";
  export let age = 45;
  export let sex = "Female"; // "Female" or "Male"
  export let race = "White only, Non-Hispanic"; // Match your data categories
  export let exercisePerWeek = 4;
  export let sleepHours = 7.5;
  export let smokerStatus = "Never smoked";
  export let bmi = 23.5;
  export let hasDiabetes = false;
  export let state = ""; // Optional: specific state or leave empty for national
  export let tryAgain = false;
  
  // Data and calculations
  let loading = true;
  let error: string | null = null;
  let userRisk = 0;
  let nationalAverage = 0;
  let riskReduction = 0;
  let animatedUserRisk = 0;
  let animatedNationalRisk = 0;
  
  // Type definition for cleaned data rows
  interface ProcessedRow {
    [key: string]: any;
    Sex: number;
    AgeCategory: number;
    RaceEthnicityCategory: number;
    Prevalence_HadHeartAttack: number;
    Prevalence_HadDiabetes: number;
    Avg_SleepHours: number;
    Avg_SmokerStatus_Score: number;
    Avg_BMI: number;
  }
  
  // Map inputs to data format
  function getAgeCategory(age: number): number {
    if (age >= 18 && age <= 24) return 0;
    if (age >= 25 && age <= 29) return 1;
    if (age >= 30 && age <= 34) return 2;
    if (age >= 35 && age <= 39) return 3;
    if (age >= 40 && age <= 44) return 4;
    if (age >= 45 && age <= 49) return 5;
    if (age >= 50 && age <= 54) return 6;
    if (age >= 55 && age <= 59) return 7;
    if (age >= 60 && age <= 64) return 8;
    if (age >= 65 && age <= 69) return 9;
    if (age >= 70 && age <= 74) return 10;
    if (age >= 75 && age <= 79) return 11;
    return 12; // 80+
  }
  
  function getSexCode(sex: string): number {
    return sex === "Female" ? 0 : 1;
  }
  
  function getRaceCode(race: string): number {
    const map: { [key: string]: number } = {
      "White only, Non-Hispanic": 0,
      "Black only, Non-Hispanic": 1,
      "Other race only, Non-Hispanic": 2,
      "Multiracial, Non-Hispanic": 3,
      "Hispanic": 4
    };
    return map[race] || 0;
  }
  
  function getSmokerCode(status: string): number {
    const map: { [key: string]: number } = {
      "Never smoked": 0,
      "Former smoker": 1,
      "Current smoker - now smokes some days": 2,
      "Current smoker - now smokes every day": 3
    };
    return map[status] || 0;
  }
  
  // Load and process CSV data using d3.csv
  async function loadData() {
    try {
      // Use d3.csv to fetch and parse the data. d3 automatically parses the CSV string.
      const data = await d3.csv('./website_summary_data.csv');
      
      // Explicitly cast numeric columns to number type for calculations
      const processedData: ProcessedRow[] = data.map(row => ({
        ...row,
        Sex: parseInt(row.Sex ?? '0'),
        AgeCategory: parseInt(row.AgeCategory ?? '0'),
        RaceEthnicityCategory: parseInt(row.RaceEthnicityCategory ?? '0'),
        Prevalence_HadHeartAttack: parseFloat(row.Prevalence_HadHeartAttack ?? '0') || 0,
        Prevalence_HadDiabetes: parseFloat(row.Prevalence_HadDiabetes ?? '0') || 0,
        Avg_SleepHours: parseFloat(row.Avg_SleepHours ?? '0') || 0,
        Avg_SmokerStatus_Score: parseFloat(row.Avg_SmokerStatus_Score ?? '0') || 0,
        Avg_BMI: parseFloat(row.Avg_BMI ?? '0') || 0,
      }));
      
      calculateRisks(processedData);
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load or process data.";
      loading = false;
    }
  }
  
  function calculateRisks(processedData: ProcessedRow[]) {
    const ageCategory = getAgeCategory(age);
    const sexCode = getSexCode(sex);
    const raceCode = getRaceCode(race);
    
    // Filter for user's exact demographic group (race included)
    let userDemographic = processedData.filter(row => 
      row.Sex === sexCode &&
      row.AgeCategory === ageCategory &&
      row.RaceEthnicityCategory === raceCode &&
      (!state || row.State === state)
    );
    
    // If state filtering leaves us empty, try without state
    if (userDemographic.length === 0 && state) {
      userDemographic = processedData.filter(row => 
        row.Sex === sexCode &&
        row.AgeCategory === ageCategory &&
        row.RaceEthnicityCategory === raceCode
      );
    }
    
    if (userDemographic.length === 0) {
      // Fallback to broader match without race
      const fallback = processedData.filter(row => 
        row.Sex === sexCode &&
        row.AgeCategory === ageCategory
      );
      
      if (fallback.length > 0) {
        calculateFromGroup(fallback, processedData);
      } else {
        error = "Insufficient data for this profile";
        loading = false;
      }
      return;
    }
    
    calculateFromGroup(userDemographic, processedData);
  }
  
  function calculateFromGroup(userGroup: ProcessedRow[], allData: ProcessedRow[]) {
    // Base risk from demographic group (includes race-specific baseline)
    const baseRisk = userGroup.reduce((sum, row) => 
      sum + row.Prevalence_HadHeartAttack, 0
    ) / userGroup.length;
    
    // Calculate national average for same age/sex (across all races for fair comparison)
    const ageCategory = getAgeCategory(age);
    const sexCode = getSexCode(sex);
    const nationalGroup = allData.filter(row =>
      row.Sex === sexCode &&
      row.AgeCategory === ageCategory
    );
    
    nationalAverage = nationalGroup.reduce((sum, row) => 
      sum + row.Prevalence_HadHeartAttack, 0
    ) / nationalGroup.length;
    
    // Apply lifestyle adjustments
    let adjustedRisk = baseRisk;
    
    // Get average diabetes prevalence for this demographic
    const avgDiabetes = userGroup.reduce((sum, row) => 
      sum + row.Prevalence_HadDiabetes, 0
    ) / userGroup.length;
    
    // Diabetes adjustment (major risk factor)
    if (hasDiabetes) {
      adjustedRisk *= 2.0; // Doubles the risk
    } else if (avgDiabetes > 0.2) {
      // If user doesn't have diabetes but their demographic has high prevalence
      adjustedRisk *= 0.85; // 15% reduction for not having it
    }
    
    // Sleep adjustment (optimal: 7-8 hours)
    const avgSleep = userGroup.reduce((sum, row) => 
      sum + row.Avg_SleepHours, 0
    ) / userGroup.length;
    
    if (sleepHours >= 7 && sleepHours <= 8 && avgSleep < 7) {
      adjustedRisk *= 0.85; // 15% reduction for good sleep
    } else if (sleepHours < 6 || sleepHours > 9) {
      adjustedRisk *= 1.15; // 15% increase for poor sleep
    }
    
    // Exercise adjustment (more granular for sedentary lifestyle)
    if (exercisePerWeek === 0) {
      adjustedRisk *= 1.35; // 35% increase for completely sedentary
    } else if (exercisePerWeek === 1) {
      adjustedRisk *= 1.15; // 15% increase for minimal exercise
  	} else if (exercisePerWeek >= 4) {
      adjustedRisk *= 0.70; // 30% reduction for regular exercise
  	} else if (exercisePerWeek >= 2) {
      adjustedRisk *= 0.85; // 15% reduction for moderate exercise
  	}
  	
  	// Smoking adjustment
  	const avgSmoker = userGroup.reduce((sum, row) => 
      sum + row.Avg_SmokerStatus_Score, 0
  	) / userGroup.length;
  	
  	const smokerCode = getSmokerCode(smokerStatus);
  	if (smokerCode === 0 && avgSmoker > 0.5) {
  		adjustedRisk *= 0.75; // 25% reduction for non-smoker in smoking population
  	} else if (smokerCode === 1) {
  		adjustedRisk *= 1.25; // 25% increase for former smoker
  	} else if (smokerCode >= 2) {
  		adjustedRisk *= 1.6; // 60% increase for current smoker
  	}
  	
  	// BMI adjustment (optimal: 18.5-24.9)
  	const avgBMI = userGroup.reduce((sum, row) => 
  		sum + row.Avg_BMI, 0
  	) / userGroup.length;
  	
  	if (bmi >= 18.5 && bmi < 25) {
  		// User has healthy BMI
  		if (avgBMI >= 25) {
  			adjustedRisk *= 0.85; // 15% reduction for healthy BMI in overweight population
  		} else {
  			adjustedRisk *= 0.95; // 5% slight reduction for maintaining healthy BMI
  		}
  	} else if (bmi >= 35) {
  		adjustedRisk *= 1.5; // 50% increase for severely obese
  	} else if (bmi >= 30) {
  		adjustedRisk *= 1.35; // 35% increase for obese
  	} else if (bmi >= 25) {
  		adjustedRisk *= 1.15; // 15% increase for overweight
  	}
  	
  	userRisk = adjustedRisk;
  	riskReduction = ((nationalAverage - userRisk) / nationalAverage) * 100;
  	
  	// Animate the values
  	animateValues();
  	loading = false;
  }
  
  function animateValues() {
  	const duration = 2000;
  	const steps = 60;
  	const increment = duration / steps;
  	let currentStep = 0;
  	
  	const interval = setInterval(() => {
  		currentStep++;
  		const progress = currentStep / steps;
  		const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
  		
  		animatedUserRisk = userRisk * easeProgress;
  		animatedNationalRisk = nationalAverage * easeProgress;
  		
  		if (currentStep >= steps) {
  			clearInterval(interval);
  			animatedUserRisk = userRisk;
  			animatedNationalRisk = nationalAverage;
  		}
  	}, increment);
  }
  
  // Gauge calculation
  function getGaugeRotation(risk: number, max: number): number {
  	// Returns degrees from -90 (left) to 90 (right)
  	const percentage = Math.min(risk / max, 1);
  	return -90 + (percentage * 180);
  }

  const dispatch = createEventDispatcher();
  function handleTryAgainClick() {
		dispatch("tryAgain"); // tells parent to reset form
  }
  
  onMount(() => {
  	loadData();
  });
  
  // Determine max for gauge (use higher of national or user risk + buffer)
  $: maxRisk = Math.max(nationalAverage, userRisk) * 1.5 || 0.1;
  $: userRotation = getGaugeRotation(animatedUserRisk, maxRisk);
  $: nationalRotation = getGaugeRotation(animatedNationalRisk, maxRisk);
</script>

<div class="risk-meter-container">
  {#if tryAgain}
	<div class="try-again">
		<button class="change-values-button" on:click={handleTryAgainClick}>
			Change Values
		</button>
  	</div>
  {/if}
  
  {#if loading}
  	<div class="loading">
  		<div class="spinner"></div>
  		<p>Calculating risk profile...</p>
  	</div>
  {:else if error}
  	<div class="error">
  		<p>⚠️ {error}</p>
  	</div>
  {:else}
  	<div class="meter-header">
  		<h3>{userName}'s Heart Attack Risk</h3>
  		<p class="subtitle">Compared to the national averages for {sex.toLowerCase()}s of age {age}</p>
  	</div>
  	
	<div class="risk-two-column">
		<div class="left-col">
			<div class="gauge-container">
				<svg viewBox="0 0 200 120" class="gauge-svg">
								<path
						d="M 20 100 A 80 80 0 0 1 180 100"
						fill="none"
						stroke="#e5e7eb"
						stroke-width="20"
						stroke-linecap="round"
					/>
					
								<path
						d="M 20 100 A 80 80 0 0 1 180 100"
						fill="none"
						stroke="url(#riskGradient)"
						stroke-width="20"
						stroke-linecap="round"
					/>
					
								<defs>
						<linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
							<stop offset="50%" style="stop-color:#f59e0b;stop-opacity:1" />
							<stop offset="100%" style="stop-color:#ef4444;stop-opacity:1" />
						</linearGradient>
					</defs>
					
								<g transform="translate(100, 100)">
						<line
							x1="0"
							y1="0"
							x2="0"
							y2="-65"
							stroke="#9ca3af"
							stroke-width="2"
							stroke-dasharray="4,4"
							transform="rotate({nationalRotation})"
						/>
						<circle cx="0" cy="-65" r="4" fill="#9ca3af" transform="rotate({nationalRotation})" />
					</g>
					
								<g transform="translate(100, 100)">
						<line
							x1="0"
							y1="0"
							x2="0"
							y2="-70"
							stroke="#3b82f6"
							stroke-width="4"
							stroke-linecap="round"
							transform="rotate({userRotation})"
							class="user-needle"
						/>
						<circle cx="0" cy="0" r="6" fill="#3b82f6" />
					</g>
					
								<text x="20" y="115" font-size="10" fill="#6b7280" text-anchor="middle">Low</text>
					<text x="100" y="25" font-size="10" fill="#6b7280" text-anchor="middle">Risk</text>
					<text x="180" y="115" font-size="10" fill="#6b7280" text-anchor="middle">High</text>
				</svg>
			</div>

			<div class="risk-stats">
				<div class="stat-card user-stat">
					<div class="stat-icon">👤</div>
					<div class="stat-content">
						<div class="stat-label">Personal Risk</div>
						<div class="stat-value">{(animatedUserRisk * 100).toFixed(2)}%</div>
					</div>
				</div>
				
				<div class="stat-card national-stat">
					<div class="stat-icon">🌎</div>
					<div class="stat-content">
						<div class="stat-label">National Avg</div>
						<div class="stat-value">{(animatedNationalRisk * 100).toFixed(2)}%</div>
					</div>
				</div>
			</div>
		</div>

		<div class="right-col">
			<div class="risk-summary {riskReduction > 0 ? 'positive' : 'negative'}">
				{#if riskReduction > 0}
					<div class="summary-icon">✅</div>
					<div class="summary-text">
						<strong>Great news!</strong> Based on {userName}'s healthy habits, their risk is
						<strong>{Math.abs(riskReduction).toFixed(0)}% lower</strong> than the national average.
					</div>
				{:else}
					<div class="summary-icon">⚠️</div>
					<div class="summary-text">
						<strong>Attention needed:</strong> Current risk is
						<strong>{Math.abs(riskReduction).toFixed(0)}% higher</strong> than average. 
						Small lifestyle changes could make a big difference.
					</div>
				{/if}
			</div>

			<div class="lifestyle-factors">
				<h4>Contributing Factors:</h4>
				<div class="factors-grid">
					<div class="factor {exercisePerWeek >= 4 ? 'positive' : exercisePerWeek >= 2 ? 'neutral' : 'negative'}">
						<span class="factor-icon">🏃</span>
						<span class="factor-label">Exercise</span>
						<span class="factor-value">{exercisePerWeek}x/week</span>
					</div>
					
					<div class="factor {sleepHours >= 7 && sleepHours <= 8 ? 'positive' : 'neutral'}">
						<span class="factor-icon">😴</span>
						<span class="factor-label">Sleep</span>
						<span class="factor-value">{sleepHours}h</span>
					</div>
					
					<div class="factor {smokerStatus === 'Never smoked' ? 'positive' : 'negative'}">
						<span class="factor-icon">🚭</span>
						<span class="factor-label">Smoking</span>
						<span class="factor-value">{smokerStatus.includes('Never') ? 'Never' : smokerStatus.includes('Former') ? 'Former' : 'Yes'}</span>
					</div>
					
					<div class="factor {bmi >= 18.5 && bmi < 25 ? 'positive' : bmi >= 25 && bmi < 30 ? 'neutral' : 'negative'}">
						<span class="factor-icon">⚖️</span>
						<span class="factor-label">BMI</span>
						<span class="factor-value">{bmi.toFixed(1)}</span>
					</div>
					
					{#if hasDiabetes}
					<div class="factor negative">
						<span class="factor-icon">💉</span>
						<span class="factor-label">Diabetes</span>
						<span class="factor-value">Yes</span>
					</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
  {/if}
</div>

 <style>
  .risk-meter-container {
  	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  	border-radius: 16px;
  	padding: 2rem;
  	color: white;
  	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  	max-width: 100%;
  	margin: 0 auto;
  }
  
  .loading, .error {
  	text-align: center;
  	padding: 3rem;
  }
  
  .spinner {
  	width: 50px;
  	height: 50px;
  	border: 4px solid rgba(255, 255, 255, 0.3);
  	border-top-color: white;
  	border-radius: 50%;
  	animation: spin 1s linear infinite;
  	margin: 0 auto 1rem;
  }
  
  @keyframes spin {
  	to { transform: rotate(360deg); }
  }
  
  .meter-header {
  	text-align: center;
  	margin-bottom: 2rem;
  }
  
  .meter-header h3 {
  	margin: 0 0 0.5rem 0;
  	font-size: 1.75rem;
  	font-weight: 700;
	color: whitesmoke;
  }
  
  .subtitle {
  	margin: 0;
  	opacity: 0.9;
  	font-size: 0.95rem;
	color: whitesmoke;
  }
  
  .gauge-container {
  	background: rgba(255, 255, 255, 0.1);
  	backdrop-filter: blur(10px);
  	border-radius: 12px;
  	padding: 1.5rem;
  	margin-bottom: 1.5rem;
  }
  
  .gauge-svg {
  	width: 100%;
  	height: auto;
  	filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
  }
  
  .user-needle {
  	filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.5));
  	transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .risk-stats {
  	display: grid;
  	grid-template-columns: 1fr 1fr;
  	gap: 1rem;
  	margin-bottom: 1.5rem;
  }
  
  .stat-card {
  	background: rgba(255, 255, 255, 0.15);
  	backdrop-filter: blur(10px);
  	border-radius: 12px;
  	padding: 1.25rem;
  	display: flex;
  	align-items: center;
  	gap: 1rem;
  	transition: transform 0.2s, background 0.2s;
  }
  
  .stat-card:hover {
  	transform: translateY(-2px);
  	background: rgba(255, 255, 255, 0.2);
  }
  
  .stat-icon {
  	font-size: 2rem;
  }
  
  .stat-content {
  	flex: 1;
  }
  
  .stat-label {
  	font-size: 0.85rem;
  	opacity: 0.9;
  	margin-bottom: 0.25rem;
  }
  
  .stat-value {
  	font-size: 1.5rem;
  	font-weight: 700;
  }
  
  .risk-summary {
  	background: rgba(255, 255, 255, 0.15);
  	backdrop-filter: blur(10px);
  	border-radius: 12px;
  	padding: 1rem;
  	display: flex;
  	gap: 1rem;
  	align-items: start;
  	margin-bottom: 1.5rem;
  }
  
  .risk-summary.positive {
  	background: rgba(16, 185, 129, 0.2);
  }
  
  .risk-summary.negative {
  	background: rgba(239, 68, 68, 0.2);
  }
  
  .summary-icon {
  	font-size: 1.5rem;
  	flex-shrink: 0;
  }
  
  .summary-text {
  	line-height: 1.6;
  }
  
  .lifestyle-factors {
  	background: rgba(255, 255, 255, 0.1);
  	backdrop-filter: blur(10px);
  	border-radius: 12px;
  	padding: 1.25rem;
  }
  
  .lifestyle-factors h4 {
  	margin: 0 0 1rem 0;
  	font-size: 1.1rem;
  	font-weight: 600;
  }
  
  .factors-grid {
  	display: grid;
  	grid-template-columns: repeat(2, 1fr);
  	gap: 0.75rem;
  }
  
  .factor {
  	background: rgba(255, 255, 255, 0.1);
  	border-radius: 8px;
  	padding: 0.75rem;
  	display: flex;
  	flex-direction: column;
  	align-items: center;
  	text-align: center;
  	gap: 0.25rem;
  	transition: transform 0.2s;
  }
  
  .factor:hover {
  	transform: scale(1.05);
  }
  
  .factor.positive {
  	background: rgba(16, 185, 129, 0.2);
  	border: 2px solid rgba(16, 185, 129, 0.4);
  }
  
  .factor.neutral {
  	background: rgba(245, 158, 11, 0.2);
  	border: 2px solid rgba(245, 158, 11, 0.4);
  }
  
  .factor.negative {
  	background: rgba(239, 68, 68, 0.2);
  	border: 2px solid rgba(239, 68, 68, 0.4);
  }
  
  .factor-icon {
  	font-size: 1.5rem;
  }
  
  .factor-label {
  	font-size: 0.8rem;
  	opacity: 0.9;
  }
  
  .factor-value {
  	font-size: 0.9rem;
  	font-weight: 600;
  }
  
  .risk-two-column {
		display: grid;
		grid-template-columns: 1fr 1.3fr; /* adjust proportion as desired */
		gap: 2rem;
		align-items: stretch;
	}

	.left-col {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;

	}

	.right-col > * {
		margin-bottom: 1.25rem;
	}

	.change-values-button {
    padding: 0.6rem 1.4rem;
    background: linear-gradient(135deg, #14b8a6, #0f766e); 
    color: white;
    font-weight: 600;
    font-size: 0.95rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }

  .change-values-button:hover {
    background: linear-gradient(135deg, #0f766e, #115e59);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
  }

  .change-values-button:active {
    transform: translateY(0);
    box-shadow: 0 3px 6px rgba(0,0,0,0.1);
  }

	@media (max-width: 768px) {
		.risk-two-column {
			grid-template-columns: 1fr; /* stack on mobile */
		}
	}

  @media (max-width: 640px) {
  	.risk-meter-container {
  		padding: 1.5rem;
  	}
  	
  	.risk-stats {
  		grid-template-columns: 1fr;
  	}
  	
  	.factors-grid {
  		grid-template-columns: 1fr;
  	}
  }
</style>