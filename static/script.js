let pieChartInstance = null;

function checkEnter(event) {
    if (event.key === "Enter") {
        searchProtein();  // Call the searchProtein function
    }
}
async function searchProtein() {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'block';
    const uniprotId = document.getElementById('search-bar').value;
    const response = await fetch(`/api/protein/${uniprotId}`);
    const drugy = await fetch(`/api/drugs/${uniprotId}`);
    const sec = document.getElementById('second-section');
    const upd2 = document.getElementById('container');
    const proteinData = await response.json();
    //const drugydata = await drugy.json();

    if (proteinData.error) {
        spinner.style.display = 'none';
        alert(proteinData.error);
    } else {
        // document.getElementById('first-section').classList.add('slide-up');
        // setTimeout(() => {
        //     displayProteinDetails(proteinData);
        // }, 500); // Match the delay with the slide-up animation duration
        spinner.style.display = 'none';
        displayProteinDetails(proteinData, uniprotId)
        upd2.classList.add('active');

        setTimeout(() =>{
            upd2.scrollIntoView({
                behavior: 'smooth'
            });

        },1000);


    }
}

function displayProteinDetails(data, uniprot_id) {
    const thirdSection = document.getElementById('third-section');
    if (thirdSection) {
        thirdSection.remove(); // This will remove the element from the DOM
    }
    const header = document.getElementById('first-section');
    const detailsDiv = document.getElementById('second-section');
    const upd = document.getElementById('container');
    // Trigger the slide-up animation
    header.classList.add('active');

    // Populate the protein details after the slide-up animation
    setTimeout(async () => {
        let buttonHTML = '';


        buttonHTML = `<button id = "view-drug-info-btn" class = "button" onclick="showDrugPopup()">Existing Drugs</button>`;

        piebutton = `<button id = "view-pie-info-btn" class = "button" onclick="showPiePopup()">View Pie Chart</button>`;
        featbutton = `<button id="features-btn" class = "button" onclick="details()" >View Protein Features</button>`;
        //dibutton = `<button id="show-third-section" class = "button" onclick="di()">Show Druggability Index</button>`;
        pmidbutton = `<button id="pmid" class = "button" onclick="mod_pmid_show()">Drug Target In Literature</button>`;
        visbutton = `<button id="visb" class = "button" onclick="vis_show()">3D Structure</button>`;
        //const drugTable = createDrugTable(drugyData);

        let dibutton = '';

        // Check if uniprot_id exists in protein_prob
        await fetch('/check_druggability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uniprot_id })
        })
        .then(response => response.json())
        .then(result => {
            if (result.exists) {
                dibutton = `<button id="show-third-section" class="button" onclick="di()">Show Druggability Index</button>`;
            } else {
                dibutton = `<p class="error-text">Druggability index of a non-human protein is not supported.</p>`;
            }
        })
        .catch(error => {
            console.error('Error checking druggability:', error);
        });

        upd.innerHTML = `

        <div id="top-div">
            <!-- Content for the top div spanning 100% width -->
            <h1>Protein: ${data.name}</h1>
        </div>

        <div id="middle-container">
            <div id="left-div">
                <div id="left-top">
                    <h2>Protein function</h2>
                    <p>${data.function || "Function not available"}</p>
                </div>
                <div id="left-bottom">

                    ${featbutton}
                    ${pmidbutton}
                    ${buttonHTML}
                </div>
            </div>
            <div id="right-div">
                <!-- 3D structure -->
                Right Div
            </div>
        </div>

        <div id="bottom-div">



        ${dibutton}
        </div>

        `

        const uniprotId = document.getElementById('search-bar').value;
    if (!uniprotId) {
        alert("Please enter a UniProt ID.");
        return;
    }

    // Post request to fetch the PDB file
    fetch('/fetch_pdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniprot_id: uniprotId }),
    })
    .then(response => response.json())
    .then(data => {

        //const popup2 = document.getElementById('right-div');
        //popup2.innerHTML = '';
        //popup.innerHTML = `

        //    <div id="viewer">

        //    </div>
        //`;
        //document.body.appendChild(popup);



        if (data.pdb_filename) {
            // Construct the URL to fetch the PDB file from Flask server
            const pdbUrl = `/pdb/${data.pdb_filename}`;

            // Initialize the viewer
            const viewer = $3Dmol.createViewer("right-div", { backgroundColor: "transparent" });

            // Fetch the PDB file from the Flask server
            fetch(pdbUrl)
                .then(response => response.text())
                .then(pdbData => {
                    // Add the PDB model to the viewer
                    viewer.addModel(pdbData, "pdb");
                    // Set the visualization style
                    viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
                    // Zoom into the structure
                    viewer.zoomTo();
                    // Render the structure
                    viewer.render();
                })
                .catch(error => console.error('Error fetching the PDB file:', error));
        } else {
            alert('Failed to fetch PDB file.');
        }
    })
    .catch(error => console.error('Error fetching PDB file:', error));

        detailsDiv.innerHTML = `
            <div class="card">



                <div class = "b1">
                <p class = "p2"> Users can click here to know the names and further details abut each of the 183 features used in training our models</p>
                ${featbutton}
                </div>
                <div class = "b1">
                <p> All the features have been used for predicting the druggability index, in doing so, some features have been shown to be of more importance in terms of their contribution. Here, we show the contribution of each of the protein-features.</p>
                ${piebutton}
                </div>
                <div class = "b1">
                <p class = "p2"> Users can view the PubMedIDs, if available related to the protein</p>
                ${pmidbutton}
                </div>
                <!-- Structure rendering will be handled later
                <div id="msp-container" style="width: 100%; height: 400px;"></div>
                -->
            </div>
            <div class="card">
                <h3>Protein: ${data.name}</h3>
                <p> This website aims at providing all the necessary information about a protein. One can view the required details by clicking the relevant buttons. We've deveoped AI models to predict the druggability of a protein. i.e - the probability of a drug to be approved druggable. The two models developed are based on XGBoost (XGB) and Random Fores(RF) and have been trained on 183 features for the entire protein database.</p>



                ${dibutton}

            </div>
            <div class="card">
                <h4>Function</h3>
                <p>${data.function || "Function not available"}</p>
                <div class = "b2">
                <p> Click here to view the 3-D alpha-fold structure of the protein</p>
                ${visbutton}
                </div>
            </div>
        `;


        // Make sure the cards are in their final position before fading in
        detailsDiv.style.opacity = 0;
        detailsDiv.classList.add('active');
        setTimeout(() => {
            detailsDiv.style.opacity = 1;
        }, 10); // Slight delay to trigger CSS transition
        if (data.pdb_url) {

            initializeMolstarViewer(data.pdb_url)
        }
    }, 1000); // Match the delay with the slide-up animation duration
}

document.getElementById('search-bar').addEventListener('focus', function() {
    document.getElementById('suggestions-box').classList.add('active');
});

document.addEventListener('click', function(event) {
    const searchBar = document.getElementById('search-bar');
    const suggestionsBox = document.getElementById('suggestions-box');

    // Check if the click happened outside the search bar and suggestions box
    if (!searchBar.contains(event.target) && !suggestionsBox.contains(event.target)) {
        suggestionsBox.classList.remove('active');
    }
});

function generateRandomColor() {
    // Generate a random color in hex format
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r}, ${g}, ${b}, 0.2)`;
}

function easeOutQuad(t) {
    return t * (2 - t);
}

function animatePercentage(element, targetValue, duration) {
    let startValue = 0;
    const startTime = performance.now();
    targetValue = parseFloat(targetValue); // Ensure targetValue is a number

    function update() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1); // Normalize progress to [0, 1]
        const easedProgress = easeOutQuad(progress); // Apply easing function
        const currentValue = (easedProgress * targetValue).toFixed(2); // Use toFixed to ensure 2 decimal places

        element.textContent = currentValue + '%';

        if (progress < 1) {
            requestAnimationFrame(update); // Continue the animation
        }
    }

    update(); // Start the animation
}

function vis_show(){
    const uniprotId = document.getElementById('search-bar').value;
    if (!uniprotId) {
        alert("Please enter a UniProt ID.");
        return;
    }

    // Post request to fetch the PDB file
    fetch('/fetch_pdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniprot_id: uniprotId })
    })
    .then(response => response.json())
    .then(data => {

        const popup2 = document.getElementById('right-div');
        popup2.innerHTML = '';
        //popup.innerHTML = `

        //    <div id="viewer">

        //    </div>
        //`;
        //document.body.appendChild(popup);



        if (data.pdb_filename) {
            // Construct the URL to fetch the PDB file from Flask server
            const pdbUrl = `/pdb/${data.pdb_filename}`;

            // Initialize the viewer
            const viewer = $3Dmol.createViewer("right-div", { backgroundColor: "white" });

            // Fetch the PDB file from the Flask server
            fetch(pdbUrl)
                .then(response => response.text())
                .then(pdbData => {
                    // Add the PDB model to the viewer
                    viewer.addModel(pdbData, "pdb");
                    // Set the visualization style
                    viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
                    // Zoom into the structure
                    viewer.zoomTo();
                    // Render the structure
                    viewer.render();
                })
                .catch(error => console.error('Error fetching the PDB file:', error));
        } else {
            alert('Failed to fetch PDB file.');
        }
    })
    .catch(error => console.error('Error fetching PDB file:', error));
}

