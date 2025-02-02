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
let trailIntensity = 0.1;
let intervalId;
let isMobileRes = false;
let updateStats = false;

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
        refreshPointsStat();
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
        default:
            break;
    }
}


// Main logic

let cells = [];
const cellSize = 10;
let prevCellTime = 0;
let mazeCellsPerSecond = 5;
let path;

function initField()
{
    path = [];
    var cellsX = SCREEN_WIDTH / cellSize;
    var cellsY = SCREEN_HEIGHT / cellSize;

    for (var i = 0; i < cellsX; i++)
    {
        var newColumn = [];
        for(var j = 0; j < cellsY; j++)
        {
            var cell = {
                x: i,
                y: j,
                top: true,
                right: true,
                bottom: true,
                left: true,
                visited: false
            }
            newColumn.push(cell);
        }
        cells.push(newColumn)
    }
    var midCell = cells[Math.floor(cellsX / 2)][Math.floor(cellsY / 2)];
    midCell.visited = true;
    path.push(midCell);
}

function logic()
{
    drawField();
    stepMaze();
}

function stepMaze()
{
    var now = new Date;
    if (now - prevCellTime > 1000 / mazeCellsPerSecond)
    {
        prevCellTime = now;
        var lastCell = path.at(-1);

        var nearbyNotVisited = getNonVisitedAroundCell(lastCell);

        if (nearbyNotVisited.length == 0)
        {
            path.pop();
            return;
        }

        let nextMove = nearbyNotVisited[Math.floor(Math.random() * nearbyNotVisited.length)];
        path.push(nextMove);
        nextMove.visited = true;
        switch (nextMove.from)
        {
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
    }
}

function getNonVisitedAroundCell(cell)
{
    var ret = [];
    // Right cell
    if (cell.x < cells.length - 1) {
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
    if (cell.y < cells[0].length - 1) {
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

function drawField()
{
    for (var i = 0; i < cells.length; i++)
    {
        var column = cells[i];
        for(var j = 0; j < column.length; j++)
        {
            var cell = column[j];
            if (cell.visited)
            {
                drawCell(cell);
            }
        }
    }
}

function drawCell(cell)
{
    //console.log(cell);
    //context.strokeStyle = 'red';
    //context.lineWidth = 2;
    //context.strokeRect(cell.x * 10, cell.y * 10, cellSize, cellSize);

    context.strokeStyle = 'green';
    context.lineWidth = 2;
    context.beginPath();
    let x = cell.x * cellSize;
    let y = cell.y * cellSize;
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

    context.stroke();
}