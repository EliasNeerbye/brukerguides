function resetPassword() {
    const currentPwd = prompt("What's your current password?");

    // Send request to the server to get a reset code
    fetch('/resetPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: currentPwd }) // No email needed here
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const code = prompt("Enter the verification code sent to your email:");
            const newPassword = prompt("Enter your new password:");

            // Verify the code and change the password
            fetch('/verifyAndChange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, newPassword }) // No email needed here
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Password changed successfully!');
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}


function delMe() {
    if (confirm("Are you sure you want to delete your account?")) {
        const currentPwd = prompt("What's your current password?");
        
        // Check if the user entered a password
        if (!currentPwd) {
            alert("You must enter your current password.");
            return; // Exit if no password is provided
        }

        // Create an object to send with the fetch request
        const data = {
            password: currentPwd // Send the current password for verification
        };

        // Make the fetch request to the server to verify the current password
        fetch('/delAcc', {
            method: 'POST', // Use POST for sensitive data
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            // Check if the response is okay
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.message || 'Unknown error occurred');
                });
            }
            return response.json();
        })
        .then(data => {
            // Handle the response from the server
            if (data.success) {
                alert("Account deleted successfully, you will now be logged out.");
                // Redirect to homepage or show a logout message
                window.location.href = '/'; // Adjust this as needed
            } else {
                alert("Incorrect password. Please try again.");
            }
        })
        .catch(error => {
            // Handle errors
            alert("There was an error deleting your account: " + error.message);
        });
    }
}
