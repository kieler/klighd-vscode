
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

            let sprotty
            if((sprotty = document.getElementById("sprotty")) != null) sprotty.appendChild(menu);
            else if((sprotty = document.getElementById("keith-diagram_sprotty")) != null)sprotty.appendChild(menu);
            else return;
            
        }

        menu.style.display = "block";
        this.onHide = onHide;
        menu.innerHTML = "";

        //Positioning of the context menu
        menu.style.left = anchor.x.toString()+"px";
        menu.style.top = anchor.y.toString()+"px";  
        
        const selected = Array.from(root.index.all().filter(isSelected));
        const options: StructuralEditingOptions = (selected[0].root.children[0] as any).properties['klighd.StructuralEditingOptions'];

        if(selected.length == 1){
            // add context menu for every entry based on the Actions given by the server
            let type = (selected[0] as any).properties['klighd.NodeType']

            for(const key in options.options){
                if(key.includes(type)){
                    type = key
                    break
                }
            }
            
            
            for( const msg of options.options[type]){
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
                    action.id = selected[0].id

                    if(msg.inputs.length == 0){
                        menu!.style.display = "none"
                        this.serverProxy.handle(action)
                        return
                    }

                    menu!.innerHTML = ''

                    menu!.style.backgroundColor = "#f7f7f7";

                    menu!.style.border = "1px solid #ccc";
                    

                    let first = true
                    const fieldset = document.createElement("form");
                    fieldset.id = "form"
                    this.setupHeaderEntrys(fieldset)

                    for( const field of msg.inputs){
                        switch(field.type_of_Input){
                            case "String":{

                                const label = document.createElement("label");
                                label.innerText = field.label
                                

                                const input_field = document.createElement("input");
                                input_field.id = field.field

                                if(first){
                                    input_field.id = "first"
                                    first = false
                                }

                                fieldset.appendChild(label)
                                fieldset.appendChild(document.createElement("br"))
                                fieldset.appendChild(input_field)
                                fieldset.appendChild(document.createElement("br"))

                                input_field.addEventListener("keydown", (event) => {
                                    if (event.isComposing || event.keyCode === 9 ) {
                                        action[field.field] = input_field.value
                                    }else if (event.isComposing || event.keyCode === 13 ){
                                        action[field.field] = input_field.value
                                        menu!.style.display = "none"
                                        this.serverProxy.handle(action);
                                    }
                                  });
                                
                                
                            }
                        }
                    }

                    menu?.appendChild(fieldset)

                    const button = document.createElement("button")
                    button.innerText = "Submit"
                    button.style.left = "50%"
                    button.style.transform = "translateX(-50%)"
                    button.style.position = "relative"
                    
                    button.addEventListener('click', (ev) => {
                        const field = document.getElementById("form")!
                        console.log("button pressed")
                        for(const f of Array.prototype.slice.call(field.childNodes)){
                            if(f instanceof HTMLInputElement){
                                action[f.id] = f.value
                            } 
                        }
                        menu!.style.display = "none"
                        this.serverProxy.handle(action);
                    }, false);

                    menu?.appendChild(button)

                    document.getElementById("first")!.focus()
                    // action.id = selected[0].id;

                    // this.serverProxy.handle(action);
                });

                menu.appendChild(new_item);   
            }
        }else{
            // TODO: check if there is a mergable server msg that can be executed on all selected Nodes
            const msgs: StructuralEditingOptions = (selected[0].root as any).properties['klighd.StructuralEditingOptions'];

            console.log(msgs)
            // const mergableMsgs = new Map<StructuredEditMsg, number[]>();
            // for( const msg of msgs){
            //     if(msg.mergable) mergableMsgs.set(msg, [0]);
            // }
            // for( let i = 1; i < selected.length; i++){
            //     const msgs = (selected[i].root as any).properties['klighd.StructuralEditingOptions'];
            //     for( const msg of msgs){
            //         if(msg.mergable){
            //             let added = false
            //             mergableMsgs.forEach((value: number[], key: StructuredEditMsg) => {
            //                 if(key.kind === msg.kind){
            //                     added = true
            //                     mergableMsgs.set(key, value.concat([i]))
            //                 }
            //             });
            //             if(!added)mergableMsgs.set(msg, [i])
            //         }
            //     }
            // }
            // console.log(mergableMsgs)
            // mergableMsgs.forEach((nodes: number[], msg: StructuredEditMsg) => {

            //     // each msg is a action given by the server
            //     const new_item = document.createElement("li");
            //     this.setupItemEntrys(new_item);
            //     new_item.innerText = msg.label;

            //     // simple mouselisteners so the color changes to indicate what is selected
            //     new_item.addEventListener('mouseenter', (ev) => {
            //         new_item.style.backgroundColor = "#868585";
            //     });
            //     new_item.addEventListener('mouseleave', (ev) => {
            //         new_item.style.backgroundColor = "#f7f7f7";
            //     });

            //     // main mouseaction if pressed a msg is send to the server
            //     new_item.addEventListener('mousedown', (ev) => {
            //         const action : NewServerActionMsg = NewServerActionMsg.create(msg.kind);

            //         let id = selected[nodes[0]].id
            //         for( let i = 1; i< nodes.length; i++) id = id.concat(":", selected[nodes[i]].id)
            //         action.id = id
            //         this.serverProxy.handle(action)
            //     })

            //     menu!.appendChild(new_item);     
            // });
            
        }
    }

    setupHeaderEntrys(item: HTMLElement):void {
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
        menu.style.color = "#000000";
    }
}

interface StructuralEditingOptions{
    options: Record<string, StructuredEditMsg[]>
}

interface StructuredEditMsg{
    label: string;
    kind: string;
    mergable: boolean;
    inputs: InputType[];
}

class InputType{
    field: string;
    type_of_Input: string;
    label: string;
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