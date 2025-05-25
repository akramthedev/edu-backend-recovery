const express = require('express');
const router = express.Router();
const Etudiant = require('../models/Etudiant');
const Seance   = require('../models/Seance');




router.get('/etudiant/:id/:classe/:groupe', async (req, res) => {
  try {

    let groupeEtu = req.params.groupe;
    let classeEtu = req.params.classe;

    const filter = {
      $and: [
        { groupe: groupeEtu },
        { classe:  classeEtu }
      ]
    };

    const seances = await Seance.find(filter)
      .populate('moduleId')
      .sort({ jour: 1, startTime: 1 })
      .lean();

    return res.json({ length: seances.length,seances: seances });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});





module.exports = router;