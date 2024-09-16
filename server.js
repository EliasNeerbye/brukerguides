const express = require('express');
const app = express();
const path = require('path');
require("dotenv").config();
const favicon = require("serve-favicon");
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const session = require('express-session');
const fileUpload = require('express-fileupload');

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(favicon('public/assets/favicon.ico'));
app.use(fileUpload());


const User = require("./models/user");
const Guide = require("./models/guide")



mongoose.connect('mongodb://localhost:27017/brukerguides')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Connection error', err));


app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24000 * 60 * 60  // 1 hour
    }
}));


app.get('/', (req, res) => {
    res.render('index');
});

// Signup route to create a default user
// app.get('/signup/default', async (req, res) => {
//     const defaultUsername = 'Blank';
//     const defaultPassword = 'Isja54321';  // You can set any password you like

//     try {
//         // Check if the user already exists
//         const existingUser = await User.findOne({ username: defaultUsername });
//         if (existingUser) {
//             return res.status(400).json({ success: false, message: 'Default user already exists.' });
//         }

//         // Hash the default password
//         const salt = await bcrypt.genSalt(10);
//         const passwordHash = await bcrypt.hash(defaultPassword, salt);

//         // Create and save the default user
//         const newUser = new User({
//             username: defaultUsername,
//             passwordHash
//         });

//         await newUser.save();

//         res.json({ success: true, message: 'Default user created successfully.' });
//     } catch (error) {
//         console.error('Error during default user creation:', error);
//         res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
//     }
// });


app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('login');
});

app.post('/login/submit', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    if (username.length < 3 || username.length > 16) {
    return res.status(400).json({ success: false, message: 'Username must be between 3 and 16 characters.' });
    }

    if (password.length < 4 || password.length > 30) {
    return res.status(400).json({ success: false, message: 'Password must be between 4 and 30 characters.' });
    }

    try {
    // Find the user in the database
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // Compare the hashed password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (isMatch) {
        req.session.user = {
            id: user._id,
            username: user.username
        };
        
        return res.json({ success: true });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }
    } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user){
        return res.redirect('/login');
    }
    res.render('dashboard');
});

app.get('/guide/:id', async (req, res) => {
    return res.render('guide'); // For making guide layout

    // const guideId = req.params.id;  // Extract the dynamic 'id' from the URL
    // const defaultGuideId = 'defaultGuideId';  // Set a default guide ID
    // try {
    //     // Simulate fetching guide from a database (replace with actual DB query)
    //     let guide = await Guide.findById(guideId);

    //     if (!guide) {
    //         // If the guide isn't found, fetch the default guide
    //         guide = await Guide.findById(defaultGuideId);

    //         if (!guide) {
    //             return res.status(404).send('Default guide not found either.');
    //         }
    //     }

    //     // Render the guide view with the found or default guide
    //     res.render('guide', { guide });

    // } catch (error) {
    //     console.error('Error fetching guide:', error);
    //     res.status(500).send('Server error. Please try again later.');
    // }
});


// Helper function to validate non-empty fields
function validateFields(data) {
    if (!data.title) {
        return false;
    }

    const parts = [];
    let partIndex = 1;

    while (data[`section${partIndex}H2`]) {
        const heading = data[`section${partIndex}H2`];
        const content = [];

        let contentIndex = 1;
        while (data[`section${partIndex}P${contentIndex}`]) {
            content.push({
                type: 'p',
                value: data[`section${partIndex}P${contentIndex}`],
                id: data[`section${partIndex}P${contentIndex}Id`] || null
            });
            contentIndex++;
        }

        let imageIndex = 1;
        while (data[`section${partIndex}Img${imageIndex}`]) {
            content.push({
                type: 'img',
                value: data[`section${partIndex}Img${imageIndex}`], // Directly use the URL/path here
                id: data[`section${partIndex}Img${imageIndex}Id`] || null
            });
            imageIndex++;
        }

        if (heading && content.length) {
            parts.push({
                heading,
                content
            });
        }
        partIndex++;
    }

    return parts.length > 0;
}

app.post('/makeGuide', (req, res) => {
    console.log("Request body:", req.body);
    console.log("Files received:", req.files);

    const { title } = req.body;
    const parts = [];

    // Validate input fields
    if (!validateFields(req.body)) {
        console.log("Validation failed:", req.body);
        return res.status(400).json({ error: "Invalid input: All required fields must be provided." });
    }
    console.log("Validation passed");

    // Process files if any
    const imageFiles = req.files || {};
    const imageUrls = {};

    // Handle file uploads and generate public URLs
    const filePromises = Object.entries(imageFiles).map(([key, file]) => {
        const filePath = `uploads/${file.name}`; // Correctly define the file path for storage
        console.log(`Saving file ${key}: ${filePath}`);
        return new Promise((resolve, reject) => {
            file.mv(`./public/${filePath}`, err => {
                if (err) {
                    console.log("File move error:", err);
                    return reject(err);
                }
                // Generate public URL
                const publicUrl = `/${filePath}`;
                console.log(`Public URL for ${key}: ${publicUrl}`);
                imageUrls[key] = publicUrl; // Store the public URL
                resolve();
            });
        });
    });

    Promise.all(filePromises)
        .then(() => {
            console.log("Files saved, imageUrls:", imageUrls);

            // Construct parts with image URLs and paragraphs
            let partIndex = 1;
            while (req.body[`section${partIndex}H2`]) {
                const heading = req.body[`section${partIndex}H2`];
                const content = [];

                let contentIndex = 1;
                // Add paragraphs
                while (req.body[`section${partIndex}P${contentIndex}`]) {
                    content.push({
                        type: 'p',
                        value: req.body[`section${partIndex}P${contentIndex}`],
                        id: req.body[`section${partIndex}P${contentIndex}Id`] || null
                    });
                    contentIndex++;
                }

                // Add images
                let imageIndex = 1;
                while (req.body[`section${partIndex}Img${imageIndex}`]) {
                    const imageUrl = imageUrls[`section${partIndex}Img${imageIndex}`] || req.body[`section${partIndex}Img${imageIndex}`];
                    console.log(`Adding image URL to content for section${partIndex}Img${imageIndex}: ${imageUrl}`);
                    content.push({
                        type: 'img',
                        value: imageUrl, // Save the URL as text
                        id: req.body[`section${partIndex}Img${imageIndex}Id`] || null
                    });
                    imageIndex++;
                }

                if (heading && content.length) {
                    parts.push({
                        heading,
                        content
                    });
                }
                partIndex++;
            }

            console.log("Constructed parts:", JSON.stringify(parts, null, 2)); // Pretty-print the parts array

            // Create new Guide document
            const newGuide = new Guide({
                title,
                parts
            });

            console.log("Saving guide:", JSON.stringify(newGuide, null, 2)); // Pretty-print the guide document

            return newGuide.save();
        })
        .then(() => {
            console.log("Guide saved successfully.");
            res.json({ message: "Guide saved successfully." });
        })
        .catch(err => {
            console.log("Error saving guide:", err);
            res.status(500).json({ error: "Error saving guide: " + err.message });
        });
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});