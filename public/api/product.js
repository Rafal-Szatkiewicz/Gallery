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
  //const cloudinary = require('cloudinary');
  const cloudinary = require('cloudinary-core').Cloudinary.new();
  const express = require('express');
  const fileUpload = require('express-fileupload');
  const path = require('path');
  const fs = require('fs');
  const router = express.Router();
  require("dotenv").config();
  
  // Replace with your Cloudinary API key and secret
  cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET
  });
  
  // Replace with your MongoDB connection string
  const mongoUrl = 'mongodb+srv://r3r2xh93:AQOhP7z9hcoo7TeO@gallery.uxrixqp.mongodb.net/gallery';
  
  //const app = express();
  
  // Enable file uploads
  router.use(fileUpload({
    createParentPath: true,
    useTempFiles: true
  }));
  router.use(express.json());
  router.use(express.urlencoded({extended: true}));
  router.use(express.static(path.join(__dirname, '/public')));
  
  // Set up the route for the HTML form
  router.post('/upload', async (req, res) => {
    // Make sure a file was uploaded
    console.log(req.files.image.name);
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
    await db.collection('images').insertOne({ url: imageUrl, version: version, public_id: public_id, format: format, width: width, height: height, date: date });
  
    console.log(`Inserted image URL into the MongoDB collection: ${imageUrl}`);
  
    // Close the MongoDB connection
    client.close();
  
    res.redirect('/gallery');
  });
  
  router.get('/', async (req, res) => {
    // Connect to the MongoDB database
    console.log('gallery entered');
    const client = await mongodb.MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const db = client.db('gallery');
  
  // Find all images in the collection
  const images = await db.collection('images').find().sort({ _id: -1 }).toArray();

  // Close the MongoDB connection
  client.close();

  // Generate the HTML for the images and the grid layout elements
  //let html = '<div id="images"><div class="grid">';
  let html = '';
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
  res.sendFile("style.css");
});
module.exports = router;