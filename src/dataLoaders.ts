import * as d3 from "d3";
import type { Person, StateData, Top5 } from "./types";

export async function loadTop5Csv(): Promise<Top5[]> {
  try {
    const csvUrl = "./Cause_of_death_2017-2022.csv";
    const data = await d3.csv(csvUrl, (row) => {
      return {
        Causes: (row["Cause"]).trim(),
        2017: Number(row["2017"]),
        2018: Number(row["2018"]),
        2019: Number(row["2019"]),
        2020: Number(row["2020"]),
        2021: Number(row["2021"]),
        2022: Number(row["2022"]),
      };
    });
    console.log("Loaded CSV Top 5 Data:", data);
    return data;
  } catch (error) {
    console.error("Error loading Top 5 CSV:", error);
    return [];
  }
}

export async function loadKaggleCsv(): Promise<Person[]> {
  try {
    const csvUrl = "./subset_transformed_heart_data.csv"; //changed this to the smaller subset
    const data = await d3.csv(csvUrl, (row) => {
      return {
        State: row.State.trim(),
        Sex: Number(row.Sex),
        SleepHours: Number(row.SleepHours),
        HadHeartAttack: Number(row.HadHeartAttack),
        HadAngina: Number(row.HadAngina),
        HadStroke: Number(row.HadStroke),
        HadCOPD: Number(row.HadCOPD),
        CovidPos: Number(row.CovidPos),
        AlcoholDrinkers: Number(row.AlcoholDrinkers),
        HadDiabetes: Number(row.HadDiabetes),
        HadDepressiveDisorder: Number(row.HadDepressiveDisorder),
        SmokerStatus: Number(row.SmokerStatus),
        ECigaretteUsage: Number(row.ECigaretteUsage),
        AgeCategory: Number(row.AgeCategory),
        RaceEthnicityCategory: Number(row.RaceEthnicityCategory),
        BMI: Number(row.BMI),
        WeightInKilograms: Number(row.WeightInKilograms),
        HeightInMeters: Number(row.HeightInMeters),
        HeartDisease: Number(row.HeartDisease),
      };
    });
    console.log("Loaded Kaggle CSV Data:", data);
    return data;
  } catch (error) {
    console.error("Error loading Kaggle CSV:", error);
    return [];
  }
}
export async function loadStateData(): Promise<StateData[]>  {
    try {
      const csvUrl = "/State_Data.csv";
      const data = await d3.csv(csvUrl, (row) => {
        // TIP: in row, all values are strings, so we need to use a row conversion function here to format them
        return {
          StateCode: Number(row.StateCode),
          StateAbv: row.StateAbbrev.trim(),
          IncMedian2022: Number(row.Median2022),
          IncError2022: Number(row.Error2022),
          IncMedian202224: Number(row.Median202224),
          IncError202224: Number(row.Error202224), 
          MortalityRate: Number(row.RATE),
          DeathCount: Number(row.DEATHS),
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
        };
      });

      console.log("Loaded state Data:", data);
      return data;
    } catch (error) {
      console.error("Error loading state data CSV:", error);
    }
  }