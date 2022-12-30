/* global bootstrap: false */

/*(() => {
    'use strict'
    const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.forEach(tooltipTriggerEl => {
      new bootstrap.Tooltip(tooltipTriggerEl)
    })
  })()*/

  // external js: packery.pkgd.js, draggabilly.pkgd.js
  const mongodb = require('mongodb');
  const cloudinary = require('cloudinary').v2;
  //const cloudinary = require('cloudinary-core').Cloudinary.new();
  const express = require('express');
  const fileUpload = require('express-fileupload');
  const path = require('path');
  const fs = require('fs');
  const router = express.Router();
  const bcrypt = require('bcryptjs');
  require("dotenv").config();
  
  // Replace with your Cloudinary API key and secret
  cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
  });
  // Replace with your MongoDB connection string
  const mongoUrl = 'mongodb+srv://r3r2xh93:AQOhP7z9hcoo7TeO@gallery.uxrixqp.mongodb.net/gallery';

  let username = ''; //global variable for documents relations;
  
  //const app = express();
  
  // Enable file uploads
  router.use(fileUpload({
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: '/tmp/'
  }));
  router.use(express.json());
  router.use(express.urlencoded({extended: true}));
  router.use(express.static('./api'));
  
  // Set up the route for the HTML form
  router.post('/upload', async (req, res) => {
    // Make sure a file was uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }
  
    // Get the uploaded file
    const file = req.files.image;
  
    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath);
    //console.log(result);
    const imageUrl = result.url;
    const version = result.version;
    const public_id = result.public_id;
    const format = result.format;
    const width = result.width;
    const height = result.height;
    const date = result.created_at;
  
    // Connect to the MongoDB database
    const client = await mongodb.MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const db = client.db('gallery');
  
    // Insert the image URL into the MongoDB collection
    await db.collection('images').insertOne({ username: username, url: imageUrl, version: version, public_id: public_id, format: format, width: width, height: height, date: date });
  
    console.log(`Inserted image URL into the MongoDB collection: ${imageUrl}`);
  
    // Close the MongoDB connection
    client.close();
  
    res.redirect('/gallery');
  });
  router.post('/signedIn', async (req, res) =>{

    username = req.body.username;
    const password = req.body.password;

    const client = await mongodb.MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const db = client.db('gallery');
  
    const verify = await db.collection('users').findOne({username: username});
    //console.log(verify);

    if(verify === null)
    {

      client.close();
      console.log("invalid data");
      res.redirect('/invalidLogin');
    }
    else
    {
      let verifyHash = false;
      verifyHash = await bcrypt.compare(password, verify.password)

      if(verifyHash == true)
      {
        console.log("logged in");
        client.close();
        res.redirect('/gallery');
      }
      else
      {
        client.close();
        console.log("invalid data");
        res.redirect('/invalidLogin');
      }
    }
  });
  router.post('/signedUp', async (req, res) =>{

    const salt = await bcrypt.genSalt(10);

    username = req.body.usernameSignUp;
    const password = await bcrypt.hash(req.body.passwordSignUp, salt);


    const client = await mongodb.MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const db = client.db('gallery');
  
    const distinct = await db.collection('users').findOne({username: username});
    if(distinct === null)
    {
      console.log("new user added");
      await db.collection('users').insertOne({ username: username, password: password});
      client.close();
      res.redirect('/gallery');
    }
    else
    {
      client.close();
      console.log("username taken");
      res.redirect('/invalid');
    }

  });
  
  router.get('/gallery', async (req, res) => {
    // Connect to the MongoDB database
    if(username == "")
    {
      res.sendStatus(404);
    }

    console.log('gallery entered');
    const client = await mongodb.MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const db = client.db('gallery');
  
  // Find all images in the collection
  const images = await db.collection('images').find({username: username}).sort({ _id: -1 }).toArray();

  // Close the MongoDB connection
  client.close();

  // Generate the HTML for the images and the grid layout elements
  //let html = '<div id="images"><div class="grid">';
  let html = "<style>body{    margin: 0;    padding: 0;    background-color: #111927;    overflow-x: hidden;    height: 100vh;    overflow-y: hidden;    overflow-x: hidden;}main{    width: 100vw;    height: 100%;        background-image: url(./img/background.jpg);    background-repeat: no-repeat;    background-position: 0%;    }.btn-group-vertical{    backdrop-filter: blur(25px) saturate(100%) !important;    -webkit-backdrop-filter: blur(25px) saturate(100%) !important;    background-color: #121212d1 !important;    border-right: 2px solid rgba(23, 107, 181, 0.3) !important;    position: relative;    width: 4.5rem;    height: 100%;    float: left;}.btn-group-vertical button{    border-radius: 0;}.btn-group-vertical li{    background: rgba(3, 172, 240, 0) !important;    width: 4.5rem;    transition: 0.3s;}.btn-group-vertical li:hover{    backdrop-filter: blur(25px) saturate(200%) !important;    -webkit-backdrop-filter: blur(25px) saturate(200%) !important;    background-color: rgba(36, 59, 226, 0.8) !important;    width: 4.5rem;    transition: 0.3s;}.btn-group-vertical img{    filter: invert(98%) sepia(66%) saturate(6900%) hue-rotate(182deg) brightness(124%) contrast(92%);}#images{    backdrop-filter: blur(30px) saturate(100%) !important;    -webkit-backdrop-filter: blur(30px) saturate(100%) !important;    background-color: #121212d1 !important;    height: 100%;    width: calc(100vw - 4.5rem);    float: right;    overflow-y: scroll;    overflow-x: hidden;}#images img{    width: 80%;    height: 80%;    transition: .6s;    object-fit: cover;}#images img:hover{    width: 100%;    height: 100%;    transition: .6s;    border-radius: 12px;}.glass-border{    width: 100%;    height: 100%;    backdrop-filter: blur(4px) saturate(200%);    -webkit-backdrop-filter: blur(4px) saturate(200%);    background-color: rgba(0, 0, 0, 0.167);    border-radius: 12px;    border: 2px solid rgba(255, 255, 255, 0.125);        display: flex;    justify-content: center;}.glass{    background-size:cover !important;    background-repeat: no-repeat !important;    position: relative;    border-radius: 12px;    float: left;    display: flex;    justify-content: center;    transition: .3s;}    .grid:after {    content: '';    display: block;    clear: both;  }      .grid-item  {    float: left;    width: 25%;    height: 50vh;    min-width: 20rem;    max-width: 25%;  }    .grid-item--width2 {    width: 75%;     height: 50vh;     min-width: calc(100vh - 20rem);    max-width: 75%;    }    .grid-item--width3 {      width: 100%;       height: 50vh;       min-width: calc(100vh - 20rem);      max-width: 100%;      }  .grid-item--height2 {    width: 30rem;     height: 100vh;     min-width: 20rem;    max-width: 25%;    }    .grid-item:hover {    cursor: move;  }    .grid-item.is-dragging,  .grid-item.is-positioning-post-drag {    z-index: 2;    transition: .15s;  }    .packery-drop-placeholder {    background-color: rgba(250, 235, 215, 0.16);    -webkit-transition: -webkit-transform 0.5s;            transition: transform 0.5s;  }  #last  {    display: none;  }  .drag-area{    border: 3px dashed #fff;    height: 500px !important;    border-radius: 5px;    display: flex;    align-items: center;    justify-content: center;    flex-direction: column;    transition: 0.5s;  }  .drag-area.active{    transition: 0.5s;    border: 3px solid #fff;  }  .drag-area .icon{    font-size: 100px;    color: #fff;  }  .drag-area header{    font-size: 30px;    font-weight: 500;    color: #fff;  }  .drag-area span{    font-size: 25px;    font-weight: 500;    color: #fff;    margin: 10px 0 15px 0;  }  .drag-area button{    padding: 10px 25px;    font-size: 20px;    font-weight: 500;    border: none;    outline: none;    background: #fff;    color: rgba(41, 41, 41);    border-radius: 5px;    cursor: pointer;  }  .drag-area img{    height: 100%;    width: 100%;    object-fit: cover;    border-radius: 5px;  }</style>";
  const baseUrl = 'http://res.cloudinary.com/ddriyyppm/image/upload';
  for (const image of images) {

    let blockType = "grid-item"
    let sizer = "";
    if(image.width > image.height)
    {
      if(image.width - image.height > 100)
      {
        blockType = "grid-item grid-item--width2";
      }
    }
    else
    {
      if(image.height - image.width > 100)
      {
        blockType = "grid-item grid-item--height2";
      }
    }

    if(blockType == "grid-item")
    {
      sizer = "grid-sizer"
    }
    if(image.format != "png")
    {
      html += `<div class="glass ${blockType} ${sizer}"><div class="glass-border d-flex justify-content-center align-items-center" style="background-image: url(${baseUrl}/v${image.version}/${image.public_id}.${image.format});"><img src="${baseUrl}/c_fill,g_auto/v${image.version}/${image.public_id}.${image.format}" alt=""></div></div>`;
    }
    else
    {
      html += `<div class="glass ${blockType} ${sizer}"><div class="glass-border d-flex justify-content-center align-items-center"><img src="${baseUrl}/c_fill,g_auto/v${image.version}/${image.public_id}.${image.format}" alt=""></div></div>`;
    }
  }
  html += '<dir id="last"></dir>';
  //html += '<div class="grid-item bg-dark grid-item--width2"></div><div class="grid-item bg-dark grid-item--width2"></div><div class="grid-item bg-dark grid-item--width2"></div><div class="grid-item bg-dark grid-item--height2"></div><div class="grid-item bg-dark grid-item--height2"></div><div class="grid-item bg-dark grid-item--height2"></div></div></div>';

  // Read the HTML file
  const file = await fs.promises.readFile(path.join(__dirname, './gallery.html'), 'utf8');

  // Replace the placeholder element with the generated HTML
  const output = file.replace('<dir id="last"></dir>', html);

  // Send the HTML file to the client
  res.send(output);
  });

  let htmlIndex = `<style>* {    margin: 0;    padding: 0;    box-sizing: border-box;    overflow: hidden;}body {    height: 100vh;        background-image: url(https://res.cloudinary.com/ddriyyppm/image/upload/v1672267405/background_rkrvc3.jpg);    background-repeat: no-repeat;    background-position: 0%;}main{    width: 100vw;    height: 200vh;    display: flex;    align-items: center;    justify-content: center;    flex-direction: column;    backdrop-filter: blur(25px) saturate(100%) !important;    -webkit-backdrop-filter: blur(25px) saturate(100%) !important;    background-color: #121212d1 !important;    transition: 2s;}.login {    width: 360px;    height: min-content;    padding: 20px;    color: whitesmoke;    border-radius: 36px;    background: #121212;    box-shadow: inset 9px 9px 18px #070707,            inset -9px -9px 18px #1d1d1d;}.login h1 {    font-size: 36px;    margin-bottom: 25px;}.login form {    font-size: 20px;}.login form .form-group {    margin-bottom: 12px;}.login form input[type='submit'] {    font-size: 20px;    margin-top: 15px;}.form-control,.form-control:valid ,.form-control:focus{    color: whitesmoke;    background-color: #121212;}.btn{    transition: .5s;    color: whitesmoke;    border-radius: 15px;    background: #121212;    box-shadow: inset -3px -3px 10px #070707,            inset 3px 3px 10px #1d1d1d !important;}.btn:hover{    transition: .5s;    color: rgba(245, 245, 245, 0.21);    border-radius: 15px;    background: #121212;    box-shadow: inset -3px -3px 10px #0707071c,            inset 3px 3px 10px #1d1d1d36 !important;}.signup{    font-size: 17px;}.signup a{    text-decoration: none;    font-weight: bold;}.text-center{    padding-bottom: 5px;}</style>`;

  router.get('/', async (req, res) => {

    const file = await fs.promises.readFile(path.join(__dirname, './index.html'), 'utf8');
    const output = file.replace('<link rel="stylesheet" href="style2.css">', htmlIndex);
    res.send(output);
  });
  router.get('/invalid', async (req, res) => {

  let file = await fs.promises.readFile(path.join(__dirname, './index.html'), 'utf8');
    file = file.replace('<link rel="stylesheet" href="style2.css">', htmlIndex);
    file = file.replace('Please enter your email username <span></span>', 'This username is already taken');
    res.send(file);
  });
  router.get('/invalidLogin', async (req, res) => {

    let file = await fs.promises.readFile(path.join(__dirname, './index.html'), 'utf8');
      file = file.replace('<link rel="stylesheet" href="style2.css">', htmlIndex);
      file = file.replace('Please enter your email username <span class="check"></span>', 'Invalid username or password');
      file = file.replace('Please enter your password <span class="check"></span>', 'Invalid username or password');
      res.send(file);
    });
module.exports = router;