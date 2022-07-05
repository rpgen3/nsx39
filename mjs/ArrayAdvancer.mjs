export class ArrayAdvancer {
    #array;
    #size;
    #index;
    #done;
    constructor(array) {
        if (!Array.isArray(array)) throw 'ArrayAdvancer must be array given.';
        this.#array = array;
        this.#size = array.length;
        this.done = false;
    }
    get done() {
        return this.#done;
    }
    set done(done) {
        this.#index = done ? this.#size : 0;
        this.#done = this.#isDone;
    }
    get #isDone() {
        return this.#index >= this.#size;
    }
    get head() {
        return this.#array[this.#index];
    }
    advance() {
        this.#index++;
        if (this.#isDone) this.#done = true;
    }
}
