from flask import Flask, render_template, request, jsonify, send_from_directory
import requests
import random
import json
from bs4 import BeautifulSoup as bs
import pandas as pd
import psycopg2
import xml.etree.ElementTree as ET
import os
import logging
from psycopg2 import pool
from pathlib import Path

print("Check")
app = Flask(__name__)
# app.config['WTF_CSRF_ENABLED'] = False
logging.basicConfig(filename='app.log', level=logging.DEBUG)
# PDB_DIR = 'pdb_files'
PDB_DIR = Path(__file__).parent / "pdb_files"
os.makedirs(PDB_DIR, exist_ok=True)
# conn = psycopg2.connect(
#     dbname="my_proteins_db",
#     user="postgres",
#     password="Trainaccount@26",
#     host="localhost"
# )
# conn = psycopg2.connect(
#     host="DrugProtAI-4079.postgres.pythonanywhere-services.com",
#     port = "14079",
#     dbname="my_proteins_db",
#     user="super",
#     password="strongpassword"
# )
# cursor = conn.cursor()

db_pool = pool.SimpleConnectionPool(
    1, 20,  # min and max connections
    host="DrugProtAI-4079.postgres.pythonanywhere-services.com",
    port="14079",
    dbname="my_proteins_db",
    user="super",
    password="strongpassword"
)

col_names = ['Sequence_Length', 'Molecular_Weight', 'GRAVY', 'Isoelectric_Point', 'Instability_Index', 'Aromaticity', 'Charge_at_7', 'is_druggable', 'is_approved_druggable', 'Amino_Acid_Percent_A', 'Amino_Acid_Percent_C', 'Amino_Acid_Percent_D', 'Amino_Acid_Percent_E', 'Amino_Acid_Percent_F', 'Amino_Acid_Percent_G', 'Amino_Acid_Percent_H', 'Amino_Acid_Percent_I', 'Amino_Acid_Percent_K', 'Amino_Acid_Percent_L', 'Amino_Acid_Percent_M', 'Amino_Acid_Percent_N', 'Amino_Acid_Percent_P', 'Amino_Acid_Percent_Q',
'Amino_Acid_Percent_R', 'Amino_Acid_Percent_S', 'Amino_Acid_Percent_T', 'Amino_Acid_Percent_V', 'Amino_Acid_Percent_W', 'Amino_Acid_Percent_Y', 'Molar_Extinction_Coefficient_1', 'Molar_Extinction_Coefficient_2', 'Secondary_Structure_helix', 'Secondary_Structure_turn', 'Secondary_Structure_sheet', 'aliphatic_aliphatic', 'aliphatic_positive', 'aliphatic_negative', 'aliphatic_uncharged', 'aliphatic_aromatic', 'positive_aliphatic', 'positive_positive', 'positive_negative', 'positive_uncharged', 'positive_aromatic', 'negative_aliphatic', 'negative_positive', 'negative_negative',
'negative_uncharged', 'negative_aromatic', 'uncharged_aliphatic', 'uncharged_positive', 'uncharged_negative', 'uncharged_uncharged', 'uncharged_aromatic', 'aromatic_aliphatic', 'aromatic_positive', 'aromatic_negative', 'aromatic_uncharged', 'aromatic_aromatic', 'Glycosylation', 'Cross_link', 'Modified_residue', 'Signal', 'Disulfide_bond', 'O_linked', 'N_linked', 'C_linked', 'N_beta_linked', 'S_linked', 'O_alpha_linked', 'binary_count', 'binary_experimental_count', 'xeno_count', 'xeno_experimental_count', 'degree_binary', 'degree_xeno', 'degree_all', 'avg_degree_nbr_binary',
'avg_degree_nbr_xeno', 'avg_degree_nbr_all', 'strongly_connected_component_sizes_all', 'cytoplasmic_vesicle', 'nucleus', 'melanosome', 'lateral_cell_membrane', 'secreted', 'vacuole', 'vesicle', 'synapse', 'presynapse', 'cleavage_furrow', 'endomembrane_system', 'late_endosome', 'recycling_endosome', 'midbody', 'cytoplasmic_granule', 'endosome', 'early_endosome', 'perikaryon', 'membrane', 'peroxisome', 'cell_membrane', 'cell_junction', 'postsynapse', 'cytoplasm', 'lipid_droplet', 'rough_endoplasmic_reticulum', 'zymogen_granule', 'smooth_endoplasmic_reticulum_membrane', 'inflammasome', 'target_cell_membrane', 'preautophagosomal_structure', 'cornified_envelope', 'mitochondrion', 'microsome', 'sarcoplasmic_reticulum', 'vacuole_membrane', 'cell_surface', 'dynein_axonemal_particle', 'golgo_apparatus', 'parasitophorous_vacuole', 'extracellular_vessicle', 'cell_projection', 'photoreceptor', 'virion', 'cytolitic_granule', 'golgi_outpost', 'myelin_membrane', 'endoplasmic_reticulum', 'chromosome', 'lysosome', 'rrm', 'acidic_residues', 'ph', 'krab', 'pdz', 'btb', 'nuclear_localization_signal', 'fibronectin_type_iii', 'disordered', 'ig_like_v_type', 'ef_hand', 'sh3', 'ig_like', 'pro_residues', 'protein_kinase', 'ig_like_c2_type', 'basic_and_acidic_residues', 'basic_residues', 'egf_like', 'polar_residues', 'Mean', 'Mode', 'Min', 'Max', 'Variance', 'Median', 'Standard_Deviation', 'Range', 'Min_gap', 'Max_gap', 'Average_gap', 'Min_2_hop_gap', 'Max_2_hop_gap', 'Average_2_hop_gap', 'Latent_Value_1', 'Latent_Value_2', 'Latent_Value_3', 'Latent_Value_4', 'Latent_Value_5', 'Latent_Value_6', 'Latent_Value_7', 'Latent_Value_8', 'Latent_Value_9', 'Latent_Value_10', 'Latent_Value_11', 'Latent_Value_12', 'Latent_Value_13', 'Latent_Value_14', 'Latent_Value_15', 'Latent_Value_16', 'Latent_Value_17', 'Latent_Value_18', 'Latent_Value_19', 'Latent_Value_20']

