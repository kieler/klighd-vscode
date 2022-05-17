/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import * as vscode from 'vscode';
import * as path from 'path';



/**
 * TODO: this is the point where we want to access the current model using the SendModelAndContextAction (doesn't exist in main branch yet)
 * and read out the data to fill the tree view
 */
export class PropertiesTreeDataProvider implements vscode.TreeDataProvider<PropertyData> {

    getTreeItem(element: PropertyData): vscode.TreeItem {
        return element;
    }

    getChildren(element?: PropertyData): vscode.ProviderResult<PropertyData[]> {
        return undefined // TODO: figure out what to do here
    }

}

class PropertyData extends vscode.TreeItem {
    constructor(
        public readonly id: string,
        public readonly data: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(id, collapsibleState);
        this.tooltip = `${this.id}: ${this.data}`
        this.description = this.data
    }

    // TODO: iconpath stuff
}