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
with open('RF_PEC_feature_scores.csv', 'r') as file:
    reader = csv.DictReader(file, delimiter=',')  # Assuming the delimiter is a tab
    for row in reader:
        # Insert each row's data into the PostgreSQL table
        feature_name = row['All_Data']  # First column represents the feature name
        partition_average = float(row['Partition_Average'])
        print(feature_name, partition_average)# Last column represents the partition average
        cur.execute(
            "INSERT INTO protein_features_rf_2 (feature_name, partition_average) VALUES (%s, %s)",
            (feature_name, partition_average)
        )
print("Hello")
# Commit the transaction and close the connection
conn.commit()
cur.close()
conn.close()
