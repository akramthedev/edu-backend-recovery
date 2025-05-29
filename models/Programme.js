const mongoose = require('mongoose');



const ProgrammeSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true 
    },
    typeProgramme: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ProgrammeType', 
        required: true 
    },
    inscription: {
        debut: Date,
        fin: Date
    }

});


module.exports = mongoose.model('Programme', ProgrammeSchema);