document.getElementById("submitBtn").addEventListener("click", async (e) => {
    e.preventDefault(); // Prevent the default form submission

    const username = document.getElementById("usernameInput").value;
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch('/signup/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const result = await response.json();

        if (result.success) {
            // Redirect to the dashboard or another page upon successful signup
            window.location.href = '/dashboard';
        } else {
            // Display error message
            document.getElementById("errorMsg").innerText = result.message;
            document.getElementById("errorMsg").style.display = "block"; // Make sure to display the error message
        }
    } catch (error) {
        console.error('Error during signup:', error);
        document.getElementById("errorMsg").innerText = 'An error occurred. Please try again later.';
        document.getElementById("errorMsg").style.display = "block"; // Ensure the error message is displayed
    }
});
