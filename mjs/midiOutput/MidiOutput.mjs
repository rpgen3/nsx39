export class MidiOutput {
    constructor () {
        this.midiOutput = null;
        this.allChannels = new Proxy(this, {
            get(target, prop) {
                return ({data, timestamp}) => {
                    for (let i = 0; i < 0x10; i++) {
                        target[prop]({data: {channel: i, ...data}, timestamp});
                    }
                };
            }
        });
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
    // 鍵盤を押下
    noteOn({data: {channel, pitch, velocity}, timestamp}) {
        this.send({
            data: [0x90 | channel, pitch, velocity],
            timestamp
        });
    }
    // 音色の切り替え
    programChange({data: {channel, programChange}, timestamp}) {
        this.send({
            data: [0xC0 | channel, programChange],
            timestamp
        });
    }
    // 音色の初期化
    resetAllControllers({data: {channel}, timestamp}) {
        this.send({
            data: [0xB0 | channel, 0x79, 0x00],
            timestamp
        });
    }
    // 発音中の音をノートオフ
    allNotesOff({data: {channel}, timestamp}) {
        this.send({
            data: [0xB0 | channel, 0x7B, 0x00],
            timestamp
        });
    }
    // 発音中の音や残響を即時に停止
    allSoundOff({data: {channel}, timestamp}) {
        this.send({
            data: [0xB0 | channel, 0x78, 0x00],
            timestamp
        });
    }
};
