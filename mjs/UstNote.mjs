import {MidiNote} from 'https://rpgen3.github.io/piano/mjs/midi/MidiNote.mjs';
export class UstNote extends MidiNote {
    constructor({ch, pitch, velocity, start, end, lyric}) {
        super({ch, pitch, velocity, start, end});
        this.lyric = lyric;
    }
    static lyricRest = 'R';
    static makeArray(ust, ch = 0) {
        const result = [];
        let currentTime = 0;
        for (const str of ust.split(/\[#[0-9]{4}\]/)) {
            const m = new Map(str.split(/[\n\r]+/).map(v => v.split('=')).filter(v => v.length === 2));
            const length = Number(m.get('Length'));
            if (Number.isNaN(length)) throw 'The value of "Length" is NaN.';
            const noteNum = Number(m.get('NoteNum'));
            if (Number.isNaN(noteNum)) throw 'The value of "NoteNum" is NaN.';
            const intensity = Number(m.get('Intensity'));
            if (Number.isNaN(intensity)) throw 'The value of "Intensity" is NaN.';
            const lyric = m.get('Lyric');
            const end = currentTime + length;
            const ustNote = new UstNote({
                ch,
                pitch: noteNum,
                velocity: intensity,
                start: currentTime,
                end,
                lyric
            });
            result.push(ustNote);
            currentTime = end;
        }
        return result;
    }
}
