You are a senior front-end developer and Urdu language learning designer.

Build a simple, clean Urdu learning platform using ONLY:
- HTML
- CSS
- Vanilla JavaScript
No frameworks, no build tools.

The user is a beginner who CAN read Urdu but slowly, and wants to improve:
- reading fluency
- vocabulary
- basic grammar for speaking + writing

Core Requirements
1) JSON-driven content
- All stories and chapters must be loaded from a local JSON file (stories.json).
- The UI must automatically update when new stories/chapters are added to JSON (no hardcoding).
- Each story has difficulty that increases gradually: 1 (very easy) to 5 (harder).

2) Story Library + Difficulty
- Provide a left sidebar (or top list on mobile) showing stories grouped by difficulty.
- Each story card shows: title, difficulty, estimated reading time, vocabulary count.
- Filter controls:
  - Difficulty dropdown (All / 1 / 2 / 3 / 4 / 5)
  - Search by title/keyword

3) Reading View
When a user opens a story:
- Show Urdu text with proper RTL layout and good readability (font-size controls).
- Show optional “help line”:
  - roman transliteration toggle (on/off)
  - English meaning toggle (on/off) at sentence level (not word-by-word mandatory, but good if possible).
- Add “Next chapter / Previous chapter” if story has chapters.
- Add a progress indicator: Chapter X of Y

4) Vocabulary Support
- Each story provides a vocabulary list (word -> meaning -> transliteration).
- Implement vocabulary interactions:
  - Clicking a word in the Urdu text highlights it and shows a small popup tooltip with meaning + transliteration (based on vocab list).
  - If exact match is hard, implement simple token matching (split by spaces and punctuation).
- Add “Save word” feature:
  - Saved words appear in a “My Words” section stored in localStorage.

5) Beginner Grammar Section
Add a “Grammar” tab with short lessons suitable for a beginner reader:
- Pronouns (میں، تم، آپ، وہ، ہم)
- Present tense basics (ہوں/ہے/ہیں)
- Past tense intro (تھا/تھی/تھے)
- Simple sentence structure (Subject–Object–Verb)
- Common polite phrases and spoken patterns
Each lesson should include:
- Urdu examples
- Transliteration
- English meaning
- 1 mini exercise (multiple choice OR fill in blank)
Store grammar lessons in a separate JSON file (grammar.json) or embed them as a JS object.

6) UI/UX Requirements
- Responsive design (mobile-friendly).
- RTL support for Urdu content; LTR for English.
- Clean typography.
- Reading controls:
  - font size slider (Urdu text)
  - line spacing toggle
  - “highlight difficult words” toggle (words marked as rare in JSON)
- Dark mode toggle (persist in localStorage).

7) Data Format Requirements (Must Provide Sample Data)
Provide:
A) stories.json sample with at least:
- 3 difficulties (1, 2, 3)
- At least 2 stories with multiple chapters
- Each chapter includes: urduText, transliteration, englishMeaning, vocab array, difficultyWords array
- Optional audioUrl field per chapter (placeholder)

B) grammar.json sample with at least 5 lessons:
- id, title, explanation, examples[], exercise{}

8) Deliverables
Return a complete working project structure:
- index.html
- styles.css
- app.js
- stories.json
- grammar.json

Implementation Details
- Use fetch() to load JSON files.
- Use localStorage for:
  - saved words
  - last read story/chapter
  - dark mode
  - font size preference
- Keep code well-commented and easy to extend.

Extra (Nice-to-have)
- Reading streak counter (days you opened a story) stored locally.
- Simple quiz mode: show 5 random saved words and ask meanings.

Important Notes
- This is for a BEGINNER who can read but slowly.
- Keep stories short, simple, and progressively harder.
- Urdu must be natural and correct (not robotic).
- Include transliteration that helps pronunciation.
- Include a small set of “spoken useful” phrases in grammar.

Now generate the full code + sample JSON content.