UNIPROT_API_URL = "https://www.ebi.ac.uk/proteins/api/proteins/"
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/check_druggability', methods=['POST'])
def check_druggability():
    data = request.json
    uniprot_id = data.get('uniprot_id')

    if not uniprot_id:
        return jsonify({"error": "No UniProt ID provided"}), 400

    conn = db_pool.getconn()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 FROM protein_prob WHERE protein_id = %s LIMIT 1;", (uniprot_id,))
            exists = cursor.fetchone() is not None
            return jsonify({"exists": exists})
    finally:
        db_pool.putconn(conn)

@app.route('/fetch_pdb', methods=['POST'])
def fetch_and_display_structure():
    data = request.json
    uniprot_id = data.get('uniprot_id')
    print("Heyya")
    logging.info('This is a log message')
    if not uniprot_id:
        return jsonify({"error": "UniProt ID is required"}), 400

    # URL to download the PDB file from AlphaFold
    url = f"https://alphafold.ebi.ac.uk/files/AF-{uniprot_id}-F1-model_v4.pdb"

    # Fetch the PDB file
    response = requests.get(url)
    # print(response.content)
    # if response.status_code == 200:
    #     # Return the content of the PDB file directly
    #     return response.content, 200, {'Content-Type': 'text/plain'}
    if response.status_code == 200:
        pdb_filename = f"{uniprot_id}.pdb"
        pdb_path = os.path.join(PDB_DIR, pdb_filename)

        # Save the PDB file locally
        with open(pdb_path, "wb") as pdb_file:
            pdb_file.write(response.content)

        # Return the filename for the frontend to request
        return jsonify({"pdb_filename": pdb_filename})
    else:
        return jsonify({"error": "Failed to fetch PDB file"}), 500

@app.route('/pdb/<filename>')
def get_pdb_file(filename):
    return send_from_directory(PDB_DIR, filename)

@app.route('/mod_get_pmid', methods=['POST'])
def get_pro_info():
    with open(Path(__file__).parent / "protein_names.json") as f:
        protein_names = json.load(f)
    data = request.get_json()
    uniprot_id = data.get('uniprot_id')
    if uniprot_id not in protein_names:
        # This case is not handled in this version -- these proteins have been moved from uniprot to uniparc
        return 0, []
    elif "shortNames" not in protein_names[uniprot_id]:
        protein_name = protein_names[uniprot_id]["fullName"]
        search_term = f'(("{uniprot_id}"[Title/Abstract] OR "{protein_name}"[Title/Abstract]) AND ((druggability[Title/Abstract] OR "drug target"[Title/Abstract] OR "protein target"[Title/Abstract] OR "drug discovery"[Title/Abstract] OR "drug binding"[Title/Abstract] OR "drug interaction"[Title/Abstract] OR "targeted therapy"[Title/Abstract]) OR ("cancer"[Title/Abstract] OR "tumor"[Title/Abstract] OR "neurodegenerative"[Title/Abstract] OR "disorders"[Title/Abstract] OR "metabolic disorders"[Title/Abstract] OR "cardiovascular"[Title/Abstract] OR "COPD"[Title/Abstract] OR "infectious"[Title/Abstract] OR "disease"[Title/Abstract])))'
    else:
        protein_name = protein_names[uniprot_id]["fullName"]
        alias_names = protein_names[uniprot_id]["shortNames"]
        search_term = f'(({uniprot_id}[Title/Abstract] OR "{protein_name}"[Title/Abstract])'
        for alias in alias_names:
            search_term += f' OR "{alias}"[Title/Abstract]'
        search_term += f') AND ((druggability[Title/Abstract] OR "drug target"[Title/Abstract] OR "protein target"[Title/Abstract] OR "drug discovery"[Title/Abstract] OR "drug binding"[Title/Abstract] OR "drug interaction"[Title/Abstract] OR "targeted therapy"[Title/Abstract]) OR ("cancer"[Title/Abstract] OR "tumor"[Title/Abstract] OR "neurodegenerative"[Title/Abstract] OR "disorders"[Title/Abstract] OR "metabolic disorders"[Title/Abstract] OR "cardiovascular"[Title/Abstract] OR "COPD"[Title/Abstract] OR "infectious"[Title/Abstract] OR "disease"[Title/Abstract]))'

    search_term += " AND Humans[MeSH Terms]"
    encoded_search_term = requests.utils.quote(search_term)
    url = f"https://pubmed.ncbi.nlm.nih.gov/?term={encoded_search_term}&sort=date&filter=datesearch.y_10"
    return jsonify({'url': url})

