export interface Clock {
    now(): number
}

export class RealClock implements Clock {
    now(): number {
        return Date.now()
    }
}

export class FixedClock implements Clock {
    constructor(private nowMs: number) {}

    now(): number {
        return this.nowMs
    }

    sleep(durationMs: number): void {
        this.nowMs += durationMs
    }
}
