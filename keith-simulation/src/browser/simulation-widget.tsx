/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

// import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { injectable, LazyServiceIdentifer, inject } from "inversify";
import { StatefulWidget, ReactWidget, Message} from "@theia/core/lib/browser";
import * as React from "react";
import { SimulationContribution } from "./simulation-contribution";
import { simulationWidgetId, SimulationData, SimulationStoppedMessage, SimulationStepMessage } from "../common"
import { Emitter } from "@theia/core";
import { Event } from '@theia/core/lib/common'
import { delay, strMapToObj } from '../common/helper'


/**
 * Widget to compile and navigate compilation results. Should be linked to editor.
 */
@injectable()
export class SimulationWidget extends ReactWidget implements StatefulWidget {

    /**
     * Id of widget. Can be used to get an instance of this widget via the WidgetManager.
     */
    public static widgetId = simulationWidgetId


    protected readonly onRequestSimulationSystemsEmitter = new Emitter<SimulationWidget | undefined>()

    /**
     * Trace for each symbol.
     */
    public simulationData: Map<string, SimulationData> = new Map

    /**
     * Holds the value that is set in the next tick. Holds only the inputs of the simulation
     */
    public valuesForNextStep: Map<string, any> = new Map

    /**
     * Map which holds wether a event listener is registered for a symbol
     */
    public eventListenerRegistered: Map<string, boolean> = new Map

    /**
     * Whether the input/output column is added to the table.
     * this is part of the state of the widget.
     */
    protected displayInOut = false

    /**
     * Wether next simulation step should be requested after a time specified by simulation delay
     */
    protected play = false

    /**
     * Time in milliseconds to wait till next simulation step is requested in play mode.
     */
    protected simulationDelay: number = 1000

    protected simulationTypes: string[] = ["Periodic", "Manual", "Dynamic"]

    /**
     * Emit when compilation systems are requested.
     */
    readonly requestSystemDescriptions: Event<SimulationWidget | undefined> = this.onRequestSimulationSystemsEmitter.event
    readonly onDidChangeOpenStateEmitter = new Emitter<boolean>()

    /**
     * Set by SimulationContribution after a simulation is started or stopped.
     * If false disables step, stop and play.
     */
    public controlsEnabled: boolean

    protected inputOutputColumnEnabled: boolean

    constructor(
        @inject(new LazyServiceIdentifer(() => SimulationContribution)) protected readonly commands: SimulationContribution
    ) {
        super();
        this.id = simulationWidgetId
        this.title.label = 'Simulation'
        this.title.iconClass = 'fa fa-table ';
        this.addClass(simulationWidgetId) // class for index.css
        this.update()
    }

    protected render(): React.ReactNode {
        return <React.Fragment>
            {this.renderSimulationPanel()}
            <div key="table" className="simulation-table">{this.renderSimulationData()}</div>
        </React.Fragment>

    }

    renderSimulationPanel() {
        return <div className="simulation-panel">
            {false ? this.renderPlayPauseButton() : ""}
            {this.controlsEnabled ? this.renderStepButton() : ""}
            {this.controlsEnabled ? this.renderStopButton() : ""}
            {this.controlsEnabled ? this.renderIOButton() : ""}
            {this.renderSimulationTypeSelectbox()}
            {this.renderSimulationSpeedInputbox()}
        </div>
    }

    renderPlayPauseButton(): React.ReactNode {
        return <div title={this.play ? "Pause" : "Play"} key="play-pause-button" className={'preference-button' + (this.play ? '' : ' off')}
            onClick={event => this.startOrPauseSimulation()}>
            <div className={'icon fa ' + (this.play ? 'fa-play-circle' : 'fa-pause-circle')}/>
        </div>
    }

    async startOrPauseSimulation() {
        this.play = !this.play
        // TODO all the things
        if (this.play) {
            this.waitForNextStep()
        }
        this.update()
    }

    async waitForNextStep() {
        while (this.play) {
            console.log("Waiting for delay")
            this.executeSimulationStep()
            delay(this.simulationDelay)
            this.update()
        }
    }

    renderStepButton(): React.ReactNode {
        return <div title="Step" key="step-button" className={'preference-button'}
            onClick={event => this.executeSimulationStep()}>
            <div className={'icon fa fa-step-forward'}/>
        </div>
    }

