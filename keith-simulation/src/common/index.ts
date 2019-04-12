export const simulationWidgetId: string = "simulation-widget"

export const OPEN_SIMULATION_WIDGET_KEYBINDING = "ctrlcmd+alt+s"

export class SimulationData {
    data: any[]
}

export class SimulationDataType {
    value: any

    public toString() {
        return JSON.stringify(this.value)
    }
}

export class SimulationBoolean extends SimulationDataType {
    value: boolean
}

export class SimulationNumber extends SimulationDataType {
    value: number
}

export class SimulationArray extends SimulationDataType {
    value: SimulationDataType[]
}