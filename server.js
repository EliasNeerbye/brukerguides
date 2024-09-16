const express = require('express');
const app = express();
const path = require('path');
require("dotenv").config();
const favicon = require("serve-favicon");
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const session = require('express-session');

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(favicon('public/assets/favicon.ico'));


const User = require("./models/user");



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



app.post('/your-server-endpoint', (req, res) => {
    const { title, sections } = req.body;

    // Process the guide title and sections data
    console.log('Guide title:', title);
    console.log('Sections data:', sections);

    res.json({ message: 'Data received successfully' });
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});