import {MidiNoteMessage} from 'https://rpgen3.github.io/piano/mjs/midi/MidiNoteMessage.mjs';
export class UstNoteMessage extends MidiNoteMessage {
    constructor({ch, pitch, velocity, when, lyric}) {
        this.super({ch, pitch, velocity, when});
        this.lyric = lyric;
    }
    static makeArray(ustNoteArray) {
        const result = [];
        for (const {ch, pitch, velocity, start, end, lyric} of ustNoteArray) {
            for (const [i, v] of [
                start,
                end
            ].entries()) {
                result.push(new this({
                    ch,
                    pitch,
                    velocity: i === 0 ? velocity : 0,
                    when: v,
                    lyric
                }));
            }
        }
        return result;
    }
}
