export class MidiOutput {
    static async fetchMidiOutputs() {
        const midiAccess = await navigator.requestMIDIAccess({
            sysex: true,
            software: true
        });
        return midiAccess.outputs;
    }
    constructor(midiOutput) {
        this.midiOutput = midiOutput;
        this.allChannels = new Proxy(this, {
            get(target, prop) {
                return ({data, timestamp} = {}) => {
                    for (let i = 0; i < 0x10; i++) {
                        target[prop]({data: {channel: i, ...data}, timestamp});
                    }
                };
            }
        });
    }
    send({data, timestamp}) {
        this.midiOutput.send(data, timestamp);
    }
    /**
     * 鍵盤を押下
     * @param {number} channel - 0x00～0x0f
     * @param {number} pitch - 0x00～0x7f
     * @param {number} velocity - 0x00～0x7f
     */
    noteOn({data: {channel, pitch, velocity}, timestamp}) {
        this.send({
            data: [0x90 | channel, pitch, velocity],
            timestamp
        });
    }
    /**
     * 音色の切り替え
     * @param {number} channel - 0x00～0x0f
     * @param {number} program - 0x00～0x7f
     */
    programChange({data: {channel, program}, timestamp}) {
        this.send({
            data: [0xC0 | channel, program],
            timestamp
        });
    }
    /**
     * 効果の設定
     * @param {number} channel - 0x00～0x0f
     * @param {number} control - 0x00～0x77
     * @param {number} value - 0x00～0x7f
     */
    controlChange({data: {channel, control, value}, timestamp}) {
        this.send({
            data: [0xB0 | channel, control, value],
            timestamp
        });
    }
    /**
     * 効果の初期化
     * @param {number} channel - 0x00～0x0f
     */
    resetAllControllers({data: {channel}, timestamp}) {
        this.send({
            data: [0xB0 | channel, 0x79, 0x00],
            timestamp
        });
    }
    /**
     * 発音中の音を停止
     * @param {number} channel - 0x00～0x0f
     */
    allNotesOff({data: {channel}, timestamp}) {
        this.send({
            data: [0xB0 | channel, 0x7B, 0x00],
            timestamp
        });
    }
    /**
     * 発音中の音や残響を停止
     * @param {number} channel - 0x00～0x0f
     */
    allSoundOff({data: {channel}, timestamp}) {
        this.send({
            data: [0xB0 | channel, 0x78, 0x00],
            timestamp
        });
    }
};
