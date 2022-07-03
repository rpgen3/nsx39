import {nsx39textMap} from 'https://rpgen3.github.io/nsx39/mjs/nsx39textMap.mjs';
const nsx39 = new class {
    constructor() {
        this.midi = null;
        this.nsx39textMap = nsx39textMap;
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
    noteOn({ch, pitch, velocity}) {
        this.midi.send([0x90 + ch, pitch, velocity]);
    }
    sendSysEx(data) {
        this.midi.send([0xF0, 0x43, 0x79, 0x09, 0x11, ...data, 0xF7]);
    }
    setLyric(lyric) {
        if (lyric in this.nsx39textMap) {
            const lyricId = this.nsx39textMap[lyric];
            this.sendSysEx([0x0A, 0x00, lyricId]);
        }
    }
};
