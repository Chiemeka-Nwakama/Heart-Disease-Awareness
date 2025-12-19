# The State of Our Hearts  
### Exploring Heart Disease Risk Factors in the United States

**Live Project:**  
https://chiemeka-nwakama.github.io/Heart-Disease-Awareness/

**Authors:**  
Chiemeka Nwakama, Julia Christenson, Lily Li, Ibrahim Ismail-Adebiyi, Emmanuel Mongare

---

## Overview
Heart disease is the leading cause of death in the United States and globally. Despite its prevalence, the relationships between lifestyle, demographic, geographic, and socioeconomic factors are often difficult to interpret. The goal of this project was to explore these relationships and communicate them through an interactive, data-driven website.

Using a combination of individual-level survey data and aggregated state-level datasets, we created multiple interactive visualizations that allow users to explore trends, correlations, and disparities related to heart disease outcomes across the U.S. :contentReference[oaicite:0]{index=0}

---

## Research Questions
This project focuses on three guiding questions:

1. How do lifestyle factors correlate with heart disease prevalence?
2. Do demographic factors influence the likelihood of a heart disease diagnosis?
3. Which U.S. states have the highest and lowest heart disease death rates, and what socioeconomic factors may contribute to these patterns?

---

## Data Sources
We combined microdata and aggregate data to provide both individual-level and population-level perspectives:

- **Indicators of Heart Disease (2022 Update)** – Kaggle / CDC survey data (400,000+ respondents)
- **CDC Heart Disease Deaths by State (2014–2023)**
- **U.S. Census Bureau Median Household Income by State (1984–2024)**
- **IPUMS NHGIS (2022)**  
  - Educational attainment (population 25+)  
  - Employment status (population 16+)  
  - Health insurance coverage by age
- **National Vital Statistics System** – U.S. Leading Causes of Death (2017–2022)

---

## Data Preparation & Analysis
- Removed rows containing null values and selected relevant variables for analysis
- Defined an individual as heart-disease positive if they reported angina, stroke, or heart attack
- Subset large datasets to focus on key demographic, lifestyle, and health variables
- Aggregated and merged state-level datasets for efficient visualization
- Conducted exploratory data analysis using Excel, Python, and Jupyter Notebooks
- Used randomized subsampling for large datasets to improve performance and site load times :contentReference[oaicite:1]{index=1}

---

## Key Visualizations

### Top Causes of Death: Line Chart
A scrolly-driven line chart shows the top 12 causes of death in the U.S. from 2017–2022. Tooltips display cause rankings and death counts for each year. Missing values are shown as zero and clearly labeled as “zero reported deaths,” not an absence of mortality. A dynamic card highlights the top cause of death each year, which is consistently heart disease.

### Demographic Variables: Heatmap & Pie Charts
We explored demographic distributions and socioeconomic correlations using:
- Heatmaps comparing state-level mortality rates and median household income
- Pie charts showing race/ethnicity and gender distributions within the heart disease dataset  
To reduce loading time, demographic summaries were precomputed and passed directly to the visualizations.

### Geographic Factors: Bivariate Choropleth Map
A bivariate choropleth map displays both heart disease mortality rates and total deaths by state. This visualization distinguishes between states with high death counts due to population size and states with disproportionately high mortality rates despite smaller populations.

### Risk Calculator: Predictive Linear Regression Model
The project includes an interactive heart disease risk calculator powered by a predictive linear regression model developed by our team. The model was trained using aggregated demographic and lifestyle variables derived from CDC-based heart disease data, including factors such as age, BMI, smoking status, and diabetes.

The regression model estimates an individual’s relative heart disease risk by comparing user inputs to national averages across similar demographic groups. The calculator is intended as an educational and explanatory tool rather than a clinical diagnostic system. Its purpose is to help users understand how controllable lifestyle factors contribute to cardiovascular risk.

Model outputs are visualized using a radial gauge, allowing abstract regression results to be translated into an intuitive and interpretable format. This design reinforces the project’s goal of making complex statistical concepts accessible to a general audience :contentReference[oaicite:2]{index=2}.

### Correlations: Scatterplots
Interactive scatterplots examine relationships between state-level lifestyle indicators and heart disease outcomes. Each plot includes a fitted trend line and displays correlation values, enabling users to assess both the direction and strength of associations between variables.

---

## Design Decisions
- Replaced complex visual forms (e.g., sunburst diagrams) with clearer alternatives such as heatmaps
- Added interactivity to all visualizations to improve user engagement and exploratory analysis
- Precomputed metrics to reduce data loading times and improve performance
- Introduced personas to ground abstract statistics in relatable real-world examples
- Broke a broad research question into smaller, focused questions to improve clarity and narrative flow :contentReference[oaicite:3]{index=3}

---

## Limitations & Future Work
- Analysis is limited to the United States and selected years
- The risk calculator uses a simplified linear regression model and does not account for genetic or clinical variables
- Future work could expand the temporal range, incorporate additional geographic regions, and use more advanced predictive modeling techniques

---

## Conclusion
This project demonstrates how lifestyle, demographic, geographic, and socioeconomic factors interact to influence heart disease outcomes in the United States. Through interactive visualizations and a predictive risk model, the project emphasizes transparent, data-driven storytelling and highlights the importance of thoughtful data analysis and visualization in public health communication :contentReference[oaicite:4]{index=4}.

---

## References

### Datasets
- Indicators of Heart Disease (Kaggle / CDC)
- CDC Heart Disease Deaths by State (2014–2023)
- U.S. Census Bureau Median Household Income
- IPUMS NHGIS (2022)
- National Vital Statistics System: Leading Causes of Death (2017–2022)

### Literature & Resources
- American Heart Association
- Cleveland Clinic
- Johns Hopkins Medicine
- CDC: Diabetes and Heart Disease
