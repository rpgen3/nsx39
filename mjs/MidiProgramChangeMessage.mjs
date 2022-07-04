import {Heap} from 'https://rpgen3.github.io/maze/mjs/heap/Heap.mjs';
export class MidiProgramChangeMessage {
    constructor({when, ch, programChange}) {
        this.when = when;
        this.programChange = programChange;
    }
    static makeArray(midi) {
        const heap = new Heap();
        for(const {event} of midi.track) {
            let currentTime = 0;
            for(const {deltaTime, type, channel, data} of event) {
                currentTime += deltaTime;
                if(type === 0xC) heap.add(currentTime, new this({
                    when: currentTime,
                    ch: channel,
                    programChange: data
                }));
            }
        }
        return [...heap];
    }
    get bpm() {
        return 6E7 / this.tempo;
    }
    set bpm(bpm) {
        this.tempo = 6E7 / this.bpm;
    }
}
