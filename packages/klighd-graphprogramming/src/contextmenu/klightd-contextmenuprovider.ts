
import { inject, injectable } from 'inversify';
import { Anchor, isSelected,  SModelRoot, TYPES, DiagramServerProxy } from 'sprotty';
import { Action } from 'sprotty-protocol';

import { KlighdIContextMenuService } from './klighd-service';

// color: var(--kdc-color-sidebar-font-primary);


@injectable()
export class ContextMenueProvider implements KlighdIContextMenuService{
    @inject(TYPES.ModelSource) protected serverProxy: DiagramServerProxy; 


    protected contextmenuID = "contextMenu"; // contextmenu items
    protected mainID = "mainID"; // the main div for the contextmenu
    protected rightsideMenuID = "contextRightsideMenu"; // items which may be deleted are stored in this div which is only shown when hovering deleteItem 
    protected deleteItemID = "deleteItem"; // added to context menu if there are items to delete

    protected containerElement: HTMLElement;
    protected activeElement: Element | null;
    protected onHide: any;

    show(root: SModelRoot, anchor: Anchor, onHide?: (() => void) | undefined): void {
        // (root.children[0] as any).properties['klighd.StructuralEditingActions'] // strores the posible actions for every type of SModelElement
        let menu = document.getElementById(this.contextmenuID);
        if(menu  == undefined) {
            // creates the main div in which we can store additional info
            menu = document.createElement("ul");
            menu.id = this.contextmenuID;
            this.setupMenuEntrys(menu);
            menu.style.marginTop = "-1px";
            menu.style.marginLeft = "-1px";
            
            menu.addEventListener("mouseleave", () => {
                if(menu != undefined) menu.style.display = "none";
                if( this.onHide != undefined ) this.onHide();
            });
            menu.addEventListener("wheel", () => {
                if(menu != undefined) menu.style.display = "none";
            });

            const sprotty = document.getElementById("sprotty");
            if(sprotty != null) sprotty.appendChild(menu); // since the contextmenu only makes sense to appear if a model is there we need sprotty tohave loaded!
            else return;
            
        }

        menu.style.display = "block";
        this.onHide = onHide;
        menu.innerHTML = "";

        //Positioning of the context menu
        menu.style.left = anchor.x.toString()+"px";
        menu.style.top = anchor.y.toString()+"px";  
        
        const selected = Array.from(root.index.all().filter(isSelected));

        if(selected.length == 1){
            // add context menu for every entry based on the Actions given by the server
            const msgs: StructuredEditMsg[] = (selected[0] as any).properties['klighd.StructuralEditingActions'];

            for( const msg of msgs){
                // each msg is a action given by the server
                const new_item = document.createElement("li");
                this.setupItemEntrys(new_item);
                new_item.innerText = msg.label;

                // simple mouselisteners so the color changes to indicate what is selected
                new_item.addEventListener('mouseenter', (ev) => {
                    new_item.style.backgroundColor = "#868585";
                });
                new_item.addEventListener('mouseleave', (ev) => {
                    new_item.style.backgroundColor = "#f7f7f7";
                });

                // main mouseaction if pressed a msg is send to the server
                new_item.addEventListener('mousedown', (ev) => {
                    // TODO: add input field for inputs
                    const action : NewServerActionMsg = NewServerActionMsg.create(msg.kind);
                    action.id = selected[0].id;

                    for( const field of msg.inputs){
                        console.log(field);

                    }

                    this.serverProxy.handle(action);
                });

                menu.appendChild(new_item);   
            }
        }else{
            // TODO: check if there is a mergable server msg that can be executed on all selected Nodes
            const msgs: StructuredEditMsg[] = (selected[0] as any).properties['klighd.StructuralEditingActions'];
            const mergableMsgs = new Map<StructuredEditMsg, number[]>();
            for( const msg of msgs){
                if(msg.mergable) mergableMsgs.set(msg, [0]);
            }
            for( let i = 1; i < selected.length; i++){
                const msgs = (selected[i] as any).properties['klighd.StructuralEditingActions'];
                for( const msg of msgs){
                    if(msg.mergable){
                        let added = false
                        mergableMsgs.forEach((value: number[], key: StructuredEditMsg) => {
                            if(key.kind === msg.kind){
                                added = true
                                mergableMsgs.set(key, value.concat([i]))
                            }
                        });
                        if(!added)mergableMsgs.set(msg, [i])
                    }
                }
            }
            console.log(mergableMsgs)
            mergableMsgs.forEach((nodes: number[], msg: StructuredEditMsg) => {

                // each msg is a action given by the server
                const new_item = document.createElement("li");
                this.setupItemEntrys(new_item);
                new_item.innerText = msg.label;

                // simple mouselisteners so the color changes to indicate what is selected
                new_item.addEventListener('mouseenter', (ev) => {
                    new_item.style.backgroundColor = "#868585";
                });
                new_item.addEventListener('mouseleave', (ev) => {
                    new_item.style.backgroundColor = "#f7f7f7";
                });

                // main mouseaction if pressed a msg is send to the server
                new_item.addEventListener('mousedown', (ev) => {
                    const action : NewServerActionMsg = NewServerActionMsg.create(msg.kind);

                    let id = selected[nodes[0]].id
                    for( let i = 1; i< nodes.length; i++) id = id.concat(":", selected[nodes[i]].id)
                    action.id = id
                    this.serverProxy.handle(action)
                })

                menu!.appendChild(new_item);     
            });
            
        }
    }

    setipHeaderEntrys(item: HTMLElement):void {
        item.style.display = "block";
        item.style.backgroundColor = "#f7f7f7";
        item.style.position = "relative";
        item.style.border = "2px solid #ccc";
    }

    setupItemEntrys(item: HTMLElement):void {
        item.style.display = "block";
        item.style.backgroundColor = "#f7f7f7";
        item.style.position = "relative";
        item.style.border = "1px solid #ccc";
        item.style.padding = "5px";
    }

    setupMenuEntrys(menu: HTMLElement):void {
        menu.style.float = "right";
        menu.style.position = "absolute";
        menu.style.listStyle = "none";
        menu.style.padding = "0";
        menu.style.display = 'none';
        menu.style.color = "var(--kdc-color-sidebar-font-primary)";
    }
}

interface StructuredEditMsg{
    label: string;
    kind: string;
    mergable: boolean;
    inputs: string[];
}

/**
 * A sprotty action to refresh the diagram. Send from client to server.
 */
 export interface NewServerActionMsg extends Action {
    kind: typeof NewServerActionMsg.KIND;
    [key: string]: any;
}

export namespace NewServerActionMsg {
    export let KIND: string;

    export function create(kind: string): NewServerActionMsg {
        return {
            kind: KIND = kind
        }
    }
}