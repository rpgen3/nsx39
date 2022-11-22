import {MidiOutput} from 'https://rpgen3.github.io/nsx39/mjs/midiOutput/MidiOutput.mjs';
import {nsx39TextMap} from 'https://rpgen3.github.io/nsx39/mjs/nsx39TextMap.mjs';
export class Nsx39 extends MidiOutput {
    async fetchNsx39() {
        const midiOutputs = await this.fetchMidiOutputs();
        const nsx39 = [...midiOutputs].map(([_, v]) => v).find(v => v.name === 'NSX-39 ');
        if (!nsx39) throw 'NSX-39 is not found.';
        this.midiOutput = nsx39;
    }
    sendSysEx({data, timestamp}) {
        this.send({
            data: [0xF0, 0x43, 0x79, 0x09, 0x11, ...data, 0xF7],
            timestamp
        });
    }
    setLyric({data: {lyric}, timestamp}) {
        this.sendSysEx({
            data: [0x0A, 0x00, lyric in nsx39TextMap ? nsx39TextMap[lyric] : 0x7d],
            timestamp
        });
    }
};
