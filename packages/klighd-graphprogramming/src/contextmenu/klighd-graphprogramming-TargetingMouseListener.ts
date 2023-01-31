import { injectable } from 'inversify';
import { Action, MouseListener, SModelElement } from 'sprotty'; 
import { ContextMenueProvider } from './klightd-contextmenuprovider';


@injectable()
export class graphprogrammingMoveMouseListener extends MouseListener {
    protected LINEID: "LineToDestination"

    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        if(ContextMenueProvider.enableMouseTargeting && ContextMenueProvider.startPos !== undefined){
            
            let line: HTMLElement | null | SVGPathElement = document.getElementById(this.LINEID)
            if(line===null){
                line = document.createElementNS("http://www.w3.org/2000/svg", "path")
                line.id = this.LINEID
                line.setAttribute("d", "M"+event.x+","+event.y + " L"+event.x+","+event.y)
                line.style.stroke = "#4a90d9"
                line.style.strokeWidth = "3px"
                line.style.markerEnd = "url(#markerArrow)"

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
                    sprotty.children.item(1)!.appendChild(line)
                    sprotty.children.item(1)!.appendChild(defs)
                }
            }

            const mx = event.x - ContextMenueProvider.startPos.x
            const my = event.y - ContextMenueProvider.startPos.y
            const x = mx/(Math.abs(mx)+Math.abs(my))
            const y = my/(Math.abs(mx)+Math.abs(my))
            line!.setAttribute("d", "M"+ContextMenueProvider.startPos.x+","+ContextMenueProvider.startPos.y + " L"+(event.x-x)+","+(event.y-y))
        }
        return [];
    }

    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        if(ContextMenueProvider.enableMouseTargeting){

            const line = document.getElementById(this.LINEID)
            line!.parentElement?.removeChild(line!)

            ContextMenueProvider.destination = target.id
        }
        return [];
    }
}
