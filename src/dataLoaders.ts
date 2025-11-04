import * as d3 from "d3";
import type { Person, State, Mortality, Income, Top5 } from "./types";

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

export async function loadIncomeCSV(): Promise<Income[]> {
  try {
    const csvUrl = "./Income.csv";
    const data = await d3.csv(csvUrl, (row) => {
      return {
        State: row.State.trim(),
        Median2022: Number(row.Median2022),
        Error2022: Number(row.Error2022),
        Median202224: Number(row.Median202224),
        Error202224: Number(row.Error202224),
      };
    });
    console.log("Loaded Income Data:", data);
    return data;
  } catch (error) {
    console.error("Error loading Income CSV:", error);
    return [];
  }
}

export async function loadMortality(): Promise<Mortality[]> {
  try {
    const csvUrl = "./mortality.csv";
    const data = await d3.csv(csvUrl, (row) => {
      return {
        State: row.STATE.trim(),
        Rate: Number(row.RATE),
        Deaths: Number(row.DEATHS),
      };
    });
    console.log("Loaded Mortality CSV Data:", data);
    return data;
  } catch (error) {
    console.error("Error loading Mortality CSV:", error);
    return [];
  }
}

export async function loadKaggleCsv(): Promise<Person[]> {
  try {
    const csvUrl = "./transformed_heart_data_to_numerical.csv";
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
      };
    });
    console.log("Loaded Kaggle CSV Data:", data);
    return data;
  } catch (error) {
    console.error("Error loading Kaggle CSV:", error);
    return [];
  }
}

export async function loadNHGISCsv(): Promise<State[]> {
  try {
    const csvUrl = "./NHGIS_STATE_DATA.csv";
    const data = await d3.csv(csvUrl, (row) => {
      return {
        StateCode: Number(row.StateCode),
        StateAbv: row.StateAbbrev?.trim() || "",
        StateName: row.StateName?.trim() || "",
        TotalSchool: Number(row.TotalSchooling) || 0,
        NoSchool: Number(row.NoSchooling) || 0,
        ElemSchool: Number(row.ElemSchool) || 0,
        MidSchool: Number(row.MidSchool) || 0,
        SomeHigh: Number(row.SomeHigh) || 0,
        DiplomaGED: Number(row.HighSchoolDiplomaGED) || 0,
        SomeColl: Number(row.SomeCollege) || 0,
        Assoc: Number(row.Associates) || 0,
        Bach: Number(row.Bachelors) || 0,
        Masters: Number(row.ProfessionalMaster) || 0,
        Doctorate: Number(row.Doctorate) || 0,
        TotalLaborForce: Number(row.TotalLaborForce) || 0,
        CivEMP: Number(row.InLaborForceCivEmployed) || 0,
        CivUNEMP: Number(row.InLaborForceCivUnemployed) || 0,
        ArmyEMP: Number(row.InLaborForceArmedForces) || 0,
        NotInForce: Number(row.NotInLaborLorce) || 0,
        Total_Insured: Number(row.TotalAbove19Insurance) || 0,
        F19To34: Number(row.F19to34Years) || 0,
        F19To34Single: Number(row.F19to34YearsWithOneInsurance) || 0,
        F19To34Dual: Number(row.F19to34YearsWithTwoPlusInsurance) || 0,
        F19To34None: Number(row.F19to34YearsWithNoInsurance) || 0,
        F35To64: Number(row.F35to64Years) || 0,
        F35To64Single: Number(row.F35to64YearsWithOneInsurance) || 0,
        F35To64Dual: Number(row.F35to64YearsWithTwoPlusInsurance) || 0,
        F35To64None: Number(row.F35to64YearsWithNoInsurance) || 0,
        F65Up: Number(row.F65Up) || 0,
        F65UpSingle: Number(row.F65UpWithOneInsurance) || 0,
        F65UpDual: Number(row.F65UpWithTwoPlusInsurance) || 0,
        F65UpNone: Number(row.F65UpWithNoInsurance) || 0,
      };
    });
    console.log("Loaded NHGIS Data:", data);
    return data;
  } catch (error) {
    console.error("Error loading NHGIS CSV:", error);
    return [];
  }
}