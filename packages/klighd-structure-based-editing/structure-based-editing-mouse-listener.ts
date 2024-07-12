/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2024 by
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
/* eslint-disable @typescript-eslint/no-unused-vars */
import { injectable } from 'inversify'
import { MouseListener, SModelElementImpl } from 'sprotty'
import { Action } from 'sprotty-protocol'
// import { ContextMenueProvider } from './klightd-contextmenuprovider'

/**
 * This class handles the drawing of the arrow after a select target or select source action is requested from the contextmenu.
 * It is enabled by the static values in the contextmenu provider class.
 */
@injectable()
export class graphprogrammingMoveMouseListener extends MouseListener {
    protected LINE_ID: 'LineToDestination'

    mouseMove(target: SModelElementImpl, event: MouseEvent): Action[] {
        // We only want to draw or update a arrow if it was requested and there is a starting position.
        // The starting position may be the end of the arrow in case of select source.
        if (ContextMenueProvider.enableMouseTargeting && ContextMenueProvider.startPos !== undefined) {
            // If there is no line yet we want to create it
            let line: HTMLElement | null | SVGPathElement = document.getElementById(this.LINEID)
            if (line === null) {
                // Creates a svg element as line
                line = document.createElementNS('http://www.w3.org/2000/svg', 'path')
                line.id = this.LINE_ID
                line.setAttribute('d', 'M' + event.x + ',' + event.y + ' L' + event.x + ',' + event.y)
                line.style.stroke = '#4a90d9'
                line.style.strokeWidth = '3px'
                // We need to change the behavior depending if we want the arrow to point to the source or to the target
                if (ContextMenueProvider.selectSource) {
                    // Since source should be selected the arrow should point to the transition
                    line.style.markerStart = 'url(#markerArrowSource)'
                    line.style.markerEnd = ''
                } else {
                    // Since target should be selected the arrow should point to the target
                    line.style.markerStart = ''
                    line.style.markerEnd = 'url(#markerArrowTarget)'
                }

                // More svg element creation
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
                const markerDestination = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
                const markerSource = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
                const pathSource = document.createElementNS('http://www.w3.org/2000/svg', 'path')

                // Creates a marker with a 5x4 box
                markerDestination.id = 'markerArrowTarget'
                markerDestination.setAttribute('markerWidth', '5')
                markerDestination.setAttribute('markerHeight', '4')
                markerDestination.setAttribute('refX', '5')
                markerDestination.setAttribute('refY', '2')
                markerDestination.setAttribute('orient', 'auto')

                // Creates the actual arrow
                path.setAttribute('d', 'M0,0 L5,2 L0,4 L0,1.5')
                path.style.fill = '#4a90d9'
                path.style.strokeLinejoin = 'round'
                path.style.strokeWidth = '2px'

                // Dom manipulation to add the marker to the dom
                defs.appendChild(markerDestination)
                markerDestination.appendChild(path)

                // Creates the source marker also in a 5x4 box
                markerSource.id = 'markerArrowSource'
                markerSource.setAttribute('markerWidth', '5')
                markerSource.setAttribute('markerHeight', '4')
                markerSource.setAttribute('refX', '0')
                markerSource.setAttribute('refY', '2')
                markerSource.setAttribute('orient', 'auto')
                // Creates the arrow (basically reversed the first from 0 to 5 and 5 to 0)
                pathSource.setAttribute('d', 'M5,0 L0,2 L5,4 L5,1.5')
                pathSource.style.fill = '#4a90d9'
                pathSource.style.strokeLinejoin = 'round'
                pathSource.style.strokeWidth = '2px'

                // Dom manipulation to add the marker and path
                defs.appendChild(markerSource)
                markerSource.appendChild(pathSource)

                // Dom manipulation to add the line and the markers to the dom if it was started in vscode
                const sprotty = document.getElementById('keith-diagram_sprotty')
                if (sprotty != null) {
                    // Id is uniqe in vscode browser version uses a different id
                    sprotty.children.item(1)!.appendChild(line)
                    sprotty.children.item(1)!.appendChild(defs)
                }
            }

            // Updates the line the arrowheads are updated automaticaly
            const mx = event.x - ContextMenueProvider.startPos.x
            const my = event.y - ContextMenueProvider.startPos.y
            const x = mx / (Math.abs(mx) + Math.abs(my))
            const y = my / (Math.abs(mx) + Math.abs(my))
            line!.setAttribute(
                'd',
                'M' +
                ContextMenueProvider.startPos.x +
                ',' +
                ContextMenueProvider.startPos.y +
                ' L' +
                (event.x - x) +
                ',' +
                (event.y - y)
            )
        }
        return []
    }

    mouseDown(target: SModelElementImpl, event: MouseEvent): Action[] {
        if (ContextMenueProvider.enableMouseTargeting) {
            //reset the mouse targeting and forwards the targeted objects id to the contextmenu
            ContextMenueProvider.enableMouseTargeting = false
            const line = document.getElementById(this.LINEID)
            line!.parentElement?.removeChild(line!)
            ContextMenueProvider.destination = target.id
        }
        return []
    }
}
