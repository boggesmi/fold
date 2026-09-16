/* Shared by the page, its worker, and the offline validation tools. */
(function (root) {
  'use strict';
  const metas = [
    { difficulty: 'easy', label: 'Easy', par: 3, dots: 2, allowStack: true, size: 6 },
    { difficulty: 'medium', label: 'Medium', par: 4, dots: 3, allowStack: true, size: 6 },
    { difficulty: 'hard', label: 'Hard', par: 5, dots: 4, allowStack: false, size: 6 },
    { difficulty: 'large', label: 'Large', par: 4, dots: 3, allowStack: true, size: 8 },
    { difficulty: 'limited', label: 'Limited Creases', par: 4, dots: 3, allowStack: true, size: 6, creaseCount: 4 },
  ];
  function random(seed) {
    let hash = 2166136261;
    for (const c of seed) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
    return () => {
      let t = (hash += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function foldsFor(size) {
    const folds = [];
    for (let k = 1; k < size; k++) {
      for (const [type, dir] of [['h', 'down'], ['h', 'up'], ['v', 'right'], ['v', 'left']]) {
        folds.push({type, k, dir});
      }
    }
    return folds;
  }
  function isCreaseAllowed(puzzle, crease) {
    return !puzzle.allowedCreases || puzzle.allowedCreases.some(c => c.type === crease.type && c.k === crease.k);
  }
  function shuffle(items, rng) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function applyFold(points, fold, size = 6) {
    let moved = false;
    const next = points.map(({x, y}) => {
      if (fold.type === 'h' && ((fold.dir === 'down' && y <= fold.k) || (fold.dir === 'up' && y > fold.k))) {
        y = 2 * fold.k + 1 - y; moved = true;
      }
      if (fold.type === 'v' && ((fold.dir === 'right' && x <= fold.k) || (fold.dir === 'left' && x > fold.k))) {
        x = 2 * fold.k + 1 - x; moved = true;
      }
      return {x, y};
    });
    return moved && next.every(p => p.x >= 1 && p.y >= 1 && p.x <= size && p.y <= size) ? next : null;
  }
  const key = points => points.map(p => `${p.x},${p.y}`).sort().join('|');
  function validPuzzle(puzzle, meta) {
    if (!puzzle || puzzle.size !== meta.size || !Array.isArray(puzzle.solution) || puzzle.solution.length !== meta.par) return false;
    if (meta.creaseCount) {
      const creases = puzzle.allowedCreases;
      if (!Array.isArray(creases) || creases.length !== meta.creaseCount || !creases.every(c => c && ['h','v'].includes(c.type) && Number.isInteger(c.k) && c.k >= 1 && c.k < meta.size)) return false;
      if (new Set(creases.map(c => `${c.type}${c.k}`)).size !== meta.creaseCount) return false;
      if (!['h','v'].every(type => creases.some(c => c.type === type))) return false;
    } else if (puzzle.allowedCreases != null) return false;
    for (const points of [puzzle.start, puzzle.target]) {
      if (!Array.isArray(points) || points.length !== meta.dots) return false;
      if (!points.every(p => p && Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 1 && p.y >= 1 && p.x <= meta.size && p.y <= meta.size)) return false;
      if (!meta.allowStack && new Set(points.map(p => `${p.x},${p.y}`)).size !== meta.dots) return false;
    }
    if (key(puzzle.start) === key(puzzle.target)) return false;
    let points = puzzle.start;
    for (const fold of puzzle.solution) {
      if (!fold || !Number.isInteger(fold.k) || fold.k < 1 || fold.k >= meta.size || !(fold.type === 'h' ? ['up','down'] : fold.type === 'v' ? ['left','right'] : []).includes(fold.dir)) return false;
      if (!isCreaseAllowed(puzzle, fold)) return false;
      points = applyFold(points, fold, meta.size);
      if (!points) return false;
    }
    return key(points) === key(puzzle.target);
  }
  function generatePuzzle(meta, seed) {
    const rng = random(`${seed}-${meta.difficulty}-v3`);
    const size = meta.size;
    const folds = shuffle(foldsFor(size), rng);
    // Precompute each cell's destination once. Integer states preserve stacked dots.
    const maps = folds.map(fold => Array.from({length: size * size}, (_, cell) => {
      const p = {x: cell % size + 1, y: Math.floor(cell / size) + 1};
      const next = applyFold([p], fold, size);
      if (next) return (next[0].y - 1) * size + next[0].x - 1;
      const moving = fold.type === 'h' ? (fold.dir === 'down' ? p.y <= fold.k : p.y > fold.k) : (fold.dir === 'right' ? p.x <= fold.k : p.x > fold.k);
      return moving ? -1 : cell;
    }));
    const decode = cells => cells.map(cell => ({x: cell % size + 1, y: Math.floor(cell / size) + 1}));
    for (let attempt = 0; attempt < 32; attempt++) {
      const allowedCreases = meta.creaseCount ? ['h','v'].flatMap(type =>
        shuffle(Array.from({length:size - 1}, (_, i) => ({type, k:i + 1})), rng).slice(0, meta.creaseCount / 2)) : null;
      const foldIndices = folds.map((_, i) => i).filter(i => isCreaseAllowed({allowedCreases}, folds[i]));
      const start = [];
      while (start.length < meta.dots) {
        const cell = Math.floor(rng() * size * size);
        if (!start.includes(cell)) start.push(cell);
      }
      start.sort((a,b) => a-b);
      const queue = [{cells: start, depth: 0, parent: -1, fold: -1}];
      const visited = new Set([start.join(',')]);
      let chosen = null, candidateCount = 0;
      // One breadth-first search constructs reachable targets and proves their par.
      // Bound work by state count, not elapsed time, so daily puzzles stay deterministic.
      for (let head = 0; head < queue.length && visited.size < 24000; head++) {
        const node = queue[head];
        if (node.depth >= meta.par) continue;
        for (const f of foldIndices) {
          const cells = node.cells.map(cell => maps[f][cell]);
          if (cells.includes(-1)) continue;
          cells.sort((a,b) => a-b);
          const distinct = new Set(cells).size;
          // Merged dots cannot separate, so they cannot lead to a non-stacked target.
          if ((!meta.allowStack && distinct !== meta.dots) || distinct < 2) continue;
          const stateKey = cells.join(',');
          if (visited.has(stateKey)) continue;
          visited.add(stateKey);
          const nextNode = {cells, depth: node.depth + 1, parent: head, fold: f};
          if (nextNode.depth === meta.par) {
            // Reservoir sampling considers the whole final frontier, avoiding a preference
            // for the first targets discovered. Final states need no queue allocation.
            candidateCount++;
            if (rng() < 1 / candidateCount) chosen = nextNode;
          } else queue.push(nextNode);
        }
      }
      if (!chosen) continue;
      const target = decode(chosen.cells);
      const solution = [folds[chosen.fold]];
      let index = chosen.parent;
      while (queue[index].parent !== -1) {
        solution.push(folds[queue[index].fold]);
        index = queue[index].parent;
      }
      solution.reverse();
      return {id: `${meta.difficulty}-${seed}`, title: `Daily ${meta.label}`, difficulty: meta.difficulty, size, start: decode(start), target, solution, ...(allowedCreases ? {allowedCreases} : {})};
    }
    return null;
  }
  function generateDailySet(date = new Date()) {
    const seed = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Los_Angeles', year:'numeric', month:'2-digit', day:'2-digit'}).format(date);
    return metas.map(meta => generatePuzzle(meta, seed));
  }
  const api = {metas, generatePuzzle, generateDailySet, applyFold, validPuzzle, isCreaseAllowed};
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
    if (require.main === module) console.log(JSON.stringify(generateDailySet(), null, 2));
  } else root.FoldGenerator = api;
})(globalThis);
