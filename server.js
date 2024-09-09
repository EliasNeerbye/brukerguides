const express = require('express');
const app = express();
const path = require('path');
require("dotenv").config();
const favicon = require("serve-favicon");


app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(favicon('public/assets/favicon.ico'));

app.get('/', (req, res) => {
    res.render('index');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});