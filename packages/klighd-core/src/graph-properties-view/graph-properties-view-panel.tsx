//@ts-nocheck
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
import { /*GraphPropertiesViewRegistry,*/ SelectedElementsUtil } from "./graph-properties-view-registry.ts"
//TODO: sort and cleanup imports


/**
 * Sidebar panel that displays the graphproperties in a tableview,
 * such as quick actions, changing the synthesis or preferences.
 */
@injectable()
export class GraphPropertiesViewPanel extends SidebarPanel{
    // hierarchy is: first elem has the lowest number. so the last one got the highest
    readonly position = 2;
                                                    
    @postConstruct()
    async init(): Promise<void> {

        this.assignQuickActions()
    



        return "graph-properties-view-panel";
    }

    get title(): string {
        return "Graph-Properties-view";
    }

    update(): void {
        super.assignQuickActions()
        super.update()
    }

    const ele = SelectedElementsUtil.getSelectedElements()

    render(): VNode {
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
                        {
                        this.ele.map((i: number) => (
                        <tr>
                            <td /*onChange = {(e: any) => e.handle()}*/ > {this.ele[i].properties[0]} </td>
                            <td>
                                <select onChange = {(e: any) => e.handleUpdate() /* TODO*/}>
                                    {/*anfang map für available propertyvalues */}
                                    <option selected={this.ele[i].properties[1]}>
                                        {this.ele[i].properties[1] /*TODO possible values */}
                                    </option>
                                    {/*ende map für available propertyvalues */}
                                </select>
                            </td>
                            {/* <td>
                                {<select onchange={(e: Event) => getCurrentValue(e, props)} class-options__selection title={props.description ?? props.name}> {props.name}
                                {props.availableValues.map((value, i) => (
                                    <option selected={props.value === value}>
                                        {props.availableValuesLabels?.[i] ?? value}
                                    </option>
                                    ))}
                                </select>}
                                </td> */}
                        </tr>
                            ))
                        }
                    </table> 
                </div>
                
            </div>
        );
    }


    get icon(): VNode {
        return <FeatherIcon iconId={"credit-card"}/>;
    }
}
