import { inject, injectable } from 'inversify';
import { Anchor, isSelected,  SModelRoot, TYPES, DiagramServerProxy, Point, IActionDispatcher } from 'sprotty';
import { Action } from 'sprotty-protocol'; //
import { KlighdIContextMenuService } from './klighd-service';

// import { VsCodeApi } from 'sprotty-vscode-webview/src/services';


@injectable()
export class ContextMenueProvider implements KlighdIContextMenuService{
    @inject(TYPES.ModelSource) protected serverProxy: DiagramServerProxy; 
    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;

    // @inject(VsCodeApi) vsCodeApi: VsCodeApi;

    protected contextmenuID = "contextMenu"; // contextmenu items
    protected mainID = "mainID"; // the main div for the contextmenu
    protected rightsideMenuID = "contextRightsideMenu"; // items which may be deleted are stored in this div which is only shown when hovering deleteItem 
    protected deleteItemID = "deleteItem"; // added to context menu if there are items to delete

    protected containerElement: HTMLElement;
    protected activeElement: Element | null;
    protected onHide: any;

    static enableMouseTargeting: boolean
    static startPos: Point|undefined
    static destination: string | undefined;
    static selected_field_name: string;

    show(root: SModelRoot, anchor: Anchor, onHide?: (() => void) | undefined): void {
        // const vscode = acquireVsCodeApi();

        // (root.children[0] as any).properties['klighd.StructuralEditingActions'] // strores the posible actions for every type of SModelElement
        let menu = document.getElementById(this.contextmenuID);
        if(menu  == undefined) {
            // creates the main div in which we can store additional info
            menu = document.createElement("ul");
            menu.id = this.contextmenuID;
            this.setupMenuEntrys(menu);
            menu.style.marginTop = "-1px";
            menu.style.marginLeft = "-1px";
            menu.style.backgroundColor = "#f4f5f6";
            menu.style.border = "2px solid #bfc2c3";
            
            menu.addEventListener("mouseleave", () => {
                if(menu != undefined && document.getElementById("button")==null){
                    ContextMenueProvider.enableMouseTargeting = false
                    menu.style.display = "none";
                }
                if( this.onHide != undefined ) this.onHide();
            });
            menu.addEventListener("wheel", () => {
                ContextMenueProvider.enableMouseTargeting = false
                if(menu != undefined) menu.style.display = "none";
            });

            document.addEventListener("click", ev => {
                const ctx = document.querySelector("#" +this.contextmenuID)
                if (ctx !== null && !ev.composedPath().includes(ctx) && !ContextMenueProvider.enableMouseTargeting){
                    menu!.innerHTML = ""
                }
            });

            let sprotty
            if((sprotty = document.getElementById("sprotty")) != null) sprotty.appendChild(menu);
            else if((sprotty = document.getElementById("keith-diagram_sprotty")) != null)sprotty.appendChild(menu);
            else return;
            
        }
        menu.innerHTML = "";
        menu.style.backgroundColor = "#f4f5f6";
        
        const selected = Array.from(root.index.all().filter(isSelected));
        const options: StructuralEditingOptions = (selected[0].root.children[0] as any).properties['klighd.StructuralEditingOptions'];

        if(selected.length == 1){
            let structuredEditMesages:StructuredEditMsg[] = [];

            for(const prop of (selected[0] as any).properties["de.cau.cs.kieler.klighd.semanticFilter.tags"]){
                if(options.options[(prop as Property).tag] !== undefined) 
                    structuredEditMesages = structuredEditMesages.concat(options.options[(prop as Property).tag])
            }
            
            for( const msg of structuredEditMesages){
                console.log(msg)
                // each msg is a action given by the server
                const new_item = document.createElement("li");
                this.setupItemEntrys(new_item);
                new_item.innerText = msg.label;
                new_item.id = msg.kind
                // simple mouselisteners so the color changes to indicate what is selected
                new_item.addEventListener('mouseenter', (ev) => {
                    new_item.style.backgroundColor = "#bae5dd";
                    new_item.style.border = "1px solid #40c2a8";
                    new_item.style.borderRadius = "5px";
                });
                new_item.addEventListener('mouseleave', (ev) => {
                    new_item.style.backgroundColor = "#f4f5f6";
                    new_item.style.border = "";
                    new_item.style.borderRadius = "";
                });

                // main mouseaction if pressed a msg is send to the server
                new_item.addEventListener('mousedown', (ev) => {
                    const action : NewServerActionMsg = NewServerActionMsg.create(msg.kind);
                    action.id = selected[0].id

                    if(msg.inputs.length == 0){
                        menu!.style.display = "none"
                        this.serverProxy.handle(action)
                        return
                    }

                    menu!.innerHTML = ''

                    menu!.style.backgroundColor = "#f4f5f6";

                    menu!.style.border = "1px solid #c4c7c8";
                    

                    const fieldset = document.createElement("form");
                    fieldset.id = "form"
                    this.setupHeaderEntrys(fieldset)
                    let hasSelect = false

                    for( const field of msg.inputs){
                        switch(field.type_of_Input){
                            case "String":{

                                const label = document.createElement("label");
                                label.innerText = field.label
                                

                                const input_field = document.createElement("input");
                                input_field.id = field.field

                                fieldset.appendChild(label)
                                fieldset.appendChild(document.createElement("br"))
                                fieldset.appendChild(input_field)
                                fieldset.appendChild(document.createElement("br"))

                                input_field.addEventListener("keydown", (event) => {
                                    if ( event.key === "Enter" ){
                                        document.getElementById("button")!.click()
                                        event.preventDefault()   
                                    }
                                  });
                                
                                break
                            }
                            case "Select":{
                                ContextMenueProvider.selected_field_name = field.field
                                hasSelect = true
                                ContextMenueProvider.destination = undefined
                                ContextMenueProvider.enableMouseTargeting = true
                                ContextMenueProvider.startPos = anchor
                            }
                        }
                    }

                    ev.preventDefault();
                    if(hasSelect){
                        (async() => {
                            while(ContextMenueProvider.destination === undefined) // define the condition as you like
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            action[ContextMenueProvider.selected_field_name] = ContextMenueProvider.destination
                            this.menuDisplayButtonAndSelectedMenu(menu!, fieldset, action)
                        })();
                    }else{
                        this.menuDisplayButtonAndSelectedMenu(menu!, fieldset, action) 
                    }
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

        menu.style.display = "block";
        this.onHide = onHide;

        //Positioning of the context menu
        menu.style.left = anchor.x.toString()+"px";
        menu.style.top = anchor.y.toString()+"px";
        
        const window_height = menu.parentElement!.offsetHeight
        const window_width = menu.parentElement!.offsetWidth

        if(menu.offsetHeight + menu.offsetTop > window_height)menu.style.top = (window_height - menu.offsetHeight).toString() + "px"

        if(menu.offsetWidth + menu.offsetLeft > window_width)menu.style.left = (window_width - menu.offsetWidth).toString() + "px"
    }

    menuDisplayButtonAndSelectedMenu(menu: HTMLElement, fieldset: HTMLElement, action: NewServerActionMsg){
        menu?.appendChild(fieldset)
        const field = document.getElementById("form")!
        console.log(field.childNodes.length)
        if(field.childNodes.length === 0){
            this.serverProxy.handle(action);
            menu!.style.display = "none"

            ContextMenueProvider.enableMouseTargeting = false  
            return
        }

        const button = document.createElement("button")
        button.id = "button";
        button.innerText = "Submit"
        button.style.left = "50%"
        button.style.transform = "translateX(-50%)"
        button.style.position = "relative"
        
        button.addEventListener('click', (ev) => {

            for(const f of Array.prototype.slice.call(field.childNodes)){
                if(f instanceof HTMLInputElement ){
                    action[f.id] = f.value
                } 
            }
            this.serverProxy.handle(action);
            menu!.style.display = "none"

            ContextMenueProvider.enableMouseTargeting = false   
        }, false);

        menu?.appendChild(button)
        
        const id = menu?.children.item(0)!.id
        document.getElementById(document.getElementById(id!)!.children.item(2)!.id)?.focus()
    }

    setupHeaderEntrys(item: HTMLElement):void {
        item.style.display = "block";
        item.style.backgroundColor = "#f4f5f6";
        item.style.position = "relative";
        item.style.border = "2px solid #bfc2c3";
    }

    setupItemEntrys(item: HTMLElement):void {
        item.style.display = "block";
        item.style.backgroundColor = "#f4f5f6";
        item.style.position = "relative";
        // item.style.border = "1px solid #ccc";#40c2a8
        item.style.padding = "5px";
    }

    setupMenuEntrys(menu: HTMLElement):void {
        menu.style.float = "right";
        menu.style.position = "absolute";
        menu.style.listStyle = "none";
        menu.style.padding = "0";
        menu.style.display = 'none';
        menu.style.color = "#3e4144"; 
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

class Property{
    tag: string;
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