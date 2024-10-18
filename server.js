const express = require('express');
const app = express();
const path = require('path');
require("dotenv").config();
const favicon = require("serve-favicon");
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const fileUpload = require('express-fileupload');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const nodemailer = require('nodemailer');

const {OAuth2Client} = require('google-auth-library');
const credentials = require('./cliendID.json'); // Path to your downloaded JSON file

// Access the credentials from the "web" object
const client = new OAuth2Client(
    credentials.web.client_id,     // Use 'web' instead of 'installed'
    credentials.web.client_secret, // Use 'web' instead of 'installed'
    `http://${process.env.GOOLEREDIRECT}/auth/google/callback`            // Replace this with your actual redirect URI
);


app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(favicon('public/assets/favicon.ico'));
app.use(fileUpload({
    createParentPath: true // Create parent directories if they do not exist
}));


const User = require("./models/user");
const Guide = require("./models/guide");
const Tag = require("./models/tag");


mongoose.connect('mongodb://localhost:27017/brukerguides')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Connection error', err));


// Configure session middleware to use MongoDB store
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: 'mongodb://localhost:27017/brukerguides', // MongoDB connection URL
        collectionName: 'sessions', // Optional: name of the sessions collection
        ttl: 14 * 24 * 60 * 60 // = 14 days. Default
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Set to true if using https
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24000 * 60 * 60 * 24 * 7 * 2 // 14 days
    }
}));

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER, // Your email address
        pass: process.env.SMTP_PASS  // Your email password
    }
})



app.get('/', async (req, res) => {
    try {
        // Fetch all guides from the database
        const guides = await Guide.find();

        // Fetch all tags from the database (if needed)
        const tags = await Tag.find();

        // Transform the guide data into a list of objects with id and title
        const guideList = guides.map(guide => ({
            id: guide._id,
            name: guide.title,
            tags: guide.tags,
            updated: guide.updatedAt,
            created: guide.createdAt
        }));

        guideList.reverse();

        // Render the index view with the list of guides and tags
        res.render('index', { guides: guideList, tags: tags });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/api/check-auth', (req, res) => {
    // Check if the user is logged in by checking the session
    const loggedIn = req.session.user ? true : false;
    res.json({ loggedIn });
});

app.get('/signup', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('signup');
});


