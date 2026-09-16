/* Date-seeded notes assembled locally from original, curated phrases. No service or API key. */
(function (root) {
  'use strict';
  const profile = {
    name: 'Ruth',
    birthday: {month: 4, day: 29},
    // Optional complete notes replace the composer; {name} inserts the recipient's name.
    notes: [],
  };
  const themes = {
    easy: {
      lines: 3,
      prose: [
        'A small puzzle makes a lovely pause.', 'A few simple folds can change the whole picture.',
        'There is pleasure in a little pattern found.', 'A familiar rhythm can be a lovely way to begin.',
        'Small discoveries deserve a moment, too.', 'A little looking and a little play can go a long way.',
        'Sometimes a small turn is all it takes.', 'A quiet beginning has its own rewards.',
      ],
      openings: [
        'A little paper, a little pause.', 'A few small folds have found their place.',
        'A simple pattern settles into view.', 'A small beginning opens out.',
        'A quiet page holds a little surprise.', 'A familiar rhythm returns.',
        'A handful of dots comes home.', 'A small discovery rests on the page.',
      ],
      turns: [
        'There is time to enjoy a little thing.', 'The simplest turns can bring a smile.',
        'A small success belongs here, too.', 'The paper asks for nothing more.',
        'A gentle start is quite enough.', 'A little looking brings a different view.',
        'One small moment can be its own reward.', 'The pattern is complete, the day still open.',
      ],
    },
    medium: {
      lines: 4,
      prose: [
        'A change of perspective can bring the pieces together.', 'There is satisfaction in finding how one fold leads to another.',
        'A familiar pattern can still hold a small surprise.', 'A little curiosity makes room for a new view.',
        'Each turn offers another way to look.', 'The shape of the answer can appear one fold at a time.',
        'There is something lovely about a pattern coming into focus.', 'A second look can reveal a welcome possibility.',
      ],
      openings: [
        'One fold suggests another.', 'A pattern comes slowly into focus.',
        'A different view appears on the page.', 'A familiar shape holds a small surprise.',
        'The next turn opens a possibility.', 'A little curiosity finds its place.',
        'A new arrangement comes to rest.', 'The dots have found their constellation.',
      ],
      turns: [
        'A change of view can make things clear.', 'Curiosity leaves room for a surprise.',
        'One thought can lead gently to the next.', 'The answer takes its shape in small turns.',
        'There is pleasure in seeing the pieces agree.', 'A second look can open another way.',
        'A familiar pattern can still feel new.', 'A little attention reveals a little more.',
      ],
    },
    hard: {
      lines: 5,
      prose: [
        'A more intricate pattern has come together.', 'There is room to enjoy the thought behind those folds.',
        'A winding route can have a satisfying finish.', 'A demanding puzzle makes this a good moment to pause.',
        'An intricate arrangement has found its shape.', 'There is a quiet pleasure in untangling a challenge.',
        'A puzzle with more to consider can offer more to discover.', 'The difficult-looking shapes can find their places, too.',
      ],
      openings: [
        'An intricate pattern comes to rest.', 'A winding route has reached its end.',
        'The tangled-looking shape is clear.', 'A deeper puzzle settles on the page.',
        'Many possibilities have become one picture.', 'A demanding pattern finds its balance.',
        'The final turn brings the details together.', 'A knot of possibilities has loosened.',
      ],
      turns: [
        'There is room for a patient second look.', 'A thoughtful pause can open a way.',
        'Small steps can carry a complicated thought.', 'A winding path is still a path.',
        'The answer need not arrive all at once.', 'There is no hurry in understanding.',
        'An intricate thing can become familiar.', 'A challenge can be met one turn at a time.',
      ],
    },
    large: {
      lines: 4,
      prose: [
        'A wider page gives the eye a little more room to wander.', 'The larger constellation has found its shape.',
        'A little space can reveal a different possibility.', 'There is pleasure in bringing a wider picture together.',
        'A broad view can begin with one small turn.', 'Even a larger page comes together one fold at a time.',
        'There is room for both the details and the whole picture.', 'A little exploring can bring a far corner into view.',
      ],
      openings: [
        'The wider page has found its pattern.', 'A larger constellation comes to rest.',
        'The far corners draw a little closer.', 'A broad view settles into place.',
        'There is room for the eye to wander.', 'A little more space holds a new arrangement.',
        'The whole page comes together.', 'A small turn changes a wider picture.',
      ],
      turns: [
        'A wide view begins with a small detail.', 'There is room to look a little farther.',
        'One fold can bring distant things together.', 'The corners belong to the same quiet page.',
        'Small moves can travel across a larger space.', 'A little exploring can reveal a new view.',
        'Both the details and the whole have their place.', 'A wider picture can arrive one turn at a time.',
      ],
    },
    limited: {
      lines: 4,
      prose: [
        'A few chosen creases can open a surprising number of possibilities.', 'There is satisfaction in finding a route through fewer doors.',
        'A boundary can invite a different way of looking.', 'A smaller set of choices can still hold a lovely surprise.',
        'The available lines have made a path of their own.', 'There is room for discovery within a few simple limits.',
        'An unexpected route can bring everything into place.', 'A few well-placed turns can be enough.',
      ],
      openings: [
        'A few chosen lines have made a path.', 'The smaller doorway opens onto a pattern.',
        'Four quiet creases hold a possibility.', 'A different route has brought the dots home.',
        'The marked lines have found their purpose.', 'A boundary has given the shape a frame.',
        'A handful of choices becomes a whole picture.', 'An unexpected way leads into place.',
      ],
      turns: [
        'A few open doors can still lead somewhere new.', 'There is room to explore within a frame.',
        'A different route can reach a familiar place.', 'A limit can invite a second way of seeing.',
        'Not every line is needed for a path.', 'A few possibilities can be quite enough.',
        'The available turns have their own quiet rhythm.', 'A small opening can lead to a new view.',
      ],
    },
  };
  const images = [
    'The last dot settles on the paper.', 'The lines lie quietly on the page.',
    'A little space remains around the dots.', 'The paper rests between its folds.',
    'The final shape is still for a moment.', 'The corners keep their quiet company.',
    'The creases trace a little journey.', 'The dots rest in their waiting rings.',
  ];
  const reflections = [
    'There is nothing more to prove here.', 'The pause belongs to you.',
    'Let the finished pattern be enough.', 'A quiet finish has its own reward.',
    'There is time to appreciate the details.', 'A small discovery can stay with you.',
    'You can leave the next question for another moment.', 'There is room to rest between one thought and the next.',
  ];
  const endings = [
    'Let the day unfold.', 'The next moment can wait a little.',
    'May the day hold a gentle surprise.', 'Enjoy the quiet of a puzzle done.',
    'There is no hurry to turn the page.', 'The day has room for little things.',
    'Carry a little calm into the day.', 'May something lovely meet you next.',
    'Stay for a moment, or go where you will.', 'Here is a little space to simply be.',
    'Let this be a pleasant place to pause.', 'The rest of the day is still yours.',
  ];
  const greetings = [
    'Nicely folded, {name}.', 'A satisfying finish, {name}.', 'The dots are home, {name}.',
    'One more constellation found, {name}.', 'Everything is in place, {name}.', 'Puzzle complete, {name}.',
    'There it is, {name}.', 'A good moment to pause, {name}.',
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
  function buildNote(dateKey, difficulty, customProfile = profile) {
    const rng = random(`fold-note-v2-${dateKey}-${difficulty}`);
    const pick = items => items[Math.floor(rng() * items.length)];
    const theme = Object.hasOwn(themes, difficulty) ? themes[difficulty] : themes.easy;
    let message;
    if (customProfile.notes?.length) message = pick(customProfile.notes);
    else if (rng() < .6) {
      const lines = [pick(theme.openings)];
      if (theme.lines >= 4) lines.push(pick(images));
      lines.push(pick(theme.turns));
      if (theme.lines >= 5) lines.push(pick(reflections));
      lines.push(pick(endings));
      message = lines.join('\n');
    } else {
      // Easy notes are shorter; other modes offer a little more reflection.
      message = [pick(greetings), pick(theme.prose), ...(difficulty === 'easy' ? [] : [pick(endings)])].join(' ');
    }
    message = message.replaceAll('{name}', customProfile.name);
    const [year, month, day] = dateKey.split('-').map(Number);
    // Calendar arithmetic is independent of daylight-saving changes and device time zone.
    const today = Date.UTC(year, month - 1, day);
    let birthdayMessage = '';
    const birthday = customProfile.birthday;
    if (birthday) {
      let next = Date.UTC(year, birthday.month - 1, birthday.day);
      if (next < today) next = Date.UTC(year + 1, birthday.month - 1, birthday.day);
      const days = Math.round((next - today) / 86400000);
      if (days === 0) birthdayMessage = `Happy birthday, ${customProfile.name}! Wishing you a lovely day.`;
      else if (difficulty === 'medium') birthdayMessage = days === 1 ? 'Only 1 day until your birthday!' : `${days} days until your birthday!`;
    }
    return {heading: `Well done, ${customProfile.name}.`, message, birthdayMessage};
  }
  const api = {profile, buildNote};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FoldMessages = api;
})(globalThis);
