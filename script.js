document.addEventListener('DOMContentLoaded', () => {
    if (typeof charInfo === 'undefined' || typeof charStrokes === 'undefined' || typeof radicalMap === 'undefined') {
        alert(t('load_error'));
        return;
    }

    const editor = document.getElementById('editor');
    const infoDisplay = document.getElementById('info-display');
    const copyBtn = document.getElementById('copy-btn');
    const transContent = document.getElementById('trans-content');
    
    const radicalContainer = document.getElementById('radical-buttons');
    const radicalCharContainer = document.getElementById('radical-char-buttons');
    const currentRadicalLabel = document.getElementById('current-radical-name');

    const strokeKeyboard = document.getElementById('stroke-keyboard');
    const strokeInputDisplay = document.getElementById('stroke-input-display');
    const strokeCharContainer = document.getElementById('stroke-char-buttons');
    const matchCountLabel = document.getElementById('match-count');
    const clearStrokeBtn = document.getElementById('clear-stroke-btn');

    const pinyinInput = document.getElementById('pinyin-input');
    const pinyinCharContainer = document.getElementById('pinyin-char-buttons');
    const pinyinMatchCountLabel = document.getElementById('pinyin-match-count');
    const clearPinyinBtn = document.getElementById('clear-pinyin-btn');

    infoDisplay.textContent = t('info_default');
    infoDisplay.dataset.i18n = 'info_default';

    let currentStrokes = ""; 

    function insertAtCursor(myField, myValue) {
        if (document.selection) {
            myField.focus();
            sel = document.selection.createRange();
            sel.text = myValue;
        } else if (myField.selectionStart || myField.selectionStart == '0') {
            var startPos = myField.selectionStart;
            var endPos = myField.selectionEnd;
            var scrollTop = myField.scrollTop;
            myField.value = myField.value.substring(0, startPos) + myValue + myField.value.substring(endPos, myField.value.length);
            myField.scrollTop = scrollTop;
            myField.selectionStart = startPos + myValue.length;
            myField.selectionEnd = startPos + myValue.length;
            myField.focus();
        } else {
            myField.value += myValue;
            myField.focus();
        }

        const event = new Event('input', { bubbles: true });
        myField.dispatchEvent(event);
    }

    function toIPA(latinSyllable) {
        let remaining = latinSyllable;
        let initialIPA = "";
        let finalIPA = "";
        let toneMark = tones[""];

        const lastChar = remaining.slice(-1);
        if (["t", "x", "p"].includes(lastChar)) {
            toneMark = tones[lastChar];
            remaining = remaining.slice(0, -1);
        }

        const initialKeys = Object.keys(initials).sort((a, b) => b.length - a.length);
        for (const key of initialKeys) {
            if (remaining.startsWith(key)) {
                initialIPA = initials[key];
                remaining = remaining.slice(key.length);
                break;
            }
        }

        if (finals[remaining]) {
            finalIPA = finals[remaining];
        } else {
            console.warn(`Unknown final: "${remaining}" in syllable "${latinSyllable}"`);
            return null;
        }

        return initialIPA + finalIPA + toneMark;
    }

    function showInfo(char) {
        const pinyin = charInfo[char] || "?";
        const strokes = charStrokes[char] || "";
        const ipa = toIPA(pinyin) || "?";
        
        const formattedStrokes = strokes ? strokes.split('').join('-') : t('info_none');
        
        infoDisplay.innerHTML = `
            <strong>${t('info_char')}:</strong> ${char} | 
            <strong>${t('info_pinyin')}:</strong> ${pinyin} |
            <strong>${t('info_ipa')}:</strong> <span class="ipa">/${ipa}/</span>
        `;
        // | <strong>${t('info_strokes')}:</strong> ${formattedStrokes}
    }

    function createCharButton(char) {
        const btn = document.createElement('button');
        btn.textContent = char;
        btn.className = 'char-btn';
        
        btn.addEventListener('click', () => {
            insertAtCursor(editor, char);
        });

        btn.addEventListener('mouseenter', () => {
            showInfo(char);
        });
        
        btn.addEventListener('mouseleave', () => {
            infoDisplay.textContent = t('info_default');
            infoDisplay.dataset.i18n = 'info_default';
        });
        return btn;
    }

    function filterCharsByPinyin() {
        pinyinCharContainer.innerHTML = '';
        const query = pinyinInput.value.toLowerCase().trim();

        if (!query) {
            pinyinCharContainer.innerHTML = `<p class="hint">${t('pinyin_hint')}</p>`;
            pinyinMatchCountLabel.textContent = '0';
            return;
        }

        const matchedChars = [];

        for (const pinyin in charLookupReverse) {
            if (pinyin.startsWith(query)) {
                const char = charLookupReverse[pinyin];
                if (char && charInfo[char]) {
                    matchedChars.push(char);
                }
            }
        }

        const uniqueChars = [...new Set(matchedChars)];

        pinyinMatchCountLabel.textContent = uniqueChars.length;

        if (uniqueChars.length === 0) {
            pinyinCharContainer.innerHTML = `<p class="hint">${t('pinyin_no_match')}</p>`;
        } else {
            uniqueChars.forEach(char => {
                const btn = createCharButton(char);
                if (btn) pinyinCharContainer.appendChild(btn);
            });
        }
    }

    pinyinInput.addEventListener('input', filterCharsByPinyin);

    function clearPinyin() {
        pinyinInput.value = "";
        filterCharsByPinyin();
        pinyinInput.focus();
    }

    clearPinyinBtn.addEventListener('click', clearPinyin);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (document.getElementById('panel-pinyin').classList.contains('active')) {
                if (document.activeElement === pinyinInput) {
                    clearPinyin();
                }
            }
        }
    });

    function updateTransliteration() {
        const text = editor.value;
        let result = "";
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (charInfo[char]) {
                result += "[" + charInfo[char] + "]";
            } else {
                result += char;
            }
        }
    
        transContent.textContent = result;
    }

    editor.addEventListener('input', updateTransliteration);

    updateTransliteration();

    function initRadicals() {
        radicalContainer.innerHTML = ''; 
        
        for (const radicalChar in radicalMap) {
            const radicalData = radicalMap[radicalChar];
            
            let btnText = radicalChar;
            if (radicalData.vars && radicalData.vars.length > 0) {
                btnText += ` ( ${radicalData.vars.join(' ')} )`;
            }
            btnText += `\u00A0\u00A0\u00A0[${radicalData.name}]`;

            const btn = document.createElement('button');
            btn.textContent = btnText;
            btn.className = 'radical-btn';
            
            btn.addEventListener('click', () => {
                renderRadicalChars(radicalChar, radicalData);
                currentRadicalLabel.textContent = radicalData.name;
                currentRadicalLabel.dataset.radicalId = radicalChar;
                delete currentRadicalLabel.dataset.i18n;
            });
            
            radicalContainer.appendChild(btn);
        }
    }

    function renderRadicalChars(radicalChar, radicalData) {
        radicalCharContainer.innerHTML = '';
        
        const groups = radicalData.syllables || [];

        if (!groups.length) {
            radicalCharContainer.innerHTML = `<p class="hint">${t('radical_empty')}</p>`;
            return;
        }

        
        groups.forEach(group => {
            const strokeCount = group[0]; 
            const syllableList = group[1]; 
            
            if (!syllableList || syllableList.length === 0) return;

            
            const charsInGroup = [];
            syllableList.forEach(syl => {
                const yiChar = charLookupReverse[syl];
                
                if (yiChar && charInfo[yiChar] && !charsInGroup.includes(yiChar)) {
                    charsInGroup.push(yiChar);
                }
            });

            
            if (charsInGroup.length === 0) return;

            
            const rowDiv = document.createElement('div');
            rowDiv.className = 'radical-stroke-row';

            
            const labelSpan = document.createElement('span');
            labelSpan.className = 'stroke-label';
            
            labelSpan.textContent = t(`radical_stroke_${strokeCount}`) || `${strokeCount}画`;
            rowDiv.appendChild(labelSpan);

            
            const charsDiv = document.createElement('div');
            charsDiv.className = 'stroke-char-list';
            
            charsInGroup.forEach(char => {
                const btn = createCharButton(char);
                if (btn) charsDiv.appendChild(btn);
            });
            rowDiv.appendChild(charsDiv);

            
            radicalCharContainer.appendChild(rowDiv);
        });
    }

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

    function isMatch(input, target) {
        const inputCounts = {};
        for (let char of input) {
            inputCounts[char] = (inputCounts[char] || 0) + 1;
        }

        const targetCounts = {};
        for (let char of target) {
            targetCounts[char] = (targetCounts[char] || 0) + 1;
        }

        for (let char in inputCounts) {
            if (!targetCounts[char] || targetCounts[char] < inputCounts[char]) {
                return false;
            }
        }

        return true;
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

    copyBtn.addEventListener('click', () => {
        const textToCopy = editor.value;
        if (!textToCopy) {
            alert(t('copy_empty')); 
            return;
        }
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            copyBtn.textContent = t('copied'); 
            copyBtn.style.backgroundColor = "#10b981"; 
            
            setTimeout(() => {
                copyBtn.textContent = t('copy_btn'); 
                copyBtn.style.backgroundColor = ""; 
            }, 1500);
        }).catch(err => {
            console.error(t('copy_error'), err);
            alert(t('copy_error_alert'));
        });
    });

    window.switchMode = function(mode) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const buttons = document.querySelectorAll('.tab-btn');
        if (mode === 'radical') buttons[0].classList.add('active');
        if (mode === 'stroke') buttons[1].classList.add('active');
        if (mode === 'pinyin') buttons[2].classList.add('active');

        document.querySelectorAll('.mode-panel').forEach(panel => panel.classList.remove('active'));
        
        if (mode === 'radical') {
            document.getElementById('panel-radical').classList.add('active');
        } else if (mode === 'stroke') {
            document.getElementById('panel-stroke').classList.add('active');
            filterCharsByStrokes();
            editor.blur(); 
        } else if (mode === 'pinyin') {
            document.getElementById('panel-pinyin').classList.add('active');
            filterCharsByPinyin();
            pinyinInput.focus();
        }
    };

    initRadicals();
    initStrokeKeyboard();
    
    setLanguage('zh');
});