// ========================================
// Global State Management
// ========================================

const AppState = {
    stories: [],
    grammar: [],
    currentStory: null,
    currentChapter: 0,
    savedWords: [],
    darkMode: false,
    fontSize: 20,
    lineSpacing: false,
    showTransliteration: false,
    showEnglish: false,
    highlightDifficult: false,
    streak: 0,
    lastVisit: null,
    currentGrammarLesson: null,
    lastReadStoryId: null,
    lastReadChapter: 0
};

let activeWordElement = null;

// ========================================
// Initialize Application
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    loadUserPreferences();
    await loadStoriesData();
    await loadGrammarData();
    initializeEventListeners();
    initializeUIState();
    renderStories();
    renderContinueSection();
    renderStreak();
});

// ========================================
// Data Loading Functions
// ========================================

async function loadStoriesData() {
    try {
        const response = await fetch('stories.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load stories.json (${response.status})`);
        }
        AppState.stories = await response.json();
    } catch (error) {
        console.error('Error loading stories:', error);
        const inline = loadInlineJson('storiesData');
        if (inline) {
            AppState.stories = inline;
            showLocalNotice('Using inline story data because fetch failed.');
        } else {
            AppState.stories = [];
            showLocalNotice('Stories could not be loaded. Run a local server to enable JSON fetch.');
        }
    }
}

async function loadGrammarData() {
    try {
        const response = await fetch('grammar.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load grammar.json (${response.status})`);
        }
        AppState.grammar = await response.json();
    } catch (error) {
        console.error('Error loading grammar:', error);
        const inline = loadInlineJson('grammarData');
        if (inline) {
            AppState.grammar = inline;
            showLocalNotice('Using inline grammar data because fetch failed.');
        } else {
            AppState.grammar = [];
            showLocalNotice('Grammar lessons could not be loaded. Run a local server to enable JSON fetch.');
        }
    }
}

// ========================================
// Local Storage Functions
// ========================================

function loadUserPreferences() {
    const saved = localStorage.getItem('urduAppPreferences');
    if (saved) {
        const prefs = JSON.parse(saved);
        AppState.darkMode = prefs.darkMode === true;
        AppState.fontSize = Number.isFinite(prefs.fontSize) ? prefs.fontSize : 20;
        AppState.savedWords = Array.isArray(prefs.savedWords) ? prefs.savedWords : [];
        AppState.streak = Number.isFinite(prefs.streak) ? prefs.streak : 0;
        AppState.lastVisit = prefs.lastVisit || null;
        AppState.lineSpacing = prefs.lineSpacing === true;
        AppState.showTransliteration = prefs.showTransliteration === true;
        AppState.showEnglish = prefs.showEnglish === true;
        AppState.highlightDifficult = prefs.highlightDifficult === true;
        if (Number.isFinite(prefs.lastReadStoryId)) {
            AppState.lastReadStoryId = prefs.lastReadStoryId;
        } else if (typeof prefs.lastReadStoryId === 'string' && prefs.lastReadStoryId.trim() !== '') {
            AppState.lastReadStoryId = parseInt(prefs.lastReadStoryId, 10);
        } else {
            AppState.lastReadStoryId = null;
        }
        AppState.lastReadChapter = Number.isFinite(prefs.lastReadChapter) ? prefs.lastReadChapter : 0;

        if (AppState.darkMode) {
            document.body.classList.add('dark-mode');
        }
    }
}

function saveUserPreferences() {
    const prefs = {
        darkMode: AppState.darkMode,
        fontSize: AppState.fontSize,
        savedWords: AppState.savedWords,
        streak: AppState.streak,
        lastVisit: AppState.lastVisit,
        lineSpacing: AppState.lineSpacing,
        showTransliteration: AppState.showTransliteration,
        showEnglish: AppState.showEnglish,
        highlightDifficult: AppState.highlightDifficult,
        lastReadStoryId: AppState.lastReadStoryId,
        lastReadChapter: AppState.lastReadChapter
    };
    localStorage.setItem('urduAppPreferences', JSON.stringify(prefs));
}

