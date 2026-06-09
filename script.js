const WORD_POOL = ["BOBA", "CAT", "MOCHI", "KAWAII", "PINK", "SWEET", "MILK", "CUTE", "BUNNY", "BEAR", "PANDA", "CAKE"];
const GRID_SIZE = 10;

let wordsToFind = [];
let foundWords = [];
let gridMatrix = [];
let isSelecting = false;
let startCell = null;
let currentSelectionIds = [];

// Setup the game on load
window.onload = () => {
    initGame();
    setupMouseListeners();
};

function initGame() {
    // Pick 5 random words from the pool
    wordsToFind = [...WORD_POOL].sort(() => 0.5 - Math.random()).slice(0, 5);
    foundWords = [];
    gridMatrix = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
    
    document.getElementById('winMessage').style.display = 'none';

    // Place words in grid
    wordsToFind.forEach(word => {
        placeWord(word);
    });

    // Fill empty spaces with random cute letters
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (gridMatrix[r][c] === '') {
                gridMatrix[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
    }

    renderGrid();
    renderWordList();
}

function placeWord(word) {
    const directions = [
        [0, 1],   // Horizontal right
        [1, 0],   // Vertical down
        [1, 1]    // Diagonal down-right
    ];
    
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);

        // Check if word fits
        if (row + dir[0] * word.length <= GRID_SIZE && col + dir[1] * word.length <= GRID_SIZE) {
            let canPlace = true;
            for (let i = 0; i < word.length; i++) {
                const nextR = row + dir[0] * i;
                const nextC = col + dir[1] * i;
                if (gridMatrix[nextR][nextC] !== '' && gridMatrix[nextR][nextC] !== word[i]) {
                    canPlace = false;
                    break;
                }
            }

            if (canPlace) {
                for (let i = 0; i < word.length; i++) {
                    gridMatrix[row + dir[0] * i][col + dir[1] * i] = word[i];
                }
                placed = true;
            }
        }
        attempts++;
    }
}

function renderGrid() {
    const gridContainer = document.getElementById('grid');
    gridContainer.innerHTML = '';
    
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.innerText = gridMatrix[r][c];
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.id = `cell-${r}-${c}`;
            gridContainer.appendChild(cell);
        }
    }
}

function renderWordList() {
    const listContainer = document.getElementById('wordList');
    listContainer.innerHTML = '';
    wordsToFind.forEach(word => {
        const li = document.createElement('li');
        li.classList.add('word-item');
        li.id = `word-${word}`;
        li.innerText = word;
        listContainer.appendChild(li);
    });
}

// Logic for drag/swipe select
function setupMouseListeners() {
    const grid = document.getElementById('grid');

    const startSelection = (e) => {
        const cell = e.target.closest('.cell');
        if (!cell || cell.classList.contains('found')) return;
        
        isSelecting = true;
        startCell = cell;
        highlightCell(cell);
    };

    const moveSelection = (e) => {
        if (!isSelecting) return;
        
        // Handle both mouse and touch coordinates
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        const element = document.elementFromPoint(clientX, clientY);
        const cell = element ? element.closest('.cell') : null;
        
        if (cell && !cell.classList.contains('found')) {
            calculateSelectionLine(startCell, cell);
        }
    };

    const endSelection = () => {
        if (!isSelecting) return;
        isSelecting = false;
        checkSelectedWord();
        clearHighlights();
    };

    // Desktop events
    grid.addEventListener('mousedown', startSelection);
    window.addEventListener('mousemove', moveSelection);
    window.addEventListener('mouseup', endSelection);

    // Mobile events
    grid.addEventListener('touchstart', startSelection, {passive: true});
    window.addEventListener('touchmove', moveSelection, {passive: false});
    window.addEventListener('touchend', endSelection);
}

function highlightCell(cell) {
    if (!currentSelectionIds.includes(cell.id)) {
        cell.classList.add('highlighted');
        currentSelectionIds.push(cell.id);
    }
}

function clearHighlights() {
    currentSelectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('highlighted');
    });
    currentSelectionIds = [];
}

function calculateSelectionLine(start, end) {
    clearHighlights();
    
    const r1 = parseInt(start.dataset.row);
    const c1 = parseInt(start.dataset.col);
    const r2 = parseInt(end.dataset.row);
    const c2 = parseInt(end.dataset.col);

    const rowDiff = r2 - r1;
    const colDiff = c2 - c1;

    // Determine if horizontal, vertical, or perfectly diagonal
    let stepR = 0;
    let stepC = 0;

    if (r1 === r2) { // Horizontal
        stepC = colDiff > 0 ? 1 : -1;
    } else if (c1 === c2) { // Vertical
        stepR = rowDiff > 0 ? 1 : -1;
    } else if (Math.abs(rowDiff) === Math.abs(colDiff)) { // Diagonal
        stepR = rowDiff > 0 ? 1 : -1;
        stepC = colDiff > 0 ? 1 : -1;
    } else {
        // Not a valid straight line selection
        highlightCell(start);
        return;
    }

    let currR = r1;
    let currC = c1;
    const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff)) + 1;

    for (let i = 0; i < steps; i++) {
        const cell = document.getElementById(`cell-${currR}-${currC}`);
        if (cell) highlightCell(cell);
        currR += stepR;
        currC += stepC;
    }
}

function checkSelectedWord() {
    let constructedWord = "";
    currentSelectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) constructedWord += el.innerText;
    });

    let reverseWord = constructedWord.split("").reverse().join("");

    let match = null;
    if (wordsToFind.includes(constructedWord) && !foundWords.includes(constructedWord)) {
        match = constructedWord;
    } else if (wordsToFind.includes(reverseWord) && !foundWords.includes(reverseWord)) {
        match = reverseWord;
    }

    if (match) {
        foundWords.push(match);
        currentSelectionIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('found');
        });
        const wordItem = document.getElementById(`word-${match}`);
        if (wordItem) wordItem.classList.add('found');

        if (foundWords.length === wordsToFind.length) {
            setTimeout(() => {
                document.getElementById('winMessage').style.display = 'block';
            }, 300);
        }
    }
}

function closeWinMessage() {
    document.getElementById('winMessage').style.display = 'none';
    initGame();
}
