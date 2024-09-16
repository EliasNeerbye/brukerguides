let sectionCount = 1; // Initialize the section count
const divCounts = {}; // Object to keep track of div counts for each section

// Function to add a new section dynamically
function addSection() {
    if (confirm("Are you sure you want to add another section?")) {
        const main = document.getElementById("main");
        
        sectionCount++; // Increment the section count
        const newSectionId = `section${sectionCount}`;
        divCounts[newSectionId] = 1; // Initialize the div count for the new section

        // Create a new section element
        const newSection = document.createElement("section");
        newSection.id = newSectionId;
        newSection.classList.add("aSection");

        // Create header input for the new section
        const headerInput = document.createElement("input");
        headerInput.type = "text";
        headerInput.name = `${newSectionId}H2`;
        headerInput.id = `${newSectionId}H2`;
        headerInput.classList.add("header2");
        headerInput.placeholder = "Header";
        
        // Create buttons for adding divs and deleting the section
        const addDivButton = document.createElement("button");
        addDivButton.textContent = "Add div";
        addDivButton.onclick = () => addDiv(newSectionId);

        const deleteSectionButton = document.createElement("button");
        deleteSectionButton.textContent = "Delete section";
        deleteSectionButton.onclick = () => deleteSection(newSectionId);

        // Create a div for the buttons
        const addDelBtnsDiv = document.createElement("div");
        addDelBtnsDiv.classList.add("addDelBtnsDiv");
        addDelBtnsDiv.appendChild(addDivButton);
        addDelBtnsDiv.appendChild(deleteSectionButton);

        // Append the header, addDelBtnsDiv to the new section
        newSection.appendChild(headerInput);
        newSection.appendChild(addDelBtnsDiv);

        // Append the new section to the main element
        main.appendChild(newSection);
        addDiv(newSection.id)
    }
}

// Function to add a new div to a specific section
function addDiv(sectionId) {
    const section = document.getElementById(sectionId);
    
    if (!divCounts[sectionId]) {
        divCounts[sectionId] = 1; // Initialize div count if not done already
    }

    divCounts[sectionId]++; // Increment the div count for this section
    const divCount = divCounts[sectionId];
    const newDivId = `${sectionId}Div${divCount}`;

    // Create a new div element
    const newDiv = document.createElement("div");
    newDiv.id = newDivId;
    newDiv.classList.add("sectionContent");

    // Create a div for paragraph input and ID
    const paragraphDiv = document.createElement("div");
    paragraphDiv.classList.add("sectionParagraph");

    const paragraphInput = document.createElement("textarea");
    paragraphInput.type = "text";
    paragraphInput.name = `${sectionId}P${divCount}`;
    paragraphInput.id = `${sectionId}P${divCount}`;
    paragraphInput.placeholder = "Paragraph";

    const paragraphIdInput = document.createElement("input");
    paragraphIdInput.type = "text";
    paragraphIdInput.name = `${sectionId}P${divCount}Id`;
    paragraphIdInput.id = `${sectionId}P${divCount}Id`;
    paragraphIdInput.classList.add("idInput"); // Added class
    paragraphIdInput.placeholder = "Id?";

    paragraphDiv.appendChild(paragraphInput);
    paragraphDiv.appendChild(paragraphIdInput);

    // Create a label and image input
    const imageLabel = document.createElement("label");
    imageLabel.setAttribute("for", `${sectionId}Img${divCount}`);
    imageLabel.classList.add("sectionImgLabel");
    imageLabel.textContent = "Select Image"; // Label text

    const imageInput = document.createElement("input");
    imageInput.type = "file";
    imageInput.name = `${sectionId}Img${divCount}`;
    imageInput.classList.add("sectionImageInput");
    imageInput.id = `${sectionId}Img${divCount}`; // Added ID
    imageInput.title = "Image";
    imageInput.onchange = () => handleFileChange(imageInput); // Adjust handler if necessary

    imageLabel.appendChild(imageInput); // Append image input to label

    // Create a button to delete this div
    const deleteDivButton = document.createElement("button");
    deleteDivButton.textContent = "Delete div";
    deleteDivButton.onclick = () => deleteDiv(sectionId, newDivId);

    // Append paragraphDiv, imageLabel, and deleteDivButton to the new div
    newDiv.appendChild(paragraphDiv);
    newDiv.appendChild(imageLabel);
    newDiv.appendChild(deleteDivButton);

    // Append the new div to the section
    section.appendChild(newDiv);
}

// Function to delete a section
function deleteSection(sectionId) {
    if (confirm("Are you sure you want to delete this section?")) {
        const section = document.getElementById(sectionId);
        section.remove();
    }
}

// Function to delete a div
function deleteDiv(sectionId, divId) {
    if (confirm("Are you sure you want to delete this div?")) {
        const div = document.getElementById(divId);
        div.remove();
    }
}

// Function to handle file changes (update as needed)
function handleFileChange(input) {
    const file = input.files[0];
    if (file) {
        console.log(`Selected file: ${file.name}`);
    }
}