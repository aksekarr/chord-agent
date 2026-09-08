import {BEAT_SECONDS,eventsFor} from './music.js';
export const STRUM_SPREAD_SECONDS = 0.025; // Full roll, independent of chord size.
export class BluesPlayer {
  constructor(createContext = () => new AudioContext()) {
    this.createContext=createContext; this.playing=false; this.version=0;
  }
  async start(key) {
    this.stop();
    const version=this.version;
    this.context ||= this.createContext();
    await this.context.resume();
    if (version!==this.version) return;
    this.master=this.context.createGain();
    this.master.gain.value=0.55;
    this.master.connect(this.context.destination);
    this.events=eventsFor(key);this.index=0;this.cycle=0;
    this.startedAt=this.context.currentTime+0.08;this.playing=true;
    this.schedule();this.timer=setInterval(()=>this.schedule(),25);
  }
  schedule() {
    while(this.playing) {
      const event=this.events[this.index];
      const time=this.startedAt+(this.cycle*48+event.beat)*BEAT_SECONDS;
      if(time>this.context.currentTime+0.15) break;
      if(time>=this.context.currentTime) this.chord(event,time);
      if(++this.index===this.events.length){this.index=0;this.cycle++;}
    }
  }
  chord(event,time) {
    const notes=[...event.chord.notes].sort((a,b)=>a-b);
    if(event.direction==='up') notes.reverse();
    const end=time+event.duration;
    for(const [index,midi] of notes.entries()) {
      const noteTime=time+index*STRUM_SPREAD_SECONDS/Math.max(1,notes.length-1);
      const frequency=440*2**((midi-69)/12);
      // A soft fundamental with a quickly decaying bell partial.
      for(const [ratio,level,decay] of [[1,0.15,0.65],[2,0.035,0.22],[3,0.012,0.12]]) {
        const oscillator=this.context.createOscillator();
        const envelope=this.context.createGain();
        oscillator.type='sine';oscillator.frequency.value=frequency*ratio;
        envelope.gain.setValueAtTime(0,noteTime);
        envelope.gain.linearRampToValueAtTime(level*event.velocity,noteTime+0.008);
        // Decay naturally, then release within the specified note length.
        const remaining=level*event.velocity*Math.exp(-(end-noteTime)/decay);
        envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001,remaining),end-0.025);
        envelope.gain.linearRampToValueAtTime(0,end);
        oscillator.connect(envelope);envelope.connect(this.master);
        oscillator.start(noteTime);oscillator.stop(time+event.duration);
        oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};
      }
    }
  }
  position() {
    if(!this.playing) return null;
    const beat=Math.max(0,Math.floor((this.context.currentTime-this.startedAt)/BEAT_SECONDS));
    return {bar:Math.floor(beat/4)%12,beat:beat%4,loop:Math.floor(beat/48)+1};
  }
  stop() {
    this.version++;this.playing=false;clearInterval(this.timer);
    if(this.master){this.master.disconnect();this.master=null;}
  }
}
