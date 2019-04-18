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
    dataPool: object
    input: object
}

export class SimulationStepMessage {
    values: object
}

export class SimulationStartedData {
    symbol: string
    initialValue: any
    input: boolean
    output: boolean
}

export class SimulationStoppedMessage {
    successful: boolean
    message: string
}