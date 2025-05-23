const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
    {
        nom : {
            type : String, 
            required : true
        }, 
        code : {
            type : String, 
            required : false
        },
        intervenants : [
            {
                type : mongoose.Schema.Types.ObjectId, 
                ref : 'Intervenant'
            }
        ], 
        semestre : {
            type : String, 
            required : false
        },
        description : {
            type : String, 
            required : false
        },
        credits : {
            type : Number, 
            required : false
        },
    },
    {
        timestamps : true, 
    }
);



module.exports = mongoose.model('Module', moduleSchema);
