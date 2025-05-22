const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const axios   = require("axios")
const Etudiant = require('../models/Etudiant');
const Intervenant = require('../models/Intervenant');
const Tuteur = require('../models/Tuteur');
const qs      = require('qs');
const jwksClient = require('jwks-rsa');

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

    let Model;

    if(decodedUser && role){
      if(role === "etudiant"){
        Model = Etudiant
      }
      else if(role === "tuteur"){
        Model = Tuteur
      }
      else if(role === "intervenant"){
        Model = Intervenant
      }
      mongodbUser = await Model.findOne({ idKeycloak : decodedUser.sub });
      console.warn('mongodbUser : '+mongodbUser);
    }
    else{
      mongodbUser = null;
    }


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


 

module.exports = router;