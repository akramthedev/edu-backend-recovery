const mongoose = require('mongoose');


const notificationSchema = new mongoose.Schema({
    
    userId : {
        type : String, 
        required : true
    },
    titre : {
        type : String, 
        required : true
    }, 
    description : {
        type : String, 
    }, 
    type : {
        type : String, 
    }, 
    isSeen : {
        type : Boolean,
        default : true, 
    }, 

}, {
    timestamps : true
});


module.exports = mongoose.model('Notification', notificationSchema);