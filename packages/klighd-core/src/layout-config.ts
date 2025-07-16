/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2024-2025 by
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

import { ElkNode, LayoutOptions } from 'elkjs'
import { inject, injectable } from 'inversify'
import { IActionDispatcher, IViewer, SModelRootImpl, TYPES, ViewerOptions } from 'sprotty'
import { DefaultLayoutConfigurator, ILayoutPostprocessor } from 'sprotty-elk'
import {
    Action,
    ComputedBoundsAction,
    ElementAndAlignment,
    ElementAndBounds,
    RequestBoundsAction,
    SGraph,
    SModelElement,
    SModelIndex,
} from 'sprotty-protocol'
import { KRectangle, KText, SKNode } from './skgraph-models'

/**
 * This layout configurator copies all layout options from the KGraph element's properties.
 */
export class KielerLayoutConfigurator extends DefaultLayoutConfigurator {
    override apply(element: SModelElement, _index: SModelIndex): LayoutOptions | undefined {
        // Only apply to elements with properties.
        if ((element as any).properties === undefined) {
            return undefined
        }
        const properties = (element as any).properties as Record<string, unknown>

        // map properties to layout options and stringify values
        const layoutOptions: LayoutOptions = {}
        Object.entries(properties).forEach(([key, value]) => {
            layoutOptions[key] = JSON.stringify(value)
        })

        return layoutOptions
    }
}

@injectable()
export class KlighdHiddenModelViewer implements IViewer {
    @inject(TYPES.ViewerOptions) protected options: ViewerOptions

    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher

    update(model: SModelRootImpl, cause?: Action): void {
        console.log(model)

        // TODO:
        // Overwriting this goes quite deep into Sprotty, as it usually expects a full hidden DOM rendering from its HiddenModelViewer implementation.
        // To avoid full DOM rendering of Sprotty and just calculate micro layout KLighD-style, these steps have to be implemented here (not sure if these steps are complete)
        // 1. estimate micro layout based on KLighD data. Estimate the sizes like done in PlacementUtil class in Java.
        // For KTexts, maybe estimate the sizes (idk how) or use a hidden renderer like Sprotty does to render the text in a hidden DOM and get its bounding box.
        // Next, Sprotty would call the HiddenBoundsUpdater in its postUpdate method and get the minimal sizes from the DOM. `this.hiddenRenderer.postUpdate(cause)`
        // 2. The estimated minimum bounds should be stored in some kind of map so we can give control back to Sprotty soon
        // 3. call the macro layout like Sprotty does in its HiddenBoundsUpdater: `this.layouter.layout(this.element2boundsData)`
        // 4. (here or in the post-processor below) Do the micro layout calculation and persist all properties needed for the final rendering on the SKGraph
        // 5. dispatch a ComputedBoundsAction, see HiddenBoundsUpdater. `this.actionDispatcher.dispatch(ComputedBoundsAction.create(resizes, { revision, alignments, requestId: request.requestId }))`

        const request = cause as RequestBoundsAction
        const resizes: ElementAndBounds[] = []
        const alignments: ElementAndAlignment[] = []
        const { revision } = model

        // Some example data that works for this kgt file:
        // kgraph rectAroundText

        // knode rectAroundText {

        // krectangle {
        //     ktext ("test") {
        //     areaData:
        //         topLeftAnchor = left 10, top 20
        //         bottomRightAnchor = right 30, bottom 40
        //     }
        // }

        // }

        // This squishes the text smaller than it should be
        // "klighd.calculated.text.bounds":{"x":0.0,"y":-8.249939,"width":38.666668,"height":18.567862}
        const ktext = ((model.children[0].children[0] as SKNode).data[0] as KRectangle).children[0] as KText
        ktext.properties['klighd.calculated.text.bounds'] = { x: 3.0, y: -5.0, width: 10.0, height: 18.567862 }
        ktext.properties['klighd.lsp.calculated.bounds'] = { x: 3.0, y: 0.0, width: 10.0, height: 18.567862 }
        ktext.properties['klighd.calculated.text.line.widths'] = [10]

        // This streches the rectangle longer than the node
        // "klighd.lsp.calculated.bounds":{"x":10.0,"y":8.0,"width":375.54166,"height":18.567863}
        ;((model.children[0].children[0] as SKNode).data[0] as KRectangle).properties['klighd.lsp.calculated.bounds'] =
            {
                x: 40.0,
                y: 8.0,
                width: 375.54166,
                height: 18.567863,
            }

        resizes.push({
            elementId: '$root$NrectAroundText',
            newSize: {
                width: 40,
                height: 20,
                // width: 25.27276611328125,
                // height: 13,
            },
        })
        resizes.push({
            elementId: '$root',
            newSize: {
                width: 40,
                height: 20,
                // width: 25.27276611328125,
                // height: 13,
            },
        })
        this.actionDispatcher.dispatch(
            ComputedBoundsAction.create(resizes, { revision, alignments, requestId: request.requestId })
        )
    }
}

/**
 * Layout postprocessor that calculates the KLighD macro layout
 */
@injectable()
export class MicroLayoutCalculator implements ILayoutPostprocessor {
    postprocess(elkGraph: ElkNode, sgraph: SGraph, index: SModelIndex): void {
        // TODO: Micro layout calculation here or in Step 4 from above
        console.log('micro layout postprosessor called!')
        console.log(elkGraph)
        console.log(sgraph)
        console.log(index)
    }
}