@app.route('/get_pmid', methods=['POST'])
def get_protein_info():

    with open(Path(__file__).parent / "protein_names.json") as f:
        protein_names = json.load(f)
    data = request.get_json()
    uniprot_id = data.get('uniprot_id')
    source = data.get('source')
    retrieve_amount = 2
    mindate = 0
    maxdate = 2024

    if source == "pubmed":
        if uniprot_id not in protein_names:
            # This case is not handled in this version -- these proteins have been moved from uniprot to uniparc
            return 0, []
        elif "shortNames" not in protein_names[uniprot_id]:
            protein_name = protein_names[uniprot_id]["fullName"]
            search_term = f'(("{uniprot_id}"[Title/Abstract] OR "{protein_name}"[Title/Abstract]) AND ((druggability[Title/Abstract] OR "drug target"[Title/Abstract] OR "protein target"[Title/Abstract] OR "drug discovery"[Title/Abstract] OR "drug binding"[Title/Abstract] OR "drug interaction"[Title/Abstract] OR "targeted therapy"[Title/Abstract]) OR ("cancer"[Title/Abstract] OR "tumor"[Title/Abstract] OR "neurodegenerative"[Title/Abstract] OR "disorders"[Title/Abstract] OR "metabolic disorders"[Title/Abstract] OR "cardiovascular"[Title/Abstract] OR "COPD"[Title/Abstract] OR "infectious"[Title/Abstract] OR "disease"[Title/Abstract])))'
        else:
            protein_name = protein_names[uniprot_id]["fullName"]
            alias_names = protein_names[uniprot_id]["shortNames"]
            search_term = f'(({uniprot_id}[Title/Abstract] OR "{protein_name}"[Title/Abstract])'
            for alias in alias_names:
                search_term += f' OR "{alias}"[Title/Abstract]'
            search_term += f') AND ((druggability[Title/Abstract] OR "drug target"[Title/Abstract] OR "protein target"[Title/Abstract] OR "drug discovery"[Title/Abstract] OR "drug binding"[Title/Abstract] OR "drug interaction"[Title/Abstract] OR "targeted therapy"[Title/Abstract]) OR ("cancer"[Title/Abstract] OR "tumor"[Title/Abstract] OR "neurodegenerative"[Title/Abstract] OR "disorders"[Title/Abstract] OR "metabolic disorders"[Title/Abstract] OR "cardiovascular"[Title/Abstract] OR "COPD"[Title/Abstract] OR "infectious"[Title/Abstract] OR "disease"[Title/Abstract]))'

        search_term += " AND Humans[MeSH Terms]"
        # print(search_term)
        encoded_search_term = requests.utils.quote(search_term)
        url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmax={retrieve_amount}&mindate={mindate}&maxdate={maxdate}&sort=pub+date&term={encoded_search_term}"
        response = requests.get(url)
        xml_data = response.text
        root = ET.fromstring(xml_data)
        counttag = root.find(".//Count")
        count = int(counttag.text)

        # Find and Extract content within <IdList> tag
        pubmed_ids = []
        for idlist in root.findall(".//IdList"):
            for id in idlist.findall(".//Id"):
                pubmed_ids.append(id.text)
        pmid_details = {}
        print(pubmed_ids, len(pubmed_ids))
        for pmid in pubmed_ids:
            url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={pmid}&retmode=xml"
            response = requests.get(url)
            print(url)
            print(response.content)
            tree = ET.fromstring(response.content)
            title = tree.findtext(".//Item[@Name='Title']")
            pub_year = tree.findtext(".//Item[@Name='PubDate']")
            authors = [author.text for author in tree.findall(".//Item[@Name='Author']")]
            doi = tree.findtext(".//Item[@Name='DOI']")
            link_from_doi = f"https://doi.org/{doi}"
            pmid_details[pmid] = {
                                        "pmid":pmid,
                                        "title": title,
                                        "pub_year": pub_year,
                                        "authors": authors,
                                        "doi": doi,
                                        "link": link_from_doi
                                    }
        print(pmid_details)
        return jsonify({'pmids': pmid_details})
    else:
        return jsonify({'error': f"Source '{source}' is not supported."}), 400

# def get_protein_info():

#     data = request.get_json()
#     uniprot_id = data.get('uniprot_id')
#     source = data.get('source')


#     if source == "pubmed":
#         # Fetching XML data from the URL
#         url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmax=30&term={uniprot_id}"
#         response = requests.get(url)
#         xml_data = response.text

#         # Parsing the XML data
#         root = ET.fromstring(xml_data)

#         # Find and Extract content within <IdList> tag
#         pubmed_ids = []
#         for idlist in root.findall(".//IdList"):
#             for id in idlist.findall(".//Id"):
#                 pubmed_ids.append(id.text)

#         return jsonify({'pmids': pubmed_ids})

#     else:
#         return jsonify({'error': f"Source '{source}' is not supported."}), 400
# @app.route('/get_mean_probability', methods=['POST'])
# def get_mean_probability():
#     protein_id = request.json['protein_id']
#     print(protein_id)
#     query = """
#         SELECT mean_probability FROM protein_prob
#         WHERE protein_id = %s
#     """
#     cursor = conn.cursor()
#     cursor.execute(query, (protein_id,))
#     result = cursor.fetchone()

#     if result:
#         mean_probability = result[0]
#     else:
#         mean_probability = "The drug is already approved druggable"

#     return jsonify({'mean_probability': mean_probability})


@app.route('/get_mean_probability', methods=['POST'])
def get_mean_probability():
    protein_id = request.json['protein_id']
    print(protein_id)
    query = """
        SELECT mean_probability FROM protein_prob_2
        WHERE protein_id = %s
    """

    conn = db_pool.getconn()  # Get a connection from the pool
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, (protein_id,))
            result = cursor.fetchone()

        if result:
            mean_probability = result[0]
        else:
            mean_probability = "The drug is already approved druggable"

        return jsonify({'mean_probability': mean_probability})

    finally:
        db_pool.putconn(conn)  # Return the connection to the pool


# @app.route('/get_mean_probability_2', methods=['POST'])
# def get_mean_probability_2():
#     protein_id = request.json['protein_id']
#     print(protein_id)
#     query = """
#         SELECT mean_probability FROM protein_prob_rf
#         WHERE protein_id = %s
#     """
#     cursor = conn.cursor()
#     cursor.execute(query, (protein_id,))
#     result = cursor.fetchone()

#     if result:
#         mean_probability = result[0]
#     else:
#         mean_probability = "The drug is already approved druggable"

#     return jsonify({'mean_probability': mean_probability})

@app.route('/get_mean_probability_2', methods=['POST'])
def get_mean_probability_2():
    protein_id = request.json['protein_id']
    print(protein_id)
    query = """
        SELECT mean_probability FROM protein_prob_rf_2
        WHERE protein_id = %s
    """

    conn = db_pool.getconn()  # Get a connection from the pool
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, (protein_id,))
            result = cursor.fetchone()

        if result:
            mean_probability = result[0]
        else:
            mean_probability = "The drug is already approved druggable"

        return jsonify({'mean_probability': mean_probability})

    finally:
        db_pool.putconn(conn)  # Return the connection to the pool

