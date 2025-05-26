const mongoose = require('mongoose');

const etudiantSchema = new mongoose.Schema(
    {
        idKeycloak : {
            type: String, 
            required : true
        },
        nom: { 
            type: String, 
            required: false 
        },
        prenom: { 
            type: String, 
            required: false 
        },
        matricule: { 
            type: String, 
            required: true, 
            unique: true 
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
        niveauEtude: { 
            type: String, 
            required: false 
        },
        classe: { 
            type: String, 
            required: false 
        },
        groupe: { 
            type: String, 
            required: false 
        },
        parcours : [
            {
                annee : String, 
                semestres : [
                    {
                        nom : String, 
                        programme : String, 
                        status : {
                            type : String, 
                            enum : [
                                "valide", 
                                "non_valide", 
                                "en_cours", 
                                "ajournee"
                            ]
                        },
                        modules : [{
                            moduleId : {
                                type : mongoose.Schema.Types.ObjectId, 
                                ref : 'Module'   
                            }, 
                            status : {
                                type : String, 
                                enum : [
                                    "valide", 
                                    "non_valide", 
                                    "en_cours", 
                                    "ajournee"
                                ]
                            }
                        }]
                    }
                ]
            }
        ]
    }, 
    { 
        timestamps: true
    }
);

module.exports = mongoose.model('Etudiant', etudiantSchema);