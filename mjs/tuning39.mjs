export const tuning39 = messages => {
    const noteOn = new Set;
    for (const {when, channel, velocity = null} of messages) {
        if (channel === 0 && velocity !== 0 && velocity !== null) noteOn.add(when); 
    }
    const excluded = new Set;
    for (const [i, {when, channel, velocity}] of messages.entries()) {
        if (channel === 0 && velocity === 0 && noteOn.has(when)) excluded.add(i); 
    }
    return messages.filter((_, i) => excluded.has(i));
};