function updateStreak() {
    const today = new Date().toDateString();
    const lastVisit = AppState.lastVisit;

    if (lastVisit) {
        const lastDate = new Date(lastVisit);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate.toDateString() === yesterday.toDateString()) {
            AppState.streak++;
        } else if (lastDate.toDateString() !== today) {
            AppState.streak = 1;
        }
    } else {
        AppState.streak = 1;
    }

    AppState.lastVisit = today;
    document.getElementById('streakCount').textContent = AppState.streak;
    saveUserPreferences();
}

function renderStreak() {
    document.getElementById('streakCount').textContent = AppState.streak || 0;
}

function loadInlineJson(elementId) {
    const el = document.getElementById(elementId);
    if (!el) {
        return null;
    }
    try {
        return JSON.parse(el.textContent);
    } catch (error) {
        console.error(`Failed to parse inline JSON for ${elementId}`, error);
        return null;
    }
}

function showLocalNotice(message) {
    const notice = document.getElementById('localNotice');
    if (!notice) {
        return;
    }
    if (message) {
        const paragraphs = notice.querySelectorAll('p');
        if (paragraphs.length > 0) {
            paragraphs[0].textContent = message;
        }
    }
    if (location.protocol === 'file:' || message) {
        notice.classList.remove('hidden');
    }
}

// ========================================
// Initialization Helpers
// ========================================

function initializeUIState() {
    document.getElementById('fontSizeSlider').value = AppState.fontSize;
    document.getElementById('fontSizeValue').textContent = AppState.fontSize;
    document.getElementById('lineSpacingToggle').checked = AppState.lineSpacing;
    document.getElementById('transliterationToggle').checked = AppState.showTransliteration;
    document.getElementById('englishToggle').checked = AppState.showEnglish;
    document.getElementById('highlightDifficultToggle').checked = AppState.highlightDifficult;
    updateDarkModeIcon();
}

function updateDarkModeIcon() {
    const icon = document.querySelector('#darkModeToggle .icon');
    icon.textContent = AppState.darkMode ? '☀️' : '🌙';
}

function renderContinueSection() {
    const section = document.getElementById('continueSection');
    const text = document.getElementById('continueText');
    if (!AppState.lastReadStoryId) {
        section.classList.add('hidden');
        return;
    }

    const story = getStoryById(AppState.lastReadStoryId);
    if (!story) {
        section.classList.add('hidden');
        return;
    }

    const chapterNumber = Math.min(
        Math.max(AppState.lastReadChapter + 1, 1),
        story.chapters.length
    );
    text.innerHTML = `Continue: <span class="urdu">${story.title}</span> (Chapter ${chapterNumber} of ${story.chapters.length})`;
    section.classList.remove('hidden');
}

// ========================================
// Event Listeners
// ========================================

function initializeEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            switchTab(e.currentTarget.dataset.tab);
        });
    });

    // Dark Mode Toggle
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

    // Continue Reading
    document.getElementById('continueBtn').addEventListener('click', () => {
        if (!AppState.lastReadStoryId) {
            return;
        }
        const story = getStoryById(AppState.lastReadStoryId);
        if (story) {
            openStory(story, AppState.lastReadChapter);
        }
    });

    // Search and Filter
    document.getElementById('searchInput').addEventListener('input', filterStories);
    document.getElementById('difficultyFilter').addEventListener('change', filterStories);

    // Reading Controls
    document.getElementById('transliterationToggle').addEventListener('change', (e) => {
        AppState.showTransliteration = e.target.checked;
        saveUserPreferences();
        renderCurrentChapter();
    });

    document.getElementById('englishToggle').addEventListener('change', (e) => {
        AppState.showEnglish = e.target.checked;
        saveUserPreferences();
        renderCurrentChapter();
    });

    document.getElementById('highlightDifficultToggle').addEventListener('change', (e) => {
        AppState.highlightDifficult = e.target.checked;
        saveUserPreferences();
        renderCurrentChapter();
    });

    document.getElementById('fontSizeSlider').addEventListener('input', (e) => {
        AppState.fontSize = parseInt(e.target.value);
        document.getElementById('fontSizeValue').textContent = AppState.fontSize;
        document.querySelectorAll('.urdu-text').forEach(el => {
            el.style.fontSize = AppState.fontSize + 'px';
        });
        saveUserPreferences();
    });

    document.getElementById('lineSpacingToggle').addEventListener('change', (e) => {
        AppState.lineSpacing = e.target.checked;
        document.querySelectorAll('.urdu-text').forEach(el => {
            el.classList.toggle('increased-spacing', AppState.lineSpacing);
        });
        saveUserPreferences();
    });

    // Navigation Buttons
    document.getElementById('backBtn').addEventListener('click', () => {
        showView('welcome');
    });

    document.getElementById('prevChapterBtn').addEventListener('click', () => {
        if (AppState.currentChapter > 0) {
            AppState.currentChapter--;
            updateLastRead();
            renderCurrentChapter();
        }
    });

    document.getElementById('nextChapterBtn').addEventListener('click', () => {
        if (AppState.currentChapter < AppState.currentStory.chapters.length - 1) {
            AppState.currentChapter++;
            updateLastRead();
            renderCurrentChapter();
        }
    });

    // Grammar Navigation
    document.getElementById('grammarBackBtn').addEventListener('click', () => {
        switchTab('grammar');
    });

    // Vocabulary Controls
    document.getElementById('quizModeBtn').addEventListener('click', startQuiz);
    document.getElementById('clearVocabBtn').addEventListener('click', clearAllVocab);

    // Quiz Navigation
    document.getElementById('quizBackBtn').addEventListener('click', () => {
        switchTab('vocabulary');
    });

    // Close tooltip on outside click
    document.addEventListener('click', (e) => {
        const tooltip = document.getElementById('wordTooltip');
        if (tooltip.classList.contains('hidden')) {
            return;
        }
        if (tooltip.contains(e.target)) {
            return;
        }
        if (!e.target.classList.contains('has-vocab')) {
            tooltip.classList.add('hidden');
            clearActiveWord();
        }
    });
}

// ========================================
// View Management
// ========================================

function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Update sidebar content
    document.querySelectorAll('.sidebar-content').forEach(s => s.classList.add('hidden'));

    if (tab === 'stories') {
        document.getElementById('storiesSidebar').classList.remove('hidden');
        renderStories();
        showView('welcome');
    } else if (tab === 'grammar') {
        document.getElementById('grammarSidebar').classList.remove('hidden');
        renderGrammarList();
        showView('welcome');
    } else if (tab === 'vocabulary') {
        document.getElementById('vocabularySidebar').classList.remove('hidden');
        renderSavedWords();
        showView('welcome');
    }
}

function showView(viewName) {
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('readingView').classList.add('hidden');
    document.getElementById('grammarView').classList.add('hidden');
    document.getElementById('quizView').classList.add('hidden');

    if (viewName === 'welcome') {
        document.getElementById('welcomeScreen').classList.remove('hidden');
    } else if (viewName === 'reading') {
        document.getElementById('readingView').classList.remove('hidden');
    } else if (viewName === 'grammar') {
        document.getElementById('grammarView').classList.remove('hidden');
    } else if (viewName === 'quiz') {
        document.getElementById('quizView').classList.remove('hidden');
    }
}

// ========================================
// Story Rendering
// ========================================

function renderStories() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const difficulty = document.getElementById('difficultyFilter').value;

    let filtered = AppState.stories;

    if (difficulty !== 'all') {
        filtered = filtered.filter(s => s.difficulty === parseInt(difficulty));
    }

    if (searchTerm) {
        filtered = filtered.filter(s => {
            const titleMatch = s.title.toLowerCase().includes(searchTerm);
            const descMatch = (s.description || '').toLowerCase().includes(searchTerm);
            return titleMatch || descMatch;
        });
    }

    const container = document.getElementById('storiesList');
    container.innerHTML = '';

    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No stories found</p>';
        return;
    }

    const grouped = filtered.reduce((acc, story) => {
        if (!acc[story.difficulty]) {
            acc[story.difficulty] = [];
        }
        acc[story.difficulty].push(story);
        return acc;
    }, {});

    Object.keys(grouped)
        .map(level => parseInt(level))
        .sort((a, b) => a - b)
        .forEach(level => {
            const groupHeader = document.createElement('div');
            groupHeader.className = 'difficulty-group';
            groupHeader.textContent = `Level ${level}`;
            container.appendChild(groupHeader);

            grouped[level].forEach(story => {
                const card = document.createElement('div');
                card.className = 'story-card';

                const totalWords = calculateVocabCount(story);
                const avgReadTime = calculateReadingTime(story);

                card.innerHTML = `
                    <div class="story-card-title urdu">${story.title}</div>
                    <div class="story-card-meta">
                        <span class="meta-badge difficulty-badge">Level ${story.difficulty}</span>
                        <span class="meta-badge">📖 ${story.chapters.length} chapters</span>
                        <span class="meta-badge">⏱️ ${avgReadTime} min</span>
                        <span class="meta-badge">📝 ${totalWords} vocab</span>
                    </div>
                `;

                card.addEventListener('click', () => openStory(story));
                container.appendChild(card);
            });
        });
}

