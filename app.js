const express = require('express');
const connectDb = require('./config/db');
const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');
const authRoute = require("./routes/auth");
const userRoute = require("./routes/user");



const app = express();
const PORT = process.env.PORT || 5000 


dotenv.config();
app.use(express.json());
app.use(cookieParser());


app.listen(PORT, ()=>{
    console.log(`Server running on PORT=${PORT}`);
    connectDb();
});


app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);