@app.route('/api/drugs/<uniprot_id>', methods=['GET'])
def get_drugbank_info(uniprot_id):
    print(f"Extracting drugbank information from recent release v5.1.13 for {uniprot_id}")

    file_paths = {
        'approved': Path(__file__).parent / 'approved.csv',
        'biotech': Path(__file__).parent / 'biotech.csv',
        'experimental':  Path(__file__).parent / 'experimental.csv',
        'illicit':  Path(__file__).parent / 'illicit.csv',
        'investigational':  Path(__file__).parent / 'investigational.csv',
        'nutraceutical':  Path(__file__).parent / 'nutraceutical.csv',
        'small molecule':  Path(__file__).parent / 'small_molecule.csv',
        'withdrawn':  Path(__file__).parent / 'withdrawn.csv'
    }

    target_data = {x: pd.read_csv(file_paths[x], index_col=0) for x in file_paths.keys()}

    protein_ids_path =  Path(__file__).parent / "protein_ids.txt"
    with open(protein_ids_path) as f:
        protein_ids = [x.strip() for x in f.readlines()]

    pharmacologically_active_data = pd.read_csv( Path(__file__).parent / "pharmacologically_active.csv", index_col=0)
    drug_pharmacological_map = {}
    for row in pharmacologically_active_data.iterrows():
        if row[1]["UniProt ID"] not in protein_ids:
            continue
        drugs = [x.strip() for x in row[1]["Drug IDs"].split(";")]
        for drug in drugs:
            if drug not in drug_pharmacological_map:
                drug_pharmacological_map[drug] = set([row[1]["UniProt ID"]])
            else:
                drug_pharmacological_map[drug].add(row[1]["UniProt ID"])


    def get_drug_info(uniprot_id):
        drugs = {}
        for class_, data in target_data.items():
            drugs[class_] = []
            drug_lists = data[data["UniProt ID"] == uniprot_id]["Drug IDs"].values
            for dl in drug_lists:
                drugs[class_].extend([x.strip() for x in dl.split(";")])

        drug_map = {}
        for class_, drug_list in drugs.items():
            for drug in drug_list:
                if drug not in drug_map:
                    drug_map[drug] = set([class_])
                else:
                    drug_map[drug].add(class_)

        return drug_map

    def get_status(classes):
        status = [x for x in classes if (x != "small molecule" and x != "biotech" and x != "nutraceutical")]
        return ", ".join(status)
    def get_type(classes):
        types = [x for x in classes if (x == "small molecule" or x == "biotech" or x == "nutraceutical")]
        return ", ".join(types)
    def get_pharmacological_status(drug, uniprot_id):
        if drug in drug_pharmacological_map:
            if uniprot_id in drug_pharmacological_map[drug]:
                return "yes"
        return "unknown"

    def get_comprehensive_drug_information(uniprot_id):
        drug_info = get_drug_info(uniprot_id)
        comprehensive_info = {}
        for drug, classes in drug_info.items():
            comprehensive_info[drug] = {
                "status": get_status(classes),
                "type": get_type(classes),
                "action": get_pharmacological_status(drug, uniprot_id),
                'hlink': f"https://go.drugbank.com/drugs/{drug}"
            }
        return comprehensive_info

    drug_information = get_comprehensive_drug_information(uniprot_id)
    print("Drug Information extracted")
    return {"drugs":drug_information, "has_drugs":len(drug_information)>0}

# @app.route('/api/drugs/<uniprot_id>', methods=['GET'])
# def get_drugbank_info(uniprot_id):
#     url = f'https://go.drugbank.com/unearth/q?searcher=bio_entities&query={uniprot_id}'
#     print(url)
#     page = requests.get(url)
#     soup = bs(page.text, 'html.parser')

#     links = soup.find_all('h2', class_='hit-link')
#     print("Number of hit-links: ", len(links))
#     drugs = {}
#     for link_ in links:
#         link = link_.find('a')
#         link = link.get('href')
#         new_url = 'https://go.drugbank.com' + link
#         print(new_url)

#         page2 = requests.get(new_url)

#         soup2 = bs(page2.text, 'html.parser')
#         table = soup2.find('table', id='target-relations')
#         table = table.find('tbody')
#         rows = table.find_all('tr')
#         drugs_ = {}
#         for row in rows:
#             cols = row.find_all('td')
#             hlink = cols[0].find('a')
#             hlink = "https://go.drugbank.com" + hlink.get('href')
#             drugbank_id = hlink.split('/')[-1]
#             cols = [ele.text.strip() for ele in cols[:-1]]
#             drugs_[drugbank_id] = {
#                 'id':drugbank_id,
#                 'drug_name': cols[0],
#                 'status': cols[1],
#                 'action': cols[3],
#                 'type': cols[4],
#                 'hlink': hlink
#             }

#         drugs[link] = drugs_
#     print(drugs)


#     return {'drugs': drugs, 'has_drugs': len(links)>0}


# @app.route('/fetch_features', methods=['POST'])
# def fetch_features():
#     protein_id = request.json['protein_id']
#     page = int(request.json['page'])

#     # Step 1: Retrieve the features grouped by feature_type from the database
#     cursor = conn.cursor()
#     cursor.execute("SELECT feature_name, feature_type FROM feature_data")
#     features = cursor.fetchall()

#     # Step 2: Organize features by their feature_type into groups
#     group_features = {}
#     for feature_name, feature_type in features:
#         if feature_type not in group_features:
#             group_features[feature_type] = []
#         group_features[feature_type].append(feature_name)
#     print("Hi")
#     # Step 3: Get the feature types (groups) to map to pages
#     group_names = list(group_features.keys())
#     print(group_names)
#     if page <= len(group_names):
#         selected_group = group_features[group_names[page-1]]
#     else:
#         return jsonify({'data': {}, 'total_pages': 0})
#     #print(group_features)
#     # Step 4: Build the SQL query for the selected group of features
#     selected_columns = selected_group
#     selected_columns = [col.replace(' ', '_').replace('-','_') for col in selected_group]
#     #selected_columns = [f'"{col}"' for col in selected_group]
#     query = f"""
#     SELECT protein_id, {', '.join(selected_columns)} FROM pro_data
#     WHERE protein_id = %s
#     """
#     cursor.execute(query, (protein_id,))
#     results = cursor.fetchone()

#     if results:
#         feature_names = [desc[0] for desc in cursor.description][1:]  # Skipping protein_id
#         feature_values = results[1:]  # Skipping the protein_id value
#         data = {
#             group_names[page - 1]: [
#                 {feature_name.replace('_', ' '): value} for feature_name, value in zip(feature_names, feature_values)
#             ]
#         }

