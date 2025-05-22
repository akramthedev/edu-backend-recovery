const mongoose = require('mongoose');

const tuteurSchema = new mongoose.Schema(
    {
        idKeycloak : {
            type : String, 
            required : true,
        },
        nom: { 
            type: String, 
            required: false 
        },
        prenom: { 
            type: String, 
            required: false 
        },
        email: { 
            type: String, 
            required: true, 
            unique: true 
        },
         
        telephone: { 
            type: String, 
            required: false 
        },
        photoProfile: { 
            type: String, 
            required: false 
        },
        adresse: { 
            type: String, 
            required: false 
        },
        dateNaissance: { 
            type: Date, 
            required: false 
        },
        profession: { 
            type: String, 
            required: false 
        },
        enfants : [
            {
                type : mongoose.Schema.Types.ObjectId, 
                ref : 'Etudiant'
            }
        ]
    }, 
    { 
        timestamps: true
    }
);

module.exports = mongoose.model('Tuteur', tuteurSchema);