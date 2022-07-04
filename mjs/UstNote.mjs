import {MidiNote} from 'https://rpgen3.github.io/piano/mjs/midi/MidiNote.mjs';
export class UstNote extends MidiNote {
    constructor({ch, pitch, velocity, start, end, lyric}) {
        super({ch, pitch, velocity, start, end});
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
                    ch,
                    pitch: noteNum,
                    velocity: intensity,
                    start: currentTime,
                    end,
                    lyric
                }));
            }
            currentTime = end;
        }
        return result;
    }
}
