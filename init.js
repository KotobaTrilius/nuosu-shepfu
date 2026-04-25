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

function createCharButton(char, exact = false) {
    const btn = document.createElement('button');
    btn.textContent = char;
    btn.className = exact ? 'char-btn exact-match' : 'char-btn';
    
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

document.addEventListener('DOMContentLoaded', () => {
    if (typeof charInfo === 'undefined') {
        alert(t('load_error'));
        return;
    }

    window.editor = document.getElementById('editor');
    window.infoDisplay = document.getElementById('info-display');
    window.copyBtn = document.getElementById('copy-btn');
    window.transContent = document.getElementById('trans-content');

    const pinyinInput = document.getElementById('pinyin-input');
    const pinyinCharContainer = document.getElementById('pinyin-char-buttons');
    const pinyinMatchCountLabel = document.getElementById('pinyin-match-count');
    const clearPinyinBtn = document.getElementById('clear-pinyin-btn');

    infoDisplay.textContent = t('info_default');
    infoDisplay.dataset.i18n = 'info_default';

    window.showInfo = (char) => {
        const pinyin = charInfo[char] || "?";
        const strokes = charStrokes[char] || "";
        const ipa = toIPA(pinyin) || "?";
        
        // const formattedStrokes = strokes ? strokes.split('').join('-') : t('info_none');

        const ipaPart = (pinyin == "w" ? `${t('iteration_mark')}` : `<strong>${t('info_ipa')}:</strong> <span class="ipa">/${ipa}/</span>`)
        // FOR THE EXCEPTIONAL SYLLABLE ITERATION MARK "ꀕ" (TRANSLITERATED AS "w").

        infoDisplay.innerHTML = `
            <strong>${t('info_char')}:</strong> <strong>${char}</strong> | 
            <strong>${t('info_pinyin')}:</strong> ${pinyin} |
            ${ipaPart}
        `;
        // | <strong>${t('info_strokes')}:</strong> ${formattedStrokes}
    };

    function filterCharsByPinyin() {
        pinyinCharContainer.innerHTML = '';
        const query = pinyinInput.value.toLowerCase().trim();

        if (!query) {
            pinyinCharContainer.innerHTML = `<p class="hint">${t('pinyin_hint')}</p>`;
            pinyinMatchCountLabel.textContent = '0';
            return;
        }

        const matchedEntries = Object.entries(charLookupReverse)
            .filter(([pinyin, char]) => pinyin.startsWith(query))
            .sort((entry1, entry2) => entry1[0].localeCompare(entry2[0]));

        const matchedChars = matchedEntries
            .map(([pinyin, char]) => [char, pinyin === query]);
        
        pinyinMatchCountLabel.textContent = matchedChars.length;

        if (matchedChars.length === 0) {
            pinyinCharContainer.innerHTML = `<p class="hint">${t('pinyin_no_match')}</p>`;
        } else {
            matchedChars.forEach(([char, exact]) => {
                const btn = createCharButton(char, exact);
                if (btn) pinyinCharContainer.appendChild(btn);
            });
        }
    }

    pinyinInput.addEventListener('input', filterCharsByPinyin);

    function flushPinyinExactMatches() {
        const elements = pinyinCharContainer.querySelectorAll('.exact-match');
        console.log(elements);
        if (elements.length === 0) return;

        const chars = Array.from(elements).map(elem => elem.textContent);
        const str = chars.join('');
        insertAtCursor(editor, str);
        clearPinyin();
    }

    pinyinInput.addEventListener('keydown', (e) => {
        if (e.key == 'Enter') flushPinyinExactMatches();
    });

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
            editor.blur(); 
        } else if (mode === 'pinyin') {
            document.getElementById('panel-pinyin').classList.add('active');
            filterCharsByPinyin();
            pinyinInput.focus();
        }
    };
    
    setLanguage('zh-CN');
});