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
import { MouseListener, SModelElement, TYPES, ContextMenuProviderRegistry, isSelectable, //IContextMenuServiceProvider, //IContextMenuService, 
         IActionDispatcher, isSelected } from 'sprotty'; 
import { Action, SelectAction } from "sprotty-protocol";

@injectable()
export class graphprogrammingMouseListener extends MouseListener {
    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;

    constructor(//@inject(TYPES.IContextMenuServiceProvider) protected readonly contextMenuService: IContextMenuServiceProvider,
                @inject(TYPES.IContextMenuProviderRegistry) protected readonly menuProvider: ContextMenuProviderRegistry){super();}
    
    contextMenu(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        this.showContextMenu(target, event);
        return [];
    }

    async showContextMenu(target: SModelElement, ev: MouseEvent){
        // let menuService: IContextMenuService;
        // try {
        //     menuService = await this.contextMenuService();
        // } catch (rejected) {
        //     // IContextMenuService is not bound => do nothing
        //     return;
        // }
        const root = target.root;
        const id = target.id;
        const mousePosition = {x:ev.x, y: ev.y};
        //to idicate what node is being modifyed we check if its selected if not we only select that node 
        //if it is selected maybe mult. nodes are selected for edeting
        if(isSelectable(target)){
            if(!isSelected(target)){
                // SelectAction will only select the node wich was selected by right click
                let options = {selectedElementsIDs: [id], deselectedElementsIDs: Array.from(root.index.all().filter(isSelected), (val) => {return val.id})}; 
                this.actionDispatcher.dispatch(SelectAction.create(options)).then(() => {
                    this.menuProvider.getItems(root, mousePosition).then((items) => {
                        //menuService.show(items, mousePosition);    
                    })
                });
            }else{
                // all selected nodes will create MenuItems
                this.menuProvider.getItems(root, mousePosition).then((items) => {
                    //menuService.show(items,mousePosition);
                })
            }
        }
    }
}