let sectionCount = 0; // Initialize the section count
let divCounts = {}; // Object to keep track of div counts for each section

// Function to add a new section dynamically
function addSection() {
    if (sectionCount == 0 || confirm("Are you sure you want to add another section?")) {
        const main = document.getElementById("guideForm");
        
        sectionCount++; // Increment the section count
        const newSectionId = `section${sectionCount}`;
        divCounts[newSectionId] = 0; // Initialize the div count for the new section

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
        addDivButton.type = "button"
        addDivButton.onclick = () => addDiv(newSectionId);

        const deleteSectionButton = document.createElement("button");
        deleteSectionButton.textContent = "Delete section";
        deleteSectionButton.type = "button"
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

function addDiv(sectionId) {
    const section = document.getElementById(sectionId);
    
    if (!divCounts[sectionId]) {
        divCounts[sectionId] = 0;
    }

    divCounts[sectionId]++;
    const divCount = divCounts[sectionId];
    const newDivId = `${sectionId}Div${divCount}`;

    const newDiv = document.createElement("div");
    newDiv.id = newDivId;
    newDiv.classList.add("sectionContent");

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
    paragraphIdInput.classList.add("idInput");
    paragraphIdInput.placeholder = "Id?";

    paragraphDiv.appendChild(paragraphInput);
    paragraphDiv.appendChild(paragraphIdInput);

    const imageLabel = document.createElement("label");
    imageLabel.setAttribute("for", `${sectionId}Img${divCount}`);
    imageLabel.classList.add("sectionImgLabel");

    const imageLabelText = document.createElement("p");
    imageLabelText.textContent = "Select Image";

    imageLabel.appendChild(imageLabelText);

    const imageInput = document.createElement("input");
    imageInput.type = "file";
    imageInput.name = `${sectionId}Img${divCount}`;
    imageInput.classList.add("sectionImageInput");
    imageInput.id = `${sectionId}Img${divCount}`;
    imageInput.title = "Image";
    imageInput.onchange = () => handleFileChange(imageInput);

    const imgUrlInput = document.createElement("input");
    imgUrlInput.type = "hidden";
    imgUrlInput.name = `${sectionId}Img${divCount}Url`;
    imgUrlInput.id = `${sectionId}Img${divCount}Url`;
    imgUrlInput.value = "";

    imageLabel.appendChild(imageInput);
    imageLabel.appendChild(imgUrlInput);

    // Add drag-and-drop functionality
    imageLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageLabel.classList.add('dragover');
    });

    imageLabel.addEventListener('dragleave', () => {
        imageLabel.classList.remove('dragover');
    });

    imageLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        imageLabel.classList.remove('dragover');
        handleImageDrop(e.dataTransfer.files, imageInput);
    });

    // Add paste functionality
    newDiv.addEventListener('paste', (e) => {
        handlePaste(e, imageInput);
    });

    const deleteDivButton = document.createElement("button");
    deleteDivButton.textContent = "Delete div";
    deleteDivButton.type = "button"
    deleteDivButton.onclick = () => deleteDiv(sectionId, newDivId);

    newDiv.appendChild(paragraphDiv);
    newDiv.appendChild(imageLabel);
    newDiv.appendChild(deleteDivButton);

    section.appendChild(newDiv);

    console.log(`New div added: ${newDivId}`);
}

function handleImageDrop(files, imageInput) {
    if (files && files[0]) {
        imageInput.files = files;
        console.log('Image dropped:', files[0].name);
        handleFileChange(imageInput);
    }
}

function handlePaste(e, imageInput) {
    const items = e.clipboardData.items;
    for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            const files = new DataTransfer();
            files.items.add(blob);
            imageInput.files = files.files;
            console.log('Image pasted:', blob.name);
            handleFileChange(imageInput);
            break;
        }
    }
}

function handleFileChange(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        console.log('File selected:', file.name);
        const label = input.closest('label');
        const labelText = label.querySelector('p');
        labelText.textContent = 'Image selected';
        label.classList.add('file-selected');
    }
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