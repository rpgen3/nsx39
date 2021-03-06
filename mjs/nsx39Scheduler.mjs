import {delta2sec} from 'https://rpgen3.github.io/piano/mjs/midi/sec2delta.mjs';
import {ArrayAdvancer} from 'https://rpgen3.github.io/nsx39/mjs/ArrayAdvancer.mjs';
import {UstTempoMessage} from 'https://rpgen3.github.io/nsx39/mjs/UstTempoMessage.mjs';
import {nsx39} from 'https://rpgen3.github.io/nsx39/mjs/nsx39.mjs';
import {tuning39} from 'https://rpgen3.github.io/nsx39/mjs/tuning39.mjs';
export const nsx39Scheduler = new class {
    constructor() {
        this.nsx39 = nsx39;
        this.isStopping = false;
        this.id = -1;
        this.startedTime = 0;
        this.duration = 0;
        this.scheduledTime = 500;
        this.shiftedLyricTime = 10;
        this.shiftedNoteTime = 150;
        this.shiftedNoteOffTime = 1;
        this.shiftedPitch = 0;
        this.shiftedOctave = 0;
    }
    load({tempos, programChanges, ustNotes, midiNotes}) {
        const shiftedTempos = tempos.slice(1).concat(new UstTempoMessage({when: Infinity}));
        this.programChanges = new ArrayAdvancer(programChanges || []);
        this.ustNotes = new ArrayAdvancer(tuning39({
            ...this,
            messages: ustNotes || []
        }));
        this.midiNotes = new ArrayAdvancer(tuning39({
            ...this,
            messages: midiNotes || []
        }));
        let startDeltaTime = 0;
        let startMilliSecond = 0;
        const toMilliSecond = (bpm, when) => delta2sec({
            bpm,
            delta: when - startDeltaTime
        }) * 1000;
        for (const [i, {bpm}] of tempos.entries()) {
            const {when} = shiftedTempos[i];
            for (const v of [
                this.programChanges,
                this.ustNotes,
                this.midiNotes
            ]) {
                while(!v.done && v.head.when < when) {
                    v.head.when = toMilliSecond(bpm, v.head.when) + startMilliSecond;
                    v.advance();
                }
            }
            startMilliSecond += toMilliSecond(bpm, when);
            startDeltaTime = when;
        }
        this.duration = Math.max(...[ustNotes, midiNotes].filter(v => v?.length).map(v => v[v.length - 1]).map(v => v.when));
    }
    #init() {
        this.programChanges.done = false;
        this.ustNotes.done = false;
        this.midiNotes.done = false;
        this.startedTime = performance.now();
    }
    #update() {
        const now = performance.now();
        const when = now - this.startedTime + this.scheduledTime;
        while (!this.programChanges.done && this.programChanges.head.when < when) {
            const data = this.programChanges.head;
            const timestamp = data.when + this.startedTime;
            nsx39.programChange({data, timestamp});
            this.programChanges.advance();
        }
        while (!this.ustNotes.done && this.ustNotes.head.when < when) {
            const data = this.ustNotes.head;
            const timestamp = data.when + this.startedTime;
            if (data.velocity) nsx39.setLyric({data, timestamp: timestamp - this.shiftedLyricTime});
            nsx39.noteOn({data, timestamp});
            this.ustNotes.advance();
        }
        while (!this.midiNotes.done && this.midiNotes.head.when < when) {
            const data = this.midiNotes.head;
            const timestamp = data.when + this.startedTime;
            nsx39.noteOn({data, timestamp});
            this.midiNotes.advance();
        }
    }
    async play() {
        if (this.isStopping) return;
        await this.stop();
        this.#init();
        this.id = setInterval(() => this.#update());
    }
    async stop() {
        if (this.isStopping) return;
        this.isStopping = true;
        clearInterval(this.id);
        return new Promise(resolve => {
            const id = setInterval(() => nsx39.allSoundOff());
            setTimeout(() => {
                clearInterval(id);
                this.isStopping = false;
                resolve();
            }, this.scheduledTime);
        });
    }
}();
