const mongoose = require('mongoose');

const intervSchema = new mongoose.Schema(
    {
        idKeycloak: {
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
        titreAcademique: { 
            type: String, 
            required: false 
        },
        matricule: { 
            type: String, 
            required: false, 
        },
        profession: { 
            type: String, 
            required: false, 
        },
        specialite: { 
            type: String, 
            required: false 
        },
        bureauNumero: { 
            type: String, 
            required: false 
        },
        contrat: { 
            type: String, 
            required: false 
        },
        tarifHoraire : {
            type : Number, 
            required : false
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
        dateInscription: { 
            type: Date, 
            required: false, 
        },
        disponibilites: [
            {
                jours: {
                    type: [String], 
                    required: false
                },
                plageHoraire: {
                    type: [String],  
                    required: false
                }
            }
        ]
    }, 
    { 
        timestamps: true
    }
);
  
module.exports = mongoose.model('Intervenant', intervSchema);