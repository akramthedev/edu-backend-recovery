const express = require('express');
const router = express.Router();
const Etudiant = require('../models/Etudiant');
const Seance   = require('../models/Seance');




router.get('/etudiant/:id', async (req, res) => {
  try {
    // const etu = await Etudiant.findById(req.params.id).lean();
    // if (!etu) return res.status(404).json({ message: 'Student not found' });

    const filter = {
      $and: [
        { groupe: etu.groupe },
        { classe:  etu.classe }
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