app.post('/signup/submit', async (req, res) => {
    const { username, password, email } = req.body;

    // Input validation
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    // Username validation: between 3 and 16 characters
    if (username.length < 3 || username.length > 16) {
        return res.status(400).json({ success: false, message: 'Username must be between 3 and 16 characters.' });
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Email is not valid.' });
    }
    

    // Password validation: between 4 and 30 characters
    if (password.length < 4 || password.length > 30) {
        return res.status(400).json({ success: false, message: 'Password must be between 4 and 30 characters.' });
    }

    try {
        // Check if the user already exists
        const existingUsername = await User.findOne({ username });
        const existingEmail = await User.findOne({ email });
        if (existingUsername || existingEmail) {
            return res.status(400).json({ success: false, message: 'Username or Email already taken.' });
        }

        // Hash the user's password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create and save the new user
        const newUser = new User({
            username: username,
            email: email,
            passwordHash: passwordHash
        });

        await newUser.save();

        // Automatically log in the user after signup
        req.session.user = {
            _id: newUser._id,
            username: newUser.username
        };

        return res.status(201).json({ success: true, message: 'User created successfully and logged in.' });
    } catch (error) {
        console.error('Error during signup:', error);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});



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
            _id: user._id,
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

app.get('/dashboard', async (req, res) => {
    if (!req.session.user){
        return res.redirect('/login');
    }
    const tags = await Tag.find();
    res.render('dashboard', { tags })
});

function isValidGuideId(guideId) {
    // Check if it's a 24-character hex string
    const isHexString = /^[0-9a-fA-F]{24}$/.test(guideId);

    // Check if it's a 12-byte Uint8Array
    const isUint8Array = (id) => {
        if (typeof id === 'string') {
            const buffer = Buffer.from(id, 'hex');
            return buffer.length === 12;
        }
        return false;
    };

    // Check if it's an integer
    const isInteger = Number.isInteger(Number(guideId));

    return isHexString || isUint8Array(guideId) || isInteger;
}

// Route to render a specific guide based on ID
app.get('/guide/:id', async (req, res) => {
    try {
        // Extract the guide ID from the request parameters
        const guideId = req.params.id;

        if (!isValidGuideId(guideId)) {
            return res.status(400).send("Invalid guide ID. Must be a 24-character hex string, 12-byte Uint8Array, or an integer.<br><br><br><a href='/'>Go home</a>");
        }

        // Fetch the guide from the database using the ID
        const guide = await Guide.findById(guideId).exec();

        // Check if the guide was found
        if (!guide) {
            return res.status(404).send('Guide not found.<br><br><br><a href="/">Go home</a>');
        }

        let isLoggedIn;
        let isOwner;
        if (!req.session.user){
            isLoggedIn = false;
        } else {
            isLoggedIn = true;
            const maybeOwner = await User.findById(req.session.user._id)
            const maybeOwnerId = maybeOwner._id
            if (guide.creator.equals(maybeOwnerId)){
                isOwner = true;
            } else {
                isOwner = false;
            }
        }

        // Render the guide view with the retrieved guide data
        res.render('guide', { guide , isLoggedIn, isOwner });
    } catch (err) {
        // Handle errors, e.g., database errors
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/guide', async (req, res) => {
    return res.render("guideDefault");
});

const crypto = require('crypto');



async function generateUniqueFilename(originalFilename) {
    const ext = path.extname(originalFilename);
    const baseFilename = path.basename(originalFilename, ext);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    return `${baseFilename}_${timestamp}_${randomString}${ext}`;
}

app.post("/makeGuide", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    try {
        const { title, tags, ...body } = req.body;
        const files = req.files;
        const sections = [];
        // Use Object.keys to dynamically collect sections
        const sectionKeys = Object.keys(body).filter(key => key.startsWith('section') && key.endsWith('H2'));
        for (const sectionKey of sectionKeys) {
            const sectionIndex = sectionKey.replace('section', '').replace('H2', ''); // Extract the index
            const sectionHeader = body[sectionKey];
            const paragraphs = [];
            const images = [];
            
            // Dynamically gather paragraphs
            const paragraphKeys = Object.keys(body).filter(key => key.startsWith(`section${sectionIndex}P`) && !key.endsWith('Id'));
            for (const paragraphKey of paragraphKeys) {
                const pIndex = paragraphKey.replace(`section${sectionIndex}P`, '');
                paragraphs.push({
                    text: body[paragraphKey],
                    id: body[`section${sectionIndex}P${pIndex}Id`] || '',
                    pIndex: parseInt(pIndex)
                });
            }

            // Dynamically gather images
            if (files) {
                const imageKeys = Object.keys(files).filter(key => key.startsWith(`section${sectionIndex}Img`));
                for (const imageKey of imageKeys) {
                    const file = files[imageKey];
                    const uniqueFilename = await generateUniqueFilename(file.name);
                    const filePath = path.join('./public/uploads', uniqueFilename);
                    await file.mv(filePath);
                    const imgIndex = imageKey.replace(`section${sectionIndex}Img`, '');
                    images.push({
                        url: `/uploads/${uniqueFilename}`,
                        filename: uniqueFilename,
                        imgIndex: parseInt(imgIndex)
                    });
                }
            }

            // Handle image URLs from body
            const imageUrlKeys = Object.keys(body).filter(key => key.startsWith(`section${sectionIndex}Img`) && key.endsWith('Url'));
            for (const imageUrlKey of imageUrlKeys) {
                const imgIndex = imageUrlKey.replace(`section${sectionIndex}Img`, '').replace('Url', '');
                if (!images.some(img => img.imgIndex === parseInt(imgIndex))) {
                    images.push({
                        url: body[imageUrlKey],
                        filename: body[imageUrlKey].split('/').pop(),
                        imgIndex: parseInt(imgIndex)
                    });
                }
            }

            sections.push({
                header: sectionHeader,
                paragraphs,
                images,
                index: parseInt(sectionIndex)
            });
        }

        // Sort paragraphs and images within each section
        sections.forEach(section => {
            section.paragraphs.sort((a, b) => a.pIndex - b.pIndex);
            section.images.sort((a, b) => a.imgIndex - b.imgIndex);
        });

        // Sort sections
        sections.sort((a, b) => a.index - b.index);

        const guide = new Guide({
            title,
            sections,
            creator: req.session.user._id
        });

        // Handle tags as before
        if (tags) {
            const tagIds = Array.isArray(tags) ? tags : [tags];
            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            const tagExistsPromises = tagIds.map(async (tagId) => {
                if (isValidObjectId(tagId)) {
                    const tagExists = await Tag.findById(tagId);
                    return tagExists ? tagId : null;
                }
                return null;
            });
            const results = await Promise.all(tagExistsPromises);
            guide.tags = results.filter(Boolean);
        }

        await guide.save();
        res.redirect('/guide/' + guide._id);
    } catch (error) {
        console.error('Error in makeGuide:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/editGuide', async (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
        return res.redirect("/login");
    }

    try {
        // Find guide by ID, ensure async handling
        const guide = await Guide.findById(req.body.id);

        if (guide) {
            const user = await User.findById(req.session.user._id);
            const userId = user._id

            if (guide.creator.equals(userId)) {
                // Return guide if found
                return res.json({
                    success: true,
                    guide: guide
                });
            } else {
                // Return error if guide was not authorized
                return res.status(401).json({
                success: false,
                message: "You do not have permission to edit this guide!"
            });
            }
        } else {
            // Return error if guide was not found
            return res.status(404).json({
                success: false,
                message: "Guide not found"
            });
        }
    } catch (err) {
        // Handle any other errors
        return res.status(500).json({
            success: false,
            message: "An error occurred",
            error: err.message
        });
    }
});

app.post('/saveGuide/:id', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const guideId = req.params.id;
    // Validate the guide ID
    if (!isValidGuideId(guideId)) {
        return res.status(400).send('Invalid guide ID');
    }
    try {
        // Retrieve the existing guide
        const existingGuide = await Guide.findById(guideId);
        if (!existingGuide) {
            return res.status(404).send('Guide not found');
        }

        const { title, ...body } = req.body;
        const files = req.files;
        const updatedSections = [];

        // Use Object.keys to dynamically collect sections
        const sectionKeys = Object.keys(body).filter(key => key.startsWith('section') && key.endsWith('H2'));
        for (const sectionKey of sectionKeys) {
            const sectionIndex = sectionKey.replace('section', '').replace('H2', '');
            const sectionHeader = body[sectionKey];
            const newSection = {
                header: sectionHeader,
                paragraphs: [],
                images: [],
                index: parseInt(sectionIndex), // Keep track of the original index
            };

            // Update paragraphs
            const paragraphKeys = Object.keys(body).filter(key => key.startsWith(`section${sectionIndex}P`) && !key.endsWith('Id'));
            for (const paragraphKey of paragraphKeys) {
                const pIndex = paragraphKey.replace(`section${sectionIndex}P`, '');
                newSection.paragraphs.push({
                    text: body[paragraphKey],
                    id: body[`section${sectionIndex}P${pIndex}Id`] || '',
                    pIndex: parseInt(pIndex),
                });
            }

            // Handle new images (file uploads)
            if (files) {
                const imageKeys = Object.keys(files).filter(key => key.startsWith(`section${sectionIndex}Img`));
                for (const imageKey of imageKeys) {
                    const file = files[imageKey];
                    const uniqueFilename = await generateUniqueFilename(file.name);
                    const filePath = path.join('./public/uploads', uniqueFilename);
                    await file.mv(filePath);
                    const imgIndex = imageKey.replace(`section${sectionIndex}Img`, '');
                    newSection.images.push({
                        url: `/uploads/${uniqueFilename}`,
                        filename: uniqueFilename,
                        imgIndex: parseInt(imgIndex),
                    });
                }
            }

            // Handle existing images (URLs in body)
            const imageUrlKeys = Object.keys(body).filter(key => key.startsWith(`section${sectionIndex}Img`) && key.endsWith('Url'));
            for (const imageUrlKey of imageUrlKeys) {
                const imgIndex = imageUrlKey.replace(`section${sectionIndex}Img`, '').replace('Url', '');
                if (!newSection.images.some(img => img.imgIndex === parseInt(imgIndex))) {
                    newSection.images.push({
                        url: body[imageUrlKey],
                        filename: body[imageUrlKey].split('/').pop(),
                        imgIndex: parseInt(imgIndex),
                    });
                }
            }

            // Sort paragraphs and images
            newSection.paragraphs.sort((a, b) => a.pIndex - b.pIndex);
            newSection.images.sort((a, b) => a.imgIndex - b.imgIndex);

            updatedSections.push(newSection);
        }

        // Sort sections
        updatedSections.sort((a, b) => a.index - b.index);

        // Determine images to delete
        const existingImages = existingGuide.sections.flatMap(section => section.images.map(img => img.filename));
        const newImages = updatedSections.flatMap(section => section.images.map(img => img.filename));
        const imagesToDelete = existingImages.filter(img => !newImages.includes(img));

        // Delete previous images from the filesystem
        for (const img of imagesToDelete) {
            const imagePath = path.join(__dirname, 'public', 'uploads', img);
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error(`Error deleting image: ${img}`, err);
                }
            });
        }

        // Update only changed fields in the guide
        await Guide.findByIdAndUpdate(
            guideId,
            { title, sections: updatedSections },
            { new: true, runValidators: true }
        );

        res.redirect('/guide/' + guideId);
    } catch (error) {
        console.error('Error updating guide:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/deleteGuide/:id', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const guideId = req.params.id;

        if (!isValidGuideId(guideId)) {
            return res.status(400).send({ message: "Invalid guide ID. Must be a 24-character hex string, 12-byte Uint8Array, or an integer." });
        }

        // Find the guide to retrieve the image URLs
        const guide = await Guide.findById(guideId);
        if (!guide) {
            return res.status(404).send({ message: "Guide not found." });
        }

        if (guide){
            const ownerQuestionMark = await User.findById(req.session.user._id);
            const ownerQM_ID = ownerQuestionMark._id;
            if (!guide.creator.equals(ownerQM_ID)){
                return res.status(401).send({ message: "You do not own this guide!"});
            }
        }

        // Extract image URLs from all sections
        const imgUrls = guide.sections.flatMap(section => 
            section.images.map(image => image.url)
        );

        // Delete the images first
        const deleteImagePromises = imgUrls.map(imgUrl => {
            const filePath = path.join(__dirname, 'public', imgUrl); // Assuming imgUrls are relative to 'public'
            return new Promise((resolve) => {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error(`Failed to delete image at ${filePath}:`, err);
                    }
                    resolve(); // Resolve regardless of error
                });
            });
        });

        await Promise.all(deleteImagePromises); // Wait for all delete operations to complete

        // Now delete the guide from the database
        const result = await Guide.deleteOne({ _id: new ObjectId(guideId) });

        if (result.deletedCount === 1) {
            return res.status(200).redirect('/');
        } else {
            return res.status(404).send({ message: "Guide not found." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: "An error occurred while deleting the guide." });
    }
});

