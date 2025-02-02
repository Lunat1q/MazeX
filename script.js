window.onload = init;

let rMin = 0;
let rMax = 255;
let gMin = 0;
let gMax = 255;
let bMin = 0;
let bMax = 255;

let SCREEN_WIDTH = 900;
let SCREEN_HEIGHT = 600;
const TARGET_DPS = 40;

const FALLBACK_COLOR = '#ffffff';

const FRAMES_TO_RECALC = 1;
var context;

let animate = true;
let fpsFilterStrength = 20;
let frameTime = 0;
let lastLoop;
let thisLoop;
let trailIntensity = 0.07;
let intervalId;
let isMobileRes = false;
let updateStats = false;
let baseSpeed = 1;

function init() {
    canvas = document.getElementById('main');
    isMobileRes = isMobile();

    if (canvas && canvas.getContext) {
        context = canvas.getContext("2d", { alpha: false });

        if (!isMobileRes) {
            // Register event listeners
            window.addEventListener('resize', windowResizeHandler, false);
            document.addEventListener('keypress', keyPressHandler, false);
        }
        else {
            document.addEventListener('touchend', detectDoubleTap(500), { passive: false });
            document.addEventListener('doubletap', doubleTapHandler);
        }
        windowResizeHandler();
        initField();
        setInterval(loop, 1000 / TARGET_DPS);
    }

    //document.getElementById("help").style.display = !isMobileRes ? "block" : "none";
    //document.getElementById("help-mobile").style.display = isMobileRes ? "block" : "none";

    document.getElementById("help").style.display = "none";
    document.getElementById("help-mobile").style.display = "none";

    startFpsUpdate();
}

document.oncontextmenu = function (e) {
    if (!isMobile()) {
        stopEvent(e);
        toggleHelp();
    }
}

function mousedownfunc(func) {
    intervalId = setInterval(func, 50);
}

function mouseupfunc() {
    clearInterval(intervalId);
}

function doubleTapHandler(e) {
    stopEvent(e);
    toggleHelp();
}

function detectDoubleTap(doubleTapMs) {
    let timeout, lastTap = 0
    return function detectDoubleTap(event) {
        const currentTime = new Date().getTime()
        const tapLength = currentTime - lastTap
        if (0 < tapLength && tapLength < doubleTapMs) {
            event.preventDefault()
            const doubleTap = new CustomEvent("doubletap", {
                bubbles: true,
                detail: event
            })
            event.target.dispatchEvent(doubleTap)
        }
        lastTap = currentTime
    }
}

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function stopEvent(event) {
    if (event.preventDefault != undefined)
        event.preventDefault();
    if (event.stopPropagation != undefined)
        event.stopPropagation();
}

function toggleHelp() {
    var x = document.getElementById(isMobileRes ? "help-mobile" : "help");
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}

function toColorHex(digit, len = 2) {
    let ret = digit.toString(16);
    while (ret.length < len) {
        ret = '0' + ret;
    }
    return ret;
}

function gerRandomColor() {
    let rDist = rMax - rMin;
    let gDist = gMax - gMin;
    let bDist = bMax - bMin;

    if (rDist == 0 && gDist == 0 && bDist == 0) {
        return FALLBACK_COLOR;
    }
    else {
        let r = (Math.random() * rDist + rMin) | 0;
        let g = (Math.random() * gDist + gMin) | 0;
        let b = (Math.random() * bDist + bMin) | 0;
        return '#' + toColorHex(r) + toColorHex(g) + toColorHex(b);
    }
}

function getHexColorFromRgb(r, g, b) { return '#' + toColorHex(r) + toColorHex(g) + toColorHex(b); }


function loop() {
    // Fade out the lines slowly by drawing a rectangle over the entire canvas
    context.fillStyle = 'rgba(0,0,0,' + trailIntensity + ')';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    calcFps();
    logic();
}

function calcFps() {
    if (updateStats) {
        var thisFrameTime = (thisLoop = new Date) - lastLoop;
        frameTime += (thisFrameTime - frameTime) / fpsFilterStrength;
        lastLoop = thisLoop;
    }
}

function startFpsUpdate() {
    var fpsOut = document.getElementById('fps');
    setInterval(
        function () {
            if (updateStats) {
                fpsOut.innerHTML = (1000 / frameTime).toFixed(1);
            }
        },
        3000);
}

