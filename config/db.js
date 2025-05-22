const mongoose = require('mongoose');
require('dotenv').config(); 

const connectDB = async () => {
  try {
    const connectionState = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to MongoDb`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);  
  }
};

module.exports = connectDB;