// function vis_show() {
//     const uniprotId = document.getElementById('search-bar').value;
//     if (!uniprotId) {
//         alert("Please enter a UniProt ID.");
//         return;
//     }

//     // Post request to fetch the PDB data
//     fetch('/fetch_pdb', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ uniprot_id: uniprotId })
//     })
//     .then(response => {
//         console.log(response);
//         console.log("Reached");
//         if (!response.ok) {
//             throw new Error('Failed to fetch PDB file');
//         }
//         return response.text();
//     })
//     .then(pdbData => {
//         console.log(pdbData);
//         console.log("#D");
//         const popup2 = document.getElementById('right-div');
//         popup2.innerHTML = '';

//         // Initialize the viewer
//         const viewer = $3Dmol.createViewer("right-div", { backgroundColor: "white" });

//         // Add the PDB model to the viewer
//         viewer.addModel(pdbData, "pdb");
//         // Set the visualization style
//         viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
//         // Zoom into the structure
//         viewer.zoomTo();
//         // Render the structure
//         viewer.render();
//     })
//     .catch(error => {
//         console.error('Error:', error);
//         alert('Failed to fetch or visualize PDB file.');
//     });
// }
function mod_pmid_show(){
    const uniprotId = document.getElementById('search-bar').value;
    //const spinner = document.getElementById('loading-spinner');
    const spinner = document.getElementById('loading-spinner');

    // Show the spinner while fetching the data
    spinner.style.display = 'block';
    fetch('/mod_get_pmid', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uniprot_id: uniprotId})
    })
    .then(response => response.json())
    .then(data => {
        spinner.style.display = 'none';
        const value = data.url;

        window.open(value, "_blank");


    })
    .catch(error => {
        spinner.style.display = 'none';
        console.error('Error:', error);

        const popup = document.getElementById('error-popup');
        popup.style.display = 'block';

        // Hide after 3 seconds
        setTimeout(() => {
            popup.style.display = 'none';
        }, 3000);
    });
}
function pmid_show(){


    const uniprotId = document.getElementById('search-bar').value;
    //const spinner = document.getElementById('loading-spinner');
    const spinner = document.getElementById('loading-spinner');

    // Show the spinner while fetching the data
    spinner.style.display = 'block';


    fetch('/get_pmid', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uniprot_id: uniprotId , source: "pubmed"})
    })
    .then(response => response.json())
    .then(data => {

        spinner.style.display = 'none';
        const popup = document.createElement('div');
        popup.id = 'pie-chart-popup';
        popup.innerHTML = `


                <div class="modal-content">
                    <span class="close-button" onclick="closeModal()">&times;</span>
                    <h2>PubMed IDs</h2>
                    <table id="pmid-table" border="1">
                    <thead>
                        <tr>

                            <th>PubMed ID</th>
                            <th>Title</th>

                            <th>Authors</th>
                            <th>DOI</th>

                        </tr>
                    </thead>
                    <tbody id="pmid-table-body">
                    </tbody>
                    </table>
                </div>

        `;
        document.body.appendChild(popup);
        const pmidTableBody = document.getElementById('pmid-table-body');
        pmidTableBody.innerHTML = ''; // Clear any previous PMIDs

        console.log(Object.keys(data.pmids).length);
        // Display PMIDs in the list
        if (Object.keys(data.pmids).length) {
            // Populate the table with PubMed IDs
            Object.values(data.pmids).forEach((pmid, index) => {
                const row = document.createElement('tr');

                const cell1 = document.createElement('td');
                const cell2 = document.createElement('td');

                const cell4 = document.createElement('td');
                const cell5 = document.createElement('td');
                const cell6 = document.createElement('td');


                cell1.textContent = pmid.pmid;
                cell2.textContent = pmid.title;

                cell4.textContent = pmid.authors.join(', '); // Join authors array into a string
                //cell5.textContent = pmid.doi;
                const doiLink = document.createElement('a');
                doiLink.href = pmid.link;
                doiLink.textContent = pmid.doi;
                cell5.appendChild(doiLink);

                row.appendChild(cell1);
                row.appendChild(cell2);

                row.appendChild(cell4);
                row.appendChild(cell5);
                //row.appendChild(cell6);
                pmidTableBody.appendChild(row);
            });

            // Show the modal
            //document.getElementById('pmid-modal').style.display = 'block';
        } else {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.textContent = 'No PMIDs found.';
            row.appendChild(cell);
            pmidTableBody.appendChild(row);
        }

        // Show the modal
        document.getElementById('pmid-modal').style.display = 'block';
    })
    .catch(error => {
        spinner.style.display = 'none';
        console.error('Error:', error);
    });


}
document.addEventListener("DOMContentLoaded", function() {
    const text = "DrugProtAI is an advanced tool designed to predict the druggability of proteins in humans by leveraging machine learning techniques. It utilizes features extracted from protein data to evaluate and predict the potential of a protein to be targeted by drugs.";
    let index = 0;
    const speed = 50; // Typing speed in milliseconds
    const typingText = document.getElementById("typing-text");

    function typeWriter() {
        if (index < text.length) {
            typingText.innerHTML += text.charAt(index);
            index++;
            setTimeout(typeWriter, speed);
        }
    }

    typeWriter();
});

