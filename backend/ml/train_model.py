import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os

# Load dataset
df = pd.read_csv('ml/diseases_dataset.csv')

# Get all unique symptoms
all_symptoms = set()
symptom_cols = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5']
for col in symptom_cols:
    all_symptoms.update(df[col].dropna().unique())
all_symptoms = sorted(list(all_symptoms))

# Create feature matrix
def encode_symptoms(row):
    vector = [0] * len(all_symptoms)
    for col in symptom_cols:
        if row[col] in all_symptoms:
            vector[all_symptoms.index(row[col])] = 1
    return vector

X = np.array([encode_symptoms(row) for _, row in df.iterrows()])
y = df['disease'].values

# Encode labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# Train model
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Accuracy
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy * 100:.2f}%")

# Save model and symptoms list
joblib.dump(model, 'ml/disease_model.pkl')
joblib.dump(le, 'ml/label_encoder.pkl')
joblib.dump(all_symptoms, 'ml/symptoms_list.pkl')

print("Model saved successfully!")
print(f"Total diseases: {len(le.classes_)}")
print(f"Total symptoms: {len(all_symptoms)}")