// Mouse and hotkeys handling
function documentMouseMoveHandler(event) {
    mouseX = event.clientX - (window.innerWidth - SCREEN_WIDTH) * .5;
    mouseY = event.clientY - (window.innerHeight - SCREEN_HEIGHT) * .5;
}

function documentMouseDownHandler(event) {
    mouseIsDown = true;
    mouseDownX = mouseX;
    mouseDownY = mouseY;
}

function documentMouseUpHandler(event) {
    mouseIsDown = false;
    selectedFound = false;
}

function windowResizeHandler() {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;

    canvas.style.position = 'absolute';
    canvas.style.left = (window.innerWidth - SCREEN_WIDTH) * .5 + 'px';
    canvas.style.top = (window.innerHeight - SCREEN_HEIGHT) * .5 + 'px';
}

function toggleStatsWindow() {
    var x = document.getElementById("stats");
    if (x.style.display === "none") {
        x.style.display = "block";
        updateStats = true;
        lastLoop = new Date;
        thisLoop = null;
        frameTime = 0;
        refreshLengthStat();
    } else {
        x.style.display = "none";
        updateStats = false;
    }
}

function toggleAnimation() {
    animate = !animate;
}

function increaseSpeed() {
    baseSpeed *= 1.1;
    adjustSpeed(1.1);
}

function decreaseSpeed() {
    baseSpeed *= 1 / 1.1;
    adjustSpeed(1 / 1.1);
}

function increaseTrail() {
    trailIntensity *= 1.1;
    if (trailIntensity > 1) {
        trailIntensity = 1;
    }
}

function decreaseTrail() {
    trailIntensity *= 1 / 1.1;
    if (trailIntensity < 0.005) {
        trailIntensity = 0.005;
    }
}

function increaseTrailLength() {
    trailLengthBase *= 1.1;
}

function decreaseTrailLength() {
    trailLengthBase /= 1.1;
}

function increaseSpeed() {
    baseSpeed *= 1.1;
}

function decreaseSpeed() {
    baseSpeed *= 1 / 1.1;
}

function increaseCellSize() {
    cellSize += 5;
    if (cellSize > 300)
    {
        cellSize = 300;
    }
    resetMaze();
}

function decreaseCellSize() {
    cellSize -= 5;
    if (cellSize < 15)
    {
        cellSize = 15;
    }
    resetMaze();
}

function keyPressHandler(e) {

    switch (e.code) {
        case 'KeyS':
            toggleStatsWindow();
            break;
        case 'KeyA':
            toggleAnimation();
            break;
        case 'BracketRight':
            decreaseTrail();
            break;
        case 'BracketLeft':
            increaseTrail();
            break;
        case 'Equal':
            increaseSpeed();
            break;
        case 'Minus':
            decreaseSpeed();
        case 'KeyO':
            increaseTrailLength();
            break;
        case 'KeyP':
            decreaseTrailLength();
            break;
        case 'KeyK':
            increaseCellSize();
            break;
        case 'KeyL':
            decreaseCellSize();
            break;
        default:
            break;
    }
}


// Main logic

let cells;
let cellSize = 20;
let prevCellTime = 0;
let mazeCellsPerSecond = 15;
let path;
let lengthElement;
let visitedCount = 0;
let trailLengthBase = 1;
let defaultTrailTime = 10000;
const bordereWidth = 2;
let solveMode = false;
let cellsX;
let cellsY;
let firstCell;
let finishCell;
let mazeSolved = false;
let solvedAt;

function initField() {
    cells = [];
    path = [];
    cellsX = Math.floor(SCREEN_WIDTH / cellSize);
    cellsY = Math.floor(SCREEN_HEIGHT / cellSize);

    for (var i = 0; i < cellsX; i++) {
        var newColumn = [];
        for (var j = 0; j < cellsY; j++) {
            var cell = {
                x: i,
                y: j,
                top: true,
                right: true,
                bottom: true,
                left: true,
                visited: false,
                visitTime: 0,
                distance: -1,
                visitedSolving: false
            }
            newColumn.push(cell);
        }
        cells.push(newColumn)
    }
    firstCell = getStartingCell();
    finishCell = firstCell;
    firstCell.distance = 1;
    visitedCount = 1;
    path.push(firstCell);
    refreshSize();
}

