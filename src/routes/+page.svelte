<script lang="ts">
  import { onMount } from "svelte";
  import type { Person, State, Mortality, Income, Top5 } from "../types";
  import { loadTop5Csv, loadIncomeCSV, loadMortality, loadKaggleCsv, loadNHGISCsv } from "../dataLoaders";
  import '../app.css';

  // Reactive variable for storing the data
  let people: Person[] = [];
  let state: State[] = []
  let cause_Of_Death: Top5[] = [];
  let mortalityRate: Mortality[] = [];
  let income: Income[] = [];

 onMount(async () => {
    // Load all data in parallel
    [cause_Of_Death, income, mortalityRate, people, state] = await Promise.all([
      loadTop5Csv(),
      loadIncomeCSV(),
      loadMortality(),
      loadKaggleCsv(),
      loadNHGISCsv()
    ]);
  });
</script>


<div class="container">
    <header>
        <h1>WHAT SHAPES OUR HEARTS?</h1>
        
        <p>Here are {people.length == 0 ? "..." : people.length + " "} [people]</p>
        <p>Here are {state.length == 0 ? "..." : state.length + " "} [state]</p>
        <p>Here are {mortalityRate.length == 0 ? "..." : mortalityRate.length + " "} [mortality]</p>
        <p>Here are {income.length == 0 ? "..." : income.length + " "} [income]</p>
        <p>Here are {cause_Of_Death.length == 0 ? "..." : cause_Of_Death.length + " "} [cause_Of_Death]</p>
    </header>

    <!-- Leading Causes Section -->
    <section id="deathCauseSection">
      <p>Heart Disease has been the leading cause of death in the U.S. for the last decade.</p>
        <div class="viz-placeholder">
            <h4>📊 Top 10 Leading Causes of Death in the U.S.</h4>
            <p>Bar chart or horizontal stacked visualization showing heart disease at #1, followed by cancer, COVID-19, accidents, stroke, etc.</p>
        </div>
    </section>

    <p>
      We looked at data on 
      <a href="#lifestyleSection">lifestyle</a>,
      <a href="#demographicSection">demographics</a>, and
      <a href="#locationSection">location</a>
      to see what really connects to heart disease across the U.S.
    </p>

    <!-- How We Live Section -->
    <section id="lifestyleSection">
        <h2>How We Live: Do Our Habits Matter?</h2>
        <p>Exercise, food, smoking, sleep – we all know they count, but how much?</p>
        
        <div class="viz-placeholder">
            <h4>📈 Lifestyle Factors & Heart Disease Risk</h4>
            <p>Interactive visualization showing correlation between lifestyle factors (exercise frequency, diet quality, smoking status, sleep hours) and heart disease rates. Could be scatter plots, connected dot plots, or small multiples.</p>
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
            <p>Gauge or meter visualization comparing Sarah's risk to national averages. Shows percentage reduction in risk based on her healthy habits.</p>
            <p><strong>Finding:</strong> People with habits like Sarah's have about 35% lower risk than the national average.</p>
        </div>
    </section>

    <!-- Who We Are Section -->
    <section id="demographicSection">
        <h2>Who We Are: Does Age or Background Change the Odds?</h2>
        <p>Let's see how things shift by age, gender, and race.</p>
        
        <div class="viz-placeholder">
            <h4>📊 Heart Disease Risk by Demographics</h4>
            <p>Set of visualizations showing:<br>
            • Age curves (risk increasing with age)<br>
            • Gender comparison (male vs. female rates)<br>
            • Racial/ethnic disparities in heart disease mortality rates</p>
        </div>

        <div class="person-card">
            <h4>Meet James, 68</h4>
            <div class="details">
                <p><strong>Age:</strong> 68 years old</p>
                <p><strong>Gender:</strong> Male</p>
                <p><strong>Race:</strong> Black/African American</p>
                <p><strong>Family History:</strong> Father had heart attack at 62</p>
            </div>
        </div>

        <div class="viz-placeholder">
            <h4>⚠️ James's Risk Profile</h4>
            <p>Visualization showing elevated risk factors. Comparison of James's demographic risk factors vs. population average.</p>
            <p><strong>Finding:</strong> People like James face higher risk due to age demographics and genetic factors, with rates 1.5x higher than younger populations.</p>
        </div>
    </section>

    <!-- Where We Live Section -->
    <section id="locationSection">
        <h2>Where We Live: Does Your State Make a Difference?</h2>
        <p>Heart health looks different in different corners of the country.</p>
        
        <div class="viz-placeholder">
            <h4>🗺️ Heart Disease Mortality by State</h4>
            <p>Choropleth map of the United States showing heart disease death rates per 100,000 by state. Southern states (Mississippi, Alabama, Oklahoma, Louisiana) highlighted in darker reds; Western/Northern states (Minnesota, Colorado, Hawaii, Massachusetts) in lighter shades.</p>
        </div>

        <div class="person-card">
            <h4>Meet Maria, 52</h4>
            <div class="details">
                <p><strong>Location:</strong> Rural Mississippi</p>
                <p><strong>Healthcare Access:</strong> 45 minutes to nearest cardiac center</p>
                <p><strong>Environment:</strong> Limited access to fresh produce, few exercise facilities</p>
                <p><strong>Lifestyle:</strong> Sedentary job, high-stress</p>
            </div>
        </div>

        <div class="viz-placeholder">
            <h4>📍 Maria's Geographic Risk</h4>
            <p>Visualization comparing heart disease rates in Maria's state vs. national average, with breakdown of contributing factors (healthcare access, food environment, built environment for physical activity).</p>
            <p><strong>Finding:</strong> Maria's story mirrors what the data show: both access to healthcare and lifestyle factors shaped by location matter significantly.</p>
        </div>
    </section>

    <!-- Interactive Section -->
    <section>
        <h2>What If They Changed a Few Things?</h2>
        <p>A few small changes can make a big difference. See how modifying lifestyle factors could impact risk.</p>
        
        <div class="viz-placeholder">
            <h4>🎛️ Risk Calculator</h4>
            <p>Interactive tool with sliders/toggles to adjust:<br>
            • Exercise frequency (0-7 days/week)<br>
            • Smoking status (current/former/never)<br>
            • Diet quality (poor/fair/good/excellent)<br>
            • Sleep hours (4-10 hours)<br>
            • BMI range<br><br>
            Real-time risk score updates as user adjusts factors, showing percentage change from baseline.</p>
        </div>
    </section>

    <!-- What We Learned Section -->
    <section class="key-findings">
        <h3>What We Learned</h3>
        <ol>
            <li><strong>Lifestyle is huge:</strong> Exercise and diet quality are among the most powerful modifiable factors, with regular physical activity and healthy eating patterns associated with 30-40% risk reduction.</li>
            
            <li><strong>Demographics matter:</strong> Age, gender, and race all shape risk in significant ways. Men face higher rates than women until older age, and certain racial/ethnic groups experience disproportionately higher rates due to a complex mix of genetic, social, and healthcare access factors.</li>
            
            <li><strong>Where you live can tilt the odds:</strong> Geographic location matters beyond individual choices. States with lower heart disease rates tend to have better healthcare infrastructure, more walkable communities, and greater access to healthy food options.</li>
        </ol>
    </section>

    <section>
        <h2>The Bottom Line</h2>
        <p>Heart health is complex, shaped by a web of factors from our daily habits to where we were born. But data helps us see what we can actually control.</p>
        
        <p>While we can't change our age, family history, or easily relocate, we <em>can</em> modify our lifestyle choices. The evidence is clear: regular exercise, nutritious eating, adequate sleep, and avoiding smoking make a substantial difference.</p>
        
        <p>Understanding these patterns isn't just about statistics—it's about empowering each of us to make informed choices that can add years to our lives and life to our years.</p>
    </section>

    <footer>
        <p>Data sources: CDC National Vital Statistics System, American Heart Association, National Health Interview Survey</p>
        <p>An interactive data story exploring heart disease risk factors across America</p>
    </footer>
</div>

