import {MidiTempoMessage} from 'https://rpgen3.github.io/piano/mjs/midi/MidiTempoMessage.mjs';
export class UstTempoMessage extends MidiTempoMessage {
    static makeArray(ustEventArray) {
        const result = [];
        let currentTime = 0;
        for(const {length, tempo} of ustEventArray) {
            if (tempo !== null) result.push(new this({
                when: currentTime,
                bpm: tempo
            }));
            currentTime += length || 0;
        }
        return result;
    }
}
