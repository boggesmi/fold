importScripts('level_generator.js');
self.onmessage = ({data}) => {
  const {requestId, meta, seed} = data;
  self.postMessage({requestId, puzzle: FoldGenerator.generatePuzzle(meta, seed)});
};
