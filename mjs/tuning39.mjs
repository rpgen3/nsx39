export const tuning39 = ({messages, shiftedNoteTime, shiftedNoteOffTime}) => {
    for (const v of messages) if (v.channel === 0) v.when -= shiftedNoteTime;
    const noteOn = new Map;
    for (const {when, channel, pitch, velocity} of messages) {
        if (channel === 0 && velocity !== 0) noteOn.set(when, pitch);
    }
    const excluded = new Set;
    for (const [i, v] of messages.entries()) {
        const {when, channel, pitch, velocity} = v;
        if (channel === 0 && velocity === 0 && noteOn.has(when)) {
            if (pitch === noteOn.get(when)) v.when -= shiftedNoteOffTime;
            else excluded.add(i);
        }
    }
    return messages.filter((_, i) => !excluded.has(i));
};