app.get('/logout', (req, res) => {
    if(!req.session.user){
        return res.redirect('/login');
    } else {
        req.session.destroy()
        return res.redirect('/');
    }
})

app.get('/tags', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    } else {
        const tags = await Tag.find();
        res.render('tags', { tags })
    }
})

app.post('/makeTag', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    } else {
        try {
            const { name, description } = req.body;

            // Create a new Tag instance with the provided data
            const newTag = new Tag({ name, description });

            // Save the tag to the database
            await newTag.save()
                .then((result) => {
                    // Success: send a success message and the created tag
                    res.status(200).json({ 
                        message: 'Tag created successfully', 
                        tag: result 
                    });
                })
                .catch((err) => {
                    // Handle validation or other errors
                    res.status(400).json({ 
                        message: 'Failed to create tag', 
                        error: err.message 
                    });
                });

        } catch (error) {
            // General server error handling
            res.status(500).json({ 
                message: 'Internal server error', 
                error: error.message 
            });
        }}
});

app.post('/addTagToGuide', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    } else {
        try {
            const { guideId, selectedTags } = req.body;

            // Ensure guideId and selectedTags are provided
            if (!guideId || !selectedTags || selectedTags.length === 0) {
                return res.status(400).json({ message: 'Guide ID and selected tags are required.' });
            }

            // Find the guide by its ID
            const guide = await Guide.findById(guideId);

            if (!guide) {
                return res.status(404).json({ message: 'Guide not found.' });
            } else {
                const ownr = await User.findById(req.session.user._id)
                const ownrId = ownr._id;
                if (!guide.creator.equals(ownrId)){
                    return res.status(401).json({ message: "Guide not yours... >:("});
                }
            }

            // Find all tags that match the selected tags
            const tags = await Tag.find({ name: { $in: selectedTags } });

            if (tags.length === 0) {
                return res.status(404).json({ message: 'No matching tags found.' });
            }

            // Add tags to the guide (assuming the Guide schema has a 'tags' field)
            // Avoid duplicating tags
            tags.forEach(tag => {
                if (!guide.tags.includes(tag._id)) {
                    guide.tags.push(tag._id);
                }
            });

            // Save the guide with the updated tags
            await guide.save();

            // Respond with success
            res.status(200).json({ message: 'Tags added successfully.', guide });
        } catch (error) {
            console.error('Error adding tags to guide:', error);
            res.status(500).json({ message: 'An error occurred while adding tags to the guide.', error });
        }}
});

