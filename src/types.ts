export type Person = {
    State: string; // As is
    Sex: number; // 0 = Female,  1 = Male
    SleepHours: number;  // number in Hours
    HadHeartAttack: number; // 0 = no, 1 = yes
    HadAngina: number;  // 0 = no, 1 = yes            
    HadStroke: number;   // 0 = no, 1 = yes
    HadCOPD: number;  // 0 = no, 1 = yes               
    CovidPos: number;   // 0 = no, 1 = yes  
    AlcoholDrinkers: number;  // 0 = no, 1 = yes
    HadDiabetes: number;  // 0 = no, 1 = yes, 2 = No, pre-diabetes or borderline diabetes, 3 = Yes, but only during pregnancy (female) 
    HadDepressiveDisorder: number;    // 0 = no, 1 = yes
    SmokerStatus: number;  // 0 = Never Smoked, 1 = Former Smoker, 2 = Current Smoker - now smokes some days, 3 = Current Smoker - now smokes some days
    ECigaretteUsage: number;  //0 = Never used e-ciggaretes, in my entire life, 1 = Not current, 2 = Use them every day, 3 = Use them some days
    AgeCategory: number;  // "Age 18 to 24" = 0 | "Age 25 to 29" = 1 | "Age 30 to 34" = 2 | "Age 35 to 39" = 3 | "Age 40 to 44" = 4 | "Age 45 to 49" = 5 | "Age 50 to 54" = 6 | "Age 55 to 59" = 7 | "Age 60 to 64" = 8 | "Age 65 to 69" = 9 | "Age 70 to 74" = 10 | "Age 75 to 79" = 11 | "Age 80 or older" = 12
    RaceEthnicityCategory: number;  // 0 = 'White only, Non-Hispanic' | 1 = 'Black only, Non-Hispanic' | 2 = 'Other race only, Non-Hispanic' | 3 = 'Multiracial, Non-Hispanic' | 4 = 'Hispanic'
    BMI: number;  //BMI in number
    WeightInKilograms: number; // weight in kilos
    HeightInMeters: number; //height in meters

}

export type Top5 = {
  
    Causes: string; // cause of death - in descending order
    All: number; //all years
    2017: number; // 2017
    2018: number;  //2018
    2019: number; // 2019
    2020: number;  // 2020
    2021: number; // 2021
    2022: number; //2022         
   
}
