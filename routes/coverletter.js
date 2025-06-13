
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
You are a professional AI assistant whose task is to write a compelling, personalized cover letter by combining information from a candidate’s resume and a target job description.   
  
Input: JSON object with job description, title, and resume:  

  
Instructions:  
1. Parse the JSON input.  
2. Extract the candidate’s:  
   - Name and contact details  
   - Key skills, experiences, and achievements  
   - Relevant education or certifications  
3. Extract the role’s:  
   - Job title and company name  
   - Core responsibilities and required skills  
   - Company mission or culture highlights  
4. Compose a one-page cover letter that:  
   - Opens with a personalized greeting to the hiring manager (if available) or “Dear Hiring Team”  
   - Introduces the candidate and states the role they are applying for  
   - Briefly summarizes why the candidate is excited about the company and the position  
   - Highlights 2–3 specific experiences or skills that match the job requirements  
   - Demonstrates knowledge of the company’s mission or products  
   - Concludes with a call to action and polite sign-off  
5. Maintain a professional but engaging tone, avoid jargon, and keep paragraphs concise (3–4 sentences each).  
6. Do not output any JSON—only the finalized cover letter text.
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
      //return res.status(400).json({ errors: errors.array() });
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
      resumedata = result.rows[0].resume_data
      console.log( resumedata)
    } catch (err) {
      //console.error(err);
      res.status(500).json({ error: 'Server error while fetching resume' });
    }

    console.log(req.body, resumedata)

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