#         total_pages = len(group_names)
#         # data = dict(zip(feature_names, feature_values))
#         # total_pages = len(group_names)  # One page per feature_type (group)
#     else:
#         data = {}
#         total_pages = 0
#     print(data)
#     return jsonify({'data': data, 'total_pages': total_pages})

@app.route('/fetch_features', methods=['POST'])
def fetch_features():
    protein_id = request.json['protein_id']
    page = int(request.json['page'])

    conn = db_pool.getconn()  # Get a connection from the pool
    try:
        # Step 1: Retrieve the features grouped by feature_type from the database
        with conn.cursor() as cursor:
            cursor.execute("SELECT feature_name, feature_type FROM feature_data")
            features = cursor.fetchall()

            # Step 2: Organize features by their feature_type into groups
            group_features = {}
            for feature_name, feature_type in features:
                if feature_type not in group_features:
                    group_features[feature_type] = []
                group_features[feature_type].append(feature_name)

            print("Hi")

            # Step 3: Get the feature types (groups) to map to pages
            group_names = list(group_features.keys())
            print(group_names)
            if page <= len(group_names):
                selected_group = group_features[group_names[page - 1]]
            else:
                return jsonify({'data': {}, 'total_pages': 0})

            # Step 4: Build the SQL query for the selected group of features
            selected_columns = [col.replace(' ', '_').replace('-', '_') for col in selected_group]
            query = f"""
            SELECT protein_id, {', '.join(selected_columns)} FROM pro_data
            WHERE protein_id = %s
            """
            cursor.execute(query, (protein_id,))
            results = cursor.fetchone()

            if results:
                feature_names = [desc[0] for desc in cursor.description][1:]  # Skipping protein_id
                feature_values = results[1:]  # Skipping the protein_id value
                data = {
                    group_names[page - 1]: [
                        {feature_name.replace('_', ' '): value} for feature_name, value in zip(feature_names, feature_values)
                    ]
                }

                total_pages = len(group_names)
            else:
                data = {}
                total_pages = 0

            print(data)
            return jsonify({'data': data, 'total_pages': total_pages})

    finally:
        db_pool.putconn(conn)  # Return the connection to the pool



# @app.route('/api/drugs/<uniprot_id>', methods=['GET'])
# def get_drugbank_info(uniprot_id):
#     url = f'https://go.drugbank.com/unearth/q?searcher=bio_entities&query={uniprot_id}'
#     print(url)
#     page = requests.get(url)
#     soup = bs(page.text, 'html.parser')

#     links = soup.find_all('h2', class_='hit-link')
#     print("Number of hit-links: ", len(links))
#     drugs = {}
#     for link_ in links:
#         link = link_.find('a')
#         link = link.get('href')
#         new_url = 'https://go.drugbank.com' + link
#         print(new_url)

#         page2 = requests.get(new_url)

#         soup2 = bs(page2.text, 'html.parser')
#         table = soup2.find('table', id='target-relations')
#         table = table.find('tbody')
#         rows = table.find_all('tr')
#         drugs_ = {}
#         for row in rows:
#             cols = row.find_all('td')
#             cols = [ele.text.strip() for ele in cols[:-1]]
#             drugs_[cols[0]] = [ele for ele in cols[1:] if ele]
#         drugs[link] = drugs_
#     print(drugs)
#     return {'drugs': drugs, 'has_drugs': len(links)>0}


# @app.route('/fetch_features', methods=['POST'])
# def fetch_features():
#     protein_id = request.json['protein_id']

#     page = int(request.json['page'])
#     per_page = 9 # Number of features per page

#     offset = (page - 1) * per_page
#     end = min(offset+per_page, 184)
#     selected_columns = col_names[offset:end]
#     query = f"""
#     SELECT protein_id, {', '.join(selected_columns)} FROM pro_data
#     WHERE protein_id = %s
#     """

#     cursor = conn.cursor()
#     cursor.execute(query, (protein_id,))
#     results = cursor.fetchone()

#     if results:
#         feature_names = [desc[0] for desc in cursor.description][1:]  # Skipping protein_id
#         feature_values = results[1:]  # Skipping the protein_id value

#         data = dict(zip(feature_names, feature_values))
#         total_pages = (185 + per_page - 1) // per_page  # Calculate total pages
#     else:
#         data = {}
#         total_pages = 0
#     print(data, total_pages)
#     return jsonify({'data': data, 'total_pages': total_pages})


# @app.route('/api/pie-chart-data_2', methods=['GET'])
# def get_pie_chart_data_2():
#     # conn = psycopg2.connect(
#     # dbname="my_proteins_db",
#     # user="postgres",
#     # password="Trainaccount@26",
#     # host="localhost"
#     # )
#     # cursor = conn.cursor()
#     top_count = int(request.args.get('top', 20))  # Default to 20 if not specified
#     # Connect to PostgreSQL and fetch data
#     cur = cursor
#     print(top_count)
#     cursor.execute("SELECT feature_name, partition_average FROM protein_features_rf ORDER BY partition_average DESC LIMIT %s", (top_count,))
#     top_features = cursor.fetchall()

#     # Get the remaining features as "Others"
#     #cursor.execute("SELECT SUM(partition_average) FROM protein_features ORDER BY partition_average DESC OFFSET 20")
#     cursor.execute("""
#             SELECT SUM(partition_average)
#             FROM protein_features_rf
#             WHERE feature_name NOT IN (
#                 SELECT feature_name
#                 FROM protein_features
#                 ORDER BY partition_average DESC
#                 LIMIT %s
#             )
#         """,(top_count,))
#     others_score = cursor.fetchone()[0]

#     # cursor.close()
#     # conn.close()

#     return jsonify({
#         'topFeatures': [{'name': feature[0], 'score': feature[1]} for feature in top_features],
#         'others': {'score': others_score}
#     })

