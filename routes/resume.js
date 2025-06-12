// routes/resume.js
const express           = require('express');
const router            = express.Router();
const pool              = require('../config/db');
const auth              = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation rules
const resumeValidation = [
  body('personal.fullName').isString().notEmpty(),
  body('personal.email').isEmail(),
  body('personal.profession').isString().notEmpty(),
  body('personal.address').isString().notEmpty(),
  body('personal.city').isString().notEmpty(),
  body('personal.state').isString().notEmpty().optional({ nullable: true }),

  body('education.schoolName').isString().notEmpty(),
  body('education.schoolLocation').isString().notEmpty(),
  body('education.degree').isString().notEmpty(),
  body('education.fieldOfStudy').isString().notEmpty(),
  body('education.gradMonth').isString().notEmpty(),
  body('education.gradYear').isInt().optional({ nullable: true }),

  body('experience.company').isString().optional({ nullable: true }),
  body('experience.employer').isString().optional({ nullable: true }),
  body('experience.role').isString().optional({ nullable: true }),
  body('experience.address').isString().optional({ nullable: true }),
  body('experience.startDate').isISO8601(),
  body('experience.finishDate').isISO8601().optional({ nullable: true }),
  body('experience.currentlyHere').isBoolean().optional({ nullable: true }),

  body('skills').isArray({ min: 1, max: 20 }),
  body('skills.*').isString(),

  body('certifications').isArray({ max: 20 }),
  body('certifications.*').isString().optional({ nullable: true }),

  body('contact.phone').optional({ nullable: true }),
  body('contact.linkedin').optional({ nullable: true }),
  body('contact.twitter').optional({ nullable: true }),
  body('contact.github').optional({ nullable: true }),
  body('contact.portfolio').optional({ nullable: true }),
];

// Create or update resume
router.post(
  '/',
  auth,
  resumeValidation,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const userId     = req.user;
    const resumeData = req.body;
    try {
      const existing = await pool.query(
        'SELECT id FROM resumes WHERE user_id=$1',
        [userId]
      );
      if (existing.rows.length) {
        await pool.query(
          'UPDATE resumes SET resume_data=$1 WHERE user_id=$2',
          [resumeData, userId]
        );
        return res.json({ message: 'Resume updated.' });
      }
      await pool.query(
        'INSERT INTO resumes (user_id, resume_data) VALUES ($1, $2)',
        [userId, resumeData]
      );
      res.status(201).json({ message: 'Resume created.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error while saving resume' });
    }
  }
);

// Fetch resume
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT resume_data FROM resumes WHERE user_id=$1',
      [req.user]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json(result.rows[0].resume_data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching resume' });
  }
});

module.exports = router;