app.get('/profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    const user = req.session.user

    res.render('profile', { user })
})

const codeExpiry = {}; // Temporary storage for verification codes

app.post('/resetPassword', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const { password } = req.body;

    try {
        const user = await User.findById(req.session.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
        if (isPasswordCorrect) {
            const email = user.email;

            // Generate a secure random code
            const code = crypto.randomInt(100000, 999999); // Generate a 6-digit code

            // Store the code and its expiry time (e.g., 5 minutes)
            codeExpiry[email] = { code, expires: Date.now() + 10 * 60 * 1000 };

            const mailOptions = {
                from: `"Brukerguides Support" <${process.env.SMTP_USER}>`,
                to: email,
                subject: "Code for resetting password",
                text: `Here is your code for resetting your password: ${code}\n\nThis code will work for the next 10 minutes`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error occurred: ' + error.message);
                    return res.status(500).json({ success: false, message: 'Email not sent' });
                }
                return res.status(200).json({ success: true, messageId: info.messageId });
            });
        } else {
            return res.status(400).json({ success: false, message: "Password incorrect." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

app.post('/verifyAndChange', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const { code, newPassword } = req.body; // Expecting the verification code and new password
    // Get the user ID from the session
    const userId = req.session.user._id;
    
    // Check if the user exists in the database
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Check if the code exists for this user in the temporary storage
        if (codeExpiry[user.email]) { // Assuming you are still using email as a key
            const storedCode = codeExpiry[user.email].code;
            const expires = codeExpiry[user.email].expires;


            // Validate the code and check for expiration
            if (storedCode.toString() === code) {
                if (Date.now() < expires) {
                    // Hash the new password
                    const hashedPassword = await bcrypt.hash(newPassword, 10);
                    
                    // Update user password in the database
                    user.passwordHash = hashedPassword;
                    await user.save();

                    // Remove the code from memory after changing the password
                    delete codeExpiry[user.email];

                    return res.status(200).json({ success: true, message: "Password changed successfully." });
                } else {
                    delete codeExpiry[user.email]; // Code has expired, delete it
                    return res.status(400).json({ success: false, message: "Code has expired." });
                }
            }
        }

        return res.status(400).json({ success: false, message: "Invalid code." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error." });
    }
});



app.post('/delAcc', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    
    const { password } = req.body;

    try {
        const user = await User.findById(req.session.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
        if (isPasswordCorrect) {
            await User.findByIdAndDelete(req.session.user._id);
            req.session.destroy();
            return res.status(200).json({ success: true, message: "User deleted." });
        } else {
            return res.status(400).json({ success: false, message: "Incorrect password." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

app.get('/auth/google', (req, res) => {
    const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    });
    res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;

    try {
        // Exchange code for tokens
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        // Get user info
        const userInfoResponse = await client.request({
            url: 'https://www.googleapis.com/oauth2/v3/userinfo'
        });
        const userInfo = userInfoResponse.data;

        // Extract user info
        const email = userInfo.email; // User's email
        const username = userInfo.name; // User's name as username

        // Check if the user exists in the database
        let existingUser = await User.findOne({ email });

        if (!existingUser) {
            // If the user does not exist, create a new user
            const generatedPassword = require('crypto').randomBytes(8).toString('hex');

            existingUser = new User({
                username,
                email,
                passwordHash: await bcrypt.hash(generatedPassword, 10) // Hash the generated password
            });

            await existingUser.save();

            // Send a welcome email
            const mailOptions = {
                from: `"Brukerguides Support" <${process.env.SMTP_USER}>`,
                to: email,
                subject: "Thanks for signing up with Google",
                text: `You signed up with Google, and we generated a password for you. Please feel free to change this: ${generatedPassword}`
            };

            await transporter.sendMail(mailOptions);
        }

        // Automatically log in the user
        req.session.user = {
            _id: existingUser._id,
            username: existingUser.username
        };

        // Redirect to the profile or home page
        res.redirect('/profile');
    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).send('Authentication failed. Please try again.');
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
    console.log("Test update")
});