function filterStories() {
    renderStories();
}

function openStory(story, chapterIndex = 0) {
    AppState.currentStory = story;
    AppState.currentChapter = Math.min(Math.max(chapterIndex, 0), story.chapters.length - 1);
    updateLastRead();
    showView('reading');
    renderCurrentChapter();
    updateStreak();
    renderContinueSection();
}

function renderCurrentChapter() {
    const story = AppState.currentStory;
    const chapter = story.chapters[AppState.currentChapter];

    // Update header
    document.getElementById('storyTitle').textContent = story.title;
    document.getElementById('chapterInfo').textContent =
        `Chapter ${AppState.currentChapter + 1} of ${story.chapters.length}`;

    // Render content
    const contentDiv = document.getElementById('storyContent');
    contentDiv.innerHTML = '';

    const vocabMap = buildVocabMap(chapter.vocab);
    const difficultSet = new Set((chapter.difficultWords || []).map(word => normalizeToken(word)));

    // Render Urdu text with clickable words
    const urduDiv = document.createElement('div');
    urduDiv.className = 'urdu-text';
    urduDiv.style.fontSize = AppState.fontSize + 'px';
    if (AppState.lineSpacing) {
        urduDiv.classList.add('increased-spacing');
    }

    const words = chapter.urduText.split(/\s+/).filter(Boolean);
    words.forEach(word => {
        const span = document.createElement('span');
        span.className = 'urdu-word';
        span.textContent = word + ' ';

        const cleanWord = normalizeToken(word);
        if (AppState.highlightDifficult && cleanWord && difficultSet.has(cleanWord)) {
            span.classList.add('difficult');
        }

        const vocabEntry = vocabMap.get(cleanWord);
        if (vocabEntry) {
            span.classList.add('has-vocab');
            span.dataset.word = vocabEntry.word;
            span.dataset.transliteration = vocabEntry.transliteration;
            span.dataset.meaning = vocabEntry.meaning;
            span.addEventListener('click', (e) => showWordTooltip(e, vocabEntry));
        }

        urduDiv.appendChild(span);
    });

    contentDiv.appendChild(urduDiv);

    // Render transliteration if enabled
    if (AppState.showTransliteration) {
        const transDiv = document.createElement('div');
        transDiv.className = 'transliteration-text';
        transDiv.textContent = chapter.transliteration;
        contentDiv.appendChild(transDiv);
    }

    // Render English translation if enabled
    if (AppState.showEnglish) {
        const engDiv = document.createElement('div');
        engDiv.className = 'english-text';
        engDiv.textContent = chapter.englishMeaning;
        contentDiv.appendChild(engDiv);
    }

    // Render vocabulary
    renderVocabulary(chapter.vocab);

    // Update navigation buttons
    const prevBtn = document.getElementById('prevChapterBtn');
    const nextBtn = document.getElementById('nextChapterBtn');
    prevBtn.disabled = AppState.currentChapter === 0;
    nextBtn.disabled = AppState.currentChapter === story.chapters.length - 1;

    const nav = document.getElementById('chapterNavigation');
    if (story.chapters.length <= 1) {
        nav.classList.add('hidden');
    } else {
        nav.classList.remove('hidden');
    }
}

function renderVocabulary(vocab) {
    const grid = document.getElementById('vocabGrid');
    grid.innerHTML = '';

    if (!vocab || vocab.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 1rem;">No difficult words in this chapter.</p>';
        return;
    }

    vocab.forEach(item => {
        const vocabCard = document.createElement('div');
        vocabCard.className = 'vocab-item';
        vocabCard.innerHTML = `
            <div class="vocab-word urdu">${item.word}</div>
            <div class="vocab-transliteration">${item.transliteration}</div>
            <div class="vocab-meaning">${item.meaning}</div>
        `;
        grid.appendChild(vocabCard);
    });
}

