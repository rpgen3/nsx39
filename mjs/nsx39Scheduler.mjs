import {delta2sec} from 'https://rpgen3.github.io/piano/mjs/midi/sec2delta.mjs';
import {ArrayAdvancer} from 'https://rpgen3.github.io/nsx39/mjs/ArrayAdvancer.mjs';
import {UstTempoMessage} from 'https://rpgen3.github.io/nsx39/mjs/UstTempoMessage.mjs';
import {Nsx39} from 'https://rpgen3.github.io/nsx39/mjs/midiOutput/Nsx39.mjs';
import {tuning39} from 'https://rpgen3.github.io/nsx39/mjs/tuning39.mjs';
export const nsx39Scheduler = new class {
    constructor() {
        this.nsx39 = null;
        this.isStopping = false;
        this.id = -1;
        this.startedTime = 0;
        this.speedRate = 1;
        this.duration = 0;
        this.scheduledTime = 500;
        this.shiftedLyricTime = 10;
        this.shiftedNoteTime = 150;
        this.shiftedNoteOffTime = 1;
        this.shiftedPitch = 0;
        this.shiftedOctave = 0;
    }
    async init() {
        const nsx39 = await Nsx39.fetchNsx39();
        if (nsx39 === null) {
            throw 'NSX-39 is not found.';
        } else {
            this.nsx39 = new Nsx39(nsx39);
        }
    }
    load({tempos, controlChanges, programChanges, ustNotes, midiNotes}) {
        for (const v of midiNotes) {
            if (v.channel !== 0 && v.velocity === 0) {
                v.when -= this.shiftedNoteOffTime;
            }
        }
        const shiftedTempos = tempos.slice(1).concat(new UstTempoMessage({when: Infinity}));
        this.controlChanges = new ArrayAdvancer(controlChanges || []);
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
                this.controlChanges,
                this.programChanges,
                this.ustNotes,
                this.midiNotes
            ]) {
                while(!v.done && v.head.when < when) {
                    v.head.when = (toMilliSecond(bpm, v.head.when) + startMilliSecond) / this.speedRate + this.scheduledTime;
                    v.advance();
                }
            }
            startMilliSecond += toMilliSecond(bpm, when);
            startDeltaTime = when;
        }
        this.duration = Math.max(...[ustNotes, midiNotes].filter(v => v?.length).map(v => v[v.length - 1]).map(v => v.when));
    }
    #init() {
        this.controlChanges.done = false;
        this.programChanges.done = false;
        this.ustNotes.done = false;
        this.midiNotes.done = false;
        this.startedTime = performance.now();
    }
    #update() {
        const now = performance.now();
        const when = now - this.startedTime + this.scheduledTime;
        while (!this.controlChanges.done && this.controlChanges.head.when < when) {
            const data = this.controlChanges.head;
            const timestamp = data.when + this.startedTime;
            this.nsx39.controlChange({data, timestamp});
            this.controlChanges.advance();
        }
        while (!this.programChanges.done && this.programChanges.head.when < when) {
            const data = this.programChanges.head;
            const timestamp = data.when + this.startedTime;
            this.nsx39.programChange({data, timestamp});
            this.programChanges.advance();
        }
        while (!this.ustNotes.done && this.ustNotes.head.when < when) {
            const data = this.ustNotes.head;
            const timestamp = data.when + this.startedTime;
            if (data.velocity) this.nsx39.setLyric({data, timestamp: timestamp - this.shiftedLyricTime});
            this.nsx39.noteOn({data, timestamp});
            this.ustNotes.advance();
        }
        while (!this.midiNotes.done && this.midiNotes.head.when < when) {
            const data = this.midiNotes.head;
            const timestamp = data.when + this.startedTime;
            this.nsx39.noteOn({data, timestamp});
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
            const id = setInterval(() => this.nsx39.allChannels.allNotesOff());
            setTimeout(() => {
                clearInterval(id);
                this.isStopping = false;
                resolve();
            }, this.scheduledTime);
        });
    }
}();
