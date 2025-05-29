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
        programmeActuel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Programme'
        },
        filiereActuelle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Filiere'
        },
        anneeActuelle: Number, // 1 or 2 or 3... 
        redoublant: { 
            type: Boolean, 
            default: false 
        },
        parcours : [  
            {
                annee : String, 
                status: {
                    type: String,
                    enum : ["valide", "non_valide", "en_cours", ], 
                    default: 'en_cours'
                },
                programme: { 
                    type: mongoose.Schema.Types.ObjectId, 
                    ref: 'Programme', 
                    required: true 
                },
                redoublant: { 
                    type: Boolean, 
                    default: false 
                },
                semestres : [
                    {
                        nom : String, 
                        status : {
                            type : String, 
                            enum : ["valide", "non_valide", "en_cours", ], 
                            default: 'en_cours'
                        },
                        note : {
                            type : String, 
                            default : "", 
                            required : false
                        },
                        modules : [{
                            moduleId : {
                                type : mongoose.Schema.Types.ObjectId, 
                                ref : 'Module'   
                            }, 
                            status : {
                                type : String, 
                                enum : ["valide", "non_valide", "en_cours", ], 
                                default: 'en_cours'
                            }
                        }]
                    }
                ]
            }
        ],
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
        
    }, 
    { 
        timestamps: true
    }
);

module.exports = mongoose.model('Etudiant', etudiantSchema);