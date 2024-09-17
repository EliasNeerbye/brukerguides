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
app.use(fileUpload({
    createParentPath: true // Create parent directories if they do not exist
}));


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


// Route to render the index page with a list of guides
app.get('/', async (req, res) => {
    try {
        // Fetch all guides from the database
        const guides = await Guide.find();

        // Transform the guide data into a list of objects with id and title
        const guideList = guides.map(guide => ({
            id: guide._id,
            name: guide.title
        }));

        // Render the index view with the list of guides
        res.render('index', { guides: guideList });
    } catch (err) {
        // Handle errors (e.g., database errors)
        console.error(err);
        res.status(500).send('Server error');
    }
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



// Route to render a specific guide based on ID
app.get('/guide/:id', async (req, res) => {
    try {
        // Extract the guide ID from the request parameters
        const guideId = req.params.id;

        // Fetch the guide from the database using the ID
        const guide = await Guide.findById(guideId).exec();

        // Check if the guide was found
        if (!guide) {
            return res.status(404).send('Guide not found');
        }

        // Render the guide view with the retrieved guide data
        res.render('guide', { guide });
    } catch (err) {
        // Handle errors, e.g., database errors
        console.error(err);
        res.status(500).send('Server error');
    }
});



app.get('/guide', async (req, res) => {
    return res.render("guideDefault");
});

app.post("/makeGuide", async (req, res) => {
    try {
        const { title, ...body } = req.body;
        const files = req.files;

        const sections = [];
        let sectionIndex = 1;

        while (body[`section${sectionIndex}H2`]) {
        const sectionHeader = body[`section${sectionIndex}H2`];
        const paragraphs = [];
        const images = [];
        let paragraphIndex = 1;
        let imageIndex = 1;

        while (body[`section${sectionIndex}P${paragraphIndex}`]) {
            paragraphs.push({
            text: body[`section${sectionIndex}P${paragraphIndex}`],
            id: body[`section${sectionIndex}P${paragraphIndex}Id`] || '',
            pIndex: paragraphIndex
            });
            paragraphIndex++;
        }

        while (files[`section${sectionIndex}Img${imageIndex}`]) {
            const file = files[`section${sectionIndex}Img${imageIndex}`];
            const filePath = `./public/uploads/${file.name}`;
            await file.mv(filePath); // Save the file to disk
            images.push({
            url: `/uploads/${file.name}`,
            filename: file.name,
            imgIndex: imageIndex
            });
            imageIndex++;
        }

        sections.push({
            header: sectionHeader,
            paragraphs,
            images,
            index: sectionIndex
        });

        sectionIndex++;
        }

        const guide = new Guide({
        title,
        sections
        });

        await guide.save();

        res.status(201).send(guide);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


// 404 Error Handler (catch-all for unhandled routes)
app.use((req, res, next) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

// 500 Error Handler (catch-all for server errors)
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
    res.status(500).render('500', { title: 'Internal Server Error', error: err });
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});