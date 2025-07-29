import csv
import psycopg2

# Connect to PostgreSQL
conn = psycopg2.connect(
    host="DrugProtAI-4079.postgres.pythonanywhere-services.com",
    port = "14079",
    dbname="my_proteins_db",
    user="super",
    password="strongpassword"
)
cur = conn.cursor()

# Read the CSV file
with open('XGB_PEC_feature_scores.csv', 'r') as file:
    reader = csv.DictReader(file, delimiter=',')  # Corrected delimiter to comma
    for row in reader:
        # Extract data from each row
        feature_name = row['Protein_feat']  # Use column name from the header
        partition_average = float(row['Partition_Average'])  # Use column name from the header

        # Insert data into PostgreSQL table
        cur.execute(
            "INSERT INTO protein_features_2 (feature_name, partition_average) VALUES (%s, %s)",
            (feature_name, partition_average)
        )

# Commit the transaction and close the connection
conn.commit()
cur.close()
conn.close()
