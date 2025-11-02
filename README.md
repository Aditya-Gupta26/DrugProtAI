## Introduction

Drug design and development are central to clinical research, yet 90% of drugs fail to reach the clinic, often due to inappropriate selection of drug targets. Conventional methods for target identification lack precision and sensitivity. While various computational tools have been developed to predict the druggability of proteins, they often focus on limited subsets of the human proteome or rely solely on amino acid properties. Our study presents DrugProtAI, a tool developed by implementing a partitioning-based method and trained on the entire human protein set using both sequence- and non–sequence-derived properties. The partitioned method was evaluated using popular machine learning algorithms, of which Random Forest and XGBoost performed the best. A comprehensive analysis of 183 features, encompassing biophysical, sequence-, and non–sequence-derived properties, achieved a median Area Under Precision-Recall Curve (AUC) of 0.87 in target prediction. The model was further tested on a blinded validation set comprising recently approved drug targets. The key predictors were also identified, which we believe will help users in selecting appropriate drug targets. We believe that these insights are poised to significantly advance drug development. This version of the tool provides the probability of druggability for human proteins. The tool is freely accessible at https://drugprotai.pythonanywhere.com/.

This work was done at the Proteomics Lab, IIT Bombay along with the following people 
 - Prof. Sanjeeva Srivastava
 - Ankit Halder
 - Sabyasachi Samantarey
 - Sahil Barbade

Our work was published in July 2025 Edition of Oxford Academic's Briefings in the Bioinformatics jounral (https://doi.org/10.1093/bib/bbaf330)

