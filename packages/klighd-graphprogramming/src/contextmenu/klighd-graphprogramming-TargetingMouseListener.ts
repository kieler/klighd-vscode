import { inject, injectable } from 'inversify';
import { Action, MouseListener, Point, SModelElement } from 'sprotty'; 
import { KlighdIContextMenuService, KlighdIContextMenuServiceProvider } from './klighd-service';
import { DISymbol } from "../symbols";
import { ContextMenueProvider } from './klightd-contextmenuprovider';


@injectable()
export class graphprogrammingMoveMouseListener extends MouseListener {
    @inject(DISymbol.KlighdIContextMenuServiceProvider) protected readonly contextMenuService: KlighdIContextMenuServiceProvider
    protected target: SModelElement|undefined
    protected startPos: Point|undefined
    protected line: SVGPathElement
    protected LINEID: "LineToDestination"

    protected ctxMenu: ContextMenueProvider

    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        this.updateArrow(target, event)
        return [];
    }

    async updateArrow(target: SModelElement, event: MouseEvent){
        let menuService: KlighdIContextMenuService;
        try {
            menuService = await this.contextMenuService();
        } catch (rejected) {
            // There is no contextmenu service => do nothing
            return[];
        }
        console.log((menuService as ContextMenueProvider).enableMouseTargeting) // is always undefined

        if(this.target !== undefined && this.startPos !== undefined){
            
            const mx = event.x - this.startPos.x
            const my = event.y - this.startPos.y
            const x = mx/(Math.abs(mx)+Math.abs(my))
            const y = my/(Math.abs(mx)+Math.abs(my))
            this.line!.setAttribute("d", "M"+this.startPos.x+","+this.startPos.y + " L"+(event.x-x)+","+(event.y-y))
        }
        return [];
    }

    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        if(this.target ===undefined){
            this.target = target
            this.startPos = {x: event.x, y: event.y}

            this.line = document.createElementNS("http://www.w3.org/2000/svg", "path")
            this.line.id = this.LINEID

            this.line.setAttribute("d", "M"+event.x+","+event.y + " L"+event.x+","+event.y)
            this.line.style.stroke = "#4a90d9"
            this.line.style.strokeWidth = "3px"
            this.line.style.markerEnd = "url(#markerArrow)"

            const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")
            const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker")
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path")

            marker.id = "markerArrow"
            marker.setAttribute("markerWidth", "5")
            marker.setAttribute("markerHeight", "4")
            marker.setAttribute("refX", "5")
            marker.setAttribute("refY", "2")
            marker.setAttribute("orient", "auto")

            path.setAttribute("d", "M0,0 L5,2 L0,4 L0,1.5")
            path.style.fill ="#4a90d9"
            path.style.strokeLinejoin = "round"
            path.style.strokeWidth = "2px"

            defs.appendChild(marker)
            marker.appendChild(path)



            let sprotty
            if((sprotty = document.getElementById("keith-diagram_sprotty")) != null){
                sprotty.children.item(1)!.appendChild(this.line)
                sprotty.children.item(1)!.appendChild(defs)
            }
        }else if(this.target !== undefined){
            // create a action
            this.line.parentElement?.removeChild(this.line)
            console.log("send action")

            console.log("from" + this.target.id)
            console.log("to" + target.id)

            this.target = undefined
        }
        return [];
    }

    public setStart(target: SModelElement, event: MouseEvent): void{
        console.log("setting start")
        this.target = target
        this.startPos = {x: event.x, y: event.y}
        
        this.line = document.createElementNS("http://www.w3.org/2000/svg", "path")
        this.line.id = this.LINEID

        this.line.setAttribute("d", "M"+event.x+","+event.y + " L"+event.x+","+event.y)
        this.line.style.stroke = "#4a90d9"
        this.line.style.strokeWidth = "3px"
        this.line.style.markerEnd = "url(#markerArrow)"

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker")
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path")

        marker.id = "markerArrow"
        marker.setAttribute("markerWidth", "5")
        marker.setAttribute("markerHeight", "4")
        marker.setAttribute("refX", "5")
        marker.setAttribute("refY", "2")
        marker.setAttribute("orient", "auto")

        path.setAttribute("d", "M0,0 L5,2 L0,4 L0,1.5")
        path.style.fill ="#4a90d9"
        path.style.strokeLinejoin = "round"
        path.style.strokeWidth = "2px"

        defs.appendChild(marker)
        marker.appendChild(path)



        let sprotty
        if((sprotty = document.getElementById("keith-diagram_sprotty")) != null){
            sprotty.children.item(1)!.appendChild(this.line)
            sprotty.children.item(1)!.appendChild(defs)
        }
    }
}
