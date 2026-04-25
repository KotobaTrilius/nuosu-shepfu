const charStrokes = {
    "": "",
};

const ALL_STROKES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

document.addEventListener('DOMContentLoaded', () => {
    if (typeof charInfo === 'undefined') {
        alert(t('load_error'));
        return;
    }

    let currentStrokes = "";

    const strokeKeyboard = document.getElementById('stroke-keyboard');
    const strokeInputDisplay = document.getElementById('stroke-input-display');
    const strokeCharContainer = document.getElementById('stroke-char-buttons');
    const matchCountLabel = document.getElementById('match-count');
    const clearStrokeBtn = document.getElementById('clear-stroke-btn');

    function initStrokeKeyboard() {
        ALL_STROKES.forEach(stroke => {
            const btn = document.createElement('button');
            btn.textContent = stroke;
            btn.className = 'stroke-key-btn';
            btn.dataset.stroke = stroke;

            btn.addEventListener('click', () => {
                addStroke(stroke);
            });

            strokeKeyboard.appendChild(btn);
        });
    }

    function addStroke(stroke) {
        let strokeArray = currentStrokes.split('');
        strokeArray.push(stroke);
        strokeArray.sort();
        currentStrokes = strokeArray.join('');

        updateStrokeUI();
        filterCharsByStrokes();
    }

    function clearStrokes() {
        currentStrokes = "";
        updateStrokeUI();
        filterCharsByStrokes();
    }

    function updateStrokeUI() {
        strokeInputDisplay.textContent = currentStrokes;
        if (currentStrokes.length > 0) {
            strokeInputDisplay.style.backgroundColor = "#eef2ff";
        } else {
            strokeInputDisplay.style.backgroundColor = "#fff";
        }
    }

    function filterCharsByStrokes() {
        strokeCharContainer.innerHTML = '';

        if (currentStrokes.length === 0) {
            strokeCharContainer.innerHTML = `<p class="hint">${t('stroke_hint')}</p>`;
            matchCountLabel.textContent = '0';
            return;
        }

        const inputStrokes = currentStrokes;
        const matchedChars = [];

        for (const char in charInfo) {
            const strokes = charStrokes[char];
            if (!strokes) continue;

            if (isMatch(inputStrokes, strokes)) {
                matchedChars.push(char);
            }
        }

        matchCountLabel.textContent = matchedChars.length;

        if (matchedChars.length === 0) {
            strokeCharContainer.innerHTML = `<p class="hint">${t('stroke_no_match')}</p>`;
        } else {
            matchedChars.forEach(char => {
                const btn = createCharButton(char);
                if (btn) strokeCharContainer.appendChild(btn);
            });
        }
    }

    document.addEventListener('keydown', (e) => {
        if (!document.getElementById('panel-stroke').classList.contains('active')) return;
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        const key = e.key.toUpperCase();
        if (ALL_STROKES.includes(key)) {
            e.preventDefault();
            addStroke(key);
        } else if (e.key === 'Escape') {
            clearStrokes();
        }
    });

    clearStrokeBtn.addEventListener('click', clearStrokes);

    initStrokeKeyboard();
});