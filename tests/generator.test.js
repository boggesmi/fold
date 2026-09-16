const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const generator = require('../level_generator.js');

// Independent coordinate implementation: do not reuse the optimized transition maps.
function fold(points, crease, size) {
  const next = points.map(([x,y]) => {
    if (crease.type === 'h' && (crease.dir === 'up' ? y > crease.k : y <= crease.k)) y = 2*crease.k+1-y;
    if (crease.type === 'v' && (crease.dir === 'left' ? x > crease.k : x <= crease.k)) x = 2*crease.k+1-x;
    return [x,y];
  });
  return next.every(([x,y]) => x>=1 && y>=1 && x<=size && y<=size) ? next : null;
}
const key = points => points.map(p => p.join(',')).sort().join('|');
function shortest(start, target, size, maxDepth, allowedCreases) {
  const queue = [{points:start,depth:0}], visited = new Set([key(start)]), goal=key(target);
  for(let head=0;head<queue.length;head++) {
    const {points,depth}=queue[head];
    if(key(points)===goal) return depth;
    if(depth===maxDepth) continue;
    for(let k=1;k<size;k++) for(const [type,dir] of [['h','up'],['h','down'],['v','left'],['v','right']]) {
      if (allowedCreases && !allowedCreases.some(c=>c.type===type && c.k===k)) continue;
      const next=fold(points,{type,dir,k},size);
      if(!next || visited.has(key(next))) continue;
      visited.add(key(next));queue.push({points:next,depth:depth+1});
    }
  }
  return null;
}

test('300 seeded puzzles are valid, deterministic, varied, and have the advertised minimum solution', () => {
  const seen = new Set();
  for(let day=0;day<60;day++) for(const meta of generator.metas) {
    const seed = new Date(Date.UTC(2026,8,1+day)).toISOString().slice(0,10);
    const puzzle=generator.generatePuzzle(meta,seed);
    assert.ok(generator.validPuzzle(puzzle,meta),`${seed} ${meta.difficulty}`);
    assert.deepEqual(puzzle,generator.generatePuzzle(meta,seed));
    const start=puzzle.start.map(p=>[p.x,p.y]),target=puzzle.target.map(p=>[p.x,p.y]);
    let points=start;
    for(const crease of puzzle.solution) {points=fold(points,crease,meta.size);assert.ok(points);}
    assert.equal(key(points),key(target));
    assert.equal(shortest(start,target,meta.size,meta.par,puzzle.allowedCreases),meta.par,`${seed} ${meta.difficulty} par`);
    seen.add(`${meta.difficulty}/${key(start)}/${key(target)}`);
  }
  assert.ok(seen.size > 270,`Only ${seen.size} distinct puzzles`);
});

test('cache validation rejects malformed, wrong-size, and unsolvable puzzles', () => {
  const meta=generator.metas[2],p=generator.generatePuzzle(meta,'cache-check');
  for(const bad of [null,{}, {...p,size:8}, {...p,start:[null]}, {...p,solution:[null,null,null,null,null]}, {...p,target:p.start}, {...p,solution:p.solution.map(f=>({...f,k:99}))}]) {
    assert.equal(generator.validPuzzle(bad,meta),false);
  }
});

test('stack multiplicity is preserved and moves outside the paper are rejected', () => {
  assert.deepEqual(generator.applyFold([{x:1,y:1},{x:1,y:1}],{type:'h',k:2,dir:'down'}),[{x:1,y:4},{x:1,y:4}]);
  assert.equal(generator.applyFold([{x:1,y:1}],{type:'h',k:5,dir:'down'}),null);
});

