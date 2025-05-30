const express = require('express');
const qs      = require('qs');
const jwksClient = require('jwks-rsa');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const axios   = require("axios")
const Etudiant = require('../models/Etudiant');
const Intervenant = require('../models/Intervenant');
const Notification = require("../models/Notification");
const Tuteur = require('../models/Tuteur');
const Module = require('../models/Module');
const Seance = require('../models/Seance');
const ProgrammeType = require('../models/ProgrammeType');
const Programme = require('../models/Programme');
const CampagnesInscriptions = require('../models/CampagnesInscriptions');
const Filiere = require('../models/Filiere');




const router  = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const client = jwksClient({
  jwksUri: `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.REALM}/protocol/openid-connect/certs`
});


 
const getSigningKey = (kid) => {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      resolve(key.getPublicKey());
    });
  });
};



router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const params = new URLSearchParams();
    params.append('grant_type', 'password');                   
    params.append('client_id', process.env.CLIENT_ID);         
    params.append('client_secret', process.env.CLIENT_SECRET);  
    params.append('username', username); 
    params.append('password', password);

    const tokenResponse = await axios.post(
      `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.REALM}/protocol/openid-connect/token`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const token = tokenResponse.data.access_token;
    const decodedHeader = jwt.decode(token, { complete: true });
    const kid = decodedHeader.header.kid;
    const publicKey = await getSigningKey(kid);

    const decodedUser = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.REALM}`,
    });

    let targetRoles = ['etudiant', 'intervenant', 'tuteur'];
    let role = null;
    let mongodbUser = null;

    if(decodedUser.realm_access.roles.length === 0){
      role = null;
    }
    else{
      const matchingIndexes = decodedUser.realm_access.roles
        .map((item, index) => targetRoles.includes(item) ? index : -1)
        .filter(index => index !== -1);
      if(matchingIndexes.length !== 0){
        role = decodedUser.realm_access.roles[matchingIndexes[0]]
      }
      else{
        role = null;
      }
    }


    if(decodedUser && role){
      if(role === "etudiant"){
        mongodbUser = await Etudiant.findOne({ idKeycloak: decodedUser.sub })
          .populate('parcours.programme')
          .populate('parcours.filiere');
      }
      else if(role === "tuteur"){
        mongodbUser = await Tuteur.findOne({ idKeycloak : decodedUser.sub });
      }
      else if(role === "intervenant"){
        mongodbUser = await Intervenant.findOne({ idKeycloak : decodedUser.sub });
      }
    }
    else{
      mongodbUser = null;
    }

    console.warn(mongodbUser);

    res.status(200).json({
      ...tokenResponse.data,
      user: decodedUser, 
      role: role, 
      mongodbUser : mongodbUser
    });


  } catch (error) {
    console.error('Keycloak Login Error:', error.response?.data || error.message);
    res.status(401).json({
      error: error.response?.data?.error_description || error.message
    });
  }
});
 



router.post('/logout', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ error: 'Missing refresh token' });
  }

  const data = qs.stringify({
    client_id:       process.env.CLIENT_ID,
    client_secret:   process.env.CLIENT_SECRET,
    refresh_token,
    token_type_hint: 'refresh_token'
  });

  try {
    const response = await axios.post(
      `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.REALM}/protocol/openid-connect/logout`,
      data,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    console.log('Logout status:', response.status);
    return res.json({ message: 'Logout request sent', status: response.status });
  } catch (err) {
    console.error('Logout error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Logout failed' });
  }
});




 

router.post('/createStudent', async (req, res) => {
  try {
    const { idKeycloak, nom, prenom, email, matricule, telephone, photoProfile, adresse, dateNaissance, dateInscription ,niveauEtude } = req.body;

    if (!email || !matricule || !idKeycloak) 
      return res.status(400).json({ msg: 'Missing required fields' });

    const existing = await Etudiant.findOne({ email });
    if (existing) return res.status(266).json({ msg: 'Email already in use' });


    const user = await Etudiant.create({
      idKeycloak,
      nom,
      prenom,
      email,
      matricule, 
      telephone, 
      photoProfile, 
      adresse, 
      dateNaissance,
      dateInscription, 
      niveauEtude
    });

    res.status(201).json({
      id: user._id,
      idKeycloak, 
      email,
      nom,
      prenom,
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: e.message });
  }
});



router.post('/createIntervenant', async (req, res) => {
  try {
    const { idKeycloak, nom, prenom, email,titreAcademique, matricule, profession,specialite, bureauNumero, contrat, tarifHoraire,  telephone, photoProfile, adresse, dateNaissance, dateInscription } = req.body;

    if (!email || !matricule || !idKeycloak) 
      return res.status(400).json({ msg: 'Missing required fields' });

    const existing = await Intervenant.findOne({ email });
    if (existing) return res.status(266).json({ msg: 'Email already in use' });


    const user = await Intervenant.create({
      idKeycloak,
      nom,
      prenom,
      email,
      matricule,
      titreAcademique, 
      profession,
      specialite,
      bureauNumero, 
      contrat, 
      tarifHoraire, 
      telephone, 
      photoProfile, 
      adresse, 
      dateNaissance,
      dateInscription, 
    });

    res.status(201).json({
      id: user._id,
      idKeycloak, 
      email,
      nom,
      prenom,
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: e.message });
  }
});




router.post('/createTuteur', async (req, res) => {
  try {
    const { idKeycloak, nom, prenom, email,telephone, photoProfile, adresse, dateNaissance, profession, enfants } = req.body;

    if (!email || !idKeycloak) 
      return res.status(400).json({ msg: 'Missing required fields' });

    const existing = await Tuteur.findOne({ email });
    if (existing) return res.status(266).json({ msg: 'Email already in use' });


    const user = await Tuteur.create({
      idKeycloak,
      nom,
      prenom,
      email,
      telephone, 
      photoProfile, 
      adresse, 
      dateNaissance,
      profession, 
      enfants
    });

    res.status(201).json({
      id: user._id,
      idKeycloak, 
      email,
      nom,
      prenom,
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: e.message });
  }
});




router.post('/createModule', async (req, res) => {
  try {
    const { nom, code, semestre, description, credits, intervenants } = req.body;

    if (!nom) 
      return res.status(400).json({ msg: 'Missing required fields' });

    const module = await Module.create({
      nom, 
      code, 
      semestre, 
      description, 
      credits, 
      intervenants
    });

    res.status(201).json({
      id: module._id,
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: e.message });
  }
});


   // create seance 


router.post('/createSeance', async (req, res) => {
  try {
    const { moduleId, salle, endDateTime, startDateTime, type, groupe, classe } = req.body;

    if (!moduleId || !classe || !salle || !startDateTime || !endDateTime || !type || !groupe) 
      return res.status(400).json({ msg: 'Missing required fields' });

    const seance = await Seance.create({
      moduleId, 
      salle, 
      startDateTime, 
      endDateTime, 
      type, 
      groupe, 
      classe
    });

    res.status(201).json({
      id: seance._id,
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: e.message });
  }
});
 




router.post('/createProgrammeType', async (req, res) => {
  try {
    const { code, libelle } = req.body;

    
    const isProgTypeCreated = await ProgrammeType.create({
      code, 
      libelle
    });

    res.status(201).json({
      id: isProgTypeCreated._id,
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: e.message });
  }
});



router.post('/createFiliere', async (req, res) => {
  try {
    const { code, libelle } = req.body;

    
    const isFiliereCreated = await Filiere.create({
      code, 
      libelle, 
  
    });

    res.status(201).json({
      id: isFiliereCreated._id,
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: e.message });
  }
});


router.post('/createProgramme', async (req, res) => {
  try {
    const { code, typeProgramme, inscription } = req.body;

    
    const isProgTypeCreated = await Programme.create({
       code, 
       typeProgramme, 
       inscription 
    });

    res.status(201).json({
      id: isProgTypeCreated._id,
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: e.message });
  }
});
 


router.get('/getSingleProgramme/:newProgramme', async (req, res) => {
  try {

    // this function will get the programm after the one sent in params ... 
    // like we do not fetch the details of this programm :progId but the one after it 
    // for example if it is Licence we gonna fetch all data of Master M1
    // if it is TRONC_COMMUN_2 2nd year we gonna fetch all data of programm Licence 
    const { newProgramme } = req.params;

    const isFound = await Programme
      .findOne({
        code : newProgramme,
      })
      .populate('filiere');

      console.warn(isFound);

    res.status(200).json(isFound);

  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: e.message });
  }
});
 


router.patch('/etudiant/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { annee, semestres } = req.body;

    const updatedUser = await Etudiant.findByIdAndUpdate(
      id,
      {
        $push: {
          parcours: {
            annee,      
            semestres
          }
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);

  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: e.message });
  }
});


router.get('/etudiant/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const etudiant = await Etudiant.findById(id)
      .populate({
        path: 'parcours.semestres.modules.moduleId',
        model: 'Module'
      })
      .populate({
        path: 'parcours.programme',
        model: 'Programme',
        populate: {
          path: 'typeProgramme',
          model: 'ProgrammeType'
        }
      });

    if (!etudiant) return res.status(404).json({ message: 'Étudiant non trouvé' });

    res.json(etudiant);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});



router.get('/notification/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({
      userId : userId
    }).sort({
      createdAt : -1
    })

    if (!notifications) return res.status(404).json({ message: "Notifications not found" });

    res.json(notifications);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
 

router.post('/notification/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const {titre, description, type} = req.body;

    const notification = await Notification.create({
      userId,
      titre, 
      description, 
      type
    });

    if (!notification) return res.status(404).json({ message: "Notifications not created" });

    res.json(notification);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
 
 

 

router.post('/createCampagne', async (req, res) => {
  try {
    const { programmeCible, filiereCible, anneeUniversitaire, dateDebut, dateFin  } = req.body;

    const isCampagneCreated = await CampagnesInscriptions.create({
      programmeCible, 
      anneeUniversitaire, 
      filiereCible, 
      dateDebut, 
      dateFin    
    });

    if (!isCampagneCreated) return res.status(404).json({ message: "Notifications not created" });

    res.status(201).json(isCampagneCreated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
 


router.post('/checkCampagne', async (req, res) => {
  try {
    const { programmeCible, filiereCible } = req.body;

    const existingCampagne = await CampagnesInscriptions.findOne({
      programmeCible,
      filiereCible,
      active: true
    })
    .populate([
      { path: 'programmeCible', populate: { path: 'typeProgramme' } },
      { path: 'filiereCible' }
    ]);


    if (!existingCampagne) {
      return res.status(202).json({ message: 'No matching campaign found.' });
    }

    res.status(200).json(existingCampagne);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});




router.get('/campagnes', async (req, res) => {
  try {
    const isCampagnesFound = await CampagnesInscriptions
    .find()
    .populate({
      path: 'programmeCible',
      populate: {
        path: 'typeProgramme'
      }
    })
    .populate({
      path: 'filiereCible'
    });


    if (!isCampagnesFound) return res.status(404).json({ message: "Campagnes not fetched" });

    res.status(200).json(isCampagnesFound);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
 
 
 



router.get('/programmes', async (req, res) => {
  try {
    const isProgrammesFetched = await Programme
    .find()
    .populate({
        path: 'typeProgramme',
        model: 'ProgrammeType'
      })

    if (!isProgrammesFetched) return res.status(404).json({ message: "Programmes not fetched" });

    res.status(200).json(isProgrammesFetched);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
 
 router.post('/add-parcours/:id', async (req, res) => {
    const { id } = req.params;
    const parcoursData = req.body; // Full parcours object

    try {
        const etudiant = await Etudiant.findById(id);

        if (!etudiant) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (!etudiant.parcours || etudiant.parcours.length === 0) {
            // If parcours is empty, initialize with the first parcours
            etudiant.parcours = [parcoursData];
        } else {
            // Push new parcours instead of updating the existing one
            etudiant.parcours.push(parcoursData);
        }

        await etudiant.save();
        return res.status(200).json({ message: 'Parcours pushed successfully', etudiant });

    } catch (error) {
        console.error('Error pushing parcours:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
});



 

module.exports = router;