    /**
     * Executes a simulation step on the LS.
     */
    async executeSimulationStep() {
        const lClient = await this.commands.client.languageClient
        // Transform the input map to an object since this is the format the LS supports
        let jsonObject = strMapToObj(this.valuesForNextStep)
        const message: SimulationStepMessage = await lClient.sendRequest("keith/simulation/step", [jsonObject, "Manual"]) as SimulationStepMessage
        // Transform jsonObject back to map
        const pool: Map<string, any> = new Map(Object.entries(message.values));
        if (pool) {
            pool.forEach((value, key) => {
                // push value in history and set new input value
                const history = this.simulationData.get(key)
                if (history !== undefined) {
                    history.data.push(value)
                    this.simulationData.set(key, history)
                    if (this.valuesForNextStep.get(key) !== undefined) {
                        console.log("Setting value for next step of " + key)
                        this.valuesForNextStep.set(key, value)
                    }
                } else {
                    this.stopSimulation()
                    this.commands.message("Unexpected value in simulation data, stopping simulation", "ERROR")
                    this.update()
                    return
                }
            });
        } else {
            this.commands.message("Simulation data values are undefined", "ERROR")
        }
        this.update()
    }

    renderStopButton(): React.ReactNode {
        return <div title="Stop" key="stop-button" className={'preference-button'}
            onClick={event => this.stopSimulation()}>
            <div className={'icon fa fa-stop'}/>
        </div>
    }

    /**
     * Request a simulation stop from the LS.
     */
    public async stopSimulation() {
        // Stop all simulation, i.e. empty maps and kill simulation process on LS
        this.valuesForNextStep.clear()
        this.simulationData.clear()
        this.play = false
        this.controlsEnabled = false
        const lClient = await this.commands.client.languageClient
        const message: SimulationStoppedMessage = await lClient.sendRequest("keith/simulation/stop") as SimulationStoppedMessage
        if (message.successful) {
            this.commands.message(message.message, "INFO")
        } else {
            this.commands.message(message.message, "ERROR")
        }
        // TODO kill some executable process by requested its termination on the LS
        this.update()
    }

    renderIOButton(): React.ReactNode {
        return <div title={"IO"}
            key="io-button" className={'preference-button'}
            onClick={event => this.toggleIO()}>
            <div className={'icon fa fa-exchange'}/>
        </div>
    }

    renderSimulationTypeSelectbox(): React.ReactNode {
        let selectionList: React.ReactNode[] = []
        this.simulationTypes.forEach(type => {
            selectionList.push(
                <option value={type} key={type}>{type}</option>
            )
            // TODO do stuff
        })
        return <div>
            <select id="simulation-type-list" className={'selection-list simulation-type-list'}
                onChange={() => this.handleSelectionOfSimulationType()} defaultValue={this.simulationTypes[0]}>
            {selectionList}
            </select>
        </div>
    }

    toggleIO() {
        this.inputOutputColumnEnabled = !this.inputOutputColumnEnabled
        this.update()
    }

    handleSelectionOfSimulationType(): void {
        throw new Error("Method not implemented.");
    }
    renderSimulationSpeedInputbox(): React.ReactNode {
        return <div></div>
    }

    /**
     * The history column should be an input box, to truncate the string better.
     */
    renderSimulationData(): React.ReactNode {
        let list: React.ReactElement[] = []
        if (this.simulationData.size === 0) {

        } else {
            this.simulationData.forEach((data, key) => {
                // nextStep is never undefined
                let nextStep = this.valuesForNextStep.get(key)
                let node: React.ReactElement;
                if (typeof nextStep === "boolean") { // boolean values are rendered as buttons
                    node = <tr key={key} className="simulation-data-row">
                        {this.renderInputOutputColumn(data)}
                        <th key="label" className="simulation-data-box" align="right">{key}</th>
                        <td key="value" className="simulation-data-box">{data.data ? JSON.stringify(data.data[data.data.length - 1]) : ""}</td>
                        <td key="input" className="simulation-data-box">
                            <input id={"input-box-" + key}
                                title={data.data ? JSON.stringify(data.data[data.data.length - 1]) : ""}
                                className={"simulation-data-button"}
                                type='button'
                                onClick={() => { this.setBooleanInput("input-box-" + key, key, nextStep as boolean, data) }}
                                placeholder={""} readOnly={!this.valuesForNextStep.has(key)}/>
                        </td>
                        <td key="next-step" className="simulation-data-box">{JSON.stringify(nextStep)}</td>
                        <td key="history" className="simulation-data-box history">
                            <input id={"input-box-" + key}
                                    className={"simulation-history-inputbox"}
                                    type='text'
                                    value={data.data ? JSON.stringify(data.data.reverse()) : ""}
                                    placeholder={""} readOnly/></td>
                    </tr>
                } else {
                    node = <tr key={key} className="simulation-data-row">
                        {this.renderInputOutputColumn(data)}
                        <th key="label" className="simulation-data-box" align="right">{key}</th>
                        <td key="value" className="simulation-data-box">{data.data ? JSON.stringify(data.data[data.data.length - 1]) : ""}</td>
                        <td key="input" className="simulation-data-box">
                            <input id={"input-box-" + key}
                                title={data.data ? "Current value is " + JSON.stringify(data.data[data.data.length - 1]) : ""}
                                className={"simulation-data-inputbox"}
                                type='text'
                                onClick={() => { this.setContentOfInputbox("input-box-" + key, key, nextStep) }}
                                placeholder={""} readOnly={!this.valuesForNextStep.has(key)}/>
                        </td>
                        <td key="next-step" className="simulation-data-box">{JSON.stringify(nextStep)}</td>
                        <td key="history" className="simulation-data-box history">
                            <input id={"input-box-" + key}
                                    className={"simulation-history-inputbox"}
                                    type='text'
                                    value={data.data ? JSON.stringify(data.data.reverse()) : ""}
                                    placeholder={""} readOnly/></td>
                    </tr>
                }
                list.push(node)
            })
            return <table className={"simulation-data-table"}>
                <thead>
                    <tr key="headings" className="simulation-data-row">
                        {this.renderInputOutputColumnHeader()}
                        <th key="label" className="simulation-data-box" align="left">Symbol</th>
                        <th key="value" className="simulation-data-box" align="left">Last Value</th>
                        <th key="input" className="simulation-data-box" align="left">Input</th>
                        <th key="next-step" className="simulation-data-box" align="left">Value for Next Tick</th>
                        <th key="history" className="simulation-data-box history" align="left">History</th>
                    </tr>
                </thead>
                <tbody>
                    {list}
                </tbody>
            </table>
        }
    }

