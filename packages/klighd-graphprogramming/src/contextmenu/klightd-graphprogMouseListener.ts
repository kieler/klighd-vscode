/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019-2021 by
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

import { injectable, inject } from 'inversify';
import { MouseListener, SModelElement, TYPES, isSelectable,
         IActionDispatcher, isSelected } from 'sprotty'; 
import { KlighdIContextMenuService, KlighdIContextMenuServiceProvider } from './klighd-service';
import { DISymbol } from "../symbols";

import { Action, SelectAction } from "sprotty-protocol";

// basicly the same implementation as in the context menu from sprotty however sprottys doesn't yet suport marking with 
// rightclicking which seems quite inconvenient push request was made and is going to be resolved
@injectable()
export class graphprogrammingMouseListener extends MouseListener {
    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;
    @inject(DISymbol.KlighdIContextMenuServiceProvider) protected readonly contextMenuService: KlighdIContextMenuServiceProvider

    constructor(){super();}
    
    contextMenu(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        this.showContextMenu(target, event);
        return [];
    }

    
    async showContextMenu(target: SModelElement, ev: MouseEvent): Promise<void>{
        let menuService: KlighdIContextMenuService;
        try {
            menuService = await this.contextMenuService();
        } catch (rejected) {
            // There is no contextmenu service => do nothing
            return;
        }
        const root = target.root;
        const id = target.id;
        const mousePosition = {x:ev.x, y: ev.y};
        //to idicate what node is being modifyed we check if its selected if not we only select that node 
        //if it is selected maybe mult. nodes are selected for edeting
        if(isSelectable(target)){
            if(!isSelected(target)){
                // SelectAction will only select the node wich was selected by right click
                const options = {selectedElementsIDs: [id], deselectedElementsIDs: Array.from(root.index.all().filter(isSelected), (val) => {return val.id})}; 
                this.actionDispatcher.dispatch(SelectAction.create(options)).then(() => {
                    menuService.show( root, mousePosition);
                });
            }else{
                menuService.show( root, mousePosition);
            }
        }
    }
}