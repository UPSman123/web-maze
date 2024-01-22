let canvas = document.getElementById('window');
let ctx = canvas.getContext('2d');
// let oldDims = [window.innerWidth, window.innerHeight];
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.display = "block";
canvas.style.position = "absolute";
canvas.style.top = 0;
canvas.style.right = 0;

const targetCellSize = 4;
const minMargin = 10;
let width = Math.floor((canvas.width - minMargin*2) / targetCellSize);
let height = Math.floor((canvas.height - minMargin*2) / targetCellSize);
let cells = [];
let walls = [];
for (let i = 0; i < width; i++) {
  cells[i] = [];
  walls[i] = [];
  for (let j = 0; j < height; j++) {
    cells[i][j] = 0;
    walls[i][j] = [0, 0];
  }
}
walls[width] = [];
for (let i = 0; i < height; i++) walls[width][i] = [0, 0];
for (let i = 0; i < width; i++)  walls[i][height] = [0, 0];
const halfStride = [
  Math.floor((canvas.width  - 2*minMargin) / width / 2),
  Math.floor((canvas.height - 2*minMargin) / height / 2),
];
const stride = [halfStride[0] * 2, halfStride[1] * 2];
const halfCellSize = [
  Math.floor(stride[0]*0.9 / 2),
  Math.floor(stride[1]*0.9 / 2)
];
const cellSize = [halfCellSize[0] * 2, halfCellSize[1] * 2];
const marginTL = [
  Math.floor((canvas.width - stride[0] * width) / 2),
  Math.floor((canvas.height - stride[1] * height) / 2)
];
const marginBR = [
  Math.ceil((canvas.width - stride[0] * width) / 2),
  Math.ceil((canvas.height - stride[1] * height) / 2)
];
ctx.fillStyle = "#000000";
ctx.fillRect(0, 0, canvas.width, canvas.height);

let maxAge = Math.floor(width * height * 1.0);
let tick = maxAge;
let stack = [[Math.floor(width / 2), Math.floor(height / 2)]];
cells[stack[0][0]][stack[0][1]] = tick;

let drawQueue = [];
let lastDrawQueueLength = 0;

let cellQueue = Array(maxAge);
cellQueue[tick%maxAge] = stack[0];

function isAlive(t) {
  return t > tick - maxAge;
}

function drawInit() {
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      drawQueue.push([i, j, 'dead']);
    }
  }
  drawQueue.push([stack[0][0], stack[0][1], 'stack']);
}

function draw(x, y, type) {
  const drawCell = (cellX, cellY) => {
      const x = Math.floor(cellX + halfStride[0] - halfCellSize[0]);
      const y = Math.floor(cellY + halfStride[1] - halfCellSize[1]);
      ctx.fillRect(x, y, cellSize[0], cellSize[1]);
  };

  const drawVWall = (cellX, cellY) => {
      const x = cellX - halfStride[0] + halfCellSize[0];
      const y = cellY + halfStride[1] - halfCellSize[1];
      const w = stride[0] - cellSize[0];
      ctx.fillRect(x, y, w, cellSize[1]);
  };

  const drawHWall = (cellX, cellY) => {
      const x = cellX + halfStride[0] - halfCellSize[0];
      const y = cellY - halfStride[1] + halfCellSize[1];
      const h = stride[1] - cellSize[1];
      ctx.fillRect(x, y, cellSize[0], h);
  };
  const cellX = x * stride[0] + marginTL[0];
  const cellY = y * stride[1] + marginTL[1];

  // Draw background
  ctx.fillStyle = '#000000';
  drawCell(cellX, cellY);
  drawHWall(cellX, cellY);
  drawVWall(cellX, cellY);
  drawHWall(cellX, cellY + stride[1]);
  drawVWall(cellX + stride[0], cellY);

  // Draw the grid
  ctx.strokeStyle = "#111111";
  ctx.beginPath();
  // Left wall
  ctx.moveTo(marginTL[0] + x * stride[0], marginTL[1] + y * stride[1]);
  ctx.lineTo(marginTL[0] + x * stride[0], marginTL[1] + (y+1) * stride[1]);
  // Right wall
  ctx.moveTo(marginTL[0] + (x+1) * stride[0], marginTL[1] + y * stride[1]);
  ctx.lineTo(marginTL[0] + (x+1) * stride[0], marginTL[1] + (y+1) * stride[1]);
  // Top wall
  ctx.moveTo(marginTL[0] + x     * stride[0], marginTL[1] + y * stride[1]);
  ctx.lineTo(marginTL[0] + (x+1) * stride[0], marginTL[1] + y * stride[1]);
  // Bottom wall
  ctx.moveTo(marginTL[0] + x     * stride[0], marginTL[1] + (y+1) * stride[1]);
  ctx.lineTo(marginTL[0] + (x+1) * stride[0], marginTL[1] + (y+1) * stride[1]);
  ctx.stroke();

  switch (type) {
    case 'dead':
      return;
    case 'alive':
      ctx.fillStyle = '#555555';
      break;
    case 'stack':
      ctx.fillStyle = '#ff5555';
      break;
    default:
      console.error('unrecognized draw request ', type);
  }
  if (!isAlive(cells[x][y]))
    console.error('request to draw dead cell as alive');
  drawCell(cellX, cellY);
  if (isAlive(walls[x][y][0])) drawHWall(cellX, cellY);
  if (isAlive(walls[x][y][1])) drawVWall(cellX, cellY);
  if (isAlive(walls[x][y+1][0])) drawHWall(cellX, cellY+stride[1]);
  if (isAlive(walls[x+1][y][1])) drawVWall(cellX+stride[0], cellY);
}

