const GRID_SIZE = 6;

function getDateKeyPST(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(date);
}

function hashStringToSeed(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomChoice(rng, items) {
  return items[randomInt(rng, 0, items.length - 1)];
}

function pointsKey(points) {
  return points
    .map((p) => `${p.x},${p.y}`)
    .sort()
    .join("|");
}

function distinctCount(points) {
  return new Set(points.map((p) => `${p.x},${p.y}`)).size;
}

function reflectPoint(p, crease) {
  if (crease.type === "h") {
    if (crease.dir === "down" && p.y <= crease.k) {
      return { x: p.x, y: 2 * crease.k + 1 - p.y };
    }
    if (crease.dir === "up" && p.y >= crease.k + 1) {
      return { x: p.x, y: 2 * crease.k + 1 - p.y };
    }
    return p;
  }

  if (crease.dir === "right" && p.x <= crease.k) {
    return { x: 2 * crease.k + 1 - p.x, y: p.y };
  }
  if (crease.dir === "left" && p.x >= crease.k + 1) {
    return { x: 2 * crease.k + 1 - p.x, y: p.y };
  }
  return p;
}

function applyFold(points, crease) {
  let moved = false;
  const next = points.map((p) => {
    const rp = reflectPoint(p, crease);
    if (rp.x !== p.x || rp.y !== p.y) moved = true;
    if (rp.x < 1 || rp.x > GRID_SIZE || rp.y < 1 || rp.y > GRID_SIZE) return null;
    return rp;
  });
  if (!moved) return null;
  if (next.some((p) => p === null)) return null;
  return next;
}

function allFolds() {
  const folds = [];
  for (let k = 1; k < GRID_SIZE; k += 1) {
    folds.push({ type: "h", k, dir: "down" });
    folds.push({ type: "h", k, dir: "up" });
    folds.push({ type: "v", k, dir: "right" });
    folds.push({ type: "v", k, dir: "left" });
  }
  return folds;
}

function findShortestPath(start, target, maxDepth) {
  const targetKey = pointsKey(target);
  const startKey = pointsKey(start);
  if (startKey === targetKey) return [];

  const folds = allFolds();
  const visited = new Set([startKey]);
  const queue = [{ points: start, path: [] }];
  let idx = 0;

  while (idx < queue.length) {
    const { points, path } = queue[idx];
    idx += 1;
    if (path.length >= maxDepth) continue;

    for (const fold of folds) {
      const next = applyFold(points, fold);
      if (!next) continue;
      const key = pointsKey(next);
      if (visited.has(key)) continue;
      const nextPath = [...path, fold];
      if (key === targetKey) return nextPath;
      visited.add(key);
      queue.push({ points: next, path: nextPath });
    }
  }
  return null;
}

function randomPoints(rng, count) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    points.push({ x: randomInt(rng, 1, GRID_SIZE), y: randomInt(rng, 1, GRID_SIZE) });
  }
  return points;
}

function randomPointsUnique(rng, count) {
  const points = [];
  const used = new Set();
  while (points.length < count) {
    const p = { x: randomInt(rng, 1, GRID_SIZE), y: randomInt(rng, 1, GRID_SIZE) };
    const key = `${p.x},${p.y}`;
    if (used.has(key)) continue;
    used.add(key);
    points.push(p);
  }
  return points;
}

function randomPointsForMeta(rng, meta) {
  return meta.allowStack
    ? randomPoints(rng, meta.dots)
    : randomPointsUnique(rng, meta.dots);
}

function themeForDate(dateKey) {
  const themes = [
    "Headlines",
    "Ticker",
    "Dateline",
    "Byline",
    "Front Page",
    "Crossword",
    "Edition",
    "Press",
    "Column",
    "Deadline",
    "Dispatch",
    "Scoop",
    "Journal",
    "Gazette",
    "Courier",
    "Ledger",
    "Bulletin",
    "Notebook",
    "Newsroom",
    "Spotlight",
  ];
  const rng = mulberry32(hashStringToSeed(`theme-${dateKey}`));
  return randomChoice(rng, themes);
}

function formatDailyTitle(theme, label) {
  return `${theme} ${label}`;
}

