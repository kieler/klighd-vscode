
/**
 * In an asyncronous context this method can be called to wait for some time.
 * @param ms wait time in ms
 */
export function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}