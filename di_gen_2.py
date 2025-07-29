import pandas as pd
import psycopg2

# Database connection parameters
DB_HOST = 'DrugProtAI-4079.postgres.pythonanywhere-services.com'
DB_PORT = '14079'
DB_NAME = 'my_proteins_db'
DB_USER = 'super'
DB_PASS = 'strongpassword'

# Connect to PostgreSQL
conn = psycopg2.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASS,
    host=DB_HOST,
    port=DB_PORT
)
cur = conn.cursor()

# Read the CSV file
csv_file_path = 'RF_DI_druggable_2.csv'
df = pd.read_csv(csv_file_path)

# Extract relevant columns
df = df[['Protein', 'Mean_Probability']]

# Prepare the SQL query
insert_query = """
    INSERT INTO protein_prob_rf_2 (protein_id, mean_probability)
    VALUES (%s, %s);
"""

# Insert data into the table
for index, row in df.iterrows():
    cur.execute(insert_query, (row['Protein'], row['Mean_Probability']))

# Commit and close
conn.commit()
cur.close()
conn.close()

print("Data inserted successfully.")