    renderInputOutputColumn(data: SimulationData): React.ReactNode {
        if (this.inputOutputColumnEnabled) {
            return <td key="inputoutput" className="simulation-data-box" align="left">{data.input ? "input" : ""}{data.output ? "output" : ""}</td>
        } else {
            return
        }
    }

    renderInputOutputColumnHeader(): React.ReactNode {
        if (this.inputOutputColumnEnabled) {
            return <th key="inputoutput" className="simulation-data-box" align="left">Input/Output</th>
        } else {
            return
        }
    }

    setBooleanInput(id: string, key: string,  value: any, data: any) {
        if (this.valuesForNextStep.has(key)) {
            // if the value is a boolean just toggle it on click
            const elem = document.getElementById(id) as HTMLInputElement
            elem.value = (!value).toString()
            this.valuesForNextStep.set(key, !value)
            this.update()
        }
    }


    /**
     * Set in values in the next step. On click the current nextValue is set as value of the inputbox.
     * One can be sure that the LS handles the type checking.
     */
    setContentOfInputbox(id: string, key: string,  currentNextValue: any) {
        const elem = document.getElementById(id) as HTMLInputElement
        // set value that is the current value that will be set next tick as value of inputbox
        // Add event listener for inputbox
        // on enter the current value of the inputbox should be set as value for the next step
        const eventListenerRegistered = this.eventListenerRegistered.get(key)
        if (!eventListenerRegistered) {
            elem.value = JSON.stringify(currentNextValue)
            elem.addEventListener("keyup", (event) => {
                if (event.keyCode === 13) {
                    // prevents enter from doing things it should not do
                    event.preventDefault()
                    // parse value as JSON
                    let parsedValue
                    try {
                        parsedValue = JSON.parse(elem.value);
                    } catch (error) {
                        // return if not parsable
                        const currentNextValue = this.valuesForNextStep.get(key)
                        elem.value = JSON.stringify(currentNextValue)
                        this.commands.message(error.toString(), "ERROR")
                        return
                    }
                    // always assume that the parsed value is valid
                    this.valuesForNextStep.set(key, parsedValue)
                    elem.placeholder = JSON.stringify(parsedValue)
                    this.update()
                }
            })
        }
    }

    onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.update()
    }

    onUpdateRequest(msg: Message): void {
        super.onUpdateRequest(msg);
        this.render()
    }

    storeState(): SimulationWidget.Data {
        return {
            displayInOut: this.displayInOut
        }
    }

    restoreState(oldState: SimulationWidget.Data): void {
        this.displayInOut = oldState.displayInOut
    }

    simulationDataToString(data: any) {
        if (data instanceof Array) {
            let returnValue = "["
            data.forEach((value, index) => {
                let innerString = ""
                if (value instanceof Array) {
                    innerString = this.simulationDataToString(value)
                } else {
                    if (index !== 0) {
                        innerString = ", "
                    }
                    innerString += value.toString()
                }
                returnValue = returnValue + innerString
            })
            return returnValue + "]"
        } else {
            return data.toString()
        }
    }
}
/**
 * Definition of the state of the corresponding {@link SimulationWidget}.
 */
export namespace SimulationWidget {
    export interface Data {
        displayInOut: boolean
    }
}