// ========================================
// Word Tooltip
// ========================================

function showWordTooltip(event, vocabEntry) {
    event.stopPropagation();

    const tooltip = document.getElementById('wordTooltip');
    const saveBtn = document.getElementById('tooltipSaveBtn');

    clearActiveWord();
    activeWordElement = event.target;
    activeWordElement.classList.add('active');

    document.getElementById('tooltipWord').textContent = vocabEntry.word;
    document.getElementById('tooltipTransliteration').textContent = vocabEntry.transliteration;
    document.getElementById('tooltipMeaning').textContent = vocabEntry.meaning;

    // Check if word is already saved
    const isSaved = AppState.savedWords.some(w => w.word === vocabEntry.word);
    if (isSaved) {
        saveBtn.textContent = 'Saved ✓';
        saveBtn.classList.add('saved');
        saveBtn.disabled = true;
    } else {
        saveBtn.textContent = 'Save word';
        saveBtn.classList.remove('saved');
        saveBtn.disabled = false;

        saveBtn.onclick = () => saveWord(vocabEntry);
    }

    // Position tooltip near the word
    const rect = event.target.getBoundingClientRect();
    tooltip.style.top = (rect.bottom + window.scrollY + 10) + 'px';
    tooltip.style.left = (rect.left + window.scrollX) + 'px';

    tooltip.classList.remove('hidden');
}

function clearActiveWord() {
    if (activeWordElement) {
        activeWordElement.classList.remove('active');
        activeWordElement = null;
    }
}

function saveWord(vocabEntry) {
    if (!AppState.savedWords.some(w => w.word === vocabEntry.word)) {
        AppState.savedWords.push(vocabEntry);
        saveUserPreferences();

        const saveBtn = document.getElementById('tooltipSaveBtn');
        saveBtn.textContent = 'Saved ✓';
        saveBtn.classList.add('saved');
        saveBtn.disabled = true;

        // Update saved words list if visible
        if (!document.getElementById('vocabularySidebar').classList.contains('hidden')) {
            renderSavedWords();
        }
    }
}

// ========================================
// Saved Words Management
// ========================================

function renderSavedWords() {
    const container = document.getElementById('savedWordsList');
    container.innerHTML = '';

    if (AppState.savedWords.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No saved words yet</p>';
        return;
    }

    AppState.savedWords.forEach((word, index) => {
        const wordCard = document.createElement('div');
        wordCard.className = 'saved-word-item';
        wordCard.innerHTML = `
            <div class="saved-word-urdu urdu">${word.word}</div>
            <div class="saved-word-transliteration">${word.transliteration}</div>
            <div class="saved-word-meaning">${word.meaning}</div>
            <button class="delete-word-btn" data-index="${index}">Delete</button>
        `;

        wordCard.querySelector('.delete-word-btn').addEventListener('click', (e) => {
            deleteWord(parseInt(e.target.dataset.index));
        });

        container.appendChild(wordCard);
    });
}

function deleteWord(index) {
    AppState.savedWords.splice(index, 1);
    saveUserPreferences();
    renderSavedWords();
}

function clearAllVocab() {
    if (confirm('Are you sure you want to delete all saved words?')) {
        AppState.savedWords = [];
        saveUserPreferences();
        renderSavedWords();
    }
}

// ========================================
// Grammar Section
// ========================================

function renderGrammarList() {
    const container = document.getElementById('grammarList');
    container.innerHTML = '';

    if (AppState.grammar.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No grammar lessons found</p>';
        return;
    }

    AppState.grammar.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'grammar-card';
        card.innerHTML = `
            <div class="grammar-card-title urdu">${lesson.title}</div>
            <div class="grammar-card-subtitle urdu">${lesson.subtitle}</div>
        `;

        card.addEventListener('click', () => openGrammarLesson(lesson));
        container.appendChild(card);
    });
}

