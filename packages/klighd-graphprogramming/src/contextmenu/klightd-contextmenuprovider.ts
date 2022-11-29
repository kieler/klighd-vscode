
import { injectable } from 'inversify';
import { Anchor, IContextMenuService, LabeledAction, MenuItem } from 'sprotty'; 

// color: var(--kdc-color-sidebar-font-primary);


@injectable()
export class ContextMenueProvider implements IContextMenuService{
    // might be smart to only use this provider for sccharts thus checking if the model is an scchart model might be nice and simply do nothing otherwise

    protected contextmenuID = "contextMenu"; // contextmenu items
    protected mainID = "mainID"; // the main div for the contextmenu
    protected rightsideMenuID = "contextRightsideMenu"; // items which may be deleted are stored in this div which is only shown when hovering deleteItem 
    protected deleteItemID = "deleteItem"; // added to context menu if there are items to delete

    protected containerElement: HTMLElement;
    protected activeElement: Element | null;
    protected onHide: any;

    protected nodes: string[] = [];
    protected io: string[] = [];
    protected edges: string[] = [];
    protected regions: string[] = [];
    

    show(items: MenuItem[], anchor: Anchor, onHide?: (() => void) | undefined): void {
        
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
        
        this.pushItems(items);

        if(this.nodes.length != 0){
            const new_item = document.createElement("li");
            this.setipHeaderEntrys(new_item);
            menu.appendChild(new_item);
            const a = document.createElement("a");
            a.innerText = "Nodes";
            new_item.appendChild(a);
        }
        
        for( const item of this.nodes) this.createNewRightsideMenu(item, "Node");

        if(this.edges.length != 0){
            const new_item = document.createElement("li");
            this.setipHeaderEntrys(new_item);
            menu.appendChild(new_item);
            const a = document.createElement("a");
            a.innerText = "Edges";
            new_item.appendChild(a);
        }
        for( const item of this.edges) this.createNewRightsideMenu(item, "Edge");
        
        if(this.regions.length != 0){
            const new_item = document.createElement("li");
            this.setipHeaderEntrys(new_item);
            menu.appendChild(new_item);
            const a = document.createElement("a");
            a.innerText = "Regions";
            new_item.appendChild(a);
        }
        for (const item of this.regions ) this.createNewRightsideMenu(item, "Region");
        
    }
    
    private pushItems(items: MenuItem[]){

        this.io, this.edges, this.nodes, this.regions = [];
        for(const item of items){
            for(const x of (item as LabeledAction).actions){
                switch(item.id){
                    case "getIO":
                        this.io.push((x as any).elementID);
                        break;
                    case "getNodes":
                        this.nodes.push((x as any).elementID);
                        break;
                    case "getEdges":
                        this.edges.push((x as any).elementID);
                        break;
                    case "getRegion":
                        this.regions.push((x as any).elementID);
                        break;
                }
            }
        }  
    }

    private createNewRightsideMenu(name: string, type: string){
        const new_item = document.createElement("li");
        this.setupItemEntrys(new_item);

        document.getElementById(this.contextmenuID)?.appendChild(new_item);


        const text = document.createElement("a");
        new_item.appendChild(text);

        const arr = name.split("$");
        text.innerText = arr[arr.length-1].substring(1);
        
        const rightsideMenu = document.createElement("ul");
        this.setupMenuEntrys(rightsideMenu);

        new_item.appendChild(rightsideMenu);

        new_item.addEventListener('mouseenter', (ev) => {
            new_item.style.backgroundColor = "#868585";
            rightsideMenu.style.display = "block";
            rightsideMenu.style.left = (new_item.getBoundingClientRect().width -1) + "px";
            rightsideMenu.style.top = "0px";

            switch(type){
                case "Node":
                    this.createRenameEntry(name, rightsideMenu);
                    this.createAddSuccessorEntry(name, rightsideMenu);
                    this.createAddHirachicalEntry(name, rightsideMenu);
                    this.createDeleteEntry(name, rightsideMenu);
                    break;
                case "Edge":
                    this.createRenameEntry(name, rightsideMenu);
                    this.createChangeRootEntry(name, rightsideMenu);
                    this.createChangeDestinationEntry(name, rightsideMenu);
                    this.createDeleteEntry(name, rightsideMenu);
                    break;
                case "Region":
                    this.createRenameEntry(name, rightsideMenu);
                    this.createConcurrentRegionEntry(name,rightsideMenu);
                    this.createDeleteEntry(name, rightsideMenu);
                    break;
            }
        });

        new_item.addEventListener('mouseleave', (ev) => {
            new_item.style.backgroundColor = "#f7f7f7";
            rightsideMenu.innerHTML ='';
            rightsideMenu.style.display = 'none';
        });
    }

