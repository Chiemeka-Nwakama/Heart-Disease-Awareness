<script lang="ts">
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import type { Person, State, Mortality } from "../types";
  import type {Top5} from  "../types";
  //import Bar from "../lib/Bar.svelte";
  import LineChart from "../lib/LineChart.svelte";
  //import CorrelationMatrix from "../lib/CorrelationMatrix.svelte";


  //In completing this assignment, I utilized ChatGPT for helping in assistance with the code for my line chart and correlation matrix implementations. 

  // Reactive variable for storing the data
  let people: Person[] = [];
  let state: State[] = []
  let cause_Of_Death: Top5[] = [];
  let mortalityRate: Mortality[] = [];
  // Function to loads in the top 5 death in USA 2017 - 2022
  async function loadtop5Csv() {
    try {
      const csvUrl = "./Cause_of_death_2017-2022.csv";
      cause_Of_Death = await d3.csv(csvUrl, (row) => {
        // TIP: in row, all values are strings, so we need to use a row conversion function here to format them
        return {

         
          Causes: (row["Cause"]).trim(), // causes of death
          2017: Number(row["2017"]), //2017
          2018: Number(row["2018"]), //2018
          2019: Number(row["2019"]), //2019
          2020: Number(row["2020"]), //2020      
          2021: Number(row["2021"]), //2021  
          2022: Number(row["2022"]), //2022              
        
          // ...row, // spread syntax to copy all properties from row
          // num_votes: Number(row.num_votes),
          // year: new Date(row.year),
          // please also format the values for other non-string attributes. You can check the attributes in the CSV file
        };
      });

      console.log("Loaded CSV Top 5 Data:", cause_Of_Death);
    } catch (error) {
      console.error("Error loading Top 5 CSV:", error);
    }
  }
  // Call the loader when the component mounts
  onMount(loadtop5Csv);

  async function loadMortality() {
    try {
      const csvUrl = "./mortality.csv";
      mortalityRate = await d3.csv(csvUrl, (row) => {
        // TIP: in row, all values are strings, so we need to use a row conversion function here to format them
        return {
         
          State: row.STATE.trim(), // As is
          Rate: Number(row.RATE),
          Deaths: Number(row.DEATHS),
        };
      });

      console.log("Loaded Mortality CSV Data:", mortalityRate);
    } catch (error) {
      console.error("Error loading Mortality CSV:", error);
    }
  }
  onMount(loadMortality);
  // Function to loads in the Kaggle CSV
  async function loadKaggleCsv() {
    try {
      const csvUrl = "./transformed_heart_data_to_numerical.csv";
      people = await d3.csv(csvUrl, (row) => {
        // TIP: in row, all values are strings, so we need to use a row conversion function here to format them
        return {

         
          State: row.State.trim(), // As is
          Sex: Number(row.Sex), //0 = Female,  1 = Male
          SleepHours: Number(row.SleepHours), // nunmber in Hours
          HadHeartAttack: Number(row.HadHeartAttack),// 0 = no, 1 = yes
          HadAngina: Number(row.HadAngina), // 0 = no, 1 = yes            
          HadStroke: Number(row.HadStroke),  // 0 = no, 1 = yes
          HadCOPD: Number(row.HadCOPD), // 0 = no, 1 = yes               
          CovidPos: Number(row.CovidPos),  // 0 = no, 1 = yes  
          AlcoholDrinkers: Number(row.AlcoholDrinkers), // 0 = no, 1 = yes
          HadDiabetes: Number(row.HadDiabetes), // 0 = no, 1 = yes, 2 = No, pre-diabetes or borderline diabetes, 3 = Yes, but only during pregnancy (female) 
          HadDepressiveDisorder: Number(row.HadDepressiveDisorder),   // 0 = no, 1 = yes
          SmokerStatus: Number(row.SmokerStatus), // 0 = Never Smoked, 1 = Former Smoker, 2 = Current Smoker - now smokes some days, 3 = Current Smoker - now smokes some days
          ECigaretteUsage: Number(row.ECigaretteUsage), //0 = Never used e-ciggaretes, in my entire life, 1 = Not current, 2 = Use them every day, 3 = Use them some days
          AgeCategory: Number(row.AgeCategory), // "Age 18 to 24" = 0 | "Age 25 to 29" = 1 | "Age 30 to 34" = 2 | "Age 35 to 39" = 3 | "Age 40 to 44" = 4 | "Age 45 to 49" = 5 | "Age 50 to 54" = 6 | "Age 55 to 59" = 7 | "Age 60 to 64" = 8 | "Age 65 to 69" = 9 | "Age 70 to 74" = 10 | "Age 75 to 79" = 11 | "Age 80 or older" = 12
          RaceEthnicityCategory: Number(row.RaceEthnicityCategory), // 0 = 'White only, Non-Hispanic' | 1 = 'Black only, Non-Hispanic' | 2 = 'Other race only, Non-Hispanic' | 3 = 'Multiracial, Non-Hispanic' | 4 = 'Hispanic'
          BMI: Number(row.BMI), //BMI in number
          WeightInKilograms: Number(row.WeightInKilograms), // weight in kilos
          HeightInMeters: Number(row.HeightInMeters), //height in meters


          // ...row, // spread syntax to copy all properties from row
          // num_votes: Number(row.num_votes),
          // year: new Date(row.year),
          // please also format the values for other non-string attributes. You can check the attributes in the CSV file
        };
      });

      console.log("Loaded Kaggle CSV Data:", people);
    } catch (error) {
      console.error("Error loading Kaggle CSV:", error);
    }
  }
  onMount(loadKaggleCsv);
  async function loadNHGISCsv() {
    try {
      const csvUrl = "./NHGIS_STATE_DATA.csv";
      state = await d3.csv(csvUrl, (row) => {
        // TIP: in row, all values are strings, so we need to use a row conversion function here to format them
        return {
          StateCode: Number(row.StateCode),
          StateAbv: row.StateAbbrev.trim(),
          StateName: row.StateName.trim(),
          TotalSchool: Number(row.TotalSchooling),
          NoSchool: Number(row.NoSchooling),
          ElemSchool: Number(row.ElemSchool),
          MidSchool: Number(row.MidSchool),
          SomeHigh: Number(row.SomeHigh),
          DiplomaGED: Number(row.HighSchoolDiplomaGED),
          SomeColl: Number(row.SomeCollege),
          Assoc: Number(row.Associates),
          Bach: Number(row.Bachelors),
          Masters: Number(row.ProfessionalMaster),
          Doctorate: Number(row.Doctorate),
          TotalLaborForce: Number(row.TotalLaborForce),
          CivEMP: Number(row.InLaborForceCivEmployed),
          CivUNEMP: Number(row.InLaborForceCivUnemployed),
          ArmyEMP: Number(row.InLaborForceArmedForces),
          NotInForce: Number(row.NotInLaborLorce),
          Total_Insured: Number(row.TotalAbove19Insurance),
          F19To34: Number(row.F19to34Years),
          F19To34Single: Number(row.F19to34YearsWithOneInsurance),
          F19To34Dual: Number(row.F19to34YearsWithTwoPlusInsurance),
          F19To34None: Number(row.F19to34YearsWithNoInsurance),
          F35To64: Number(row.F35to64Years),
          F35To64Single: Number(row.F35to64YearsWithOneInsurance),
          F35To64Dual: Number(row.F35to64YearsWithTwoPlusInsurance),
          F35To64None: Number(row.F35to64YearsWithNoInsurance),
          F65Up: Number(row.F65Up),
          F65UpSingle: Number(row.F65UpWithOneInsurance),
          F65UpDual: Number(row.F65UpWithTwoPlusInsurance),
          F65UpNone: Number(row.F65UpWithNoInsurance),

          // ...row, // spread syntax to copy all properties from row
          // num_votes: Number(row.num_votes),
          // year: new Date(row.year),
          // please also format the values for other non-string attributes. You can check the attributes in the CSV file
        };
      });

      console.log("Loaded NHGIS Data:", state);
    } catch (error) {
      console.error("Error loading NHGIS CSV:", error);
    }
  }
  // Call the loader when the component mounts
  onMount(loadNHGISCsv);
</script>

<h1>WHAT SHAPES OUR HEARTS?</h1>

<p>Here are {people.length == 0 ? "..." : people.length + " "} [people]</p>
<p>Here are {state.length == 0 ? "..." : state.length + " "} [state]</p>
<p>Here are {mortalityRate.length == 0 ? "..." : mortalityRate.length + " "} [mortality]</p>



<p>Here are {cause_Of_Death.length == 0 ? "..." : cause_Of_Death.length + " "} [cause_Of_Death]</p>

<!-- <Bar {movies} /> -->
<!--<Bar {movies} width={600} height={400} />-->




<!-- put final graph here for Q1-->

<!--<LineChart {movies} width={1200} height={400} />-->




<!--<CorrelationMatrix {movies} width={1200} height={800} />-->