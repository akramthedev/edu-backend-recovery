const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const axios   = require("axios")
const Etudiant = require('../models/Etudiant');
const Intervenant = require('../models/Intervenant');
const Tuteur = require('../models/Tuteur');
const verifyKeycloakToken = require('../middleware/verifyKeyCloakToken');
const JWT_SECRET = process.env.JWT_SECRET;
const accessByRole = require('../middleware/accessByRole');
const ROLES = require('../utils/roles');

const router  = express.Router();
 

router.post(
  '/test1', 
  verifyKeycloakToken,
  accessByRole(ROLES.ETUDIANT),
  async (req, res) => {
  try {
    res.json({
        message : "Sucess", 
        user : req.user
    })

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(401).json({
      error: error.response?.data?.error_description || error.message
    });
  }
});
 


router.post(
  '/test2', 
  verifyKeycloakToken,
  accessByRole(ROLES.ETUDIANT, ROLES.INTERV, ROLES.TUTEUR),
  async (req, res) => {
  try {
    res.json({
        message : "Sucess", 
        user : req.user
    })

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(401).json({
      error: error.response?.data?.error_description || error.message
    });
  }
});
 


router.post(
  '/test3', 
  verifyKeycloakToken,
  accessByRole(ROLES.TUTEUR, ROLES.INTERV),
  async (req, res) => {
  try {
    res.json({
        message : "Sucess", 
        user : req.user
    })

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(401).json({
      error: error.response?.data?.error_description || error.message
    });
  }
});
 

module.exports = router;