import {nsx39TextMap} from 'https://rpgen3.github.io/nsx39/mjs/nsx39TextMap.mjs';
export const nsx39 = new class {
    constructor() {
        this.midi = null;
        this.nsx39TextMap = nsx39TextMap;
    }
    async requestMIDIAccess() {
        const midi = await navigator.requestMIDIAccess({
            sysex: true,
            software: true
        });
        const nsx39 = [...midi.outputs].map(([_, v]) => v).find(v => v.name === 'NSX-39 ');
        if (!nsx39) throw 'NSX-39 is not found.';
        this.midi = nsx39;
    }
    noteOn(timestamp, {ch, pitch, velocity}) {
        this.midi.send([0x90 | ch, pitch, velocity], timestamp);
    }
    programChange(timestamp, {ch, programChange}) {
        this.midi.send([0xC0 | ch, programChange], timestamp)
    }
    allSoundOff(timestamp) {
        for (let i = 0; i < 0x10; i++) {
            this.midi.send([0xB0 | i, 0x78, 0x00], timestamp);
        }
    }
    sendSysEx(timestamp, data) {
        this.midi.send([0xF0, 0x43, 0x79, 0x09, 0x11, ...data, 0xF7], timestamp);
    }
    setLyric(timestamp, lyric) {
        if (lyric in this.nsx39TextMap) {
            const lyricId = this.nsx39TextMap[lyric];
            this.sendSysEx(timestamp, [0x0A, 0x00, lyricId]);
        }
    }
}();
