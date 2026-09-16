const {test} = require('node:test');
const assert = require('node:assert/strict');
const {buildNote, profile} = require('../personal_messages');
const modes = ['easy','medium','hard','large','limited'];

test('date-seeded messages stay reproducible across future years without a 28-day cycle',()=>{
  for(const mode of modes) {
    const notes=new Set(); let poems=0, prose=0, matches28=0;
    for(let day=0;day<730;day++) {
      const date=new Date(Date.UTC(2026,0,1+day)).toISOString().slice(0,10);
      const next=new Date(Date.UTC(2026,0,29+day)).toISOString().slice(0,10);
      const note=buildNote(date,mode);
      assert.deepEqual(note,buildNote(date,mode));
      assert.ok(note.heading.includes('Ruth'));
      assert.ok(note.message && !/undefined|NaN|\{name\}/.test(note.message));
      if(note.message.includes('\n')) poems++; else prose++;
      matches28+=note.message===buildNote(next,mode).message;
      notes.add(note.message);
    }
    assert.ok(notes.size>300,`${mode} has too few distinct compositions`);
    assert.ok(poems>100 && prose>100);
    assert.ok(matches28<15,`${mode} repeats on a 28-day cycle`);
  }
  for(const year of [2030,2050,2100,2400]) for(const mode of modes) {
    const note=buildNote(`${year}-09-15`,mode);
    assert.ok(note.message && !/undefined|NaN/.test(note.message));
  }
});

test('poems scale from a short Easy note to a fuller Hard reflection',()=>{
  const lineCounts={easy:3,medium:4,hard:5,large:4,limited:4};
  for(const mode of modes) {
    let checked=0;
    for(let day=1;day<=28;day++) {
      const message=buildNote(`2026-09-${String(day).padStart(2,'0')}`,mode).message;
      if(!message.includes('\n')) continue;
      assert.equal(message.split('\n').length,lineCounts[mode]);checked++;
    }
    assert.ok(checked>0);
  }
});

test('birthday greetings cover every mode; the usual countdown stays on Medium',()=>{
  for(const mode of modes) {
    assert.match(buildNote('2026-04-29',mode).birthdayMessage,/Happy birthday, Ruth!/);
    if(mode!=='medium')assert.equal(buildNote('2026-04-28',mode).birthdayMessage,'');
  }
  assert.equal(buildNote('2026-04-28','medium').birthdayMessage,'Only 1 day until your birthday!');
  assert.equal(buildNote('2026-04-30','medium').birthdayMessage,'364 days until your birthday!');
  assert.equal(buildNote('2027-04-30','medium').birthdayMessage,'365 days until your birthday!');
  assert.equal(buildNote('2026-03-08','medium').birthdayMessage,'52 days until your birthday!');
});

test('personal wording and name can change without touching puzzle rules',()=>{
  const customized={name:'Ruth',birthday:null,notes:['A note for {name}.\nEnjoy your day.']};
  const note=buildNote('2026-09-15','easy',customized);
  assert.equal(note.message,'A note for Ruth.\nEnjoy your day.');
  assert.equal(note.birthdayMessage,'');
  assert.ok(buildNote('2026-09-15','easy',{...customized,notes:[]}).message);
});
