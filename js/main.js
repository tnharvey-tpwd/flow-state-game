// --- GAME STATE ---
let currentLevelIndex = 0;
let currentMode = 'rotate';
let grid = [];
let inventory = [];
let maxInv = 0;
let selectedInvIndex = null;
let cols = 0;
let rows = 0;

let moves = 0;
let attempts = 1;
let bestMoves = null;
let worstMoves = null;
let hasWon = false;
let highestUnlocked = parseInt(localStorage.getItem('flowState_highestUnlocked')) || 0;

// --- INITIALIZATION & CORE LOGIC ---

function updateStatsDisplay() {
    document.getElementById('stat-level').innerText = currentLevelIndex + 1;
    document.getElementById('stat-moves').innerText = moves;
    document.getElementById('stat-attempts').innerText = attempts;
    document.getElementById('stat-best').innerText = bestMoves === null ? '-' : bestMoves;
    document.getElementById('stat-worst').innerText = worstMoves === null ? '-' : worstMoves;
}

function resetLevel() {
    loadLevel(currentLevelIndex);
}

function loadLevel(levelIndex) {
    currentLevelIndex = levelIndex;
    localStorage.setItem('flowState_currentLevel', currentLevelIndex);

    const levelData = levels[levelIndex];
    maxInv = levelData.maxInventoryCapacity;
    inventory = [...levelData.initialInventory];
    selectedInvIndex = null;
    moves = 0; 
    
    bestMoves = parseInt(localStorage.getItem(`flowState_best_${levelIndex}`)) || null;
    worstMoves = parseInt(localStorage.getItem(`flowState_worst_${levelIndex}`)) || null;
    hasWon = false;
    
    let savedAttempts = parseInt(localStorage.getItem(`flowState_attempts_${levelIndex}`)) || 0;
    attempts = savedAttempts + 1; 
    localStorage.setItem(`flowState_attempts_${levelIndex}`, attempts); 

    rows = levelData.map.length;
    cols = levelData.map[0].split(' ').length;
    grid = [];

    for (let y = 0; y < rows; y++) {
        const rowChars = levelData.map[y].split(' ');
        let gridRow = [];
        for (let x = 0; x < cols; x++) {
            const char = rowChars[x];
            gridRow.push({
                x, y,
                type: (char === '.' || char === 'X') ? null : char,
                isObstacle: char === 'X',
                isFixed: char === 'S' || char === 'E',
                rotation: 0,
                filled: false
            });
        }
        grid.push(gridRow);
    }

    updateStatsDisplay();
    render();
    updateFlow();
    document.getElementById('message').innerText = ""; 
}

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${mode}`).classList.add('active');
    
    if (mode !== 'add') {
        selectedInvIndex = null;
        renderInventory();
    }
}

function selectInventory(index) {
    if (currentMode !== 'add' || index >= inventory.length) return;
    selectedInvIndex = index;
    renderInventory();
}

function handleCellClick(x, y) {
    const cell = grid[y][x];
    let actionTaken = false; 

    if (cell.isObstacle || cell.isFixed) return;

    if (currentMode === 'rotate' && cell.type) {
        cell.rotation = (cell.rotation + 1) % 4;
        actionTaken = true;
    } 
    else if (currentMode === 'add' && !cell.type && selectedInvIndex !== null) {
        cell.type = inventory[selectedInvIndex];
        cell.rotation = 0;
        inventory.splice(selectedInvIndex, 1);
        selectedInvIndex = null;
        actionTaken = true;
    } 
    else if (currentMode === 'remove' && cell.type) {
        if (inventory.length < maxInv) {
            inventory.push(cell.type);
            cell.type = null;
            cell.rotation = 0;
            actionTaken = true;
        } else {
            alert("Inventory full! You cannot remove any more pipes.");
            return;
        }
    }

    if (actionTaken) {
        moves++;
        updateStatsDisplay();
        render();
        updateFlow();
    }
}

// --- FLOW ALGORITHM (DFS) ---

function getActiveExits(cell) {
    if (!cell.type) return [0, 0, 0, 0];
    const baseExits = pipeDefs[cell.type];
    let rotated = [...baseExits];
    for (let i = 0; i < cell.rotation; i++) {
        rotated.unshift(rotated.pop());
    }
    return rotated;
}

function updateFlow() {
    let sourceCell = null;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            grid[y][x].filled = false;
            if (grid[y][x].type === 'S') sourceCell = grid[y][x];
        }
    }

    if (!sourceCell) return;

    let stack = [sourceCell];
    sourceCell.filled = true;
    let win = false;

    while (stack.length > 0) {
        const current = stack.pop();
        const exits = getActiveExits(current);

        const directions = [
            { dir: 0, dx: 0, dy: -1, opp: 2 },
            { dir: 1, dx: 1, dy: 0, opp: 3 },
            { dir: 2, dx: 0, dy: 1, opp: 0 },
            { dir: 3, dx: -1, dy: 0, opp: 1 }
        ];

        directions.forEach(d => {
            if (exits[d.dir] === 1) { 
                const nx = current.x + d.dx;
                const ny = current.y + d.dy;

                if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
                    const neighbor = grid[ny][nx];
                    if (neighbor.type && !neighbor.filled) {
                        const neighborExits = getActiveExits(neighbor);
                        if (neighborExits[d.opp] === 1) {
                            neighbor.filled = true;
                            stack.push(neighbor);
                            if (neighbor.type === 'E') win = true;
                        }
                    }
                }
            }
        });
    }

    renderGrid(); 
    
    const msgDiv = document.getElementById('message');
    const nextBtn = document.getElementById('btn-next-level'); 
    
    if (win) {
        msgDiv.innerText = "Flow Established! Level Complete.";
        if (currentLevelIndex < levels.length - 1) {
            nextBtn.style.display = 'block';
        }

        if (!hasWon) {
            hasWon = true;
            if (bestMoves === null || moves < bestMoves) {
                bestMoves = moves;
                localStorage.setItem(`flowState_best_${currentLevelIndex}`, bestMoves);
            }
            if (worstMoves === null || moves > worstMoves) {
                worstMoves = moves;
                localStorage.setItem(`flowState_worst_${currentLevelIndex}`, worstMoves);
            }
            updateStatsDisplay(); 
        }
    } else {
        msgDiv.innerText = "";
        nextBtn.style.display = 'none'; 
        hasWon = false; 
    }
}

// --- RENDERING ---

function render() {
    renderGrid();
    renderInventory();
}

function renderGrid() {
    const board = document.getElementById('game-board');
    board.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
    board.innerHTML = '';

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cellData = grid[y][x];
            const cellDiv = document.createElement('div');
            cellDiv.className = 'cell';
            
            if (cellData.isObstacle) cellDiv.classList.add('obstacle');
            if (cellData.type === 'S') cellDiv.classList.add('source');
            if (cellData.type === 'E') cellDiv.classList.add('exit');
            if (cellData.filled) cellDiv.classList.add('filled');

            if (cellData.type && pipeSVGs[cellData.type]) {
                const svgWrapper = document.createElement('div');
                svgWrapper.style.width = '100%';
                svgWrapper.style.height = '100%';
                svgWrapper.style.transform = `rotate(${cellData.rotation * 90}deg)`;
                svgWrapper.innerHTML = `<svg viewBox="0 0 100 100">${pipeSVGs[cellData.type]}</svg>`;
                cellDiv.appendChild(svgWrapper);
            }

            cellDiv.onclick = () => handleCellClick(x, y);
            board.appendChild(cellDiv);
        }
    }
}

function renderInventory() {
    const invDiv = document.getElementById('inventory');
    invDiv.innerHTML = '';

    for (let i = 0; i < maxInv; i++) {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'inv-slot';
        if (i === selectedInvIndex) slotDiv.classList.add('selected');

        if (i < inventory.length) {
            const pipeType = inventory[i];
            slotDiv.innerHTML = `<svg viewBox="0 0 100 100">${pipeSVGs[pipeType]}</svg>`;
        }

        slotDiv.onclick = () => selectInventory(i);
        invDiv.appendChild(slotDiv);
    }
}

// --- MENU, PROGRESSION & MODAL LOGIC ---

function handleNextLevelClick() {
    const nextLevel = currentLevelIndex + 1;
    if (nextLevel <= highestUnlocked || nextLevel >= fullUnlockLevel) {
        highestUnlocked = Math.max(highestUnlocked, nextLevel);
        localStorage.setItem('flowState_highestUnlocked', highestUnlocked);
        document.getElementById('btn-next-level').style.display = 'none';
        loadLevel(nextLevel);
    } else {
        showModal();
    }
}

function toggleMenu() {
    document.getElementById('level-menu').classList.toggle('show-menu');
    populateMenu();
}

function populateMenu() {
    const menu = document.getElementById('level-menu');
    menu.innerHTML = ''; 
    
    for (let i = 0; i < levels.length; i++) {
        const btn = document.createElement('button');
        btn.innerText = `Level ${i + 1}`;
        
        if (i <= highestUnlocked) {
            if (i === currentLevelIndex) {
                btn.style.color = 'var(--accent)'; 
            }
            btn.onclick = () => {
                loadLevel(i);
                document.getElementById('level-menu').classList.remove('show-menu');
            };
        } else {
            btn.classList.add('locked');
            btn.innerText += ' (Locked)';
            btn.onclick = () => alert('Complete the previous levels and enter the instructor code to unlock.');
        }
        menu.appendChild(btn);
    }

    const clearBtn = document.createElement('button');
    clearBtn.innerText = '⚠️ Clear Game Data';
    clearBtn.style.color = 'var(--accent)'; 
    clearBtn.style.borderTop = '1px solid var(--obstacle)'; 
    clearBtn.onclick = clearGameData;
    menu.appendChild(clearBtn);
}

function clearGameData() {
    if (confirm("Are you sure you want to clear all progress and stats? This cannot be undone.")) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('flowState_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        highestUnlocked = 0;
        loadLevel(0);
        document.getElementById('level-menu').classList.remove('show-menu');
    }
}

window.onclick = function(event) {
    if (!event.target.matches('#btn-menu')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].classList.contains('show-menu')) {
                dropdowns[i].classList.remove('show-menu');
            }
        }
    }
}

function showModal() {
    document.getElementById('instructor-modal').style.display = 'flex';
    const input = document.getElementById('unlock-code');
    input.value = ''; 
    input.focus();
    document.getElementById('btn-unlock').disabled = true;
}

document.getElementById('unlock-code').addEventListener('input', function(e) {
    const btn = document.getElementById('btn-unlock');
    if (e.target.value.trim().toLowerCase() === 'understanding') {
        btn.disabled = false;
    } else {
        btn.disabled = true;
    }
});

function unlockNextLevel() {
    highestUnlocked = Math.max(highestUnlocked, currentLevelIndex + 1);
    localStorage.setItem('flowState_highestUnlocked', highestUnlocked);
    document.getElementById('instructor-modal').style.display = 'none';
    document.getElementById('btn-next-level').style.display = 'none';
    loadLevel(currentLevelIndex + 1);
}

// Initialize on page load
const startingLevel = parseInt(localStorage.getItem('flowState_currentLevel')) || 0;
loadLevel(startingLevel);
