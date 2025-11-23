// --- CONFIGURAÇÕES ---
const ROWS = 10;
const COLS = 10;

let gridData = []; 
let startNode = { r: 0, c: 0 };
let endNode = { r: 9, c: 9 };

let queue = [];
let visited = new Set();
let parentMap = new Map(); 
let isRunning = false;
let isFinished = false;
let timer = null;

const gridEl = document.getElementById('grid');
const logEl = document.getElementById('log-panel');
let cellsDOM = [];

// --- INICIALIZAÇÃO ---
function init() {
    criarGridHTML();
    resetarLogica();
    atualizarTextoDeVelocidade(); 
}

function atualizarTextoDeVelocidade() {
    const val = document.getElementById('speed-range').value;
    const label = document.getElementById('speed-display');
    
    if (val == 0) {
        label.innerText = "INSTANTÂNEO";
        label.style.color = "#55ff55"; 
    } else {
        label.innerText = val + " ms";
        label.style.color = "yellow";
    }
}

function criarGridHTML() {
    gridEl.innerHTML = '';
    cellsDOM = [];
    gridData = [];

    gridEl.style.gridTemplateColumns = `repeat(${COLS}, var(--grid-size))`;
    gridEl.style.gridTemplateRows = `repeat(${ROWS}, var(--grid-size))`;

    for (let r = 0; r < ROWS; r++) {
        const rowData = [];
        const rowDOM = [];
        for (let c = 0; c < COLS; c++) {
            rowData.push(0); 
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.addEventListener('mousedown', handleMouse);
            cell.addEventListener('mouseenter', handleMouse);
            gridEl.appendChild(cell);
            rowDOM.push(cell);
        }
        gridData.push(rowData);
        cellsDOM.push(rowDOM);
    }
    atualizarVisuaisFixos();
}

// --- INTERAÇÃO ---
let isMouseDown = false;
let currentButton = 0;
document.body.onmousedown = (e) => { isMouseDown = true; currentButton = e.button; };
document.body.onmouseup = () => { isMouseDown = false; };

function handleMouse(e) {
    if (e.type === 'contextmenu') e.preventDefault();
    if (e.type === 'mouseenter' && !isMouseDown) return;
    if (isRunning || isFinished) return; 

    const r = parseInt(e.target.dataset.r);
    const c = parseInt(e.target.dataset.c);

    if ((r === startNode.r && c === startNode.c) || (r === endNode.r && c === endNode.c)) return;

    if (currentButton === 0) { 
        gridData[r][c] = 1;
        e.target.classList.add('wall');
    } else if (currentButton === 2) { 
        gridData[r][c] = 0;
        e.target.classList.remove('wall');
    }
}

function atualizarVisuaisFixos() {
    cellsDOM.flat().forEach(c => {
        c.classList.remove('start', 'end');
        c.innerText = ''; 
    });
    cellsDOM[startNode.r][startNode.c].classList.add('start');
    cellsDOM[endNode.r][endNode.c].classList.add('end');
}

// --- LÓGICA GERAL ---
function resetarLogica() {
    clearInterval(timer);
    isRunning = false;
    isFinished = false;
    queue = [];
    visited = new Set();
    parentMap = new Map();
    
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            cellsDOM[r][c].classList.remove(
                'visited', 'path', 'current', 'path-static',
                'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right'
            );
        }
    }
}

function resetarGrid() {
    resetarLogica();
    log("Memória limpa. Desenhe obstáculos e inicie.");
}

function limparParedes() {
    resetarLogica();
    
    for(let r = 0; r < ROWS; r++) {
        for(let c = 0; c < COLS; c++) {
            if (gridData[r][c] === 1) {
                gridData[r][c] = 0;
                cellsDOM[r][c].classList.remove('wall');
            }
        }
    }
    log("Obstáculos limpos!");
}

