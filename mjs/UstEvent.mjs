export class UstEvent {
    constructor({length, noteNum, lyric, intensity, tempo}) {
        this.length = length;
        this.noteNum = noteNum;
        this.lyric = lyric;
        this.intensity = intensity;
        this.tempo = tempo;
    }
    static toNullableNumber(any) {
        const n = Number(any);
        return Number.isNaN(n) ? null : n;
    }
    static toNullableString(any) {
        const n = String(any);
        return n.length === 0 ? null : n;
    }
    static makeArray(ust) {
        const result = [];
        for (const str of ust.split('[')) {
            const m = new Map(str.split(/[\n\r]+/).map(v => v.split('=')).filter(v => v.length === 2));
            const length = this.toNullableNumber(m.get('Length'));
            const noteNum = this.toNullableNumber(m.get('NoteNum'));
            const lyric = this.toNullableString(m.get('Lyric'));
            const intensity = this.toNullableNumber(m.get('Intensity')) || 100;
            const tempo = this.toNullableNumber(m.get('Tempo'));
            if (
                length === null &&
                noteNum === null &&
                lyric === null &&
                tempo === null
            ) continue;
            result.push(new this({length, noteNum, lyric, intensity, tempo}));
        }
        return result;
    }
}