function getStartingCell() {
    var midCell = cells[Math.floor(cellsX / 2)][Math.floor(cellsY / 2)];
    midCell.visited = true;
    midCell.visitTime = new Date;
    return midCell;
}

function logic() {
    drawField();
    if (solveMode) {
        if (!mazeSolved)
        {
            solveMaze();
        }
        else
        {
            showSolvedPath();
        }
    }
    else {
        stepMaze();
    }
}

function showSolvedPath()
{
    var now = new Date;
    if (now - solvedAt < 10000)
    {
        for (var i = 0; i < path.length; i++)
        {
            path[i].visitedSolving = true;
            path[i].visitTime = new Date;
        }
    }
    else
    {
        resetMaze();
    }
}

function resetMaze()
{
    solveMode = false;
    mazeSolved = false;
    firstCell = null;
    finishCell = null;
    initField();
}

function solveMaze() {
    var now = new Date;
    if (now - prevCellTime > 1000 / (mazeCellsPerSecond * baseSpeed)) {
        prevCellTime = now;
        var lastCell = path.at(-1);
        var possibleMoves = getPossiblePathFromCell(lastCell);
        lastCell.active = false;
        if (possibleMoves.length == 0) {
            lastCell = path.at(-2)
            if (lastCell) {
                lastCell.visitTime = new Date;
                lastCell.active = true;
            }
            path.pop();
            return;
        }

        let nextMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        path.push(nextMove);
        nextMove.visitedSolving = true;
        nextMove.visitTime = new Date;
        nextMove.active = true;

        if (nextMove == finishCell)
        {
            mazeSolved = true;
            solvedAt = new Date;
        }
    }
}

function drawFinishCell() {
    const chestWidth = cellSize * 0.6;
    const chestHeight = cellSize * 0.3;
    const chestX = finishCell.x * cellSize + (cellSize - chestWidth) / 2;
    const chestY = finishCell.y * cellSize + (cellSize - chestHeight) / 2 + cellSize * 0.05;

    // ** Draw Chest Base **
    context.fillStyle = "saddlebrown"; // Wooden color
    context.fillRect(chestX, chestY, chestWidth, chestHeight);

    // ** Chest Outline **
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.strokeRect(chestX, chestY, chestWidth, chestHeight);

    // ** Plank Divisions **
    context.strokeStyle = "darkslategray";
    for (let i = 1; i <= 4; i++) {
        let plankX = chestX + (i * chestWidth) / 5;
        context.beginPath();
        context.moveTo(plankX, chestY);
        context.lineTo(plankX, chestY + chestHeight);
        context.stroke();
    }

    // ** Less Rounded Lid **
    const lidHeight = chestHeight * 0.2;
    context.fillStyle = "peru"; // Lighter brown
    context.fillRect(chestX, chestY - lidHeight, chestWidth, lidHeight * 0.9); // Less round

    // ** Lid Outline **
    context.strokeRect(chestX, chestY - lidHeight, chestWidth, lidHeight * 0.9);

    // ** Metal Frame on Lid **
    context.fillStyle = "gray";
    context.fillRect(chestX, chestY - lidHeight * 0.1, chestWidth, lidHeight * 0.12);
    context.strokeRect(chestX, chestY - lidHeight * 0.1, chestWidth, lidHeight * 0.12);

    // ** Metal Bands on Chest **
    const bandHeight = chestHeight * 0.15;
    context.fillStyle = "darkgray";
    context.fillRect(chestX, chestY + chestHeight * 0.4, chestWidth, bandHeight);
    context.strokeRect(chestX, chestY + chestHeight * 0.4, chestWidth, bandHeight);

    // ** Golden Lock **
    let lockWidth = chestWidth * 0.12;
    let lockHeight = chestHeight * 0.3;
    let lockX = chestX + (chestWidth - lockWidth) / 2;
    let lockY = chestY + chestHeight * 0.5;

    context.fillStyle = "gold";
    context.fillRect(lockX, lockY, lockWidth, lockHeight);
    context.strokeRect(lockX, lockY, lockWidth, lockHeight);

    // ** Keyhole **
    context.beginPath();
    context.arc(lockX + lockWidth / 2, lockY + lockHeight * 0.3, lockWidth * 0.15, 0, Math.PI * 2);
    context.fillStyle = "black";
    context.fill();
    context.stroke();

    context.beginPath();
    context.moveTo(lockX + lockWidth / 2, lockY + lockHeight * 0.3);
    context.lineTo(lockX + lockWidth / 2, lockY + lockHeight * 0.75);
    context.stroke();
}

