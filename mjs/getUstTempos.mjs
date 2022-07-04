export const getUstTempos = ustEventArray => {
    const result = new Map;
    let currentTime = 0;
    for(const {length, tempo} of ustEventArray) {
        if (tempo !== null) result.set(currentTime, tempo);
        currentTime += length || 0;
    }
    if(result.size) return result;
    else throw 'BPM is none.';
};
