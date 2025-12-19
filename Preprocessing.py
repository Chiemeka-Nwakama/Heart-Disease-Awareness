import pandas as pd

# Load the cleaned data
df = pd.read_csv('cleaned_heart_data.csv')
print(df['SmokerStatus'].unique())
# Map 'Sex' column: Female -> 0, Male -> 1
df['Sex'] = df['Sex'].map({'Female': 0, 'Male': 1})

# Map all 'Yes'/'No' columns to 1/0
yes_no_columns = ['HadDepressiveDisorder', 'HadHeartAttack', 'HadAngina', 'HadStroke', 'HadCOPD', 'AlcoholDrinkers']
for col in yes_no_columns:
    if col in df.columns:
        df[col] = df[col].map({'Yes': 1, 'No': 0})

# Map 'SmokerStatus' to 0, 1, 2, 3
df['SmokerStatus'] = df['SmokerStatus'].map({
    'Never smoked': 0,
    'Former smoker': 1,
    'Current smoker - now smokes some days': 2,
    'Current smoker - now smokes every day': 3
})

df['HadDiabetes'] = df['HadDiabetes'].map({
    'No': 0,
    'Yes': 1,
    'No, pre-diabetes or borderline diabetes': 2,
    'Yes, but only during pregnancy (female)': 3
})

df['ECigaretteUsage'] = df['ECigaretteUsage'].map({
    'Never used e-cigarettes in my entire life': 0,
    'Not at all (right now)': 1,
    'Use them every day': 2,
    'Use them some days': 3
})

df['RaceEthnicityCategory'] = df['RaceEthnicityCategory'].map({
    'White only, Non-Hispanic' : 0,
    'Black only, Non-Hispanic' : 1,
    'Other race only, Non-Hispanic' : 2,
    'Multiracial, Non-Hispanic' : 3,
    'Hispanic' : 4
})

df['AgeCategory'] = df['AgeCategory'].map({
    "Age 18 to 24" : 0,
    "Age 25 to 29" : 1,
    "Age 30 to 34" : 2,
    "Age 35 to 39" : 3,
    "Age 40 to 44" : 4,
    "Age 45 to 49" : 5,
    "Age 50 to 54" : 6,
    "Age 55 to 59" : 7,
    "Age 60 to 64" : 8,
    "Age 65 to 69" : 9,
    "Age 70 to 74" : 10,
    "Age 75 to 79" : 11,
    "Age 80 or older" : 12
})

df['CovidPos'] = df['CovidPos'].map({
    'Yes': 1,
    'Tested positive using home test without a health professional': 1,
    'No': 0
})
# Save the transformed DataFrame
df.to_csv('transformed_heart_data_to_numerical.csv', index=False)
