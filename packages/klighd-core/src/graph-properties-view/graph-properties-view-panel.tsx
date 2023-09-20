/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/** @jsx html */
import { injectable, postConstruct } from "inversify";
import { VNode } from "snabbdom";
import { html } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { FeatherIcon } from '../feather-icons-snabbdom/feather-icons-snabbdom';
import { SidebarPanel } from "../sidebar";
import { QuickActionsBar } from '../sidebar/sidebar-panel';
import { GraphPropertiesViewRegistry, SelectedElementsUtil } from "./graph-properties-view-registry"
//TODO: sort and cleanup imports


/**
 * Sidebar panel that displays the graphproperties in a tableview,
 * such as quick actions, changing the synthesis or preferences.
 */
@injectable()
export class GraphPropertiesViewPanel extends SidebarPanel{
    // hierarchy is: first elem has the lowest number. so the last one got the highest
    readonly position = 2;
    private index = 0

    
                                                    
    @postConstruct()
    async init(): Promise<void> {
        this.assignQuickActions()
    }

    get id(): string {
        return "graph-properties-view-panel";
    }

    get title(): string {
        return "Graph-Properties-view";
    }

    update(): void {
        super.assignQuickActions()
        super.update()
    }

    setIndex(i: number): number {
        this.index = i
        return this.index
    }


    render(): VNode {
        const selectedElements = SelectedElementsUtil.getSelectedElements()
        const prop = SelectedElementsUtil.getSelectedElements()[this.index].properties
        const propKey: string[] = []
        const propValue: any[] = []

        let i = 0
        for(const key in prop) {
            propKey[i]= key
            propValue[i]= prop[key]

            i++
        }

        
        return (
            <div>
                <QuickActionsBar
                    quickActions={this.getQuickActions()}
                    onChange={this.handleQuickActionClick.bind(this)}
                    thisSidebarPanel={this}
                />
                <div>
                    <table>
                        <tr>
                            <td>Property</td>
                            <td>Value</td>
                        </tr>
                        {propKey.map((element) => (
                        <tr>
                            <td> {element} </td>
                            <td> {prop[element]} </td>
                        </tr>
                        ))}
                    </table> 
                    </div> 
                
            </div>
        );
    }


    get icon(): VNode {
        return <FeatherIcon iconId={"credit-card"}/>;
    }
}
