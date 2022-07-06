import {nsx39TextMap} from 'https://rpgen3.github.io/nsx39/mjs/nsx39TextMap.mjs';
export const nsx39 = new class {
    constructor() {
        this.midiOutput = null;
    }
    async requestMIDIAccess() {
        const midiAccess = await navigator.requestMIDIAccess({
            sysex: true,
            software: true
        });
        const nsx39 = [...midiAccess.outputs].map(([_, v]) => v).find(({name}) => name === 'NSX-39 ');
        if (!nsx39) throw 'NSX-39 is not found.';
        this.midiOutput = nsx39;
    }
    send({data, timestamp}) {
        this.midiOutput.send(data, timestamp);
    }
    noteOn({data: {channel, pitch, velocity}, timestamp}) {
        this.send({
            data: [0x90 | channel, pitch, velocity],
            timestamp
        });
    }
    programChange({data: {channel, programChange}, timestamp}) {
        this.send({
            data: [0xC0 | channel, programChange],
            timestamp
        });
    }
    soundOff({data: {channel}, timestamp}) {
        this.send({
            data: [0xB0 | channel, 0x78, 0x00],
            timestamp
        });
    }
    allSoundOff({timestamp} = {}) {
        for (let i = 0; i < 0x10; i++) {
            this.soundOff({
                data: {channel: i},
                timestamp
            });
        }
    }
    sendSysEx({data, timestamp}) {
        this.send({
            data: [0xF0, 0x43, 0x79, 0x09, 0x11].concat(data).concat(0xF7),
            timestamp
        });
    }
    setLyric({data: {lyric}, timestamp}) {
        const payload = [];
        for (const phoneme of lyric) {
            payload.push(nsx39TextMap[phoneme] || 0x7c); // 0x7c, 0x7d, 0x7e, 0x7f
        }
        this.sendSysEx({
            data: [0x0A, 0x00].concat(payload),
            timestamp
        });
    }
}();