function closeModal() {
    const modal = document.getElementById('pie-chart-popup');
    if (modal) {
        modal.parentNode.removeChild(modal);
    }
}
function di() {
    const thirdSection2 = document.getElementById('third-section');
    const about2 = document.getElementById('about');
    const team2 = document.getElementById('team');
    const contus2 = document.getElementById('contus');
    const help2 = document.getElementById('help');
    const ack2 = document.getElementById('ack');
    const citeus2 = document.getElementById('citeus');
    if(ack2){
        ack2.remove();
    }
    if(about2){
        about2.remove();
    }
    if(team2){
        team2.remove();
    }
    if(contus2){
        contus2.remove();
    }
    if(citeus2){
        citeus2.remove();
    }
    if(help2){
        help2.remove();
    }
    if (thirdSection2) {
        thirdSection2.remove(); // This will remove the element from the DOM
    }
    const uniprotId = document.getElementById('search-bar').value;
    console.log("Yo");
    const thirdSection = document.createElement('div');
    thirdSection.id = 'third-section';
    thirdSection.innerHTML = ` <div id="left-third-section">
            <h3>Druggability Index</h3>
            <p id="druggability-index"></p>
            <h6>The XGB model predicts the protein to be approved-druggable by this percentage.</h6>
        </div>
        <div id="vertical-line"></div> <!-- Add this line -->
        <div id="right-third-section">
            <p id="di-description">
                The Druggability-Index displays the probability of the selected protein being approved-druggable. Our models are trained on a total of 183 features for over 20,000 proteins.
            </p>
            <p id="model-description">
                We have trained multiple models on the protein dataset. Here, we display results obtained from training on XG-Boost and Random-Forest algorithms. You can choose to view the DI-scores for either model.
            </p>
            <div id="button-container">
                <button id="xgb-button" class = "button" onclick="di()" >DI USING XGB</button>
                <button id="rf-button" class = "button" onclick = "dirf()" >DI USING RF</button>
            </div>
        </div>`;
    const about = document.createElement('div');
    about.id = 'about';
    about.innerHTML =
    `
    <video autoplay muted loop id="background-video2">
            <source src="static/abouty.mp4" type="video/mp4">
            Your browser does not support the video tag.
        </video>
    `;
    const help = document.createElement('div');
    help.id = 'help';
    help.innerHTML=`
    <div id="help">
        <h1>FAQ's</h1>
        <div class="card2">
            <div class="left">
                <h2>What does DrugProtAI do?</h2>
            </div>
            <div class="right">
                <p>
                    DrugProtAI is a comprehensive web-based tool designed for evaluating the druggability of proteins. It allows users to search for a protein using its UniProt ID and provides detailed information, including feature contributions from machine learning models like XGBoost (XGB) and Random Forest (RF), druggability predictions, and an interactive 3D protein structure viewer. The platform integrates data from several knowledgebases such as UniProt, DrugBank, PubMed, and Alphafold, making it a powerful resource for researchers aiming to assess the potential of proteins as drug targets.
                </p>
            </div>
        </div>
        <div class="card2">
            <div class="left2">
                <p>
                    The Druggability Index (DI) of a protein is then defined as the probability of the given protein being approved-druggable
                </p>
            </div>
            <div class="right2">
                <h2>
                    What is the meaning of druggability index?
                </h2>
            </div>
        </div>
        <div class="card2">
            <div class="left">
                <h2>What are the features on which the tool has been developed?
                </h2>
            </div>
            <div class="right">
                <p>
                    DrugProtAI is built using 183 features from UniProt, including protein domains, PPI properties, PTM counts, glycosylation, subcellular locations, flexibility sequence properties, and physicochemical properties. Additional features include latent values from an autoencoder and GDPC encodings. These features capture diverse biological and physicochemical aspects critical for predicting protein druggability.
                </p>
            </div>
        </div>
        <div class="card2">
            <div class="left2">
                <p>
                    DrugProtAI uses two machine learning models: XGBoost (XGB) and Random Forest (RF). These models are trained on 183 protein features, including biological, physicochemical, and structural properties. The reliability of these models is ensured through rigorous cross-validation and testing, with feature contributions visualized via pie charts. These models are widely used in bioinformatics for their accuracy and robustness in classification tasks like druggability prediction.
                </p>
            </div>
            <div class="right2"><h2>
                What model is employed to get the result? How reliable is the model?
            </h2></div>
        </div>
        <div class="card2">
            <div class="left"><h2>
                Does it work on any protein or specific to a species?
            </h2></div>
            <div class="right"><p>
                DrugProtAI is primarily designed to work with human proteins, as its dataset consists of 20,273 human proteins verified by SwissProt from UniProtKB. While the tool's models and features are optimized for human proteins, extending it to other species would require additional training and dataset adjustments.
            </p>
        </div>
        </div>

        <!-- Add more content here as needed -->
    </div>
    `
    const team = document.createElement('div');
    team.id = 'team';
    team.innerHTML=
    `

    <img src="/static/tea.svg" alt="About Image" id = "imgeee">
    `;
    const ack = document.createElement('div');
        ack.id = 'ack';
        ack.innerHTML=
        `

        <div id = "ack">
            <h2 class="about-heading">Acknowledgements</h2>



            <div id = "overall">
                <div id = "acky">
                    <div id = "subacky">
                        <a href="https://www.uniprot.org/" target="_blank" class="footer-link">
                        <img src="static/uni.png" alt="Image 1" class="footer-image">
                        </a>
                        <p>UniProt</p>
                    </div>
                    <div id = "subacky">
                        <a href="https://go.drugbank.com/" target="_blank" class="footer-link">
                        <img src="static/drugbank.png" alt="Image 1" class="footer-image">
                        </a>
                        <p>DrugBank</p>

                    </div>
                    <div id = "subacky">
                        <a href="https://deepmind.google/technologies/alphafold/" target="_blank" class="footer-link">
                        <img src="static/alpha.png" alt="Image 1" class="footer-image">
                        </a>
                        <p>AlphaFold</p>
                    </div>
                    <div id = "subacky">
                        <a href="https://www.canva.com/" target="_blank" class="footer-link">
                        <img src="static/canva.png" alt="Image 1" class="footer-image">
                        </a>
                        <p>Canva</p>
                    </div>
                </div>
                <div id = "acky2">
                    <div id = "subacky">

                        <img src="static/ack1.jpg" alt="Image 1" class="footer-image2">

                        <p>Suhisna Dutta<br>
                            IIT Bombay</p>
                    </div>
                    <div id = "subacky">

                        <img src="static/ack2.png" alt="Image 1" class="footer-image2">

                        <p> Nirjhar Banerjee<br>
                            IIT Bombay
                        </p>

                    </div>
                </div>
            </div>
        </div>

        `;

    const contus = document.createElement('div');
    contus.id = 'contus';
    contus.innerHTML=
    `
    <div id="contus">
        <h2 class="about-heading">Contact Us</h2>
        <div class = "footer">
            <div class="footer-left"></div>
            <div class="footer-middle">
            <a href="https://www.bio.iitb.ac.in/~sanjeeva/facility/" target="_blank" class="footer-link">
            <img src="static/massfiitb.png" alt="Image 1" class="footer-image">
            </a>
            <a href="https://www.iitb.ac.in/" target="_blank" class="footer-link">
            <img src="static/iitb.png" alt="Image 2" class="footer-image">
            </a>
            </div>
            <div class="footer-right"></div>

        </div>

        <!-- Add more content here as needed -->
    </div>
    `;


    const citeus = document.createElement('div');
    citeus.id = 'citeus';
    citeus.innerHTML=
    `
    <div id="citeus">
        <h2 class="about-heading">Cite Us</h2>
        <div class = "footer2">
            <h4>
            If you are using DrugProtAI, please cite us –
            <br>
            Ankit Halder, Sabyasachi Samantaray, Sahil Barbade, Aditya Gupta, Sanjeeva Srivastava,
            <i>DrugProtAI: A machine learning–driven approach for predicting protein druggability through feature engineering and robust partition-based ensemble methods</i>,
            <b>Briefings in Bioinformatics</b>, Volume 26, Issue 4, July 2025, bbaf330,
            <a href="https://doi.org/10.1093/bib/bbaf330" target="_blank">https://doi.org/10.1093/bib/bbaf330</a>
        </h4>
        </div>
    </div>
    `;


    fetch('/get_mean_probability', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ protein_id: uniprotId })
    })
    .then(response => response.json())
    .then(data => {

        const targetValue = (data.mean_probability*100).toFixed(2);
        animatePercentage(document.getElementById('druggability-index'), targetValue, 1000);
        // document.getElementById('druggability-index').textContent = (data.mean_probability*100).toFixed(2) + '%';

        document.getElementById('third-section').style.display = 'flex';
        document.getElementById('third-section').scrollIntoView({
            behavior: 'smooth'
        });

    })
    .catch(error => {
        console.error('Error:', error);
    });

    document.body.appendChild(thirdSection);
    document.body.appendChild(about);
    document.body.appendChild(help);
    document.body.appendChild(team);
    document.body.appendChild(ack);
    document.body.appendChild(contus);
    document.body.appendChild(citeus);

};

