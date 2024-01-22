let canvas = document.getElementById('window');
let ctx = canvas.getContext('2d');
let oldDims = [window.innerWidth, window.innerHeight];
canvas.width = oldDims[0];
canvas.height = oldDims[1];
canvas.style.display = "block";
canvas.style.position = "absolute";
canvas.style.top = 0;
canvas.style.right = 0;

const targetCellSize = 30;
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
let maxAge = Math.floor(width * height * 1.0);
let tick = maxAge;
let stack = [[Math.floor(width / 2), Math.floor(height / 2)]];
cells[stack[0][0]][stack[0][1]] = tick;

function isAlive(t) {
  return t > tick - maxAge;
}

function doDraw() {
  if (window.innerWidth != oldDims[0]) {
    oldDims[0] = window.innerWidth;
    canvas.width = oldDims[0];
  }
  if (window.innerHeight != oldDims[1]) {
    oldDims[1] = window.innerHeight;
    canvas.height = oldDims[1];
  }
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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

  // Draw the grid
  ctx.strokeStyle = "#111111";
  ctx.beginPath();
  for (let i = 0; i <= width; i++) {
    ctx.moveTo(marginTL[0] + i * stride[0], marginTL[1]);
    ctx.lineTo(marginBR[0] + i * stride[0], marginBR[1] + height * stride[1]);
  }
  for (let i = 0; i <= height; i++) {
    ctx.moveTo(marginTL[0], marginTL[1] + i * stride[1]);
    ctx.lineTo(marginBR[0] + width * stride[0], marginBR[1] + i * stride[1]);
  }
  ctx.stroke();

  const drawCell = (cellX, cellY) => {
      const x = Math.floor(cellX + halfStride[0] - halfCellSize[0]);
      const y = Math.floor(cellY + halfStride[1] - halfCellSize[1]);
      ctx.fillRect(x, y, cellSize[0], cellSize[1]);
  };

  const drawVWall = (cellX, cellY) => {
      const x = cellX + halfStride[0] - halfCellSize[0];
      const y = cellY - halfStride[1] + halfCellSize[1];
      const h = stride[1] - cellSize[1] + 1;
      ctx.fillRect(x, y, cellSize[0], h);
  };

  const drawHWall = (cellX, cellY) => {
      const x = cellX - halfStride[0] + halfCellSize[0];
      const y = cellY + halfStride[1] - halfCellSize[1];
      const w = stride[0] - cellSize[0];
      ctx.fillRect(x, y, w, cellSize[1]);
  };

  // fill the cells
  ctx.fillStyle = '#555555';
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const cellX = i * stride[0] + marginTL[0];
      const cellY = j * stride[1] + marginTL[1];
      if (isAlive(cells[i][j])) { drawCell(cellX, cellY); }
      const wallPair = walls[i][j];
      if (isAlive(wallPair[0])) { drawVWall(cellX, cellY); }
      if (isAlive(wallPair[1])) { drawHWall(cellX, cellY); }
    }
  }

  // draw the stack
  ctx.fillStyle = '#ff5555';
  for (let i = 0; i < stack.length; i++) {
    const cur = stack[i];
    const cellX = cur[0] * stride[0] + marginTL[0];
    const cellY = cur[1] * stride[1] + marginTL[1];
    if (isAlive(cells[cur[0]][cur[1]])) drawCell(cellX, cellY);
    if (i == stack.length - 1) break;
    const next = stack[i+1];
    if      (next[0] < cur[0]) drawHWall(cellX, cellY);
    else if (next[1] < cur[1]) drawVWall(cellX, cellY);
    else if (next[0] > cur[0]) drawHWall(cellX + stride[0], cellY);
    else if (next[1] > cur[1]) drawVWall(cellX, cellY + stride[1]);
  }

  requestAnimationFrame(doDraw);
  setTimeout(doUpdate, 0);
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
    cells[head[0]][head[1]] = tick;
    if      (head[0] < cur[0]) walls[cur[0]][cur[1]][1] = tick;
    else if (head[1] < cur[1]) walls[cur[0]][cur[1]][0] = tick;
    else if (head[0] > cur[0]) walls[head[0]][head[1]][1] = tick;
    else if (head[1] > cur[1]) walls[head[0]][head[1]][0] = tick;
    else console.error("cells in the stack should not be equal");
  } else {
    const idx = Math.floor(Math.random() * neighbors.length);
    const next = neighbors[idx];
    stack.push([next[0], next[1]]);
    cells[next[0]][next[1]] = tick;
    const prevTick = cells[cur[0]][cur[1]];
    switch (next[2]) {
      case 'l': walls[cur[0]][cur[1]][1]   = prevTick; break;
      case 'u': walls[cur[0]][cur[1]][0]   = prevTick; break;
      case 'r': walls[cur[0]+1][cur[1]][1] = prevTick; break;
      case 'd': walls[cur[0]][cur[1]+1][0] = prevTick; break;
    }
  }

  // if (stack.length > 0) { setTimeout(update, 0); }
}

let speed = 10;
let bucket = 0;
function doUpdate() {
  bucket += speed;
  while (bucket > 1) {
    update();
    bucket -= 1;
  }
}

doUpdate();

requestAnimationFrame(doDraw);