function openGrammarLesson(lesson) {
    AppState.currentGrammarLesson = lesson;
    showView('grammar');

    document.getElementById('grammarTitle').textContent = lesson.title;
    const contentDiv = document.getElementById('grammarContent');
    contentDiv.innerHTML = '';

    // Render explanation
    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'grammar-explanation urdu';
    explanationDiv.textContent = lesson.explanation;
    contentDiv.appendChild(explanationDiv);

    // Render examples
    if (lesson.examples && lesson.examples.length > 0) {
        const examplesSection = document.createElement('div');
        examplesSection.className = 'grammar-examples';
        examplesSection.innerHTML = '<h4>Examples</h4>';

        lesson.examples.forEach(example => {
            const exampleDiv = document.createElement('div');
            exampleDiv.className = 'example-item';
            exampleDiv.innerHTML = `
                <div class="example-urdu urdu">${example.urdu}</div>
                <div class="example-transliteration">${example.transliteration}</div>
                <div class="example-meaning">${example.meaning}</div>
            `;
            examplesSection.appendChild(exampleDiv);
        });

        contentDiv.appendChild(examplesSection);
    }

    // Render exercise
    if (lesson.exercise) {
        renderGrammarExercise(lesson.exercise, contentDiv);
    }
}

function renderGrammarExercise(exercise, container) {
    const exerciseDiv = document.createElement('div');
    exerciseDiv.className = 'grammar-exercise';

    exerciseDiv.innerHTML = `
        <h4>Exercise</h4>
        <div class="exercise-question urdu">${exercise.question}</div>
        <div class="exercise-options" id="exerciseOptions"></div>
        <button class="exercise-submit" id="exerciseSubmit">Submit Answer</button>
        <div class="exercise-feedback hidden" id="exerciseFeedback"></div>
    `;

    container.appendChild(exerciseDiv);

    const optionsDiv = exerciseDiv.querySelector('#exerciseOptions');
    exercise.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'exercise-option';
        optionDiv.innerHTML = `
            <input type="radio" name="exercise" id="option${index}" value="${index}">
            <label class="urdu" for="option${index}">${option}</label>
        `;
        optionsDiv.appendChild(optionDiv);

        optionDiv.addEventListener('click', () => {
            document.getElementById(`option${index}`).checked = true;
            document.querySelectorAll('.exercise-option').forEach(opt =>
                opt.classList.remove('selected'));
            optionDiv.classList.add('selected');
        });
    });

    exerciseDiv.querySelector('#exerciseSubmit').addEventListener('click', () => {
        checkExerciseAnswer(exercise);
    });
}

function checkExerciseAnswer(exercise) {
    const selected = document.querySelector('input[name="exercise"]:checked');
    if (!selected) {
        alert('Please select an answer');
        return;
    }

    const selectedIndex = parseInt(selected.value);
    const feedback = document.getElementById('exerciseFeedback');
    const options = document.querySelectorAll('.exercise-option');

    if (selectedIndex === exercise.correctAnswer) {
        feedback.textContent = 'Great job! Correct answer.';
        feedback.className = 'exercise-feedback correct';
        options[selectedIndex].classList.add('correct');
    } else {
        feedback.textContent = 'Incorrect. Try again.';
        feedback.className = 'exercise-feedback incorrect';
        options[selectedIndex].classList.add('incorrect');
        options[exercise.correctAnswer].classList.add('correct');
    }

    feedback.classList.remove('hidden');
    document.getElementById('exerciseSubmit').disabled = true;
}

// ========================================
// Quiz Mode
// ========================================

let quizState = {
    questions: [],
    currentQuestion: 0,
    score: 0
};

function startQuiz() {
    if (AppState.savedWords.length < 3) {
        alert('Please save at least 3 words to start the quiz.');
        return;
    }

    // Generate 5 random questions
    const shuffled = [...AppState.savedWords].sort(() => Math.random() - 0.5);
    const numQuestions = Math.min(5, shuffled.length);

    quizState.questions = shuffled.slice(0, numQuestions).map(word => {
        const wrongOptions = AppState.savedWords
            .filter(w => w.word !== word.word)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(w => w.meaning);

        const allOptions = [word.meaning, ...wrongOptions]
            .sort(() => Math.random() - 0.5);

        return {
            word: word.word,
            transliteration: word.transliteration,
            correctAnswer: word.meaning,
            options: allOptions
        };
    });

    quizState.currentQuestion = 0;
    quizState.score = 0;

    showView('quiz');
    renderQuizQuestion();
}