function generatePuzzle(rng, meta, dateKey) {
  const folds = allFolds();
  const maxAttempts = meta.maxAttempts || 1600;
  const altAttempts = meta.altAttempts || 0;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const target = randomPointsForMeta(rng, meta);
    const targetDistinct = distinctCount(target);
    if (!meta.allowStack && targetDistinct !== meta.dots) continue;
    if (meta.allowStack && meta.dots > 1 && targetDistinct < 2) continue;
    let start = target.map((p) => ({ ...p }));

    for (let i = 0; i < meta.par; i += 1) {
      const fold = folds[randomInt(rng, 0, folds.length - 1)];
      const next = applyFold(start, fold);
      if (!next) {
        i -= 1;
        continue;
      }
      start = next;
    }

    const startDistinct = distinctCount(start);
    if (pointsKey(start) === pointsKey(target)) continue;
    if (!meta.allowStack && startDistinct !== meta.dots) continue;
    if (meta.allowStack && meta.dots > 1 && startDistinct < 2) continue;

    const solution = findShortestPath(start, target, meta.par);
    if (solution && solution.length === meta.par) {
      const theme = themeForDate(dateKey);
      return {
        id: `${meta.difficulty}-${dateKey}`,
        title: formatDailyTitle(theme, meta.label),
        difficulty: meta.difficulty,
        start,
        target,
        solution,
      };
    }
  }

  for (let attempt = 0; attempt < altAttempts; attempt += 1) {
    const target = randomPointsForMeta(rng, meta);
    const start = randomPointsForMeta(rng, meta);
    if (pointsKey(start) === pointsKey(target)) continue;
    const targetDistinct = distinctCount(target);
    const startDistinct = distinctCount(start);
    if (!meta.allowStack) {
      if (targetDistinct !== meta.dots || startDistinct !== meta.dots) continue;
    } else if (meta.dots > 1 && (targetDistinct < 2 || startDistinct < 2)) {
      continue;
    }

    const solution = findShortestPath(start, target, meta.par);
    if (solution && solution.length === meta.par) {
      const theme = themeForDate(dateKey);
      return {
        id: `${meta.difficulty}-${dateKey}`,
        title: formatDailyTitle(theme, meta.label),
        difficulty: meta.difficulty,
        start,
        target,
        solution,
      };
    }
  }
  return null;
}

function puzzleMatchesMeta(puzzle, meta) {
  if (!puzzle) return false;
  if (puzzle.solution.length !== meta.par) return false;
  if (puzzle.start.length !== meta.dots || puzzle.target.length !== meta.dots) return false;
  if (!meta.allowStack) {
    if (distinctCount(puzzle.start) !== meta.dots) return false;
    if (distinctCount(puzzle.target) !== meta.dots) return false;
  }
  return true;
}

function generateDailySet(date = new Date()) {
  const dateKey = getDateKeyPST(date);
  const rng = mulberry32(hashStringToSeed(dateKey));
  const metas = [
    { difficulty: "easy", label: "Easy", par: 3, dots: 2, allowStack: true },
    { difficulty: "medium", label: "Medium", par: 4, dots: 3, allowStack: true },
    {
      difficulty: "hard",
      label: "Hard",
      par: 5,
      dots: 4,
      allowStack: false,
      maxAttempts: 8000,
      altAttempts: 4000,
    },
  ];

  return metas.map((meta) => {
    const tries = 10;
    for (let i = 0; i < tries; i += 1) {
      const localSeed = hashStringToSeed(`${dateKey}-${meta.difficulty}-${i}`);
      const localRng = mulberry32(localSeed);
      const puzzle = generatePuzzle(localRng, meta, dateKey);
      if (puzzleMatchesMeta(puzzle, meta)) return puzzle;
    }
    const fallbackPuzzle = generatePuzzle(rng, meta, dateKey);
    return puzzleMatchesMeta(fallbackPuzzle, meta) ? fallbackPuzzle : null;
  });
}

if (require.main === module) {
  const daily = generateDailySet();
  console.log(JSON.stringify(daily, null, 2));
}

module.exports = {
  generateDailySet,
  generatePuzzle,
  findShortestPath,
  applyFold,
};