@app.route('/api/pie-chart-data_2', methods=['GET'])
def get_pie_chart_data_2():
    top_count = int(request.args.get('top', 20))  # Default to 20 if not specified

    conn = db_pool.getconn()  # Get a connection from the pool
    try:
        with conn.cursor() as cursor:
            print(top_count)

            # Fetch top features
            cursor.execute(
                "SELECT feature_name, partition_average FROM protein_features_rf_2 ORDER BY partition_average DESC LIMIT %s",
                (top_count,)
            )
            top_features = cursor.fetchall()

            # Get the remaining features as "Others"
            cursor.execute("""
                SELECT SUM(partition_average)
                FROM protein_features_rf
                WHERE feature_name NOT IN (
                    SELECT feature_name
                    FROM protein_features_rf
                    ORDER BY partition_average DESC
                    LIMIT %s
                )
            """, (top_count,))
            others_score = cursor.fetchone()[0]

        return jsonify({
            'topFeatures': [{'name': feature[0], 'score': feature[1]} for feature in top_features],
            'others': {'score': others_score}
        })

    finally:
        db_pool.putconn(conn)  # Return the connection to the pool


# @app.route('/api/pie-chart-data', methods=['GET'])
# def get_pie_chart_data():
#     # conn = psycopg2.connect(
#     # dbname="my_proteins_db",
#     # user="postgres",
#     # password="Trainaccount@26",
#     # host="localhost"
#     # )
#     # cursor = conn.cursor()
#     top_count = int(request.args.get('top', 20))  # Default to 20 if not specified
#     # Connect to PostgreSQL and fetch data
#     cur = cursor
#     print(top_count)
#     cursor.execute("SELECT feature_name, partition_average FROM protein_features ORDER BY partition_average DESC LIMIT %s", (top_count,))
#     top_features = cursor.fetchall()

#     # Get the remaining features as "Others"
#     #cursor.execute("SELECT SUM(partition_average) FROM protein_features ORDER BY partition_average DESC OFFSET 20")
#     cursor.execute("""
#             SELECT SUM(partition_average)
#             FROM protein_features
#             WHERE feature_name NOT IN (
#                 SELECT feature_name
#                 FROM protein_features
#                 ORDER BY partition_average DESC
#                 LIMIT %s
#             )
#         """,(top_count,))
#     others_score = cursor.fetchone()[0]

#     # cursor.close()
#     # conn.close()

#     return jsonify({
#         'topFeatures': [{'name': feature[0], 'score': feature[1]} for feature in top_features],
#         'others': {'score': others_score}
#     })

@app.route('/api/pie-chart-data', methods=['GET'])
def get_pie_chart_data():
    top_count = int(request.args.get('top', 20))  # Default to 20 if not specified

    conn = db_pool.getconn()  # Get a connection from the pool
    try:
        with conn.cursor() as cursor:
            print(top_count)

            # Fetch top features
            cursor.execute(
                "SELECT feature_name, partition_average FROM protein_features_2 ORDER BY partition_average DESC LIMIT %s",
                (top_count,)
            )
            top_features = cursor.fetchall()

            # Get the remaining features as "Others"
            cursor.execute("""
                SELECT SUM(partition_average)
                FROM protein_features
                WHERE feature_name NOT IN (
                    SELECT feature_name
                    FROM protein_features
                    ORDER BY partition_average DESC
                    LIMIT %s
                )
            """, (top_count,))
            others_score = cursor.fetchone()[0]

        return jsonify({
            'topFeatures': [{'name': feature[0], 'score': feature[1]} for feature in top_features],
            'others': {'score': others_score}
        })

    finally:
        db_pool.putconn(conn)  # Return the connection to the pool



@app.route('/api/protein/<uniprot_id>', methods=['GET'])
def get_protein(uniprot_id):
    response = requests.get(f"{UNIPROT_API_URL}{uniprot_id}")


# Extract pdbUrl from the first item in the list

    if response.status_code == 200:
        data = response.json()

        # Save data to a file
        with open(f"{uniprot_id}.json", "w") as f:
            json.dump(data, f, indent=4)

        # Fetch the function from the API response
        function = ""
        if "comments" in data:
            for comment in data["comments"]:
                if comment["type"] == "FUNCTION":
                    function = comment["text"][0]["value"]
                    break

        alphafold_url = f"https://alphafold.ebi.ac.uk/api/prediction/{uniprot_id}"
        alphafold_response = requests.get(alphafold_url)
        if alphafold_response.status_code == 200:
            alphafold_data = alphafold_response.json()
            with open("dekho.json", "w") as f:
                json.dump(alphafold_data, f, indent=4)
            pdb_url = alphafold_data[0].get('pdbUrl', None)
            print(pdb_url)
        else:
            pdb_url = None


        protein = {
            "name": data["protein"]["recommendedName"]["fullName"]["value"],
            "type": "Unknown",  # This would be determined based on your data
            "medicines": [],  # Medicines can be added based on your data
            "di": 0.5,  # This should be determined based on your data
            "models": ["Model1", "Model2", "Model3"],  # List of models you have
            "function": function,
            "pdb_url": pdb_url
        }
        return jsonify(protein)
    else:
        return jsonify({"error": "Protein not found"}), 404


# @app.route('/api/search', methods=['GET'])
# def search_protein():
#     query = request.args.get('query', '')
#     cursor.execute("SELECT uniprot_id FROM proteins WHERE uniprot_id ILIKE %s LIMIT 10", (f'{query}%',))
#     results = cursor.fetchall()
#     return jsonify([row[0] for row in results])


@app.route('/api/search', methods=['GET'])
def search_protein():
    query = request.args.get('query', '')

    conn = db_pool.getconn()  # Get a connection from the pool
    try:
        with conn.cursor() as cursor:
            #cursor.execute("SELECT uniprot_id FROM proteins WHERE uniprot_id ILIKE %s LIMIT 10", (f'{query}%',))
            cursor.execute("""
                SELECT uniprot_id, protein_name
                FROM proteins2
                WHERE uniprot_id ILIKE %s OR protein_name ILIKE %s
                LIMIT 10
            """, (f'{query}%', f'%{query}%'))
            results = cursor.fetchall()
            #return jsonify([row[0] for row in results])
            return jsonify([{'uniprot_id': row[0], 'protein_name': row[1]} for row in results])


    finally:
        db_pool.putconn(conn)  # Return the connection to the pool


