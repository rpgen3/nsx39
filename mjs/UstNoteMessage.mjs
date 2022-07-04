import {MidiNoteMessage} from 'https://rpgen3.github.io/piano/mjs/midi/MidiNoteMessage.mjs';
export class UstNoteMessage extends MidiNoteMessage {
    constructor({when, ch, pitch, velocity, lyric}) {
        this.super({when, ch, pitch, velocity});
        this.lyric = lyric;
    }
    static makeArray(ustNoteArray) {
        const result = [];
        for (const {start, end, ch, pitch, velocity, lyric} of ustNoteArray) {
            for (const [i, v] of [
                start,
                end
            ].entries()) {
                result.push(new this({
                    when: v,
                    ch,
                    pitch,
                    velocity: i === 0 ? velocity : 0,
                    lyric
                }));
            }
        }
        return result;
    }
}
