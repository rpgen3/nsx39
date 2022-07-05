export const tuning39 = messages => {
    const set = new Set;
    return messages.filter(message => {
        if (message.channel !== 0) return true;
        if ('pitch' in message) {
            if (set.has(message.when)) return false;
            else {
                set.add(message.when);
            }
        }
        return keep;
    });
};
