import {MidiNoteMessage} from 'https://rpgen3.github.io/piano/mjs/midi/MidiNoteMessage.mjs';
export class UstNoteMessage extends MidiNoteMessage {
    constructor({when, channel, pitch, velocity, lyric}) {
        this.super({when, channel, pitch, velocity});
        this.lyric = lyric;
    }
    static makeArray(ustNoteArray) {
        const result = [];
        for (const {start, end, channel, pitch, velocity, lyric} of ustNoteArray) {
            for (const [i, v] of [
                start,
                end
            ].entries()) {
                result.push(new this({
                    when: v,
                    channel,
                    pitch,
                    velocity: i === 0 ? velocity : 0,
                    lyric
                }));
            }
        }
        return result;
    }
}
