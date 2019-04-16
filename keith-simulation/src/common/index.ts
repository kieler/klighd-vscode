export const simulationWidgetId: string = "simulation-widget"

export const OPEN_SIMULATION_WIDGET_KEYBINDING = "ctrlcmd+alt+s"

export class SimulationData {
    data: any[]
    input: boolean
    output: boolean
}

export class SimulationStartedMessage {
    successful: boolean
    error: string
    initialValues: SimulationStartedData[]
}

export class SimulationStepMessage {
    values: SimulationStepData[]
}

export class SimulationStepData {
    symbol: string
    value:  any
    constructor(symbol: string, value: any) {
        this.symbol = symbol
        this.value = value
    }
}

export class SimulationStartedData {
    symbol: string
    initialValue: any
    input: boolean
    output: boolean
}

export class SimulationStoppedMessage {
    successful: boolean
    error: string
}