function dirf() {
    const thirdSection2 = document.getElementById('third-section');
    const about2 = document.getElementById('about');
    const team2 = document.getElementById('team');
    const contus2 = document.getElementById('contus');
    const citeus2 = document.getElementById('citeus');
    const help2 = document.getElementById('help');
    const ack2 = document.getElementById('ack');
    if(ack2){
        ack2.remove();
    }
    if (thirdSection2) {
        thirdSection2.remove(); // This will remove the element from the DOM
    }
    if(about2){
        about2.remove();
    }
    if(team2){
        team2.remove();
    }
    if(contus2){
        contus2.remove();
    }
    if(citeus2){
        citeus2.remove();
    }
    if(help2){
        help2.remove();
    }
    const uniprotId = document.getElementById('search-bar').value;
    console.log("Yo");
    const thirdSection = document.createElement('div');
    thirdSection.id = 'third-section';
    thirdSection.innerHTML = ` <div id="left-third-section">
            <h3>Druggability Index</h3>
            <p id="druggability-index"></p>
            <h6>The RF model predicts the protein to be approved-druggable by this percentage.</h6>
        </div>
        <div id="vertical-line"></div> <!-- Add this line -->
        <div id="right-third-section">
            <p id="di-description">
                The Druggability-Index displays the probability of the selected protein being approved-druggable. Our models are trained on a total of 183 features for over 20,000 proteins.
            </p>
            <p id="model-description">
                We have trained multiple models on the protein dataset. Here, we display results obtained from training on XG-Boost and Random-Forest algorithms. You can choose to view the DI-scores for either model.
            </p>
            <div id="button-container">
                <button id="xgb-button" class = "button" onclick="di()" >DI USING XGB</button>
                <button id="rf-button" class = "button" onclick = "dirf()">DI USING RF</button>
            </div>
        </div>`;
        const about = document.createElement('div');
        about.id = 'about';
        about.innerHTML =
        `

        <video autoplay muted loop id="background-video2">
            <source src="static/abouty.mp4" type="video/mp4">
            Your browser does not support the video tag.
        </video>

        `;
        const help = document.createElement('div');
        help.id = 'help';
        help.innerHTML=`
        <div id="help">
        <h1>FAQ's</h1>
        <div class="card2">
            <div class="left">
                <h2>What does DrugProtAI do?</h2>
            </div>
            <div class="right">
                <p>
                    DrugProtAI is a comprehensive web-based tool designed for evaluating the druggability of proteins. It allows users to search for a protein using its UniProt ID and provides detailed information, including feature contributions from machine learning models like XGBoost (XGB) and Random Forest (RF), druggability predictions, and an interactive 3D protein structure viewer. The platform integrates data from several knowledgebases such as UniProt, DrugBank, PubMed, and Alphafold, making it a powerful resource for researchers aiming to assess the potential of proteins as drug targets.
                </p>
            </div>
        </div>
        <div class="card2">
            <div class="left2">
                <p>
                    The Druggability Index (DI) of a protein is then defined as the probability of the given protein being approved-druggable
                </p>
            </div>
            <div class="right2">
                <h2>
                    What is the meaning of druggability index?
                </h2>
            </div>
        </div>
        <div class="card2">
            <div class="left">
                <h2>What are the features on which the tool has been developed?
                </h2>
            </div>
            <div class="right">
                <p>
                    DrugProtAI is built using 183 features from UniProt, including protein domains, PPI properties, PTM counts, glycosylation, subcellular locations, flexibility sequence properties, and physicochemical properties. Additional features include latent values from an autoencoder and GDPC encodings. These features capture diverse biological and physicochemical aspects critical for predicting protein druggability.
                </p>
            </div>
        </div>
        <div class="card2">
            <div class="left2">
                <p>
                    DrugProtAI uses two machine learning models: XGBoost (XGB) and Random Forest (RF). These models are trained on 183 protein features, including biological, physicochemical, and structural properties. The reliability of these models is ensured through rigorous cross-validation and testing, with feature contributions visualized via pie charts. These models are widely used in bioinformatics for their accuracy and robustness in classification tasks like druggability prediction.
                </p>
            </div>
            <div class="right2"><h2>
                What model is employed to get the result? How reliable is the model?
            </h2></div>
        </div>
        <div class="card2">
            <div class="left"><h2>
                Does it work on any protein or specific to a species?
            </h2></div>
            <div class="right"><p>
                DrugProtAI is primarily designed to work with human proteins, as its dataset consists of 20,273 human proteins verified by SwissProt from UniProtKB. While the tool's models and features are optimized for human proteins, extending it to other species would require additional training and dataset adjustments.
            </p>
        </div>
        </div>

        <!-- Add more content here as needed -->
    </div>
        `
        const team = document.createElement('div');
        team.id = 'team';
        team.innerHTML=
        `

        <img src="/static/tea.svg" alt="About Image" id = "imgeee">

        `;
        const ack = document.createElement('div');
        ack.id = 'ack';
        ack.innerHTML=
        `
        <div id = "ack">
            <h2 class="about-heading">Acknowledgements</h2>



            <div id = "overall">
                <div id = "acky">
                    <div id = "subacky">
                        <a href="https://www.uniprot.org/" target="_blank" class="footer-link">
                        <img src="static/uni.png" alt="Image 1" class="footer-image">
                        </a>
                        <p>UniProt</p>
                    </div>
                    <div id = "subacky">
                        <a href="https://go.drugbank.com/" target="_blank" class="footer-link">
                        <img src="static/drugbank.png" alt="Image 1" class="footer-image">
                        </a>
                        <p>DrugBank</p>

                    </div>
                    <div id = "subacky">
                        <a href="https://deepmind.google/technologies/alphafold/" target="_blank" class="footer-link">
                        <img src="static/alpha.png" alt="Image 1" class="footer-image">
                        </a>
                        <p>AlphaFold</p>
                    </div>
                    <div id = "subacky">
                        <a href="https://www.canva.com/" target="_blank" class="footer-link">
                        <img src="static/canva.png" alt="Image 1" class="footer-image">
                        </a>
                        <p>Canva</p>
                    </div>
                </div>
                <div id = "acky2">
                    <div id = "subacky">

                        <img src="static/ack1.jpg" alt="Image 1" class="footer-image2">

                        <p>Suhisna Dutta<br>
                            IIT Bombay</p>
                    </div>
                    <div id = "subacky">

                        <img src="static/ack2.png" alt="Image 1" class="footer-image2">

                        <p> Nirjhar Banerjee<br>
                            IIT Bombay
                        </p>

                    </div>
                </div>
            </div>
        </div>
        `;
        const contus = document.createElement('div');
        contus.id = 'contus';
        contus.innerHTML=
        `
        <div id="contus">
        <h2 class="about-heading">Contact Us</h2>
        <div class = "footer">
            <div class="footer-left"></div>
            <div class="footer-middle">
            <a href="https://www.bio.iitb.ac.in/~sanjeeva/facility/" target="_blank" class="footer-link">
            <img src="static/massfiitb.png" alt="Image 1" class="footer-image">
            </a>
            <a href="https://www.iitb.ac.in/" target="_blank" class="footer-link">
            <img src="static/iitb.png" alt="Image 2" class="footer-image">
            </a>
            </div>
            <div class="footer-right"></div>

        </div>

        <!-- Add more content here as needed -->
    </div>
        `;

        const citeus = document.createElement('div');
    citeus.id = 'citeus';
    citeus.innerHTML=
    `
    <div id="citeus">
        <h2 class="about-heading">Cite Us</h2>
        <div class = "footer2">
            <h4>
            If you are using DrugProtAI, please cite us –
            <br>
            Ankit Halder, Sabyasachi Samantaray, Sahil Barbade, Aditya Gupta, Sanjeeva Srivastava,
            <i>DrugProtAI: A machine learning–driven approach for predicting protein druggability through feature engineering and robust partition-based ensemble methods</i>,
            <b>Briefings in Bioinformatics</b>, Volume 26, Issue 4, July 2025, bbaf330,
            <a href="https://doi.org/10.1093/bib/bbaf330" target="_blank">https://doi.org/10.1093/bib/bbaf330</a>
        </h4>
        </div>
    </div>
    `;

    fetch('/get_mean_probability_2', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ protein_id: uniprotId })
    })
    .then(response => response.json())
    .then(data => {

        const targetValue = (data.mean_probability*100).toFixed(2);
        var value = document.getElementById('druggability-index');
        animatePercentage(value, targetValue, 1000);
        // document.getElementById('druggability-index').textContent = (data.mean_probability*100).toFixed(2) + '%';

        document.getElementById('third-section').style.display = 'flex';
        document.getElementById('third-section').scrollIntoView({
            behavior: 'smooth'
        });

    })
    .catch(error => {
        console.error('Error:', error);
    });
    document.body.appendChild(thirdSection);
    document.body.appendChild(about);
    document.body.appendChild(help);
    document.body.appendChild(team);
    document.body.appendChild(ack)
    document.body.appendChild(contus);
    document.body.appendChild(citeus);
};



function showPiePopup() {
    // Create and display the full-screen pop-up
    const popup = document.createElement('div');
    popup.id = 'pie-chart-popup';
    popup.innerHTML = `
        <div class="popup-content2">
            <button class="close" onclick="closePieChartPopup()">&times;</button>
            <h3 class = "prot_feat" >Protein Features Pie Chart</h3>
            <div class = "chart-container">
                <canvas id="pie-chart"></canvas>
                <div class="chart-legend"></div>
            </div>
            <div class="bottom-section">
                <div class="label-container">
                    <label for="top-features-select">Number of Top Features:</label>
                    <select id="top-features-select" onchange="updatePieChart()">
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20" selected>20</option>
                        <option value="25">25</option>
                        <option value="30">30</option>
                        <option value="35">35</option>
                        <option value="40">40</option>
                        <option value="45">45</option>
                        <option value="50">50</option>
                        <option value="55">55</option>
                        <option value="60">60</option>
                    </select>

                    <select id="top-features-select2" onchange="updatePieChart2()" style="display:none;">
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20" selected>20</option>
                        <option value="25">25</option>
                        <option value="30">30</option>
                        <option value="35">35</option>
                        <option value="40">40</option>
                        <option value="45">45</option>
                        <option value="50">50</option>
                        <option value="55">55</option>
                        <option value="60">60</option>
                    </select>
                </div>

                <div class="button-container">
                    <button id="xgb_pie" class="button" onClick="renderPieChart(20)">XGB</button>
                    <button id="rf_pie" class="button" onClick="renderPieChart2(20)">RF</button>
                </div>
            </div>

        </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.querySelector('.popup-content2').classList.add('active');
    }, 10);

    // Render the pie chart
    renderPieChart(20);
}

function showPiePopup2() {
    // Create and display the full-screen pop-up
    const popup = document.createElement('div');
    popup.id = 'pie-chart-popup';
    popup.innerHTML = `
        <div class="popup-content2">
            <button class="close" onclick="closePieChartPopup()">&times;</button>
            <h3>Protein Features Pie Chart</h3>
            <button id="xgb_pie" class = "button" onClick="renderPieChart()">XGB</button>
            <button id = "rf_pie" class = "button">RF</button>
            <div class = "label-container"
                <label for="top-features-select2">Number of Top Features:</label>
                <select id="top-features-select2" onchange="updatePieChart2()">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20" selected>20</option>
                    <option value="25">25</option>
                    <option value="30">30</option>
                    <option value="35">35</option>
                    <option value="40">40</option>
                    <option value="45">45</option>
                    <option value="50">50</option>
                    <option value="55">55</option>
                    <option value="60">60</option>
            </select>
            </div>
            <canvas id="pie-chart"></canvas>
            <div class="chart-legend"></div>
        </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.querySelector('.popup-content2').classList.add('active');
    }, 10);

    // Render the pie chart
    renderPieChart2(20);
}