function renderQuizQuestion() {
    const container = document.getElementById('quizContent');

    if (quizState.currentQuestion >= quizState.questions.length) {
        showQuizResults();
        return;
    }

    const question = quizState.questions[quizState.currentQuestion];

    document.getElementById('quizScore').textContent = quizState.score;
    document.getElementById('quizTotal').textContent = quizState.questions.length;

    container.innerHTML = `
        <div class="quiz-question">
            <div class="question-number">Question ${quizState.currentQuestion + 1} of ${quizState.questions.length}</div>
            <div class="question-word urdu">${question.word}</div>
            <div style="text-align: center; color: var(--text-secondary); font-style: italic; margin-bottom: 1.5rem;">
                ${question.transliteration}
            </div>
            <div class="quiz-options" id="quizOptions"></div>
        </div>
    `;

    const optionsDiv = document.getElementById('quizOptions');
    question.options.forEach((option) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'quiz-option';
        optionDiv.textContent = option;

        optionDiv.addEventListener('click', () => {
            checkQuizAnswer(option, question.correctAnswer, optionDiv);
        });

        optionsDiv.appendChild(optionDiv);
    });
}

function checkQuizAnswer(selected, correct, optionDiv) {
    const allOptions = document.querySelectorAll('.quiz-option');
    allOptions.forEach(opt => {
        opt.style.pointerEvents = 'none';
        if (opt.textContent === correct) {
            opt.classList.add('correct');
        }
    });

    if (selected === correct) {
        quizState.score++;
        optionDiv.classList.add('selected');
    } else {
        optionDiv.classList.add('incorrect');
    }

    setTimeout(() => {
        quizState.currentQuestion++;
        renderQuizQuestion();
    }, 1500);
}

function showQuizResults() {
    const percentage = (quizState.score / quizState.questions.length) * 100;
    let message = '';

    if (percentage === 100) {
        message = 'Excellent! You answered everything correctly.';
    } else if (percentage >= 80) {
        message = 'Great work! Keep it up.';
    } else if (percentage >= 60) {
        message = 'Good effort. A little more practice will help.';
    } else {
        message = 'Keep practicing and try again.';
    }

    const container = document.getElementById('quizContent');
    container.innerHTML = `
        <div class="quiz-result">
            <h3>Results</h3>
            <div class="quiz-result-score">${quizState.score}/${quizState.questions.length}</div>
            <div class="quiz-result-message">${message}</div>
            <button class="quiz-restart" onclick="startQuiz()">Try Again</button>
        </div>
    `;
}

// ========================================
// Helpers
// ========================================

function normalizeToken(token) {
    if (!token) {
        return '';
    }
    return token
        .replace(/[\u064B-\u065F]/g, '')
        .replace(/[.,!?؟،؛۔:"“”'()\[\]{}]/g, '')
        .trim();
}

function buildVocabMap(vocab) {
    const map = new Map();
    vocab.forEach(entry => {
        const key = normalizeToken(entry.word);
        if (key) {
            map.set(key, entry);
        }
    });
    return map;
}

function countWords(text) {
    return text.split(/\s+/).filter(Boolean).length;
}

function calculateReadingTime(story) {
    const totalWords = story.chapters.reduce((sum, ch) => sum + countWords(ch.urduText), 0);
    const wordsPerMinute = 80;
    return Math.max(1, Math.ceil(totalWords / wordsPerMinute));
}

function calculateVocabCount(story) {
    const vocabSet = new Set();
    story.chapters.forEach(ch => {
        ch.vocab.forEach(item => vocabSet.add(item.word));
    });
    return vocabSet.size;
}

function getStoryById(id) {
    return AppState.stories.find(story => story.id === id);
}

function updateLastRead() {
    if (!AppState.currentStory) {
        return;
    }
    AppState.lastReadStoryId = AppState.currentStory.id;
    AppState.lastReadChapter = AppState.currentChapter;
    saveUserPreferences();
}

// ========================================
// Dark Mode
// ========================================

function toggleDarkMode() {
    AppState.darkMode = !AppState.darkMode;
    document.body.classList.toggle('dark-mode');
    updateDarkModeIcon();
    saveUserPreferences();
}
