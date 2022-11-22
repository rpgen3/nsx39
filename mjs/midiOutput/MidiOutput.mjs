export class MidiOutput {
    constructor () {
        this.midiOutput = null;
    }
    async fetchMidiOutputs() {
        const midiAccess = await navigator.requestMIDIAccess({
            sysex: true,
            software: true
        });
        return midiAccess.outputs;
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
};
