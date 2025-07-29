import csv
import psycopg2

# Connect to the PostgreSQL database
conn = psycopg2.connect(
    host="DrugProtAI-4079.postgres.pythonanywhere-services.com",
    port = "14079",
    dbname="my_proteins_db",
    user="super",
    password="strongpassword"
)
cur = conn.cursor()
print("Starting")
# Read the CSV file and insert data into the table
with open('protein_names_enriched.csv', 'r') as file:
    reader = csv.reader(file)
    next(reader)  # Skip the header row
    for row in reader:
        print("Doing")
        uniprot_id, protein_name = row
        cur.execute("""
            INSERT INTO proteins2 (uniprot_id, protein_name)
            VALUES (%s, %s)
            ON CONFLICT (uniprot_id) DO UPDATE SET protein_name = EXCLUDED.protein_name;
        """, (uniprot_id, protein_name))

# Commit the changes and close the connection
conn.commit()
cur.close()
conn.close()
