document.addEventListener('DOMContentLoaded', () => {
    if (typeof charInfo === 'undefined') {
        alert(t('load_error'));
        return;
    }

    const pinyinInput = document.getElementById('pinyin-input');
    const pinyinCharContainer = document.getElementById('pinyin-char-buttons');
    const pinyinMatchCountLabel = document.getElementById('pinyin-match-count');
    const clearPinyinBtn = document.getElementById('clear-pinyin-btn');

    window.pinyinTrie = {};

    for (const pinyin in charLookupReverse) {
        let ptr = pinyinTrie;
        for (const ch of pinyin) {
            ptr[ch] = ptr[ch] || {};
            ptr = ptr[ch];
        }
        ptr.pinyin = pinyin;
    }

    function cutQuery(query) {
        const delimiters = "- ";

        const pinyins = [];
        const l = query.length;

        let ptr = pinyinTrie;

        let trailerStart = 0;

        for (let i = 0; i < l; ++i) {
            const ch = query[i];

            if (ptr[ch]) { // can advance
                ptr = ptr[ch];
            } else { // cannot advance
                if (ptr.pinyin) {
                    pinyins.push(ptr.pinyin);
                    trailerStart = i;
                    if (pinyinTrie[ch]) {
                        ptr = pinyinTrie[ch];
                    } else if (delimiters.includes(ch)) {
                        ptr = pinyinTrie;
                        trailerStart += 1;
                    } else {
                        break;
                    }
                } else if (delimiters.includes(ch)) {
                    trailerStart += 1;
                } else {
                    break;
                }
            }
        }

        if (trailerStart < l) pinyins.push(query.substring(trailerStart, l));

        return pinyins;
    }

    function filterCharsByPinyin() {
        pinyinCharContainer.innerHTML = '';
        const query = pinyinInput.value.toLowerCase().trim();

        if (!query) {
            pinyinCharContainer.innerHTML = `<p class="hint">${t('pinyin_hint')}</p>`;
            pinyinMatchCountLabel.textContent = '0';
            return;
        }

        queryCut = cutQuery(query);

        exactMatches = queryCut.slice(0, -1).map(pinyin =>
            [charLookupReverse[pinyin], true]
        );

        const trailerQuery = queryCut.at(-1);

        const matchedEntries = Object.entries(charLookupReverse)
            .filter(([pinyin, char]) => pinyin.startsWith(trailerQuery))
            .sort((entry1, entry2) => entry1[0].localeCompare(entry2[0]));

        const matchedChars = [...exactMatches, ...matchedEntries
            .map(([pinyin, char]) => [char, pinyin === trailerQuery])];

        quotationFlags = Object.fromEntries(
            Object.entries(quotationMirror)
                .map(quotationMark => [quotationMark, false]));

        for (let i = 0; i < matchedChars.length; ++i) {
            let seg = matchedChars[i][0];
            if (quotationMirror[seg]) {
                if (quotationFlags[seg]) {
                    matchedChars[i][0] = quotationMirror[seg];
                }
                quotationFlags[seg] = !quotationFlags[seg];
            }
        }

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

    whenPanelActivates['pinyin'] = () => {
        filterCharsByPinyin();
        pinyinInput.focus();
    };
});