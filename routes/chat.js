
const express           = require('express');
const router            = express.Router();
const auth              = require('../middleware/auth');
const OpenAI            = require('openai');
const { body, validationResult } = require('express-validator');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System prompt for resume generation
const SYSTEM_PROMPT = `
You are ResumeGen, an AI assistant specialized in generating professional, ATS-friendly resumes in Markdown format.

You will receive a JSON object with this structure:
{
  "personal": { /* … */ },
  "education": { /* … */ },
  "experience": { /* … */ },
  "skills": ["…"],
  "certifications": ["…"],
  "contact": { /* … */ }
}

Instructions:
- Parse the JSON and map its fields to distinct resume sections.
- Do NOT use any links except for the LinkedIn (or Headhunter) profile link.
- Place side‐column info (Name, Contact Info, Skills, Certifications) in HTML.
- Produce a clean Markdown resume with sections: Header, Summary (if any), Experience, Education.
- Use # for the name, ## for section titles, - or * for bullets, **bold** for dates/company names.
- Always include blank lines between sections; use --- between major sections.
- Use HTML for a two-column layout: left column for side info, right column for main sections.
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

    try {
      const resumeJson = req.body;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: JSON.stringify(resumeJson) }
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