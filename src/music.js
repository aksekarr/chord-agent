export const BPM = 90;
export const BEAT_SECONDS = 60 / BPM;
export const STRUCTURE = [0,1,0,0,1,1,0,0,2,1,0,2];
export const DEGREES = ['I','IV','V'];
const ROOTS = {E:[40,45,47],A:[45,50,40],C:[48,53,55]};
const NAMES = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','B♭','B'];
// Each beat repeats its pair twice; fifth on beats 1/3, sixth on beats 2/4.
export function chordsFor(key,beatInBar=0) {
  if (!(key in ROOTS)) throw new Error('Choose E, A, or C.');
  return ROOTS[key].map(root => {
    const notes=[root,root+(beatInBar%2===0?7:9)];
    return {name:NAMES[root%12],notes,tones:notes.map(note=>NAMES[note%12])};
  });
}
// Triplet shuffle, with a fixed 20 ms delay on every offbeat only.
export const OFFBEAT_DELAY_SECONDS = 0.020;
const OFFBEAT = 2/3 + OFFBEAT_DELAY_SECONDS/BEAT_SECONDS;
export const STRUM_PATTERN = ['down','up','down','up','down','up','down','up'];
export const HITS = [0,OFFBEAT,1,1+OFFBEAT,2,2+OFFBEAT,3,3+OFFBEAT];
export function eventsFor(key) {
  return STRUCTURE.flatMap((degree,bar) => HITS.map((hit,index) => ({
    beat:bar*4+hit,bar,chord:chordsFor(key,Math.floor(index/2))[degree],
    direction:STRUM_PATTERN[index],
    velocity:index%2===0?0.85:0.48,
    // Downstrokes ring to the upstroke; upstrokes release 30 ms before the next beat.
    duration:((HITS[index+1]??4)-hit)*BEAT_SECONDS-(index%2===1?0.030:0)
  })));
}
