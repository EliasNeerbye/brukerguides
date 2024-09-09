document.getElementById('submitBtn').addEventListener('click', function () {
    loginUser();
});

window.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        loginUser();
    }
});


function loginUser() {
    // Get input values
    const usernameInput = document.getElementById('usernameInput').value;
    const passwordInput = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    // Sanitize inputs by stripping dangerous characters (basic sanitation)
    const sanitize = (input) => {
        const tempElement = document.createElement('div');
        tempElement.innerText = input; // Encode input by placing it in a div
        return tempElement.innerHTML.trim(); // Return sanitized HTML-encoded value
    };

    const username = sanitize(usernameInput);
    const password = sanitize(passwordInput);

    // Validate username and password length
    if (username.length < 3 || username.length > 16) {
        errorMsg.textContent = 'Brukernavnet må være mellom 3 og 16 tegn.';
        errorMsg.style.display = "block";
        return;
    }

    if (password.length < 4 || password.length > 30) {
        errorMsg.textContent = 'Passordet må være mellom 4 og 30 tegn.';
        errorMsg.style.display = "block";
        return;
    }

    // Clear error message
    errorMsg.textContent = '';

    // Prepare data to be sent in AJAX request
    const data = {
        username: username,
        password: password
    };

    // Send AJAX request to the server using Fetch API
    fetch('/login/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Parse JSON response
    })
    .then(result => {
        if (result.success) {
            window.location.href = '/dashboard'; // Redirect if login is successful
        } else {
            errorMsg.textContent = result.message || 'Innlogging mislyktes. Prøv igjen.';
            errorMsg.style.display = "block";
        }
    })
    .catch(error => {
        errorMsg.textContent = 'En feil oppstod. Prøv igjen senere.';
        errorMsg.style.display = "block";
        console.error('There was a problem with the fetch operation:', error);
    });
}