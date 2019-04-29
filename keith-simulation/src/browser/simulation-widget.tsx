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
import { delay, strMapToObj } from '../common/helper'
import { CompilationSystems } from "@kieler/keith-kicool/lib/common/kicool-models"


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

    readonly onDidChangeOpenStateEmitter = new Emitter<boolean>()

    /**
     * Set by SimulationContribution after a simulation is started or stopped.
     * If false disables step, stop and play.
     */
    public controlsEnabled: boolean

    /**
     * Indicates whether the input/output column should be displayed.
     */
    protected inputOutputColumnEnabled: boolean

    /**
     * Indicates whether a simulation is currently running.
     */
    public simulationRunning: boolean

    protected showInternalVariables: boolean

    public categories: string[] = []

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
        if (!this.commands.kicoolContribution ||
            !this.commands.kicoolContribution.compilerWidget ||
            this.commands.kicoolContribution.compilerWidget.systems.length === 0) {
            return this.renderSpinner()
        } else {
            return <React.Fragment>
                {this.renderSimulationPanel()}
                {this.commands.kicoolContribution.compilerWidget.compiling ? this.renderSpinner() : ""}
                <div key="table" className="simulation-table">{this.renderSimulationData()}</div>
            </React.Fragment>
        }
    }

    renderSpinner() {
        return <div className='spinnerContainer'>
            <div className='fa fa-spinner fa-pulse fa-3x fa-fw'></div>
        </div>;
    }

    /**
     * Renders the control panel of the simulation widget.
     * The play/pause button is hidden. TODO shot it whenever a simulation is running.
     * Step, stop, and IO button are only shown if a simulation is running.
     * The simulation type selectbox and simulation speed input box are always shown.
     * The simulation compilation system selectbox and the compile button are only shown if no simulation is running.
     * The restart button is only shown if the last invoked compilation system is a simulation compilation system.
     */
    renderSimulationPanel() {
        return <div className="simulation-panel">
            {false ? this.renderPlayPauseButton() : ""}
            {this.simulationRunning ? this.renderStepButton() : ""}
            {this.simulationRunning ? this.renderStopButton() : ""}
            {this.simulationRunning ? this.renderIOButton() : ""}
            {this.simulationRunning ? this.renderShowInternalButton() : ""}
            {this.renderSimulationTypeSelectbox()}
            {this.renderSimulationSpeedInputbox()}
            {this.simulationRunning ? "" : this.renderSimulationSelectionBox()}
            {this.simulationRunning ? "" : this.renderCompileButton()}
            {this.commands.kicoolContribution.compilerWidget.lastInvokedCompilation.includes("simulation") && !this.simulationRunning ? this.renderRestartButton() : ""}
        </div>
    }

    renderPlayPauseButton(): React.ReactNode {
        return <div title={this.play ? "Pause" : "Play"} key="play-pause-button" className={'preference-button' + (this.play ? '' : ' off')}
            onClick={event => this.startOrPauseSimulation()}>
            <div className={'icon fa ' + (this.play ? 'fa-play-circle' : 'fa-pause-circle')}/>
        </div>
    }

    /**
     * TODO implement
     */
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
                        this.valuesForNextStep.set(key, value)
                    }
                } else {
                    this.stopSimulation()
                    this.commands.message("Unexpected value for " + key + "in simulation data, stopping simulation", "ERROR")
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
        this.simulationRunning = false
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
            key="io-button" className={'preference-button' + (this.inputOutputColumnEnabled ? '' : ' off')}
            onClick={event => this.toggleIO()}>
            <div className={'icon fa fa-exchange'}/>
        </div>
    }

    toggleIO() {
        this.inputOutputColumnEnabled = !this.inputOutputColumnEnabled
        this.update()
    }

    renderShowInternalButton(): React.ReactNode {
        return <div title={this.showInternalVariables ? "Disable internal variables" : "Show internal variables"}
            key="toggle-internal-button" className={'preference-button' + (this.showInternalVariables ? '' : ' off')}
            onClick={event => this.toggleShowInternal()}>
            <div className={'icon fa fa-cog'}/>
        </div>
    }

    toggleShowInternal() {
        this.showInternalVariables = !this.showInternalVariables
        this.update()
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

    handleSelectionOfSimulationType(): void {
        throw new Error("Method not implemented.");
    }
    renderSimulationSpeedInputbox(): React.ReactNode {
        return <div></div>
    }


    renderSimulationSelectionBox(): React.ReactNode {
        const simulationCommands: React.ReactNode[] = [];
        this.commands.kicoolContribution.compilerWidget.systems.forEach((system: CompilationSystems)  => {
            if (system.label.toLowerCase().search("simulation") > -1) {
                simulationCommands.push(<option value={system.id} key={system.id}>{system.label}</option>)
            }
        })
        return <select id="simulation-list" className={'selection-list simulation-list'}>
            {simulationCommands}
        </select>
    }

    renderCompileButton(): React.ReactNode {
        return <div className={'compile-button'} title="Compile"
            onClick={event => {
                this.startSimulation()
            }}>
            <div className='icon fa fa-play-circle'> </div>
        </div>
    }

    async startSimulation() {
        const selection = document.getElementById("simulation-list") as HTMLSelectElement;
        const option = selection.selectedOptions[0]
        if (option !== undefined) {
            await this.commands.kicoolContribution.compile(option.value)
            this.commands.simulate()
        } else {
            this.commands.message("Option is undefined, did not simulate", "ERROR")
        }
    }

    renderRestartButton(): React.ReactNode {
        return <div className={'compile-button'} title="Restart"
            onClick={event => {
                this.commands.simulate()
            }}>
            <div className='icon rotate180 fa fa-reply'> </div>
        </div>
    }

    /**
     * The history column should be an input box, to truncate the string better.
     */
    renderSimulationData(): React.ReactNode {
        let list: React.ReactElement[] = []
        if (this.simulationData.size === 0) {

        } else {
            this.simulationData.forEach((data, key) => {
                // only add data that if input, output or internal data should be shown
                if (this.showInternalVariables || !this.isInternal(data)) {
                    // nextStep is never undefined
                    let nextStep = this.valuesForNextStep.get(key)
                    let node: React.ReactElement;
                    if (typeof nextStep === "boolean") { // boolean values are rendered as buttons
                        node = <tr key={key} className="simulation-data-row">
                            {this.renderInputOutputColumn(data)}
                            <th key="label" className="simulation-data-box" align="left"><div>{key}</div></th>
                            <td key="value" className="simulation-data-box">
                                <div>{data.data ? JSON.stringify(data.data[data.data.length - 1]) : ""}</div>
                            </td>
                            <td key="input" className="simulation-data-box">
                                <div>
                                    <input id={"input-box-" + key}
                                        title={data.data ? JSON.stringify(data.data[data.data.length - 1]) : ""}
                                        className={"simulation-data-button"}
                                        type='button'
                                        onClick={() => { this.setBooleanInput("input-box-" + key, key, nextStep as boolean, data) }}
                                        placeholder={""} readOnly={!this.valuesForNextStep.has(key)}/>
                                </div>
                            </td>
                            <td key="next-step" className="simulation-data-box"><div>{JSON.stringify(nextStep)}</div></td>
                            <td key="history" className="simulation-data-box history"><div>
                                <input id={"input-box-" + key}
                                        className={"simulation-history-inputbox"}
                                        type='text'
                                        value={data.data ? JSON.stringify(data.data.reverse()) : ""}
                                        placeholder={""} readOnly/></div></td>
                        </tr>
                    } else {
                        node = <tr key={key} className="simulation-data-row">
                            {this.renderInputOutputColumn(data)}
                            <th key="label" className="simulation-data-box" align="left"><div>{key}</div></th>
                            <td key="value" className="simulation-data-box">
                                <div>{data.data ? JSON.stringify(data.data[data.data.length - 1]) : ""}</div>
                            </td>
                            <td key="input" className="simulation-data-box">
                                <div>
                                    <input id={"input-box-" + key}
                                        title={data.data ? "Current value is " + JSON.stringify(data.data[data.data.length - 1]) : ""}
                                        className={"simulation-data-inputbox"}
                                        type='text'
                                        onClick={() => { this.setContentOfInputbox("input-box-" + key, key, nextStep) }}
                                        placeholder={""} readOnly={!this.valuesForNextStep.has(key)}/>
                                </div>
                            </td>
                            <td key="next-step" className="simulation-data-box"><div>{JSON.stringify(nextStep)}</div></td>
                            <td key="history" className="simulation-data-box history">
                                <div>
                                    <input id={"input-box-" + key}
                                            className={"simulation-history-inputbox"}
                                            type='text'
                                            value={data.data ? JSON.stringify(data.data.reverse()) : ""}
                                            placeholder={""} readOnly/></div></td>
                        </tr>
                    }
                    list.push(node)
                }
            })
            return <table className={"simulation-data-table"}>
                <thead>
                    <tr key="headings" className="simulation-data-row">
                        {this.renderInputOutputColumnHeader()}
                        <th key="label" className="simulation-data-box" align="left"><div className="simulation-div">Symbol</div></th>
                        <th key="value" className="simulation-data-box" align="left"><div className="simulation-div">Last Value</div></th>
                        <th key="input" className="simulation-data-box" align="left"><div>Input</div></th>
                        <th key="next-step" className="simulation-data-box" align="left"><div className="simulation-div">Value for Next Tick</div></th>
                        <th key="history" className="simulation-data-box history" align="left"><div className="simulation-div">History</div></th>
                    </tr>
                </thead>
                <tbody>
                    {list}
                </tbody>
            </table>
        }
    }

    isInternal(data: SimulationData) {
        return data.categories.includes("guard") || data.categories.includes("sccharts-generated") || data.categories.includes("term") || data.categories.includes("ticktime")
    }

    renderInputOutputColumn(data: SimulationData): React.ReactNode {
        if (this.inputOutputColumnEnabled) {
            return <td key="inputoutput" className="simulation-data-box" align="left">
                    <div>
                        {data.input ? "input" : ""}
                        {data.output ? "output" : ""}
                        {data.categories}
                    </div>
                </td>
        } else {
            return
        }
    }

    renderInputOutputColumnHeader(): React.ReactNode {
        if (this.inputOutputColumnEnabled) {
            return <th key="inputoutput" className="simulation-data-box" align="left"><div className="simulation-div">Input/Output</div></th>
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