@app.route('/api/score/<uniprot_id>', methods=['GET'])
def get_score(uniprot_id):
    model = request.args.get('model')
    # Mock score calculation
    score = random.uniform(0, 1)
    return jsonify({"score": score})

# if __name__ == '__main__':
#     app.run(debug=True)


from flask import Flask, render_template, request, jsonify
import requests
import random
import json
from bs4 import BeautifulSoup as bs
import pandas as pd
import psycopg2


# app = Flask(__name__)

# # conn = psycopg2.connect(
# #     dbname="my_proteins_db",
# #     user="postgres",
# #     password="Trainaccount@26",
# #     host="localhost"
# # )
# conn = psycopg2.connect(
#     host="DrugProtAI-4079.postgres.pythonanywhere-services.com",
#     port = "14079",
#     dbname="my_proteins_db",
#     user="super",
#     password="strongpassword"
# )
# cursor = conn.cursor()
# col_names = ['Sequence_Length', 'Molecular_Weight', 'GRAVY', 'Isoelectric_Point', 'Instability_Index', 'Aromaticity', 'Charge_at_7', 'is_druggable', 'is_approved_druggable', 'Amino_Acid_Percent_A', 'Amino_Acid_Percent_C', 'Amino_Acid_Percent_D', 'Amino_Acid_Percent_E', 'Amino_Acid_Percent_F', 'Amino_Acid_Percent_G', 'Amino_Acid_Percent_H', 'Amino_Acid_Percent_I', 'Amino_Acid_Percent_K', 'Amino_Acid_Percent_L', 'Amino_Acid_Percent_M', 'Amino_Acid_Percent_N', 'Amino_Acid_Percent_P', 'Amino_Acid_Percent_Q',
# 'Amino_Acid_Percent_R', 'Amino_Acid_Percent_S', 'Amino_Acid_Percent_T', 'Amino_Acid_Percent_V', 'Amino_Acid_Percent_W', 'Amino_Acid_Percent_Y', 'Molar_Extinction_Coefficient_1', 'Molar_Extinction_Coefficient_2', 'Secondary_Structure_helix', 'Secondary_Structure_turn', 'Secondary_Structure_sheet', 'aliphatic_aliphatic', 'aliphatic_positive', 'aliphatic_negative', 'aliphatic_uncharged', 'aliphatic_aromatic', 'positive_aliphatic', 'positive_positive', 'positive_negative', 'positive_uncharged', 'positive_aromatic', 'negative_aliphatic', 'negative_positive', 'negative_negative',
# 'negative_uncharged', 'negative_aromatic', 'uncharged_aliphatic', 'uncharged_positive', 'uncharged_negative', 'uncharged_uncharged', 'uncharged_aromatic', 'aromatic_aliphatic', 'aromatic_positive', 'aromatic_negative', 'aromatic_uncharged', 'aromatic_aromatic', 'Glycosylation', 'Cross_link', 'Modified_residue', 'Signal', 'Disulfide_bond', 'O_linked', 'N_linked', 'C_linked', 'N_beta_linked', 'S_linked', 'O_alpha_linked', 'binary_count', 'binary_experimental_count', 'xeno_count', 'xeno_experimental_count', 'degree_binary', 'degree_xeno', 'degree_all', 'avg_degree_nbr_binary',
# 'avg_degree_nbr_xeno', 'avg_degree_nbr_all', 'strongly_connected_component_sizes_all', 'cytoplasmic_vesicle', 'nucleus', 'melanosome', 'lateral_cell_membrane', 'secreted', 'vacuole', 'vesicle', 'synapse', 'presynapse', 'cleavage_furrow', 'endomembrane_system', 'late_endosome', 'recycling_endosome', 'midbody', 'cytoplasmic_granule', 'endosome', 'early_endosome', 'perikaryon', 'membrane', 'peroxisome', 'cell_membrane', 'cell_junction', 'postsynapse', 'cytoplasm', 'lipid_droplet', 'rough_endoplasmic_reticulum', 'zymogen_granule', 'smooth_endoplasmic_reticulum_membrane', 'inflammasome', 'target_cell_membrane', 'preautophagosomal_structure', 'cornified_envelope', 'mitochondrion', 'microsome', 'sarcoplasmic_reticulum', 'vacuole_membrane', 'cell_surface', 'dynein_axonemal_particle', 'golgo_apparatus', 'parasitophorous_vacuole', 'extracellular_vessicle', 'cell_projection', 'photoreceptor', 'virion', 'cytolitic_granule', 'golgi_outpost', 'myelin_membrane', 'endoplasmic_reticulum', 'chromosome', 'lysosome', 'rrm', 'acidic_residues', 'ph', 'krab', 'pdz', 'btb', 'nuclear_localization_signal', 'fibronectin_type_iii', 'disordered', 'ig_like_v_type', 'ef_hand', 'sh3', 'ig_like', 'pro_residues', 'protein_kinase', 'ig_like_c2_type', 'basic_and_acidic_residues', 'basic_residues', 'egf_like', 'polar_residues', 'Mean', 'Mode', 'Min', 'Max', 'Variance', 'Median', 'Standard_Deviation', 'Range', 'Min_gap', 'Max_gap', 'Average_gap', 'Min_2_hop_gap', 'Max_2_hop_gap', 'Average_2_hop_gap', 'Latent_Value_1', 'Latent_Value_2', 'Latent_Value_3', 'Latent_Value_4', 'Latent_Value_5', 'Latent_Value_6', 'Latent_Value_7', 'Latent_Value_8', 'Latent_Value_9', 'Latent_Value_10', 'Latent_Value_11', 'Latent_Value_12', 'Latent_Value_13', 'Latent_Value_14', 'Latent_Value_15', 'Latent_Value_16', 'Latent_Value_17', 'Latent_Value_18', 'Latent_Value_19', 'Latent_Value_20']

# UNIPROT_API_URL = "https://www.ebi.ac.uk/proteins/api/proteins/"
# @app.route('/')
# def index():
#     return render_template('index.html')


