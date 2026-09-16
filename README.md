# Fold

A daily paper-folding puzzle. Reflect dots across creases to match the target rings.

## Preview

Run `python3 -m http.server 8765` from this folder and open http://localhost:8765.
The site is static: no build step or dependencies. Serve the entire folder, including
`index.html`, `paper.css`, `level_generator.js`, `puzzle-worker.js`, and `personal_messages.js`.

## Puzzles

- Easy: 6×6, two dots, minimum three folds.
- Medium: 6×6, three dots, minimum four folds.
- Hard: 6×6, four dots without stacks, minimum five folds.
- Large: 8×8, three dots, minimum four folds.
- Limited Creases: 6×6, three dots, four permitted crease lines, minimum four folds.
- Fresh puzzle generates practice at the selected difficulty. Back to daily restores
  that difficulty's daily puzzle (starting over).

Daily seeds use the date in America/Los_Angeles. The shared generator explores
reachable positions once using breadth-first search, so the stored solution is a
shortest path. It runs in a worker; worker failures use the same bounded generator
on the page. Generation never changes the active board's grid size. Complete daily
sets are cached under `foldDaily-v3-<date>`; practice never overwrites them.
The new generator intentionally produces different daily puzzles from the old version.
Every completed puzzle reveals a gentle note or short original poem for Ruth.
Notes are composed from curated original phrases using a date-and-mode seed.
They keep working on future dates without a prewritten calendar or 28-day loop,
and stay the same on repeat plays that day. This is a local phrase composer, not
live AI generation: no account, network service, or API key is needed. The set of
possible combinations is finite, so individual phrases and complete notes can recur.
Easy poems have three lines, Medium four, and Hard five. Large reflects space and
exploration; Limited reflects finding a route within constraints. Prose notes also
follow each mode's theme. The note never depends on move count. Medium retains the birthday countdown; on April 29,
all modes show a birthday greeting. The name, birthday, themes, and phrase collections can be edited in
`personal_messages.js` without changing puzzle generation. Optional complete
personal notes can replace the composer through `profile.notes`.
Notes are refreshed even when the daily puzzles come from the local cache.

Fold exploration is shuffled deterministically and targets are reservoir-sampled
across the final search frontier (subject to the state limit). This avoids the old
fixed traversal order and first-96-target selection bias. Limited puzzles include
an explicit allowed-crease list enforced by generation, validation, pointer
controls, and keyboard controls. Both directions are available on each allowed
line when the dots remain on the paper; folds that move no dots are disabled.

Horizontal and vertical operations remain independent in the core rules. Distinct
layouts and varied stored solutions do not establish different solving strategies
or long-term enjoyment; those still need playtesting.

## Verify

Run `node --test tests/*.test.js`. Tests cover 300 deterministic puzzles with
independent shortest-path validation, cache rejection, worker parity and failure
recovery, unavailable storage, practice isolation, solution playback cancellation, restricted-fold enforcement, and a year-long
opening-move distribution check.

Message checks cover two years of compositions, distant future dates, difficulty
scaling, personal wording, and birthday dates across
daylight-saving and leap-year boundaries.