// --- ALGORITMO BFS ---
function iniciarBFS() {
    if (queue.length === 0 && !isFinished) {
        queue.push({ r: startNode.r, c: startNode.c });
        visited.add(`${startNode.r},${startNode.c}`);
        parentMap.set(`${startNode.r},${startNode.c}`, null);
        isRunning = true;
        log("Zumbi iniciou a busca.");
    } else if (isFinished) {
        resetarLogica();
        iniciarBFS();
        return;
    }

    if(timer) clearInterval(timer);
    
    const delay = parseInt(document.getElementById('speed-range').value);

    if (delay === 0) {
        // MODO INSTANTÂNEO
        while(isRunning && !isFinished) {
            executarPasso();
        }
    } else {
        // MODO ANIMAÇÃO
        timer = setInterval(() => {
            if(!isRunning && !isFinished) clearInterval(timer);
            else if (isFinished) clearInterval(timer);
            else executarPasso();
        }, delay);
    }
}

function iniciarAnimacao() {
    iniciarBFS();
}

function executarPasso() {
    if (queue.length === 0) {
        finalizar(false);
        return;
    }

    const current = queue.shift();
    const currentKey = `${current.r},${current.c}`;
    
    const cell = cellsDOM[current.r][current.c];
    cell.classList.remove('current'); 
    if(currentKey !== `${startNode.r},${startNode.c}`) {
        cell.classList.add('visited');
    }

    if (current.r === endNode.r && current.c === endNode.c) {
        finalizar(true);
        return;
    }

    const directions = [
        {r: -1, c: 0}, {r: 1, c: 0}, {r: 0, c: -1}, {r: 0, c: 1}
    ];

    for (let dir of directions) {
        const nr = current.r + dir.r;
        const nc = current.c + dir.c;
        const nKey = `${nr},${nc}`;

        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            if (gridData[nr][nc] !== 1 && !visited.has(nKey)) {
                visited.add(nKey);
                parentMap.set(nKey, current); 
                queue.push({ r: nr, c: nc });
                
                let arrowClass = '';
                if (dir.r === 1) arrowClass = 'arrow-up';
                else if (dir.r === -1) arrowClass = 'arrow-down';
                else if (dir.c === 1) arrowClass = 'arrow-left';
                else if (dir.c === -1) arrowClass = 'arrow-right';

                const neighborCell = cellsDOM[nr][nc];
                neighborCell.classList.add(arrowClass);
                neighborCell.classList.add('current');
            }
        }
    }
}

function finalizar(sucesso) {
    isRunning = false;
    isFinished = true;
    if(timer) clearInterval(timer);
    
    if (sucesso) {
        log("Villager encontrado!", "log-success");
        const delay = parseInt(document.getElementById('speed-range').value);
        reconstruirCaminhoVisual(delay === 0);
    } else {
        log("Zumbi não achou um caminho.", "log-error");
    }
}

function reconstruirCaminhoVisual(instantaneo) {
    let curr = endNode;
    let caminhoStack = []; 

    caminhoStack.push(curr);
    if (!instantaneo) cellsDOM[curr.r][curr.c].classList.add('path-static');

    const processarNo = () => {
        let key = `${curr.r},${curr.c}`;
        let parent = parentMap.get(key);
        if (!parent) return false; 
        
        curr = parent;
        cellsDOM[curr.r][curr.c].classList.add('path-static');
        caminhoStack.push(curr);

        return true; 
    };

    if (instantaneo) {
        while(processarNo()) {}
        while(caminhoStack.length > 0) {
                const step = caminhoStack.pop();
                const cell = cellsDOM[step.r][step.c];
                cell.classList.remove('path-static');
                cell.classList.add('path');
        }
    } else {
        const intervalBacktrack = setInterval(() => {
            if (!processarNo()) {
                clearInterval(intervalBacktrack);
                setTimeout(() => aplicarPulseInvertido(caminhoStack), 200); 
            }
        }, 50);
    }
}

function aplicarPulseInvertido(pilha) {
    const intervalPulse = setInterval(() => {
        if (pilha.length === 0) {
            clearInterval(intervalPulse);
            return;
        }
        const step = pilha.pop(); 
        const cell = cellsDOM[step.r][step.c];
        cell.classList.remove('path-static');
        cell.classList.add('path');
    }, 100); 
}

function log(msg, className = "") {
    const div = document.createElement('div');
    div.className = 'log-entry ' + className;
    div.innerHTML = `> ${msg}`;
    logEl.prepend(div);
}

init();