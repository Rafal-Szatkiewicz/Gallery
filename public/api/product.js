  const mongodb = require('mongodb');
  const cloudinary = require('cloudinary').v2;
  //const cloudinary = require('cloudinary-core').Cloudinary.new();
  const express = require('express');
  const fileUpload = require('express-fileupload');
  const path = require('path');
  const fs = require('fs');
  const router = express.Router();
  const bcrypt = require('bcryptjs');
const { text } = require('express');
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

  let client = null;
  let db = null;
  
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
    const fileName = file.name;
    const imageUrl = result.url.replace("http","https");
    const version = result.version;
    const public_id = result.public_id;
    const format = result.format;
    const width = result.width;
    const height = result.height;
    const date = result.created_at;
  
  
    // Insert the image URL into the MongoDB collection
    await db.collection('images').insertOne({ username: username, url: imageUrl, version: version, public_id: public_id, format: format, width: width, height: height, date: date, name: fileName});
  
    console.log(`Inserted image URL into the MongoDB collection: ${imageUrl}`);
  
    // Close the MongoDB connection
    //client.close();
  
    res.redirect('/gallery');
  });
  router.post('/signedIn', async (req, res) =>{

    username = req.body.username;
    const password = req.body.password;

  
    const verify = await db.collection('users').findOne({username: username});
    //console.log(verify);

    if(verify === null)
    {

      //client.close();
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
        //client.close();
        res.redirect('/gallery');
      }
      else
      {
        //client.close();
        console.log("invalid data");
        res.redirect('/invalidLogin');
      }
    }
  });
  router.post('/signedUp', async (req, res) =>{

    const salt = await bcrypt.genSalt(10);

    username = req.body.usernameSignUp;
    const password = await bcrypt.hash(req.body.passwordSignUp, salt);


  
    const distinct = await db.collection('users').findOne({username: username});
    if(distinct === null)
    {
      console.log("new user added");
      await db.collection('users').insertOne({ username: username, password: password});
      //client.close();
      res.redirect('/gallery');
    }
    else
    {
      //client.close();
      console.log("username taken");
      res.redirect('/invalid');
    }

  });
  router.post('/delete', async (req, res) =>{
    const id = req.body.id;
    cloudinary.uploader.destroy(id);

    db.collection('images').deleteOne( { public_id: id } );
    //client.close();

    res.redirect('/gallery');
  });
  router.post('/deleteAccount', async (req, res) =>{

    if(req.body.verify == "passed")
    {
      const images = await db.collection('images').find({username: username}).sort({ _id: -1 }).toArray();
      for (const image of images)
      {
        cloudinary.uploader.destroy(image.public_id);
      }
      db.collection('images').deleteMany( { username: username } );
      db.collection('users').deleteMany( { username: username } );
      //client.close();
  
      username = '';
      res.redirect('/');
    }
    else
    {
      res.redirect('/gallery');
    }
  });
  
  router.get('/gallery', async (req, res) => {
    // Connect to the MongoDB database
    if(username == "")
    {
      res.sendStatus(404);
    }
    else
    {
        console.log('gallery entered');
      
      // Find all images in the collection
      const images = await db.collection('images').find({username: username}).sort({ _id: -1 }).toArray();

      // Close the MongoDB connection
      //client.close();

      // Generate the HTML for the images and the grid layout elements
      //let html = '<div id="images"><div class="grid">';
      let html = "<style>body{    margin: 0;    padding: 0;    background-color: #111927;    height: 100vh;    overflow-y: hidden;    overflow-x: hidden;    background-image: url(https://res.cloudinary.com/ddriyyppm/image/upload/v1672267405/background_rkrvc3.jpg);    background-repeat: no-repeat;    background-position: 0%;}main{    width: 100vw;    height: 100%;        transition: 1s;}.btn-group-vertical{    backdrop-filter: blur(25px) saturate(100%) !important;    -webkit-backdrop-filter: blur(25px) saturate(100%) !important;    background-color: #121212d1 !important;    border-right: 2px solid rgba(255, 255, 255, 8%) !important;    position: relative;    width: 4.5rem;    height: 100%;    float: left;}.btn-group-vertical button{    border-radius: 0;}.btn-group-vertical li{    background: rgba(3, 172, 240, 0) !important;    width: 4.5rem;    transition: 0.3s;}.btn-group-vertical li:hover{    backdrop-filter: blur(25px) saturate(200%) !important;    -webkit-backdrop-filter: blur(25px) saturate(200%) !important;    background-color: rgba(36, 59, 226, 0.8) !important;    width: 4.5rem;    transition: 0.3s;}.btn-group-vertical img{    filter: invert(98%) sepia(66%) saturate(6900%) hue-rotate(182deg) brightness(124%) contrast(92%);}#images{    backdrop-filter: blur(30px) saturate(100%) !important;    -webkit-backdrop-filter: blur(30px) saturate(100%) !important;    background-color: #121212d1 !important;    height: 100%;    width: calc(100vw - 4.5rem);    float: right;    overflow-y: scroll;    overflow-x: hidden;    z-index: 0;    position: relative;}#images img{    width: 80%;    height: 80%;    transition: .6s;    object-fit: cover;}#images img:hover{    width: 100%;    height: 100%;    transition: .6s;    border-radius: 12px;}.glass-border{    position: relative;    width: 100%;    height: 100%;    backdrop-filter: blur(4px) saturate(200%);    -webkit-backdrop-filter: blur(4px) saturate(200%);    background-color: rgba(0, 0, 0, 0.167);    background-size: cover;    background-repeat: no-repeat;    border-radius: 12px;    border: 2px solid rgba(255, 255, 255, 0.125);        display: flex;    justify-content: center;}.glass{    background-size:cover !important;    background-repeat: no-repeat !important;    position: relative;    border-radius: 12px;    float: left;    display: flex;    justify-content: center;    transition: .3s;}    .grid:after {    content: '';    display: block;    clear: both;  }      .grid-item, .grid-sizer  {    float: left;    width: 25%;    height: 50vh;    min-width: 20rem;    max-width: 25%;  }    .grid-item--width2 {    width: 75%;     height: 50vh;     min-width: calc(100vh - 20rem);    max-width: 75%;    }    .grid-item--width3 {      width: 100%;       height: 50vh;       min-width: calc(100vh - 20rem);      max-width: 100%;      }  .grid-item--height2 {    width: 30rem;     height: 100vh;     min-width: 20rem;    max-width: 25%;    }    .grid-item:hover {    cursor: move;  }    .grid-item.is-dragging,  .grid-item.is-positioning-post-drag {    z-index: 2;    transition: .15s;  }    .packery-drop-placeholder {    background-color: rgba(250, 235, 215, 0.16);    -webkit-transition: -webkit-transform 0.5s;            transition: transform 0.5s;  }  #last  {    display: none;  }  .drag-area{    outline: 3px dashed #fff;    outline-offset: -3px;    height: 500px !important;    border-radius: 5px;    display: flex;    align-items: center;    justify-content: center;    flex-direction: column;    transition: 0.5s;  }  .drag-area.active{    transition: 0.5s;     outline: 3px solid #fff;    outline-offset: -20px;  }  .drag-area .icon{    font-size: 100px;    color: #fff;  }  .drag-area header{    font-size: 30px;    font-weight: 500;    color: #fff;  }  .drag-area span{    font-size: 25px;    font-weight: 500;    color: #fff;    margin: 10px 0 15px 0;  }  .drag-area .uploadButton{    padding: 10px 25px;    font-size: 20px;    font-weight: 500;    border: none;    outline: none;    background: #fff;    color: rgb(41, 41, 41);    border-radius: 5px;    cursor: pointer;  }  .drag-area img{    height: 100%;    width: 100%;    object-fit: cover;    border-radius: 5px;  }    .imageClicked  {    width: 0%;    height: 100%;    backdrop-filter: blur(15px) saturate(200%);    -webkit-backdrop-filter: blur(15px) saturate(200%);    background-color: rgba(0, 0, 0, 0.351);    position: absolute;    z-index: 2;    transition: .5s;    display: flex;    justify-content: center;    gap: 10px;    border-radius: 12px;  }  .imageClicked form  {    margin-top:auto;     margin-bottom:auto;    height: 6rem;  }  .imageClicked button  {    margin-top:auto;     margin-bottom:auto;    height: 6rem;    padding: 0px 0px;    font-size: 35px;    font-weight: 500;    border: none;    outline: none;    background: rgba(255, 255, 255, 0);    color: rgba(41, 41, 41, 0);    border-radius: 5px;    transition: .5s;  }  .noHover  {    pointer-events: none;  }  #about  {    position: absolute;    height: 100vh;    width: 100vw;    transform: translate(-100vw);    color: whitesmoke;    z-index: 10;    transition: 1s;    backdrop-filter: blur(30px) saturate(100%) !important;    -webkit-backdrop-filter: blur(30px) saturate(100%) !important;    background-color: #121212d1 !important;  }  #aboutCenter   {    text-align: left;    margin: auto;    padding: 3rem;    height: 100%;    overflow-y: scroll;    line-height: 2.15rem;  }  .fw-bold   {    color: #7af1ff;  }  .display-6 a  {    text-decoration: none;    color: #7af1ff;    font-size: 2rem;  }  #lightbox  {    z-index: -3;    position: absolute;    background-color: whitesmoke;    /* z-index: 10; */    border: 10px solid whitesmoke;    height: 95vh;    width: 95vw;    left: 0;    right: 0;    top: 0;    bottom: 0;    margin: auto;    padding: 15px;    background-image: url();    background-size: contain;    background-repeat: no-repeat;    background-position: center;    transition: .3s;    opacity: 0;  }</style>";
      const baseUrl = 'https://res.cloudinary.com/ddriyyppm/image/upload';
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
          html += `<div class="glass ${blockType} ${sizer}"><div class="glass-border d-flex justify-content-center align-items-center" style="background-image: url(${baseUrl}/v${image.version}/${image.public_id}.${image.format});" onclick="imageClick(this)"><img src="${baseUrl}/c_fill,g_auto/v${image.version}/${image.public_id}.${image.format}" alt="${image.name}"><div class="imageClicked"><button class="noHover" onclick="lightbox('${image.url}')"><i class="fa-solid fa-magnifying-glass"></i></button><button class="noHover" onclick="downloadImage('${image.url}','${image.name}')"><i class="fa-solid fa-download"></i></button><form action="/delete" method="POST"><button type="button" class="noHover" onclick="deleteImage(this,'${image.public_id}')"><i class="fa-solid fa-trash-can"></i></button></form></div></div></div>`;
        }
        else
        {
          html += `<div class="glass ${blockType} ${sizer}"><div class="glass-border d-flex justify-content-center align-items-center" onclick="imageClick(this)"><img src="${baseUrl}/c_fill,g_auto/v${image.version}/${image.public_id}.${image.format}" alt="${image.name}"><div class="imageClicked"><button class="noHover" onclick="lightbox('${image.url}')"><i class="fa-solid fa-magnifying-glass"></i></button><button class="noHover" onclick="downloadImage('${image.url}','${image.name}')"><i class="fa-solid fa-download"></i></button><form action="/delete" method="POST"><button type="button"  class="noHover" onclick="deleteImage(this,'${image.public_id}')"><i class="fa-solid fa-trash-can"></i></button></form></div></div></div>`;
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
    }
  });
  router.get('/signOut', async (req,res) => {
    username = '';
    res.redirect('/');
  });

  let htmlIndex = `<style>* {    margin: 0;    padding: 0;    box-sizing: border-box;    overflow: hidden;}body {    height: 100vh;        background-image: url(https://res.cloudinary.com/ddriyyppm/image/upload/v1672267405/background_rkrvc3.jpg);    background-repeat: no-repeat;    background-position: 0%;}main{    width: 100vw;    height: 200vh;    display: flex;    align-items: center;    justify-content: center;    flex-direction: column;    backdrop-filter: blur(25px) saturate(100%) !important;    -webkit-backdrop-filter: blur(25px) saturate(100%) !important;    background-color: #121212d1 !important;    transition: 2s;}.login {    width: 360px;    height: min-content;    padding: 20px;    color: whitesmoke;    border-radius: 36px;    background: #121212;    box-shadow: inset 9px 9px 18px #070707,            inset -9px -9px 18px #1d1d1d;}.login h1 {    font-size: 36px;    margin-bottom: 25px;}.login form {    font-size: 20px;}.login form .form-group {    margin-bottom: 12px;}.login form input[type='submit'] {    font-size: 20px;    margin-top: 15px;}.form-control,.form-control:valid ,.form-control:focus{    color: whitesmoke;    background-color: #121212;}.btn{    transition: .5s;    color: whitesmoke;    border-radius: 15px;    font-weight: bold;    border: 1px solid whitesmoke;}.btn:hover{    transition: .5s;    color: #070707;    border-radius: 15px;    background: whitesmoke;    font-weight: bold;}.signup{    font-size: 17px;}.signup a{    text-decoration: none;    font-weight: bold;}.text-center{    padding-bottom: 5px;}.roller{    height: 100vh;    display: flex;    align-items: center;    justify-content: center;}</style>`;

  router.get('/', async (req, res) => {

    client = await mongodb.MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    db = client.db('gallery');

    const file = await fs.promises.readFile(path.join(__dirname, './index.html'), 'utf8');
    const output = file.replace('<link rel="stylesheet" href="style2.css">', htmlIndex);
    res.send(output);
  });
  router.get('/invalid', async (req, res) => {

  let file = await fs.promises.readFile(path.join(__dirname, './index.html'), 'utf8');
    file = file.replace('<link rel="stylesheet" href="style2.css">', htmlIndex);
    file = file.replace('Please enter your username <span></span>', 'This username is already taken');
    res.send(file);
  });
  router.get('/invalidLogin', async (req, res) => {

    let file = await fs.promises.readFile(path.join(__dirname, './index.html'), 'utf8');
      file = file.replace('<link rel="stylesheet" href="style2.css">', htmlIndex);
      file = file.replace('Please enter your username <span class="check"></span>', 'Invalid username or password');
      file = file.replace('Please enter your password <span class="check"></span>', 'Invalid username or password');
      res.send(file);
    });
module.exports = router;