# @app.route('/get_mean_probability', methods=['POST'])
# def get_mean_probability():
#     protein_id = request.json['protein_id']
#     print(protein_id)
#     query = """
#         SELECT mean_probability FROM protein_prob
#         WHERE protein_id = %s
#     """
#     cursor = conn.cursor()
#     cursor.execute(query, (protein_id,))
#     result = cursor.fetchone()

#     if result:
#         mean_probability = result[0]
#     else:
#         mean_probability = "The drug is already approved druggable"

#     return jsonify({'mean_probability': mean_probability})

# @app.route('/get_mean_probability_2', methods=['POST'])
# def get_mean_probability_2():
#     protein_id = request.json['protein_id']
#     print(protein_id)
#     query = """
#         SELECT mean_probability FROM protein_prob_rf
#         WHERE protein_id = %s
#     """
#     cursor = conn.cursor()
#     cursor.execute(query, (protein_id,))
#     result = cursor.fetchone()

#     if result:
#         mean_probability = result[0]
#     else:
#         mean_probability = "The drug is already approved druggable"

#     return jsonify({'mean_probability': mean_probability})



# @app.route('/api/pie-chart-data_2', methods=['GET'])
# def get_pie_chart_data_2():
#     # conn = psycopg2.connect(
#     # dbname="my_proteins_db",
#     # user="postgres",
#     # password="Trainaccount@26",
#     # host="localhost"
#     # )
#     # cursor = conn.cursor()
#     top_count = int(request.args.get('top', 20))  # Default to 20 if not specified
#     # Connect to PostgreSQL and fetch data
#     cur = cursor
#     print(top_count)
#     cursor.execute("SELECT feature_name, partition_average FROM protein_features_rf ORDER BY partition_average DESC LIMIT %s", (top_count,))
#     top_features = cursor.fetchall()

#     # Get the remaining features as "Others"
#     #cursor.execute("SELECT SUM(partition_average) FROM protein_features ORDER BY partition_average DESC OFFSET 20")
#     cursor.execute("""
#             SELECT SUM(partition_average)
#             FROM protein_features_rf
#             WHERE feature_name NOT IN (
#                 SELECT feature_name
#                 FROM protein_features
#                 ORDER BY partition_average DESC
#                 LIMIT %s
#             )
#         """,(top_count,))
#     others_score = cursor.fetchone()[0]

#     # cursor.close()
#     # conn.close()

#     return jsonify({
#         'topFeatures': [{'name': feature[0], 'score': feature[1]} for feature in top_features],
#         'others': {'score': others_score}
#     })


# @app.route('/api/pie-chart-data', methods=['GET'])
# def get_pie_chart_data():
#     # conn = psycopg2.connect(
#     # dbname="my_proteins_db",
#     # user="postgres",
#     # password="Trainaccount@26",
#     # host="localhost"
#     # )
#     # cursor = conn.cursor()
#     top_count = int(request.args.get('top', 20))  # Default to 20 if not specified
#     # Connect to PostgreSQL and fetch data
#     cur = cursor
#     print(top_count)
#     cursor.execute("SELECT feature_name, partition_average FROM protein_features ORDER BY partition_average DESC LIMIT %s", (top_count,))
#     top_features = cursor.fetchall()

#     # Get the remaining features as "Others"
#     #cursor.execute("SELECT SUM(partition_average) FROM protein_features ORDER BY partition_average DESC OFFSET 20")
#     cursor.execute("""
#             SELECT SUM(partition_average)
#             FROM protein_features
#             WHERE feature_name NOT IN (
#                 SELECT feature_name
#                 FROM protein_features
#                 ORDER BY partition_average DESC
#                 LIMIT %s
#             )
#         """,(top_count,))
#     others_score = cursor.fetchone()[0]

#     # cursor.close()
#     # conn.close()

#     return jsonify({
#         'topFeatures': [{'name': feature[0], 'score': feature[1]} for feature in top_features],
#         'others': {'score': others_score}
#     })



# @app.route('/api/protein/<uniprot_id>', methods=['GET'])
# def get_protein(uniprot_id):
#     response = requests.get(f"{UNIPROT_API_URL}{uniprot_id}")


# # Extract pdbUrl from the first item in the list

#     if response.status_code == 200:
#         data = response.json()

#         # Save data to a file
#         with open(f"{uniprot_id}.json", "w") as f:
#             json.dump(data, f, indent=4)

#         # Fetch the function from the API response
#         function = ""
#         if "comments" in data:
#             for comment in data["comments"]:
#                 if comment["type"] == "FUNCTION":
#                     function = comment["text"][0]["value"]
#                     break

#         alphafold_url = f"https://alphafold.ebi.ac.uk/api/prediction/{uniprot_id}"
#         alphafold_response = requests.get(alphafold_url)
#         if alphafold_response.status_code == 200:
#             alphafold_data = alphafold_response.json()
#             with open("dekho.json", "w") as f:
#                 json.dump(alphafold_data, f, indent=4)
#             pdb_url = alphafold_data[0].get('pdbUrl', None)
#             print(pdb_url)
#         else:
#             pdb_url = None


#         protein = {
#             "name": data["protein"]["recommendedName"]["fullName"]["value"],
#             "type": "Unknown",  # This would be determined based on your data
#             "medicines": [],  # Medicines can be added based on your data
#             "di": 0.5,  # This should be determined based on your data
#             "models": ["Model1", "Model2", "Model3"],  # List of models you have
#             "function": function,
#             "pdb_url": pdb_url
#         }
#         return jsonify(protein)
#     else:
#         return jsonify({"error": "Protein not found"}), 404


# @app.route('/api/search', methods=['GET'])
# def search_protein():
#     query = request.args.get('query', '')
#     cursor.execute("SELECT uniprot_id FROM proteins WHERE uniprot_id ILIKE %s LIMIT 10", (f'{query}%',))
#     results = cursor.fetchall()
#     return jsonify([row[0] for row in results])


# @app.route('/api/score/<uniprot_id>', methods=['GET'])
# def get_score(uniprot_id):
#     model = request.args.get('model')
#     # Mock score calculation
#     score = random.uniform(0, 1)
#     return jsonify({"score": score})

if __name__ == '__main__':
    app.run(debug=True)

