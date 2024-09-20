async function loadEditId() {
    const editId = document.getElementById('editId').value;

    if (!editId) {
        alert("Please enter an ID to edit.");
        return;
    }

    try {
        // Send an AJAX request to get the guide data
        const response = await fetch('/editGuide', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: editId }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Populate the guide form with the returned guide data
            populateGuideForm(data.guide);
        } else {
            alert(data.message || "Error loading guide.");
        }
    } catch (err) {
        console.error("Error fetching guide:", err);
        alert("An error occurred while loading the guide.");
    }
}

async function populateGuideForm(guide) {
    const guideForm = document.getElementById('guideForm');
    guideForm.innerHTML = '<input type="text" name="title" id="title" placeholder="Title">';
    sectionCount = 0;
    divCounts = {};
    addSection();


    // Populate the title
    document.getElementById('title').value = guide.title;

    // Track existing images for each section
    const existingImages = {};

    // Loop through guide sections and dynamically create them
    guide.sections.forEach((section, sectionIndex) => {
        const sectionId = `section${sectionIndex + 1}`;

        // Use existing function to add a section
        addSection();

        // Populate the header of the section
        const headerInput = document.getElementById(`${sectionId}H2`);
        headerInput.value = section.header;

        let logCount = 0;

        // Loop through each section's paragraphs and create divs
        section.paragraphs.forEach((paragraph, paragraphIndex) => {
            logCount++;
            console.log("Making paragraph " + logCount);
            
            // Only add a div if it's not the last paragraph
            if (paragraphIndex < section.paragraphs.length - 1) {
                addDiv(sectionId); // Create a new div for the paragraph
            }

            const paragraphInput = document.getElementById(`${sectionId}P${paragraphIndex + 1}`);
            paragraphInput.value = paragraph.text;

            const paragraphIdInput = document.getElementById(`${sectionId}P${paragraphIndex + 1}Id`);
            paragraphIdInput.value = paragraph.id;
        });

        section.images.forEach(async (image, imgIndex) => {
            const imgUrlInput = document.getElementById(`${sectionId}Img${imgIndex + 1}Url`);
            imgUrlInput.value = image.url; // Set the image URL in the hidden input
            
            // Fetch the image and set it to the file input
            const fileInput = document.getElementById(`${sectionId}Img${imgIndex + 1}`);
            await loadImageToFileInput(image.url, fileInput, imgIndex); // Pass imgIndex here
        });
    });

    guideForm.removeChild(guideForm.lastChild);
    guideForm.action = '/saveGuide/' + guide._id;
}


async function loadImageToFileInput(imageUrl, inputElement) {
    try {
        // Fetch the image data
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Network response was not ok');

        // Get the image as a Blob
        const blob = await response.blob();

        // Extract the original filename from the URL
        const fileName = imageUrl.split('/').pop(); // Get the last part of the URL

        // Create a File object
        const file = new File([blob], fileName, { type: blob.type });

        // Create a DataTransfer object to hold the file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        // Set the file input's files to the DataTransfer's files
        inputElement.files = dataTransfer.files;

        console.log("Image loaded into file input successfully.");

        if (inputElement.files.length > 0) {
            // File has been selected
            inputElement.parentElement.style.borderStyle = "solid";
            inputElement.parentElement.style.width = "90%";
            inputElement.parentElement.style.alignSelf = "center";
            inputElement.previousElementSibling.textContent = inputElement.files[0].name + " selected.";
            inputElement.nextElementSibling.value = "/uploads/" + inputElement.files[0].name;
        }
    } catch (error) {
        console.error("Error loading image:", error);
    }
}


function save() {
    // Submit the form
    document.getElementById('guideForm').submit();
}