function closePieChartPopup() {
    const popup = document.getElementById('pie-chart-popup');
    if (popup) {
        document.body.removeChild(popup);
    }
    // const popupContent = document.getElementById('.popup-content2');
    // if (popupContent) {
    //     popupContent.classList.add('closing');
    //     setTimeout(() => {
    //         const popup = document.getElementById('.pie-chart-popup');
    //         if (popup) {
    //             document.body.removeChild(popup);
    //         }
    //     }, 500); // Match the delay with the CSS transition duration
    //     document.body.removeChild(popup);
    // }
}

function updatePieChart() {
    const topFeaturesCount = document.getElementById('top-features-select').value;
    renderPieChart(parseInt(topFeaturesCount));
}

function updatePieChart2() {
    const topFeaturesCount = document.getElementById('top-features-select2').value;
    renderPieChart2(parseInt(topFeaturesCount));
}


function renderPieChart(topFeaturesCount) {
    var section = document.getElementById('top-features-select');
    if (section.style.display === 'none') {
        section.style.display = 'block';
    } else {
        section.style.display = 'block';
    }
    var section = document.getElementById('top-features-select2');
    if (section.style.display === 'none') {
        section.style.display = 'none';
    } else {
        section.style.display = 'none';
    }

    fetch(`/api/pie-chart-data?top=${topFeaturesCount}`) // API endpoint to fetch data
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('pie-chart').getContext('2d');

            if (pieChartInstance) {
                pieChartInstance.destroy();
            }

            // Top 20 features and "Others"
            const topFeatures = data.topFeatures;
            const others = data.others;
            const featureColors = [...topFeatures.map(() => generateRandomColor()), generateRandomColor()];
            const chartData = {
                labels: [...topFeatures.map(feature => feature.name), 'Others'],
                datasets: [{
                    data: [...topFeatures.map(feature => feature.score), others.score],
                    backgroundColor: featureColors,
                    borderColor: featureColors.map(color => color.replace('0.2', '1')), // Make borders darker
                    borderWidth: 1
                    // backgroundColor: [...topFeatures.map(() => 'rgba(75, 192, 192, 0.2)'), 'rgba(153, 102, 255, 0.2)']
                }]
            };


            pieChartInstance = new Chart(ctx, {
                type: 'pie',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (context.parsed) {
                                        // label += ': ' + context.parsed + '%';
                                        label += ': ' + context.raw.toFixed(2) + '%'; // Adjusted for percentage
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        });
}

function renderPieChart2(topFeaturesCount) {

    var section = document.getElementById('top-features-select');
    if (section.style.display === 'none') {
        section.style.display = 'none';
    } else {
        section.style.display = 'none';
    }
    var section = document.getElementById('top-features-select2');
    if (section.style.display === 'none') {
        section.style.display = 'block';
    } else {
        section.style.display = 'block';
    }
    fetch(`/api/pie-chart-data_2?top=${topFeaturesCount}`) // API endpoint to fetch data
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('pie-chart').getContext('2d');

            if (pieChartInstance) {
                pieChartInstance.destroy();
            }

            // Top 20 features and "Others"
            const topFeatures = data.topFeatures;
            const others = data.others;
            const featureColors = [...topFeatures.map(() => generateRandomColor()), generateRandomColor()];
            const chartData = {
                labels: [...topFeatures.map(feature => feature.name), 'Others'],
                datasets: [{
                    data: [...topFeatures.map(feature => feature.score), others.score],
                    backgroundColor: featureColors,
                    borderColor: featureColors.map(color => color.replace('0.2', '1')), // Make borders darker
                    borderWidth: 1
                    // backgroundColor: [...topFeatures.map(() => 'rgba(75, 192, 192, 0.2)'), 'rgba(153, 102, 255, 0.2)']
                }]
            };


            pieChartInstance = new Chart(ctx, {
                type: 'pie',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (context.parsed) {
                                        // label += ': ' + context.parsed + '%';
                                        label += ': ' + context.raw.toFixed(2) + '%'; // Adjusted for percentage
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        });
}




function showDrugPopup() {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'block';
    const drugyResponse = fetch(`/api/drugs/${document.getElementById('search-bar').value}`)
        .then(response => response.json())
        .then(drugyData => {
            spinner.style.display = 'none';
            const drugTable = createDrugTable(drugyData.drugs, drugyData.has_drugs);
            //const drugTable = createDrugTable(drugyData.drugs);
            const popup = document.createElement('div');
            popup.classList.add('popup');
            popup.innerHTML = `
                <div class="popup-content">
                    <span class="close" onclick="closeDrugPopup()">&times;</span>
                    <div class="popup-header"><h2>Drug Information</h2></div>
                    <div class="popup-body">${drugTable}</div>

                </div>
            `;
            document.body.appendChild(popup);

            setTimeout(() => {
                popup.querySelector('.popup-content').classList.add('active');
            }, 10);
        });
}

function closeDrugPopup() {
    const popupContent = document.querySelector('.popup-content');
    if (popupContent) {
        popupContent.classList.add('closing');
        setTimeout(() => {
            const popup = popupContent.closest('.popup');
            if (popup) {
                document.body.removeChild(popup);
            }
        }, 500); // Match the delay with the CSS transition duration

        document.body.removeChild(popup);
    }
}



function createDrugTable(drugyData,flag) {
    let tableHTML = '<table><tr><th>Drug ID</th><th>Status</th><th>Pharmacological Action</th><th>Type</th></tr>';
    console.log(flag);
    if(flag){
        for (const [name, drugDetails] of Object.entries(drugyData)) {
            console.log(drugDetails);
            tableHTML += `<tr>
                                <td><a href="${drugDetails.hlink}" target="_blank">${name}</a></td>
                                <td>${drugDetails.status}</td>
                                <td>${drugDetails.action}</td>
                                <td>${drugDetails.type}</td>

                              </tr>`;
    }
    }
    else{

        tableHTML += `<tr>
            <td colspan="5">No Drug Information available !</td>
        </tr>`;
    }
    // else{
    //         const row = document.createElement('tr');
    //         const cell = document.createElement('td');
    //         cell.colSpan = 2;
    //         cell.textContent = 'No PMIDs found.';
    //         row.appendChild(cell);
    //         tableHTML.appendChild(row);
    // }

    tableHTML += '</table>';
    return tableHTML;
}

function displayModelSelection(models) {
    const modelSelectionDiv = document.getElementById('model-selection');
    modelSelectionDiv.innerHTML = `
        <h3>Select a Model to Get Score</h3>
        <select id="model-select">
            ${models.map(model => `<option value="${model}">${model}</option>`).join('')}
        </select>
        <button onclick="getScore()">Get Score</button>
    `;
}

function toggleDropdown(dropdownId) {
    // Close other dropdowns
    document.querySelectorAll('.dropdown-content').forEach(dropdown => {
        if (dropdown.id !== dropdownId) {
            dropdown.style.display = 'none';
        }
    });

    // Toggle the clicked dropdown
    const dropdown = document.getElementById(dropdownId);
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function downloadFile(fileName) {
    // Simulate a file download - update this URL as needed
    const link = document.createElement('a');

    link.href = `/static/${fileName}`;

    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


async function getScore() {
    const selectedModel = document.getElementById('model-select').value;
    const uniprotId = document.getElementById('search-bar').value;
    const response = await fetch(`/api/score/${uniprotId}?model=${selectedModel}`);
    const scoreData = await response.json();
    alert(`The score for ${selectedModel} is ${scoreData.score}`);
}

async function fetchAlphaFoldData(pdb_url) {
    render3DStructure(pdb_url);

    // const response = await fetch(`/api/alphafold/${pdbId}`);
    // const data = await response.json();

    // if (data.pdb_url) {
    //     render3DStructure(data.pdb_url);
    // } else {
    //     document.getElementById('msp-container').innerHTML = "<p>3D structure not available.</p>";
    // }
}

async function fetchSuggestions(query) {
    const response = await fetch(`/api/search?query=${query}`);
    const suggestions = await response.json();
    return suggestions;
}

document.getElementById('search-bar').addEventListener('input', async function() {
    const query = this.value;
    const suggestions = await fetchSuggestions(query);
    const suggestionsBox = document.getElementById('suggestions-box');
    suggestionsBox.innerHTML = ''; // Clear previous suggestions

    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        //div.textContent = suggestion;
        div.innerHTML = `<strong>${suggestion.uniprot_id}</strong> - ${suggestion.protein_name}`;
        div.classList.add('suggestion-item');
        div.onclick = function() {
            document.getElementById('search-bar').value = suggestion.uniprot_id;
            suggestionsBox.innerHTML = '';
        };
        suggestionsBox.appendChild(div);
    });
    //console.log(suggestions);  // You can display these suggestions in a dropdown below the search bar
});


function render3DStructure(pdbUrl) {
    const viewer = $3Dmol.createViewer("msp-container", {
        defaultcolors: $3Dmol.rasmolElementColors
    });

    viewer.addModelFromURI(pdbUrl, "pdb", function() {
        viewer.setStyle({}, {cartoon: {color: 'red'}});
        viewer.zoomTo();
        viewer.render();
    });
}

function initializeMolstarViewer(pdbUrl) {
    const viewerDiv = document.getElementById('viewer');
    const viewer = new Molstar.Viewer(viewerDiv);

    viewer.loadStructure({
        url: pdbUrl,
        format: 'pdb',
    }).then(() => {
        viewer.setView('full');
    }).catch(error => {
        console.error('Error loading structure:', error);
    });
}

function details() {
    /*let proteinID = /* Get the UniProt ID entered by the user */
    const uniprotId = document.getElementById('search-bar').value;
    let proteinID = uniprotId;
    let currentPage = 1;
    let searchFeature = "";

    function loadFeatures(page) {
        fetch('/fetch_features', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ protein_id: proteinID, page: page })
        })
        .then(response => response.json())
        .then(data => {




            const featuresContent = document.getElementById('features-content');
            featuresContent.innerHTML = '';  // Clear previous content

            if (Object.keys(data.data).length === 0) {
            const popup = document.getElementById('no-data-popup');
            popup.style.display = 'block';
            setTimeout(() => {
                popup.style.display = 'none';
            }, 3000);
            return;  // Don't proceed further
        }

            for (const [groupName, features] of Object.entries(data.data)) {
                // Create a table for each group
                let table = document.createElement('table');
                table.setAttribute('border', '1');
                table.style.width = '100%';
                table.style.marginBottom = '20px';  // Add space between tables

                // Table header
                let thead = document.createElement('thead');
                let headerRow = document.createElement('tr');
                let th1 = document.createElement('th');
                th1.textContent = 'Feature Name';
                let th2 = document.createElement('th');
                th2.textContent = 'Feature Value';
                headerRow.appendChild(th1);
                headerRow.appendChild(th2);
                thead.appendChild(headerRow);
                table.appendChild(thead);

                // Table body
                let tbody = document.createElement('tbody');
                for (const feature of features) {
                    let row = document.createElement('tr');

                    let featureNameCell = document.createElement('td');
                    let featureName = Object.keys(feature)[0];  // Get the feature name
                    featureNameCell.textContent = featureName;

                    let featureValueCell = document.createElement('td');
                    featureValueCell.textContent = feature[featureName];  // Get the feature value

                    row.appendChild(featureNameCell);
                    row.appendChild(featureValueCell);
                    tbody.appendChild(row);
                }

                table.appendChild(tbody);

                // Add a title for the group above the table
                let groupTitle = document.createElement('h3');
                groupTitle.textContent = groupName;
                groupTitle.style.textAlign = 'center';

                // Append the group title and table to the content area
                featuresContent.appendChild(groupTitle);
                featuresContent.appendChild(table);
            }

            document.getElementById('page-info').textContent = `Page ${page} of ${data.total_pages}`;
            currentPage = page;

            document.getElementById('prev-page').disabled = page <= 1;
            document.getElementById('next-page').disabled = page >= data.total_pages;
            // for (const [feature, value] of Object.entries(data.data)) {


            //     let featureItem = document.createElement('div');
            //     featureItem.className = 'feature-item';
            //     let formattedFeature = feature.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

            //     featureItem.innerHTML = `
            //         <div class="feature-name" style="font-weight: bold; text-align: center; margin-bottom: 10px;">
            //             ${formattedFeature}:
            //         </div>

            //         <div class="feature-value" style="text-align: center;">
            //             ${value}
            //         </div>
            //     `;

            //     // Append the feature item to the content area
            //     featuresContent.appendChild(featureItem);
            // }

            // document.getElementById('page-info').textContent = `Page ${page} of ${data.total_pages}`;
            // currentPage = page;

            // document.getElementById('prev-page').disabled = page <= 1;
            // document.getElementById('next-page').disabled = page >= data.total_pages;
        });
    }
    const popup = document.createElement('div');
    popup.id = 'pie-chart-popup';
    popup.innerHTML = `
        <div id="features-popup" class="popup-overlay">
            <div class="popup-content3">
                <div id="divone">
                <input type="text" id="search-bar2" class = "search-input2" placeholder="Search Protein Feature" onkeydown="checkEnter(event)">
                <button id="search-button5" class = "search-btn5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="feather feather-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </button>
                <button id="close-features-popup" onClick = endit() class="close">&times;</button>
                </div>
                <div id="features-content" class = "grid-container">
                    <!-- Dynamic content will be loaded here -->
                </div>
                <div id="pagination">
                    <button id="prev-page">Previous</button>
                    <span id="page-info" ></span>
                    <button id="next-page">Next</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
    // const popup = document.createElement('div');
    // popup.id = 'pie-chart-popup';
    // popup.innerHTML = `
    //     <div id="features-popup" class="popup-overlay">
    //         <div class="popup-content3">
    //             <button id="close-features-popup" onClick = endit() class="close">&times;</button>
    //             <input type="text" id="search-feature" placeholder="Search for a feature">
    //             <button id="search-button" class = "button">Search</button>
    //             <div id="features-content" class = "grid-container">
    //                 <!-- Dynamic content will be loaded here -->
    //             </div>
    //             <div id="pagination">
    //                 <button id="prev-page">Previous</button>
    //                 <span id="page-info"></span>
    //                 <button id="next-page">Next</button>
    //             </div>
    //         </div>
    //     </div>
    // `;
    // document.body.appendChild(popup);

    // function searchy() {
    //     console.log("Yo");
    //     col_names = ['Sequence_Length', 'Molecular_Weight', 'GRAVY', 'Isoelectric_Point', 'Instability_Index', 'Aromaticity', 'Charge_at_7', 'is_druggable', 'is_approved_druggable', 'Amino_Acid_Percent_A', 'Amino_Acid_Percent_C', 'Amino_Acid_Percent_D', 'Amino_Acid_Percent_E', 'Amino_Acid_Percent_F', 'Amino_Acid_Percent_G', 'Amino_Acid_Percent_H', 'Amino_Acid_Percent_I', 'Amino_Acid_Percent_K', 'Amino_Acid_Percent_L', 'Amino_Acid_Percent_M', 'Amino_Acid_Percent_N', 'Amino_Acid_Percent_P', 'Amino_Acid_Percent_Q',
    //         'Amino_Acid_Percent_R', 'Amino_Acid_Percent_S', 'Amino_Acid_Percent_T', 'Amino_Acid_Percent_V', 'Amino_Acid_Percent_W', 'Amino_Acid_Percent_Y', 'Molar_Extinction_Coefficient_1', 'Molar_Extinction_Coefficient_2', 'Secondary_Structure_helix', 'Secondary_Structure_turn', 'Secondary_Structure_sheet', 'aliphatic_aliphatic', 'aliphatic_positive', 'aliphatic_negative', 'aliphatic_uncharged', 'aliphatic_aromatic', 'positive_aliphatic', 'positive_positive', 'positive_negative', 'positive_uncharged', 'positive_aromatic', 'negative_aliphatic', 'negative_positive', 'negative_negative',
    //         'negative_uncharged', 'negative_aromatic', 'uncharged_aliphatic', 'uncharged_positive', 'uncharged_negative', 'uncharged_uncharged', 'uncharged_aromatic', 'aromatic_aliphatic', 'aromatic_positive', 'aromatic_negative', 'aromatic_uncharged', 'aromatic_aromatic', 'Glycosylation', 'Cross_link', 'Modified_residue', 'Signal', 'Disulfide_bond', 'O_linked', 'N_linked', 'C_linked', 'N_beta_linked', 'S_linked', 'O_alpha_linked', 'binary_count', 'binary_experimental_count', 'xeno_count', 'xeno_experimental_count', 'degree_binary', 'degree_xeno', 'degree_all', 'avg_degree_nbr_binary',
    //         'avg_degree_nbr_xeno', 'avg_degree_nbr_all', 'strongly_connected_component_sizes_all', 'cytoplasmic_vesicle', 'nucleus', 'melanosome', 'lateral_cell_membrane', 'secreted', 'vacuole', 'vesicle', 'synapse', 'presynapse', 'cleavage_furrow', 'endomembrane_system', 'late_endosome', 'recycling_endosome', 'midbody', 'cytoplasmic_granule', 'endosome', 'early_endosome', 'perikaryon', 'membrane', 'peroxisome', 'cell_membrane', 'cell_junction', 'postsynapse', 'cytoplasm', 'lipid_droplet', 'rough_endoplasmic_reticulum', 'zymogen_granule', 'smooth_endoplasmic_reticulum_membrane', 'inflammasome', 'target_cell_membrane', 'preautophagosomal_structure', 'cornified_envelope', 'mitochondrion', 'microsome', 'sarcoplasmic_reticulum', 'vacuole_membrane', 'cell_surface', 'dynein_axonemal_particle', 'golgo_apparatus', 'parasitophorous_vacuole', 'extracellular_vessicle', 'cell_projection', 'photoreceptor', 'virion', 'cytolitic_granule', 'golgi_outpost', 'myelin_membrane', 'endoplasmic_reticulum', 'chromosome', 'lysosome', 'rrm', 'acidic_residues', 'ph', 'krab', 'pdz', 'btb', 'nuclear_localization_signal', 'fibronectin_type_iii', 'disordered', 'ig_like_v_type', 'ef_hand', 'sh3', 'ig_like', 'pro_residues', 'protein_kinase', 'ig_like_c2_type', 'basic_and_acidic_residues', 'basic_residues', 'egf_like', 'polar_residues', 'Mean', 'Mode', 'Min', 'Max', 'Variance', 'Median', 'Standard_Deviation', 'Range', 'Min_gap', 'Max_gap', 'Average_gap', 'Min_2_hop_gap', 'Max_2_hop_gap', 'Average_2_hop_gap', 'Latent_Value_1', 'Latent_Value_2', 'Latent_Value_3', 'Latent_Value_4', 'Latent_Value_5', 'Latent_Value_6', 'Latent_Value_7', 'Latent_Value_8', 'Latent_Value_9', 'Latent_Value_10', 'Latent_Value_11', 'Latent_Value_12', 'Latent_Value_13', 'Latent_Value_14', 'Latent_Value_15', 'Latent_Value_16', 'Latent_Value_17', 'Latent_Value_18', 'Latent_Value_19', 'Latent_Value_20'];
    //     searchFeature = document.getElementById('search-feature').value.toUpperCase().replace(/\s+/g, '_');
    //     const featureIndex = col_names.findIndex(name => name.toUpperCase() === searchFeature);
    //     if (featureIndex !== -1) {
    //         const targetPage = Math.floor((featureIndex - 1) / 9) + 1;
    //         loadFeatures(targetPage);
    //     } else {
    //         alert("Feature not found!");
    //     }
    // };
    // col_names = ['Sequence_Length', 'Molecular_Weight', 'GRAVY', 'Isoelectric_Point', 'Instability_Index', 'Aromaticity', 'Charge_at_7', 'is_druggable', 'is_approved_druggable', 'Amino_Acid_Percent_A', 'Amino_Acid_Percent_C', 'Amino_Acid_Percent_D', 'Amino_Acid_Percent_E', 'Amino_Acid_Percent_F', 'Amino_Acid_Percent_G', 'Amino_Acid_Percent_H', 'Amino_Acid_Percent_I', 'Amino_Acid_Percent_K', 'Amino_Acid_Percent_L', 'Amino_Acid_Percent_M', 'Amino_Acid_Percent_N', 'Amino_Acid_Percent_P', 'Amino_Acid_Percent_Q',
    //              'Amino_Acid_Percent_R', 'Amino_Acid_Percent_S', 'Amino_Acid_Percent_T', 'Amino_Acid_Percent_V', 'Amino_Acid_Percent_W', 'Amino_Acid_Percent_Y', 'Molar_Extinction_Coefficient_1', 'Molar_Extinction_Coefficient_2', 'Secondary_Structure_helix', 'Secondary_Structure_turn', 'Secondary_Structure_sheet', 'aliphatic_aliphatic', 'aliphatic_positive', 'aliphatic_negative', 'aliphatic_uncharged', 'aliphatic_aromatic', 'positive_aliphatic', 'positive_positive', 'positive_negative', 'positive_uncharged', 'positive_aromatic', 'negative_aliphatic', 'negative_positive', 'negative_negative',
    //              'negative_uncharged', 'negative_aromatic', 'uncharged_aliphatic', 'uncharged_positive', 'uncharged_negative', 'uncharged_uncharged', 'uncharged_aromatic', 'aromatic_aliphatic', 'aromatic_positive', 'aromatic_negative', 'aromatic_uncharged', 'aromatic_aromatic', 'Glycosylation', 'Cross_link', 'Modified_residue', 'Signal', 'Disulfide_bond', 'O_linked', 'N_linked', 'C_linked', 'N_beta_linked', 'S_linked', 'O_alpha_linked', 'binary_count', 'binary_experimental_count', 'xeno_count', 'xeno_experimental_count', 'degree_binary', 'degree_xeno', 'degree_all', 'avg_degree_nbr_binary',
    //             'avg_degree_nbr_xeno', 'avg_degree_nbr_all', 'strongly_connected_component_sizes_all', 'cytoplasmic_vesicle', 'nucleus', 'melanosome', 'lateral_cell_membrane', 'secreted', 'vacuole', 'vesicle', 'synapse', 'presynapse', 'cleavage_furrow', 'endomembrane_system', 'late_endosome', 'recycling_endosome', 'midbody', 'cytoplasmic_granule', 'endosome', 'early_endosome', 'perikaryon', 'membrane', 'peroxisome', 'cell_membrane', 'cell_junction', 'postsynapse', 'cytoplasm', 'lipid_droplet', 'rough_endoplasmic_reticulum', 'zymogen_granule', 'smooth_endoplasmic_reticulum_membrane', 'inflammasome', 'target_cell_membrane', 'preautophagosomal_structure', 'cornified_envelope', 'mitochondrion', 'microsome', 'sarcoplasmic_reticulum', 'vacuole_membrane', 'cell_surface', 'dynein_axonemal_particle', 'golgo_apparatus', 'parasitophorous_vacuole', 'extracellular_vessicle', 'cell_projection', 'photoreceptor', 'virion', 'cytolitic_granule', 'golgi_outpost', 'myelin_membrane', 'endoplasmic_reticulum', 'chromosome', 'lysosome', 'rrm', 'acidic_residues', 'ph', 'krab', 'pdz', 'btb', 'nuclear_localization_signal', 'fibronectin_type_iii', 'disordered', 'ig_like_v_type', 'ef_hand', 'sh3', 'ig_like', 'pro_residues', 'protein_kinase', 'ig_like_c2_type', 'basic_and_acidic_residues', 'basic_residues', 'egf_like', 'polar_residues', 'Mean', 'Mode', 'Min', 'Max', 'Variance', 'Median', 'Standard_Deviation', 'Range', 'Min_gap', 'Max_gap', 'Average_gap', 'Min_2_hop_gap', 'Max_2_hop_gap', 'Average_2_hop_gap', 'Latent_Value_1', 'Latent_Value_2', 'Latent_Value_3', 'Latent_Value_4', 'Latent_Value_5', 'Latent_Value_6', 'Latent_Value_7', 'Latent_Value_8', 'Latent_Value_9', 'Latent_Value_10', 'Latent_Value_11', 'Latent_Value_12', 'Latent_Value_13', 'Latent_Value_14', 'Latent_Value_15', 'Latent_Value_16', 'Latent_Value_17', 'Latent_Value_18', 'Latent_Value_19', 'Latent_Value_20'];

    // document.body.addEventListener('click', function(e) {
    //     console.log("Yo");
    //     if (e.target && e.target.id === 'search-button') {
    //         searchFeature = document.getElementById('search-feature').value.toUpperCase().replace(/\s+/g, '_');
    //         const featureIndex = col_names.findIndex(name => name.toUpperCase() === searchFeature);
    //         if (featureIndex !== -1) {
    //             const targetPage = Math.floor((featureIndex) / 9) + 1;
    //             loadFeatures(targetPage);
    //         } else {
    //             console.log("Nahi mila");
    //             alert("Feature not found!");
    //         }
    //     }
    // });
    det2 = ['Physicochemical Properties', 'GDPC Encodings', 'PTM Counts', 'Glycosylation Counts', 'PPI properties', 'PPI Network Properties', 'Subcellular Locations', 'Domains', 'Latent Values']
    det = {
        'Physicochemical_Properties': ['Sequence_Length', 'Molecular_Weight', 'GRAVY', 'Isoelectric_Point', 'Instability_Index', 'Aromaticity', 'Charge_at_7', 'Amino_Acid_Percent_A', 'Amino_Acid_Percent_C', 'Amino_Acid_Percent_D', 'Amino_Acid_Percent_E', 'Amino_Acid_Percent_F', 'Amino_Acid_Percent_G', 'Amino_Acid_Percent_H', 'Amino_Acid_Percent_I', 'Amino_Acid_Percent_K', 'Amino_Acid_Percent_L', 'Amino_Acid_Percent_M', 'Amino_Acid_Percent_N', 'Amino_Acid_Percent_P', 'Amino_Acid_Percent_Q', 'Amino_Acid_Percent_R', 'Amino_Acid_Percent_S', 'Amino_Acid_Percent_T', 'Amino_Acid_Percent_V', 'Amino_Acid_Percent_W', 'Amino_Acid_Percent_Y', 'Molar_Extinction_Coefficient_1', 'Molar_Extinction_Coefficient_2', 'Secondary_Structure_helix', 'Secondary_Structure_turn', 'Secondary_Structure_sheet'],
        'GDPC_Encodings': ['aliphatic_aliphatic', 'aliphatic_positive', 'aliphatic_negative', 'aliphatic_uncharged', 'aliphatic_aromatic', 'positive_aliphatic', 'positive_positive', 'positive_negative', 'positive_uncharged', 'positive_aromatic', 'negative_aliphatic', 'negative_positive', 'negative_negative', 'negative_uncharged', 'negative_aromatic', 'uncharged_aliphatic', 'uncharged_positive', 'uncharged_negative', 'uncharged_uncharged', 'uncharged_aromatic', 'aromatic_aliphatic', 'aromatic_positive', 'aromatic_negative', 'aromatic_uncharged', 'aromatic_aromatic'],
        'PTM_Counts': ['Glycosylation', 'Cross-link', 'Modified_residue', 'Signal', 'Disulfide_bond'],
        'Glycosylation_Counts': ['O-linked', 'N-linked', 'C-linked', 'N-beta-linked', 'S-linked', 'O-alpha-linked'],
        'PPI_properties': ['binary_count', 'binary_experimental_count', 'xeno_count', 'xeno_experimental_count'],
        'PPI_Network_Properties': ['degree_binary', 'degree_xeno', 'degree_all', 'avg_degree_nbr_binary', 'avg_degree_nbr_xeno', 'avg_degree_nbr_all', 'strongly_connected_component_sizes_all'],
        'Subcellular_Locations': ['late_endosome', 'cleavage_furrow', 'postsynapse', 'microsome', 'cytoplasm', 'synapse', 'rough_endoplasmic_reticulum', 'chromosome', 'sarcoplasmic_reticulum', 'lateral_cell_membrane', 'nucleus', 'secreted', 'endosome', 'golgo_apparatus', 'zymogen_granule', 'vesicle', 'lysosome', 'cytoplasmic_vesicle', 'membrane', 'recycling_endosome', 'target_cell_membrane', 'cytoplasmic_granule', 'parasitophorous_vacuole', 'vacuole_membrane', 'extracellular_vessicle', 'cell_membrane', 'golgi_outpost', 'early_endosome', 'cornified_envelope', 'virion', 'melanosome', 'vacuole', 'endomembrane_system', 'photoreceptor', 'cell_surface', 'inflammasome', 'midbody', 'lipid_droplet', 'presynapse', 'endoplasmic_reticulum', 'preautophagosomal_structure', 'cell_projection', 'cytolitic_granule', 'cell_junction', 'dynein_axonemal_particle', 'mitochondrion', 'perikaryon', 'peroxisome', 'smooth_endoplasmic_reticulum_membrane', 'myelin_membrane'],
        'Domains': ['rrm', 'acidic_residues', 'ph', 'krab', 'pdz', 'btb', 'nuclear_localization_signal', 'fibronectin_type-iii', 'disordered', 'ig-like_v-type', 'ef-hand', 'sh3', 'ig-like', 'pro_residues', 'protein_kinase', 'ig-like_c2-type', 'basic_and_acidic_residues', 'basic_residues', 'egf-like', 'polar_residues', 'Mean', 'Mode', 'Min', 'Max', 'Variance', 'Median', 'Standard_Deviation', 'Range', 'Min_gap', 'Max_gap', 'Average_gap', 'Min_2-hop_gap', 'Max_2-hop_gap', 'Average_2-hop_gap'],
        'Latent_Values': ['Latent_Value_1', 'Latent_Value_2', 'Latent_Value_3', 'Latent_Value_4', 'Latent_Value_5', 'Latent_Value_6', 'Latent_Value_7', 'Latent_Value_8', 'Latent_Value_9', 'Latent_Value_10', 'Latent_Value_11', 'Latent_Value_12', 'Latent_Value_13', 'Latent_Value_14', 'Latent_Value_15', 'Latent_Value_16', 'Latent_Value_17', 'Latent_Value_18', 'Latent_Value_19', 'Latent_Value_20']
    }

    for (let key in det) {
        if (det.hasOwnProperty(key)) {
            det[key] = det[key].map(item => item.toUpperCase());
        }
    }
    det2 = det2.map(item => item.toUpperCase());
    // document.body.addEventListener('click', function(e) {
    //     console.log("Yo");
    //     console.log(e.target.id);
    //     if (e.target && e.target.id === 'search-button5') {
    //         console.log("Yo2");
    //         searchInput = document.getElementById('search-feature').value.replace(/\s+/g, '_');
    //         console.log(searchInput);
    //         let categoryKey = null;
    //         for (const [key, values] of Object.entries(det)) {
    //             if (values.includes(searchInput)) {
    //                 categoryKey = key;
    //                 break;
    //             }
    //         }
    //         if(categoryKey){
    //             const index = det2.indexOf(categoryKey);
    //             loadFeatures(index+1);
    //         }
    //     }
    //     else{
    //         console.log("Nokay");
    //     }
    // });
    // Load the first page
    loadFeatures(currentPage);
    document.getElementById('search-button5').addEventListener('click', () => {
        const searchInput = document.getElementById('search-bar2').value.toUpperCase().replace(/\s+/g, '_');
        //searchInput = document.getElementById('search-feature').value.replace(/\s+/g, '_');
            console.log(searchInput);
            let categoryKey = null;
            for (const [key, values] of Object.entries(det)) {
                if (values.includes(searchInput)) {
                    categoryKey = key;
                    break;
                }
            }
            console.log(categoryKey);
            categoryKey = categoryKey.toUpperCase();
            if(categoryKey){
                categoryKey = categoryKey.replace(/_/g, ' ');
                const index = det2.indexOf(categoryKey);
                console.log(index);
                loadFeatures(index+1);
            }
        // Perform the search and update the content
        //loadFeatures(currentPage);  // You might need to adjust this based on actual search functionality
    });
    document.getElementById('features-popup').classList.add('active');
    // Show the pop-up
    //document.getElementById('features-popup').classList.add('active');

    // Handle pagination
    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            loadFeatures(currentPage - 1);
        }
    });

    document.getElementById('next-page').addEventListener('click', function() {
        if (currentPage < 9) {
            loadFeatures(currentPage + 1);
        }
    });
};



