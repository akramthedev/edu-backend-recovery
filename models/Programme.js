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
    filiere: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Filiere', 
            required: false 
        }
    ],
    inscription: {
        debut: Date,
        fin: Date
    }

});


module.exports = mongoose.model('Programme', ProgrammeSchema);