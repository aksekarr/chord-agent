import {chordsFor,STRUCTURE,DEGREES} from './music.js';
import {BluesPlayer} from './audio.js';
const $=id=>document.getElementById(id);
const player=new BluesPlayer();
let frame, request=0;
function renderBars(){
  const chords=chordsFor($('key').value);
  $('bars').innerHTML=STRUCTURE.map((degree,index)=>`<div class="bar"><span class="number">${String(index+1).padStart(2,'0')}</span><strong>${chords[degree].name}</strong><span class="degree">${DEGREES[degree]}</span></div>`).join('');
  display(null);
}
function display(position){
  const chord=chordsFor($('key').value,position?.beat??0)[STRUCTURE[position?.bar??0]];
  $('chord').textContent=chord.name;$('tones').textContent=chord.tones.join(' · ');
  $('position').textContent=position?`Bar ${position.bar+1} of 12 · Loop ${position.loop}`:'Ready to play';
  [...$('bars').children].forEach((bar,index)=>bar.classList.toggle('active',index===position?.bar));
  [...$('beats').children].forEach((beat,index)=>beat.classList.toggle('active',index===position?.beat));
}
function tick(){display(player.position());frame=requestAnimationFrame(tick);}
async function play(){
  const current=++request;cancelAnimationFrame(frame);
  $('play').disabled=true;$('stop').disabled=false;
  try{await player.start($('key').value);if(current!==request)return;
    $('status').textContent='Playing · Blues shuffle · D U D U D U D U · continuous loop';tick();
  }catch(error){if(current!==request)return;stop();$('status').textContent='Audio could not start. Press Play to retry.';console.error(error);}
}
function stop(){request++;player.stop();cancelAnimationFrame(frame);display(null);$('play').disabled=false;$('stop').disabled=true;$('status').textContent='Stopped · press Play to start at bar 1';}
$('play').addEventListener('click',play);
$('stop').addEventListener('click',stop);
$('key').addEventListener('change',()=>{const active=!$('stop').disabled;renderBars();if(active)play();});
window.addEventListener('pagehide',stop);
renderBars();
