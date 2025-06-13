
const express           = require('express');
const router            = express.Router();
const auth              = require('../middleware/auth');
const OpenAI            = require('openai');
const pool              = require('../config/db');
const { body, validationResult } = require('express-validator');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});




// System prompt for resume generation
const SYSTEM_PROMPT = `
You are CoverGen, an AI assistant specialized in generating professional, ATS-friendly cover letters in Markdown format.

You will receive a JSON object with this structure:
{
  "job_title": "",
  "job_description":"",
  "theme":"",
  "personal": { /* … */ },
  "education": { /* … */ },
  "experience": { /* … */ },
  "skills": ["…"],
  "certifications": ["…"],
  "contact": { /* … */ }
}

Instructions:
- Parse the JSON and map its fields to distinct cover letter sections.
- Do NOT use any links except for the LinkedIn (or Headhunter) profile link.
- Produce a clean Markdown cover letter.
- Use # for the name, ## for section titles, - or * for bullets, **bold** for dates/company names.
- Always include blank lines between sections; use --- between major sections.
- Omit any empty or missing sections.
- Do NOT include any commentary or the original JSON—only output the final Markdown resume.
`.trim();

router.post(
  '/',
  auth,
  // Ensure body is non-empty
  body().custom(value => {
    if (!value || Object.keys(value).length === 0) {
      throw new Error('Missing resume JSON in request body');
    }
    return true;
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let resumedata = {}
    try {
      const result = await pool.query(
        'SELECT resume_data FROM resumes WHERE user_id=$1',
        [req.user]
      );
      //console.log(result)
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Resume not found' });
      }
      resumedata = res.json(result.rows[0].resume_data);
      console.log( resumedata)
    } catch (err) {
      //console.error(err);
      res.status(500).json({ error: 'Server error while fetching resume' });
    }

    try {
      const coverJson = req.body;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: JSON.stringify(coverJson, resumedata) }
        ],
        temperature: 0.7
      });

      const markdown = completion.choices[0].message.content;
      res.type('text/markdown').send(markdown);

    } catch (err) {
      console.error('OpenAI error:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
);

module.exports = router;