    createRenameEntry(name: string, rightsideMenu: HTMLElement):void {
        const new_item = document.createElement("li");
        this.setupItemEntrys(new_item);
        new_item.innerText = "Rename";
        new_item.addEventListener('mouseenter', (ev) => {
            new_item.style.backgroundColor = "#868585";
        });
        new_item.addEventListener('mouseleave', (ev) => {
            new_item.style.backgroundColor = "#f7f7f7";
        });

        rightsideMenu.appendChild(new_item);
    }

    createAddSuccessorEntry(name: string, rightsideMenu: HTMLElement): void { 
        const new_item = document.createElement("li");
        this.setupItemEntrys(new_item);
        new_item.innerText = "Add Successor";
        new_item.addEventListener('mouseenter', (ev) => {
            new_item.style.backgroundColor = "#868585";
        });
        new_item.addEventListener('mouseleave', (ev) => {
            new_item.style.backgroundColor = "#f7f7f7";
        });

        rightsideMenu.appendChild(new_item);
    }

    createAddHirachicalEntry(name: string, rightsideMenu: HTMLElement): void {
        const new_item = document.createElement("li");
        this.setupItemEntrys(new_item);
        new_item.innerText = "Add Hirachical Node";
        new_item.addEventListener('mouseenter', (ev) => {
            new_item.style.backgroundColor = "#868585";
        });
        new_item.addEventListener('mouseleave', (ev) => {
            new_item.style.backgroundColor = "#f7f7f7";
        });
        rightsideMenu.appendChild(new_item);

    }

    createDeleteEntry(name: string, rightsideMenu: HTMLElement): void {
        const new_item = document.createElement("li");
        this.setupItemEntrys(new_item);
        new_item.innerText = "Delete";
        new_item.addEventListener('mouseenter', (ev) => {
            new_item.style.backgroundColor = "#868585";
        });
        new_item.addEventListener('mouseleave', (ev) => {
            new_item.style.backgroundColor = "#f7f7f7";
        });
        rightsideMenu.appendChild(new_item);
    }
    
    createChangeRootEntry(name: string, rightsideMenu: HTMLElement): void {
        const new_item = document.createElement("div");
        new_item.innerText = "Change Root";
        this.setupItemEntrys(new_item);
        new_item.addEventListener('mouseenter', (ev) => {
            new_item.style.backgroundColor = "#868585";
        });
        new_item.addEventListener('mouseleave', (ev) => {
            new_item.style.backgroundColor = "#f7f7f7";
        });
        rightsideMenu?.appendChild(new_item);
    }

    createChangeDestinationEntry(name: string, rightsideMenu: HTMLElement):void {
        const new_item = document.createElement("div");
        this.setupItemEntrys(new_item);
        new_item.innerText = "Change Destination";
        new_item.addEventListener('mouseenter', (ev) => {
            new_item.style.backgroundColor = "#868585";
        });
        new_item.addEventListener('mouseleave', (ev) => {
            new_item.style.backgroundColor = "#f7f7f7";
        });
        rightsideMenu?.appendChild(new_item);
    }

    createConcurrentRegionEntry(name: string, rightsideMenu: HTMLUListElement):void {
        const new_item = document.createElement("div");
        this.setupItemEntrys(new_item);
        new_item.innerText = "CreateConcurrentRegion";
        new_item.addEventListener('mouseenter', (ev) => {
            new_item.style.backgroundColor = "#868585";
        });
        new_item.addEventListener('mouseleave', (ev) => {
            new_item.style.backgroundColor = "#f7f7f7";
        });
        rightsideMenu?.appendChild(new_item);
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