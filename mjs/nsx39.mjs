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
        const nsx39 = [...midi.outputs].map(([_, v]) => v).find(({name}) => name === 'NSX-39 ');
        if (!nsx39) throw 'NSX-39 is not found.';
        this.midi = nsx39;
    }
    noteOn({ch, pitch, velocity}) {
        this.midi.send([0x90 + ch, pitch, velocity]);
    }
    programChange({ch, program}) {
        this.midi.send([0xC0 + ch, program])
    }
    allSoundOff() {
        for (let i = 0; i < 0x10; i++) {
            this.midi.send([0xB0 + i, 0x78, 0x00]);
        }
    }
    sendSysEx(data) {
        this.midi.send([0xF0, 0x43, 0x79, 0x09, 0x11, ...data, 0xF7]);
    }
    setLyric(lyric) {
        if (lyric in this.nsx39TextMap) {
            const lyricId = this.nsx39TextMap[lyric];
            this.sendSysEx([0x0A, 0x00, lyricId]);
        }
    }
}();
