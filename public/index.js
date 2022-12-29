const express = require('express');
const product = require('./api/product');
app = express();

app.use("/", product);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});