function drawEntraceCell() {
    if ((new Date - firstCell.visitTime) > defaultTrailTime * trailLengthBase)
    {
        return;
    }
    const doorWidth = Math.max(4, cellSize * 0.6);  
    const doorHeight = Math.max(6, cellSize * 0.8);  
    const doorX = firstCell.x * cellSize + (cellSize - doorWidth) / 2; 
    const doorY = firstCell.y * cellSize + (cellSize - doorHeight) / 2;

    // ** Door Base (Dark Metal) **
    context.fillStyle = "dimgray"; 
    context.fillRect(doorX, doorY, doorWidth, doorHeight);

    // ** Door Outline **
    context.strokeStyle = "dimgray";
    context.lineWidth = Math.max(1, cellSize * 0.1);
    context.strokeRect(doorX, doorY, doorWidth, doorHeight);

    // ** Vertical Metal Bars **
    context.strokeStyle = "black";
    context.lineWidth = Math.max(1, cellSize * 0.05);
    let numBars = 2; // Only 2 bars for clarity at small sizes
    let barSpacing = doorWidth / (numBars + 1);
    for (let i = 1; i <= numBars; i++) {
        let barX = doorX + i * barSpacing;
        context.beginPath();
        context.moveTo(barX, doorY);
        context.lineTo(barX, doorY + doorHeight);
        context.stroke();
    }

    // ** Horizontal Reinforcement Bars **
    let barY = doorY + doorHeight * 0.5;
    context.beginPath();
    context.moveTo(doorX, barY);
    context.lineTo(doorX + doorWidth, barY);
    context.stroke();

    // ** Door Handle  **
    const handleSize = Math.max(1, cellSize * 0.1);
    context.fillStyle = "gold";
    context.beginPath();
    context.arc(doorX + doorWidth * 0.75, doorY + doorHeight * 0.5, handleSize, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
}

function prepareForSolving() {
    solveMode = true;
    path.push(firstCell);
    firstCell.visitedSolving = true;
    firstCell.visitTime = new Date;
}

function stepMaze() {
    var now = new Date;
    if (now - prevCellTime > 1000 / (mazeCellsPerSecond * baseSpeed)) {
        prevCellTime = now;
        if (path.length == 0) {
            prepareForSolving();
            return;
        }
        var lastCell = path.at(-1);
        var nearbyNotVisited = getNonVisitedAroundCell(lastCell);
        lastCell.active = false;
        if (nearbyNotVisited.length == 0) {
            lastCell = path.at(-2)
            if (lastCell) {
                lastCell.visitTime = new Date;
                lastCell.active = true;
            }
            path.pop();
            return;
        }

        let nextMove = nearbyNotVisited[Math.floor(Math.random() * nearbyNotVisited.length)];
        path.push(nextMove);
        nextMove.visited = true;
        nextMove.visitTime = new Date;
        nextMove.distance = lastCell.distance + 1;
        nextMove.active = true;
        if (nextMove.distance > finishCell.distance) {
            finishCell = nextMove;
        }
        visitedCount++;
        switch (nextMove.from) {
            case "l": // Coming from the left
                nextMove.left = false;
                lastCell.right = false;
                break;

            case "r": // Coming from the right
                nextMove.right = false;
                lastCell.left = false;
                break;

            case "t": // Coming from the top
                nextMove.top = false;
                lastCell.bottom = false;
                break;

            case "b": // Coming from the bottom
                nextMove.bottom = false;
                lastCell.top = false;
                break;
        }
        refreshLengthStat();
    }
}

function refreshLengthStat() {
    if (!lengthElement) {
        lengthElement = document.getElementById("numberOfVisited");
    }
    if (updateStats) {
        lengthElement.innerText = visitedCount;
    }
}

function refreshSize() {
    let sizeElement = document.getElementById("size");
    sizeElement.innerText = "W: " + cellsX + " H: " + cellsY;
}

function getPossiblePathFromCell(cell) {
    var ret = [];
    // No right wall in the cell
    if (!cell.right) {
        let rightCell = cells[cell.x + 1][cell.y];
        if (!rightCell.visitedSolving) {
            ret.push(rightCell);
        }
    }

    // No left wall in the cell
    if (!cell.left) {
        let leftCell = cells[cell.x - 1][cell.y];
        if (!leftCell.visitedSolving) {
            ret.push(leftCell);
        }
    }

    // No top wall in the cell
    if (!cell.top) {
        let topCell = cells[cell.x][cell.y - 1];
        if (!topCell.visitedSolving) {
            ret.push(topCell);
        }
    }

    // No bottom wall in the cell
    if (!cell.bottom) {
        let bottomCell = cells[cell.x][cell.y + 1];
        if (!bottomCell.visitedSolving) {
            ret.push(bottomCell);
        }
    }

    return ret;
}

function getNonVisitedAroundCell(cell) {
    var ret = [];
    // Right cell
    if (cell.x < cellsX - 1) {
        let rightCell = cells[cell.x + 1][cell.y];
        if (!rightCell.visited) {
            rightCell.from = "l";
            ret.push(rightCell);
        }
    }

    // Left cell
    if (cell.x > 0) {
        let leftCell = cells[cell.x - 1][cell.y];
        if (!leftCell.visited) {
            leftCell.from = "r";
            ret.push(leftCell);
        }
    }

    // Bottom cell
    if (cell.y < cellsY - 1) {
        let bottomCell = cells[cell.x][cell.y + 1];
        if (!bottomCell.visited) {
            bottomCell.from = "t";
            ret.push(bottomCell);
        }
    }

    // Top cell
    if (cell.y > 0) {
        let topCell = cells[cell.x][cell.y - 1];
        if (!topCell.visited) {
            topCell.from = "b";
            ret.push(topCell);
        }
    }
    return ret;
}

function drawField() {
    var now = new Date;
    for (var i = 0; i < cellsX; i++) {
        var column = cells[i];
        for (var j = 0; j < cellsY; j++) {
            var cell = column[j];
            if ((cell.visited || cell.visitedSolving) && (now - cell.visitTime) < defaultTrailTime * trailLengthBase) {
                drawCell(cell);
            }
        }
    }
    drawEntraceCell();
    if (solveMode) {
        drawFinishCell();
    }
    if (mazeSolved)
    {
        drawPath();
    }
}

function drawPath() {
    if (path.length < 2) return; // No path to draw

    context.strokeStyle = "gold"; // Path color
    context.lineWidth = Math.max(2, cellSize * 0.2); // Adaptive line thickness
    context.lineCap = "round";

    context.beginPath();
    let startX = path[0].x * cellSize + cellSize / 2;
    let startY = path[0].y * cellSize + cellSize / 2;
    context.moveTo(startX, startY);

    // Draw smooth path from start to finish
    for (let i = 1; i < path.length; i++) {
        let cell = path[i];
        let cellX = cell.x * cellSize + cellSize / 2;
        let cellY = cell.y * cellSize + cellSize / 2;
        context.lineTo(cellX, cellY);
    }
    
    context.stroke();
}

function drawCell(cell) {
    context.strokeStyle = 'green';
    context.lineWidth = bordereWidth;
    let x = cell.x * cellSize;
    let y = cell.y * cellSize;

    if (cell.active) {
        context.fillStyle = "#1F51FF";
        context.fillRect(x, y, cellSize, cellSize);
    }
    else {
        context.beginPath();
        if (cell.top) {
            context.moveTo(x, y);
            context.lineTo(x + cellSize, y);
        }

        if (cell.right) {
            context.moveTo(x + cellSize, y);
            context.lineTo(x + cellSize, y + cellSize);
        }

        if (cell.bottom) {
            context.moveTo(x + cellSize, y + cellSize);
            context.lineTo(x, y + cellSize);
        }

        if (cell.left) {
            context.moveTo(x, y + cellSize);
            context.lineTo(x, y);
        }
    }

    context.stroke();
}