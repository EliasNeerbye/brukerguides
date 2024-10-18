function createTag() {
    const inputValue = document.getElementById("makeTag").value.trim();
    const tagDesc = document.getElementById("tagDesc").value.trim();
    const alertMsg = document.getElementById("alertMsg");

    // Validate input values (ensure tag name is not empty)
    if (!inputValue) {
        alert('Tag name is required!');
        return;
    }

    if (confirm(`Are you sure that you want to create this tag: ${inputValue}?`)) {
        // Send the POST request using fetch
        fetch('/makeTag', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: inputValue, description: tagDesc })  // Send the inputValue and tagDesc as part of the body
        })
        .then(response => {
            // We keep both the response and the data
            return response.json().then(data => ({
                data: data,
                response: response   // Pass the original response to the next .then()
            }));
        })
        .then(({ data, response }) => {
            if (response.ok) {
                // Success: display success message and optionally clear the form fields
                alertMsg.innerText = 'Tag created successfully!';

                // Optionally clear the input fields after successful tag creation
                document.getElementById("makeTag").value = '';
                document.getElementById("tagDesc").value = '';
                location.reload();
            } else {
                // Error handling from server-side validation (e.g., duplicate tag name)
                alertMsg.innerText = `Failed to create tag: ${data.message} (Status: ${response.status})`;
                console.error('Error:', data);
            }
        })
        .catch(error => {
            // Handle any network/server errors
            alertMsg.innerText = 'An error occurred while creating the tag. Please try again.';
            console.error('Error:', error);
        });
    }
}

let selectedTags = [];

function updateWithTag(elem) {
    // Toggle the checked state of the checkbox
    const checkbox = elem.firstElementChild.firstElementChild; // Access the checkbox directly
    checkbox.checked = !checkbox.checked; // Flip the checked value

    const tagValue = checkbox.id; // Get the tag ID

    if (checkbox.checked) {
        console.log("Element is checked");
        // Add the tag to selectedTags if it's not already in the array
        if (!selectedTags.includes(tagValue)) {
            selectedTags.push(tagValue);
        }
        elem.classList.add("selected");
    } else {
        console.log("Element is not checked");
        // Remove the tag from selectedTags if it is there
        selectedTags = selectedTags.filter(tag => tag !== tagValue);
        elem.classList.remove("selected");
    }

    console.log("Selected tags:", selectedTags);
}



function addTags(){
    const guideId = document.getElementById("guideId").value;
    // Validate input values (ensure tag name is not empty)
    if (!guideId) {
        alert('Guide id is required!');
        return;
    }

    if (selectedTags.length < 1){
        alert('You need to select some tags!');
        return;
    }

    if (confirm(`Are you sure that you want to add these tags: ${selectedTags} to the guide with the id: ${guideId}?`)) {
        // Send the POST request using fetch
        fetch('/addTagToGuide', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ guideId, selectedTags })  // Send the inputValue and tagDesc as part of the body
        })
        .then(response => {
            // We keep both the response and the data
            return response.json().then(data => ({
                data: data,
                response: response   // Pass the original response to the next .then()
            }));
        })
        .then(({ data, response }) => {
            if (response.ok) {
                // Success: display success message and optionally clear the form fields
                alertMsg.innerText = 'Tags added successfully!';
                console.log('Response:', data);

                // Optionally clear the input fields after successful tag creation
                document.getElementById("guideId").value = '';
                selectedTags.forEach(element => {
                    document.getElementById(element).checked = false;
                });
            } else {
                // Error handling from server-side validation (e.g., duplicate tag name)
                alertMsg.innerText = `Failed to add tag: ${data.message} (Status: ${response.status})`;
                console.error('Error:', data);
            }
        })
        .catch(error => {
            // Handle any network/server errors
            alertMsg.innerText = 'An error occurred while creating the tag. Please try again.';
            console.error('Error:', error);
        });
    }
}