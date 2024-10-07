document.addEventListener("DOMContentLoaded", function () {
    // Function to get query parameter by name
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Check if "id" exists in the query string
    const editId = getQueryParam('id');

    if (editId) {
        // Fill the input field with the ID
        const editIdInput = document.getElementById("editId");
        editIdInput.value = editId;

        // Automatically trigger the loadEditId function
        loadEditId();
    }
});