var i = 0;
var txt = 'Lorem ipsum typing effect!'; /* The text */
var speed = 50; /* The speed/duration of the effect in milliseconds */

function typeWriter() {
  if (i < txt.length) {
    document.getElementById("demo").innerHTML += txt.charAt(i);
    i++;
    setTimeout(typeWriter, speed);
  }
}


function endit(){
    const popup = document.getElementById('pie-chart-popup');
    if (popup) {
        document.body.removeChild(popup);
    }

};

var aText = new Array(
    "DrugProtAI is an advanced tool designed to predict the druggability of proteins in humans by leveraging machine learning techniques. ",
    "It utilizes features extracted from protein data to evaluate and predict the potential of a protein to be targeted by drugs."
    );
    var iSpeed = 30; // time delay of print out
    var iIndex = 0; // start printing array at this posision
    var iArrLength = aText[0].length; // the length of the text array
    var iScrollAt = 20; // start scrolling up at this many lines

    var iTextPos = 0; // initialise text position
    var sContents = ''; // initialise contents variable
    var iRow; // initialise current row

    function typewriter()
    {
     sContents =  ' ';
     iRow = Math.max(0, iIndex-iScrollAt);
     var destination = document.getElementById("typedtext");

     while ( iRow < iIndex ) {
      sContents += aText[iRow++] + '<br />';
     }
     destination.innerHTML = sContents + aText[iIndex].substring(0, iTextPos) + "_";
     if ( iTextPos++ == iArrLength ) {
      iTextPos = 0;
      iIndex++;
      if ( iIndex != aText.length ) {
       iArrLength = aText[iIndex].length;
       setTimeout("typewriter()", 500);
      }
     } else {
      setTimeout("typewriter()", iSpeed);
     }
    }


    typewriter();