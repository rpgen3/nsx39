const vowels = new Set([
    "あ",
    "い",
    "う",
    "え",
    "お",
    "ん",
]);
export const tuning39 = ({
    messages,
    shiftedNoteTime = 0,
    shiftedNoteOffTime = 0,
    shiftedPitch = 0,
    shiftedOctave = 0
}) => {
    for (const v of messages) if (v.channel === 0) v.pitch += shiftedPitch + shiftedOctave * 12;
    for (const v of messages) if (v.channel === 0) v.when -= shiftedNoteTime;
    const noteOn = new Map;
    for (const {when, channel, pitch, velocity} of messages) {
        if (channel === 0 && velocity !== 0) noteOn.set(when, pitch);
    }
    const excluded = new Set;
    for (const [i, v] of messages.entries()) {
        const {when, channel, pitch, velocity, lyric} = v;
        if (channel === 0) {
            if (velocity === 0) {
                if (noteOn.has(when)) {
                    if (pitch === noteOn.get(when)) {
                        v.when -= shiftedNoteOffTime;
                    } else {
                        excluded.add(i);
                    }
                }
            } else if (i !== 0) {
                if (lyric === messages[i - 1].lyric && !vowels.has(lyric)) {
                    messages[i - 1].when -= shiftedNoteOffTime;
                    excluded.delete(i - 1);
                }
            }
        }
    }
    return messages.filter((_, i) => !excluded.has(i));
};
