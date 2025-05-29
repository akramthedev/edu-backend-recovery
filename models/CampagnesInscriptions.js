const mongoose = require('mongoose');


const campagneInscriptionSchema = new mongoose.Schema({
    programmeCible: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Programme',
        required: true
    },
    anneeCible: { 
        type: Number, 
        required: true 
    },  
    filiereCible: { 
        type: String, 
        required: false 
    },  
    anneeUniversitaire: { 
        type: String, 
        required: true 
    },  
    dateDebut: { 
        type: Date, 
        required: true 
    },
    dateFin: { 
        type: Date, 
        required: true 
    }, 
    active : {
        type : Boolean, 
        default : false
    }
}, {
    timestamps : true,
});



module.exports = mongoose.model('CampagneInscription', campagneInscriptionSchema);