test('worker and main-thread fallback produce exactly the same puzzle', () => {
  let reply;
  const context=vm.createContext({self:{postMessage:message=>{reply=message;}}});
  context.importScripts=()=>vm.runInContext(fs.readFileSync(require.resolve('../level_generator.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(require.resolve('../puzzle-worker.js'),'utf8'),context);
  for(const meta of generator.metas) {
    context.self.onmessage({data:{requestId:meta.difficulty,meta,seed:'worker-check'}});
    assert.equal(reply.requestId,meta.difficulty);
    assert.deepEqual(JSON.parse(JSON.stringify(reply.puzzle)),generator.generatePuzzle(meta,'worker-check'));
  }
});

const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
function loadingHarness(workerMode, storageMode='normal') {
  const callbacks=[], buttons=new Map(), messages=[], cache=new Map();
  let worker;
  const context=vm.createContext({
    FoldGenerator:generator,
    getDateKeyPST:()=> '2026-09-15',
    document:{getElementById:id=>{if(!buttons.has(id)) buttons.set(id,{});return buttons.get(id);}},
    localStorage:{getItem:k=>{if(storageMode==='blocked') throw Error('blocked');return cache.get(k)||null;},setItem:(k,v)=>{if(storageMode==='blocked') throw Error('blocked');cache.set(k,v);}},
    setTimeout:fn=>callbacks.push(fn),
    Worker:class {constructor(){if(workerMode==='constructor-error') throw Error('blocked');worker=this;}postMessage(request){messages.push(request);}terminate(){this.terminated=true;}},
    addRuthNote:list=>list,
    newPuzzle:id=>vm.runInContext(`state = {id:${JSON.stringify(id)}}`,context),
    initRules:()=>{},watchForNewDay:()=>{},
  });
  vm.runInContext(`let state=null,isPlayback=false,difficulty='easy';const freshBtn={},dailyBtn={};const fallbackPuzzles=[];`,context);
  vm.runInContext(html.slice(html.indexOf('    const dailyMetas'),html.indexOf('    function watchForNewDay')),context);
  vm.runInContext(html.slice(html.indexOf('    let puzzles ='),html.indexOf('    function buildPuzzle')),context);
  const run=code=>vm.runInContext(code,context);
  const flush=()=>{while(callbacks.length)callbacks.shift()();};
  return {run,flush,buttons,cache,messages,get worker(){return worker;}};
}

test('blocked worker construction and blocked storage still load all five puzzles',()=>{
  const h=loadingHarness('constructor-error','blocked');
  h.run('initializePuzzles()');h.flush();
  assert.equal(h.run('puzzles.filter(Boolean).length'),5);
  for(const meta of generator.metas) assert.equal(h.buttons.get(`${meta.difficulty}Btn`).disabled,false);
  assert.equal(h.run('freshBtn.disabled'),false);
});

test('worker failure after a partial result fills the remaining slots without replacing the active board',()=>{
  const h=loadingHarness('async-error');h.run('initializePuzzles()');
  const first=h.messages[0];
  h.worker.onmessage({data:{requestId:first.requestId,puzzle:generator.generatePuzzle(first.meta,first.seed)}});
  const active=h.run('state.id');
  h.worker.onerror();h.flush();
  assert.equal(h.run('puzzles.length'),5);
  assert.equal(h.run('puzzles.filter(Boolean).length'),5);
  assert.equal(h.run('state.id'),active);
  assert.equal(h.run('pending.size'),0);
  assert.equal(h.worker.terminated,true);
  assert.equal(h.cache.size,1);
});

test('practice does not overwrite daily puzzles or cache, and cached startup generates nothing',()=>{
  const h=loadingHarness('constructor-error');h.run('initializePuzzles()');h.flush();
  const daily=h.run('JSON.stringify(puzzles)'),cached=[...h.cache.values()][0];
  h.run('freshPuzzle()');h.flush();
  assert.equal(h.run('JSON.stringify(puzzles)'),daily);
  assert.equal([...h.cache.values()][0],cached);
  assert.match(h.run('state.id'),/practice/);
  assert.equal(h.run('pending.size'),0);
  h.run('initializePuzzles()');
  assert.equal(h.run('pending.size'),0);
  assert.equal(h.run('state.id'),JSON.parse(daily)[0].id);
});

test('Stop after a single solution step cancels delayed completion and restores control',()=>{
  let restored=0;const cleared=[];
  const context=vm.createContext({clearTimeout:id=>cleared.push(id),clearInterval:()=>{},setActiveStep:()=>{},restoreSnapshot:()=>restored++,setPlaybackMode:on=>vm.runInContext(`isPlayback=${on}`,context),renderBoard:()=>{},updateStatus:()=>{}});
  vm.runInContext('let isPlayback=true,playbackTimer=null,playbackEndTimer=42,playbackIndex=1,playbackCrease={},playbackSnapshot={};',context);
  vm.runInContext(html.slice(html.indexOf('    function stopPlayback('),html.indexOf('    function beginPlaybackSession')),context);
  vm.runInContext(html.slice(html.indexOf('    function startAutoPlayback('),html.indexOf('    function setSolutionOpen')),context);
  vm.runInContext('startAutoPlayback()',context);
  assert.equal(restored,1);assert.deepEqual(cleared,[42]);
  assert.equal(vm.runInContext('isPlayback',context),false);
});

test('Limited Creases validates its four lines and excludes disallowed moves in UI and solutions',()=>{
  const meta=generator.metas.find(m=>m.creaseCount),p=generator.generatePuzzle(meta,'limited-check');
  assert.equal(p.allowedCreases.length,4);
  assert.ok(p.solution.every(f=>p.allowedCreases.some(c=>c.type===f.type && c.k===f.k)));
  assert.equal(generator.validPuzzle({...p,allowedCreases:undefined},meta),false);
  assert.equal(generator.validPuzzle({...p,allowedCreases:[...p.allowedCreases.slice(1),p.allowedCreases[1]]},meta),false);
  assert.equal(generator.validPuzzle({...p,allowedCreases:p.allowedCreases.map(c=>({...c,k:99}))},meta),false);
  const context=vm.createContext({FoldGenerator:generator,state:p,SIZE:p.size});
  vm.runInContext(html.slice(html.indexOf('    function foldValid('),html.indexOf('    function renderGrid')),context);
  let validRestrictedMoves=0;
  for(let k=1;k<meta.size;k++) for(const [type,dir] of [['h','up'],['h','down'],['v','left'],['v','right']]) {
    const crease={type,dir,k};
    if(p.allowedCreases.some(c=>c.type===type && c.k===k)) continue;
    if(generator.applyFold(p.start,crease,p.size))validRestrictedMoves++;
    context.crease=crease;
    assert.equal(vm.runInContext('foldValid(state.start,crease)',context),false);
  }
  assert.ok(validRestrictedMoves>0,'The restrictions should remove otherwise legal moves');
  context.crease=p.solution[0];assert.equal(vm.runInContext('foldValid(state.start,crease)',context),true);
});

test('a year of stored opening moves avoids the former fixed-order bias',()=>{
  for(const meta of generator.metas.filter(m=>['medium','hard','large'].includes(m.difficulty))) {
    const counts=new Map();
    for(let day=0;day<365;day++) {
      const seed=new Date(Date.UTC(2026,0,1+day)).toISOString().slice(0,10);
      const puzzle=generator.generatePuzzle(meta,seed);
      assert.ok(puzzle);
      const f=puzzle.solution[0],key=`${f.type}${f.k}${f.dir}`;
      counts.set(key,(counts.get(key)||0)+1);
    }
    assert.ok(Math.max(...counts.values())/365<.22,`${meta.difficulty} opening move dominates the year`);
  }
});
