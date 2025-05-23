const mongoose = require('mongoose');


const seanceSchema = new mongoose.Schema(
    {
        moduleId : {
            type : mongoose.Schema.Types.ObjectId, 
            required : true,
            ref : 'Module'
        },
        salle : {
            type : String, 
            required : true, 
        }, 
        startDateTime: {
            type: Date,
            required: true,
        },
        endDateTime: {
            type: Date,
            required: true,
        },
        type : {
            type : String, 
            required : true,
        },
        groupe : {
            type : [String], 
            required : true,
        },
        classe : {
            type : String, 
            required : true,
        }
    },
    {
        timestamps : true,
    }
);


module.exports = mongoose.model('Seance', seanceSchema);