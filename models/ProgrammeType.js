const mongoose = require('mongoose');



const TypeProgrammeSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true 
    },
    libelle: { 
        type: String, 
        required: true
    }
});


module.exports = mongoose.model('ProgrammeType', TypeProgrammeSchema);