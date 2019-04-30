import { SimulationData } from ".";

/**
 * In an asynchronous context this method can be called to wait for some time.
 * @param ms wait time in ms
 */
export function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export function strMapToObj(strMap: Map<string, any>) {
    let obj = Object.create(null);
    strMap.forEach((v, k) => {
        obj[k] = v
    });
    return obj;
}

export function strMapToJson(strMap: any) {
    return JSON.stringify(strMapToObj(strMap));
}

export function isInternal(data: SimulationData) {
    return data.categories.includes("guard") || data.categories.includes("sccharts-generated") || data.categories.includes("term") || data.categories.includes("ticktime")
}

export function reverse(array: any[]) {
    return array.map((item, idx) => array[array.length - 1 - idx])
}