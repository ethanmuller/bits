import * as Tone from 'tone'

//Tone.getDestination().volume.value = -6

let isSetup = false

const bitSynth = new Tone.Synth({
  oscillator: {
    type: 'sine',
  },
  envelope: {
    attack: 0.001,
    decay: 0.02,
    sustain: 0,
    release: 0,
  },
}).toDestination();

const navSynth = new Tone.Synth({
  oscillator: {
    type: 'sine',
  },
  envelope: {
    attack: 0.001,
    decay: 0.02,
    sustain: 0,
    release: 0,
  },
}).toDestination();

const clipboardSynth = new Tone.Synth({
  oscillator: {
    type: 'sine',
  },
  envelope: {
    attack: 0.001,
    decay: 0.2,
    sustain: 0,
    release: 0.02,
  },
}).toDestination();

const filter = new Tone.Filter({
    Q: 8,
    type : 'lowpass',
  rolloff: -48,
    frequency: 200,
  }).toDestination();

const noiseSynth = new Tone.NoiseSynth({
  volume: -30,
  envelope: {
    attack: 0.01,
    decay: 0.09,
    sustain: 0,
    release: 0,
  },
}).connect(filter);


export const sfx = {
  bit(x,y,c) {
    if (!isSetup) {
      isSetup = true
      return
    }

    const f = 300-y/9*300 + x/9 * 300 + 300 + c * 300

    try {
      bitSynth.triggerAttackRelease(f, "64n");
    } catch(e) {
    }
  },
  nav() {
    navSynth.triggerAttackRelease(300, "32n");
    navSynth.frequency.rampTo(100, 0.02)
  },
  bwip() {
    clipboardSynth.triggerAttackRelease("C3", "32n");
    clipboardSynth.frequency.rampTo("C7", "32n")
  },
  up() {
    clipboardSynth.triggerAttackRelease("C4", "32n");
    clipboardSynth.frequency.rampTo("C5", "32n")
  },
  down() {
    clipboardSynth.triggerAttackRelease("C5", "32n");
    clipboardSynth.frequency.rampTo("C4", "32n")
  },
  csh() {
    const r = 600 + Math.random()*9000;

    filter.set({
        frequency: r
    });

    filter.frequency.rampTo(600 + Math.random()*9000, 0.2)

    noiseSynth.triggerAttackRelease("8n");
  },
}
