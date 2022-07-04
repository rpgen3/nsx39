import {MidiNote} from 'https://rpgen3.github.io/piano/mjs/midi/MidiNote.mjs';
export class UstNote extends MidiNote {
    constructor({start, end, ch, pitch, velocity, lyric}) {
        super({start, end, ch, pitch, velocity});
        this.lyric = lyric;
    }
    static makeArray(ustEventArray, ch = 0) {
        const result = [];
        let currentTime = 0;
        for (const {length, noteNum, lyric, intensity} of ustEventArray) {
            const end = currentTime + (length || 0);
            if (
                noteNum !== null &&
                lyric !== null &&
                intensity !== null
            ) {
                result.push(new this({
                    start: currentTime,
                    end,
                    ch,
                    pitch: noteNum,
                    velocity: intensity,
                    lyric
                }));
            }
            currentTime = end;
        }
        return result;
    }
}