let doDrawLogging = false;
function doDraw() {
  setTimeout(doUpdate, 0);
  for (let i = 0; i < drawQueue.length; i++) {
    const item = drawQueue[i];
    draw(item[0], item[1], item[2]);
  }
  lastDrawQueueLength = drawQueue.length;
  if (doDrawLogging && lastDrawQueueLength != 0) console.log(lastDrawQueueLength);
  drawQueue = [];
}

function getNeighbors(pos) {
  const x = pos[0];
  const y = pos[1];
  let result = [];
  if (x > 0        && !isAlive(cells[x-1][y])) { result.push([x-1, y, 'l']); }
  if (y > 0        && !isAlive(cells[x][y-1])) { result.push([x, y-1, 'u']); }
  if (x < width-1  && !isAlive(cells[x+1][y])) { result.push([x+1, y, 'r']); }
  if (y < height-1 && !isAlive(cells[x][y+1])) { result.push([x, y+1, 'd']); }
  return result;
}

function update() {
  tick += 1;
  while (true) {
    const cell = cells[stack[0][0]][stack[0][1]];
    if (!isAlive(cell)) stack.shift();
    else break;
  }
  const cur = stack[stack.length-1];
  const neighbors = getNeighbors(cur);
  if (neighbors.length == 0) {
    stack.pop();
    const head = stack[stack.length-1];
    const oldAge = cells[head[0]][head[1]];
    cellQueue[oldAge%maxAge] = undefined;
    cells[head[0]][head[1]] = tick;
    cellQueue[tick%maxAge] = head;
    drawQueue.push([cur[0], cur[1], 'alive']);
    if      (head[0] < cur[0]) walls[cur[0]][cur[1]][1] = tick-1;
    else if (head[1] < cur[1]) walls[cur[0]][cur[1]][0] = tick-1;
    else if (head[0] > cur[0]) walls[head[0]][head[1]][1] = tick-1;
    else if (head[1] > cur[1]) walls[head[0]][head[1]][0] = tick-1;
    else console.error("cells in the stack should not be equal");
  } else {
    const idx = Math.floor(Math.random() * neighbors.length);
    const next = neighbors[idx];
    stack.push([next[0], next[1]]);
    cells[next[0]][next[1]] = tick;
    drawQueue.push([next[0], next[1], 'stack']);
    cellQueue[tick%maxAge] = next;
    const prevTick = cells[cur[0]][cur[1]];
    switch (next[2]) {
      case 'l': walls[cur[0]][cur[1]][1]   = prevTick; break;
      case 'u': walls[cur[0]][cur[1]][0]   = prevTick; break;
      case 'r': walls[cur[0]+1][cur[1]][1] = prevTick; break;
      case 'd': walls[cur[0]][cur[1]+1][0] = prevTick; break;
    }
  }

  // for (let i = 0; i < width; i++) {
  //   for (let j = 0; j < height; j++) {
  //     if (cells[i][j] == tick - maxAge)
  //       drawQueue.push([i, j, 'dead']);
  //   }
  // }
  const deadCell = cellQueue[(tick+1)%maxAge];
  if (deadCell !== undefined) drawQueue.push([deadCell[0], deadCell[1], 'dead']);
  cellQueue[(tick+1)%maxAge] = undefined;
}

let speed = 1;
let bucket = 0;
function doUpdate() {
  requestAnimationFrame(doDraw);
  bucket += speed;
  while (bucket > 1) {
    update();
    bucket -= 1;
  }
}

async function init() {
  drawInit();
  doUpdate();
  requestAnimationFrame(doDraw);
}

init();

