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
import { simulationWidgetId, SimulationData } from "../common"
import { Emitter } from "@theia/core";
import { Event } from '@theia/core/lib/common'


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

    public simulationData: Map<string, SimulationData> = new Map

    /**
     * Emit when compilation systems are requested.
     */
    readonly requestSystemDescriptions: Event<SimulationWidget | undefined> = this.onRequestSimulationSystemsEmitter.event
    readonly onDidChangeOpenStateEmitter = new Emitter<boolean>()

    constructor(
        @inject(new LazyServiceIdentifer(() => SimulationContribution)) protected readonly commands: SimulationContribution
    ) {
        super();
        this.id = simulationWidgetId
        this.title.label = 'Simulation'
        this.title.iconClass = 'fa fa-table ';
        this.addClass(simulationWidgetId) // class for index.css
        this.simulationData.set("TEst", {data: [[1], [2], [3], [4]]})
    }

    protected render(): React.ReactNode {
        return <React.Fragment>
             <div className="simulation-table">{this.renderSimulationData()}</div>
        </React.Fragment>

    }
    renderSimulationData(): React.ReactNode {
        let list: React.ReactElement[] = []
        this.simulationData.forEach((data, key) => {
            data.data.toString = () => this.simulationDataToString(data.data)
            if (data.data.length > 0) {
                data.data[0].toString = () => this.simulationDataToString(data.data[0])
            }
            const node: React.ReactElement = <tr key={key} className="simulation-data-row">
                    <th key="label" className="simulation-data-box">{key}</th>
                    <td key="value" className="simulation-data-box">{data.data[0].toString()}</td>
                    <td key="input" className="simulation-data-box">
                        <input id={"input-box-" + key}
                            title={"Current value is " + data.data[0].toString()}
                            className={"simulation-data-inputbox"}
                            type='text'
                            onClick={() => {this.setContentOfInputbox("input-box-" + key, key, data.data[0].toString())}}
                            placeholder={""}/>
                    </td>
                    <td key="history" className="simulation-data-box">{data.data.toString()}</td>
                </tr>
            list.push(node)
        })
        return <table className={"simulation-data-table"}>
            <thead>
                <tr key="headings" className="simulation-data-row">
                    <th key="label" className="simulation-data-box">label</th>
                    <th key="value" className="simulation-data-box">Current Value</th>
                    <th key="input" className="simulation-data-box">Input</th>
                    <th key="history" className="simulation-data-box">History</th>
                </tr>
            </thead>
            <tbody>
                {list}
            </tbody>
            </table>
    }

    setContentOfInputbox(id: string, key: string,  value: any) {
        const elem = document.getElementById(id) as HTMLInputElement
        if (elem.placeholder === "") {
            elem.value = value
            elem.addEventListener("keyup", (event) => {
                if (event.keyCode === 13) {
                    console.log("I got input" + elem.value)
                    elem.placeholder = elem.value
                    console.log("Got event with keycode " + event.keyCode)
                    elem.value = ""
                    const array = JSON.parse(elem.placeholder);
                    console.log("Array 0 is " + array[0])
                }
            })
        } else {
            console.log("Set value to palcehodler")
            elem.value = elem.placeholder
        }
    }

    handleInput(id: string, input: string) {
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
        throw new Error("Method not implemented.");
    }

    restoreState(oldState: SimulationWidget.Data): void {
        throw new Error("Method not implemented.");
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
    }
}