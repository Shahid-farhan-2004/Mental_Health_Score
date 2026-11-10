# Student Social Media & Mental Health Score Prediction

A machine learning project that predicts a student's **Mental Health Score** from their social media habits, sleep, study time, physical activity, and demographics. It covers the full workflow: data exploration, cleaning, preprocessing pipelines, model comparison, hyperparameter tuning, and model export.


## Overview

| | |
|---|---|
| **Task** | Regression (predict `Mental_Health_Score`) |
| **Dataset** | Student Social Media And Mental Health Impact (5,000 rows, 13 columns) |
| **Models** | Linear Regression, Random Forest, Random Forest (tuned) |
| **Best test R²** | 0.89 (Random Forest) |
| **Output** | Saved scikit-learn pipeline (`.pkl`) via `joblib` |

---

## Dataset

The data has 5,000 student records with no missing values.

| Feature | Type | Description |
|---|---|---|
| `Age` | Numeric | Student age (18–24) |
| `Gender` | Categorical | Male / Female |
| `Country` | Categorical | Student's country |
| `Academic_Level` | Categorical | High School / Undergraduate / Graduate |
| `Most_Used_Platform` | Categorical | Instagram, TikTok, Facebook, LinkedIn, YouTube, etc. |
| `Purpose_Of_Use` | Categorical | Entertainment, Education, Networking, etc. |
| `Avg_Daily_Usage_Hours` | Numeric | Average hours on social media per day |
| `Daily_Unlocks` | Numeric | Phone unlocks per day |
| `Study_Hours` | Numeric | Daily study hours |
| `Physical_Activity_Hours` | Numeric | Daily physical activity hours |
| `Sleep_Hours_Per_Night` | Numeric | Average nightly sleep |
| `Stress_Level` | Ordinal | Low < Medium < High < Very High |
| `Mental_Health_Score` | Numeric (target) | Score from roughly 3.6 to 9.4 |

---

## Workflow

### 1. Exploratory Data Analysis
- Checked nulls, duplicates, data types, and summary statistics
- Plotted the distribution of the target variable
- Correlation heatmap of numeric features
- Boxplot of mental health score by stress level
- Scatter plots of mental health score against daily usage hours and sleep hours
- Platform popularity count plot (Instagram and TikTok are the most common)

### 2. Data Cleaning & Feature Engineering
- Detected outliers with the IQR method
- Clipped negative `Physical_Activity_Hours` values to 0
- Checked skewness of numeric columns; `Study_Hours` was the most skewed
- Grouped `Country` into the **top 10 countries + "other"** (`Grouped_Country`) to limit one-hot encoding dimensionality

### 3. Preprocessing Pipeline
A `ColumnTransformer` applies a different pipeline to each feature group:

| Feature group | Columns | Transformation |
|---|---|---|
| Skewed numeric | `Study_Hours` | `log1p` → `StandardScaler` |
| Other numeric | Age, usage hours, unlocks, activity, sleep | `StandardScaler` |
| Ordinal | `Stress_Level` | `OrdinalEncoder` |
| Nominal | Gender, academic level, platform, purpose, country | `OneHotEncoder(handle_unknown="ignore")` |

Using scikit-learn `Pipeline` objects keeps preprocessing and the model together, which prevents data leakage and makes the exported model easy to reuse.

### 4. Modelling
- 70/30 train-test split (`random_state=42`)
- Trained a **Linear Regression** baseline and a **Random Forest Regressor**
- Tuned the Random Forest with `RandomizedSearchCV` (5-fold CV, scoring on R²) over `n_estimators`, `max_depth`, `min_samples_split`, and `min_samples_leaf`

---

## Results

| Model | R² (test) | R² (train) | MAE | RMSE |
|---|---|---|---|---|
| Linear Regression | 0.755 | 0.720 | 0.515 | 0.651 |
| Random Forest | **0.891** | 0.983 | **0.324** | **0.434** |
| Random Forest (tuned) | 0.857 | 0.912 | 0.381 | 0.498 |

**Takeaways**
- Random Forest clearly beats the linear baseline, which suggests non-linear relationships between lifestyle factors and mental health score.
- The untuned Random Forest has the best test metrics but a large train/test gap (0.98 vs 0.89), a sign of overfitting.
- The tuned model gives up some test accuracy in exchange for a smaller train/test gap (0.91 vs 0.86), so it is the one exported as the final model.

---

## Getting Started

### Requirements

```bash
pip install numpy pandas matplotlib seaborn scikit-learn joblib
```

### Run the notebook

1. Download the dataset (`Student Social Media And Mental Health Impact.csv`) and place it next to the notebook.
2. Open `Mental_Health_Model.ipynb` in Jupyter or Google Colab.
3. Run all cells.

### Use the saved model

```python
import joblib
import pandas as pd

model = joblib.load("mental_health_model.pkl")

sample = pd.DataFrame([{
    "Study_Hours": 3.5,
    "Age": 21,
    "Avg_Daily_Usage_Hours": 5.0,
    "Daily_Unlocks": 170,
    "Physical_Activity_Hours": 1.5,
    "Sleep_Hours_Per_Night": 6.5,
    "Stress_Level": "Medium",
    "Gender": "Female",
    "Academic_Level": "Undergraduate",
    "Most_Used_Platform": "Instagram",
    "Purpose_Of_Use": "Entertainment",
    "Grouped_Country": "India",   # top-10 country name, otherwise "other"
}])

print(model.predict(sample))
```

> **Note:** `Grouped_Country` must be built the same way as in the notebook: keep the 10 most frequent countries from the training data, and label everything else `"other"`.

---

## Project Structure

```
├── Mental_Health_Model.ipynb      # Full analysis and modelling notebook
├── mental_health_model.pkl        # Exported tuned Random Forest pipeline
├── screenshots/                   # App screenshots used in this README
└── README.md
```

---

## Tech Stack

Python · pandas · NumPy · Matplotlib · Seaborn · scikit-learn · joblib

---

## Future Improvements

- Add feature importance analysis to show which habits influence the score most
- Try gradient boosting models (XGBoost / LightGBM) and compare
- Use a narrower, more regularised hyperparameter search to reduce overfitting
- Wrap the model in a small Streamlit or FastAPI app for live predictions

---

## Disclaimer

This project is for educational purposes. Predictions come from a statistical model trained on a specific dataset and are **not** a medical or psychological assessment.

---

## Author

**Shahid Farhan**
B.Tech Computer Science student
(https://github.com/Shahid-farhan-2004)
