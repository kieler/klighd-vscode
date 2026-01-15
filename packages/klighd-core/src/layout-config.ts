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
import { HiddenModelViewer, IActionDispatcher, SChildElementImpl, SModelRootImpl, TYPES, ViewerOptions } from 'sprotty'
import { DefaultLayoutConfigurator, ILayoutPostprocessor } from 'sprotty-elk'
import {
    Action,
    Bounds,
    ComputedBoundsAction,
    ElementAndAlignment,
    ElementAndBounds,
    RequestBoundsAction,
    SGraph,
    SModelElement,
    SModelIndex,
} from 'sprotty-protocol'
import {
    Decoration,
    isContainerRendering,
    isRendering,
    isRenderingRef,
    isSKGraphElement,
    K_RENDERING_REF,
    KContainerRendering,
    KPlacement,
    KPointPlacementData,
    KRectangle,
    KRendering,
    KRenderingRef,
    KText,
    SKEdge,
    SKNode,
} from './skgraph-models'
import { boundsMax } from './micro-layout/bounds-util'
import { estimateSize, evaluatePointPlacementRendering } from './micro-layout/placement-util'
import { SKGraphModelRenderer } from './skgraph-model-renderer'
import { KGraphData, SKGraphElement } from '@kieler/klighd-interactive/lib/constraint-classes'
import { evaluatePointPlacement } from './micro-layout/placement-util'

const CALCULATED_BOUNDS = 'klighd.lsp.calculated.bounds'
const CALCULATED_BOUNDS_MAP = 'klighd.lsp.calculated.bounds.map'
const CALCULATED_DECORATION = 'klighd.lsp.calculated.decoration'
const CALCULATED_DECORATION_MAP = 'klighd.lsp.calculated.decoration.map'
const RENDERING_ID = 'klighd.lsp.rendering.id'

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
            if (typeof value === 'string') {
                layoutOptions[key] = value
            } else {
                layoutOptions[key] = JSON.stringify(value)
            }
        })

        return layoutOptions
    }
}

@injectable()
export class KlighdHiddenModelViewer extends HiddenModelViewer {
    @inject(TYPES.ViewerOptions) protected options: ViewerOptions

    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher

    update(model: SModelRootImpl, cause?: Action): void {
        if (cause?.kind !== RequestBoundsAction.KIND) {
            return super.update(model, cause)
        }
        console.warn('SModelRootImpl')
        console.log(model.children[0])

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

        // Update from Max
        // it seems the way this is called is already correct
        // 1. estimate sizes here and trigger ComputedBoundsAction
        // 2. this is handled in the diagram-server, which triggers layout
        // 3. calculate sizes in postprocessor

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

        // // This squishes the text smaller than it should be
        // // "klighd.calculated.text.bounds":{"x":0.0,"y":-8.249939,"width":38.666668,"height":18.567862}
        // const ktext = ((model.children[0].children[0] as SKNode).data[0] as KRectangle).children[0] as KText
        // ktext.properties['klighd.calculated.text.bounds'] = { x: 3.0, y: -5.0, width: 10.0, height: 18.567862 }
        // ktext.properties['klighd.lsp.calculated.bounds'] = { x: 3.0, y: 0.0, width: 10.0, height: 18.567862 }
        // ktext.properties['klighd.calculated.text.line.widths'] = [10]

        // // This streches the rectangle longer than the node
        // // "klighd.lsp.calculated.bounds":{"x":10.0,"y":8.0,"width":375.54166,"height":18.567863}
        // ;((model.children[0].children[0] as SKNode).data[0] as KRectangle).properties['klighd.lsp.calculated.bounds'] =
        //     {
        //         x: 40.0,
        //         y: 8.0,
        //         width: 375.54166,
        //         height: 18.567863,
        //     }

        // resizes.push({
        //     elementId: '$root$NrectAroundText',
        //     newSize: {
        //         width: 40,
        //         height: 20,
        //         // width: 25.27276611328125,
        //         // height: 13,
        //     },
        // })
        // resizes.push({
        //     elementId: '$root',
        //     newSize: {
        //         width: 40,
        //         height: 20,
        //         // width: 25.27276611328125,
        //         // height: 13,
        //     },
        // })

        const remainingElements: SKGraphElement[] = [model.children[0] as SKNode]
        while (remainingElements.length > 0) {
            const modelElement = remainingElements.pop()!
            for (const child of modelElement.children) {
                if (isSKGraphElement(child)) {
                    remainingElements.push(child)
                }
            }
            const rendering = getKRendering(modelElement.data)

            if (rendering) {
                const size = boundsMax(Bounds.EMPTY, estimateSize(rendering, Bounds.EMPTY))

                // TODO: calculate insets

                resizes.push({
                    elementId: modelElement.id,
                    newSize: size,
                })
            }
            // TODO: else only calculate insets and push those resizes
        }

        this.actionDispatcher.dispatch(
            ComputedBoundsAction.create(resizes, { revision, alignments, requestId: request.requestId })
        )
    }
}

// TODO: copied from view-common but stripped the SKGraphModelRenderer parts, those or something similar is necessary for KRenderingLibraries to work
function getKRendering(datas?: KGraphData[]): KRendering | undefined {
    if (datas)
        for (const data of datas) {
            if (data !== null && data.type === K_RENDERING_REF) {
                console.log('KRenderingLibrary lookup not implemented')
            } else {
                console.log('No KRenderingLibrary for KRenderingRef in context')
            }
            if (data !== null && isRendering(data)) {
                return data
            }
        }
    else return undefined
}

/**
 * Layout postprocessor that calculates the KLighD macro layout
 */
@injectable()
export class MicroLayoutCalculator implements ILayoutPostprocessor {
    postprocess(elkGraph: ElkNode, sgraph: SGraph, index: SModelIndex): void {
        // TODO: DO THIS:
        /*
        static def void prepareRenderingLayout(KGraphElement element, Map<KGraphElement, SModelElement> kGraphToSGraph) {
        // calculate the sizes of all renderings:
        for (var int i = 0; i < element.data.size; i++) {
            val data = element.data.get(i)
            switch(data) {
                KRenderingRef: {
                    // all references to KRenderings need to place a map with their 
                    // sizes and their decoration in this case in the properties of the reference.
                    var boundsMap = new HashMap<String, Bounds>
                    var decorationMap = new HashMap<String, Decoration>
                    handleKRendering(element, data.rendering, boundsMap, decorationMap)
                    // add new Property to contain the boundsMap
                    data.properties.put(CALCULATED_BOUNDS_MAP, boundsMap)
                    // and the decorationMap
                    data.properties.put(CALCULATED_DECORATION_MAP, decorationMap)
                }
                KRendering: {
                    // TODO: Important.
                    handleKRendering(element, data, null, null)
                }
            }
        }
        
        // Recursively call this method for every child KGraphElement of this.
        // (all labels, child nodes, outgoing edges and ports)
        
        if (element instanceof KLabeledGraphElement) {
            for (label : element.labels) {
                prepareRenderingLayout(label, kGraphToSGraph)
            }
        }
        if (element instanceof KNode) {
            // Do not recurse generating IDs if the element is not expanded, as there won't be any SGraph generated for
            // it.
            var boolean isExpanded
            val renderingContextData = RenderingContextData.get(element)
            if (renderingContextData.hasProperty(SprottyProperties.EXPANDED)) {
                isExpanded = renderingContextData.getProperty(SprottyProperties.EXPANDED)
            } else {
                // If the expanded property does not exist yet, use the initial expansion.
                isExpanded = element.getProperty(KlighdProperties.EXPAND)
            }
            
            if (isExpanded) {
                for (node : element.children) {
                    prepareRenderingLayout(node, kGraphToSGraph)
                }
            }
            for (edge : element.outgoingEdges) {
                // not expanded => edge must not have the target node inside the non-expanded
                if (isExpanded || !KGraphUtil.isDescendant(edge.target, element)) {
                    prepareRenderingLayout(edge, kGraphToSGraph)
                }
            }
            for (port : element.ports) {
                prepareRenderingLayout(port, kGraphToSGraph)
            }
        }

        private static def void handleKRendering(KGraphElement element, KRendering rendering, Map<String, Bounds> boundsMap,
        Map<String, Decoration> decorationMap) {
        var Bounds bounds
        if (element instanceof KShapeLayout) {
            // The parent rendering inherits its bounds from the element containing the rendering.
            bounds = new Bounds(element.width, element.height)
        } else {
            // In this case the element is a KEdge.
            bounds = edgeBounds(element as KEdge)
        }
        // Calculate the bounds of the rendering.
        // TODO: This is _very_ important.
        handleAreaAndPointAndDecoratorPlacementRendering(rendering, bounds, boundsMap, decorationMap, element)
        
        // Calculate the bounds for the junction point rendering.
        if (rendering instanceof KPolyline) {
            if (rendering.junctionPointRendering !== null) {                
                handleAreaAndPointAndDecoratorPlacementRendering(rendering.junctionPointRendering, bounds, boundsMap,
                    decorationMap, element)
            }
        }
        
        // Calculate the bounds for the clip shape.
        if (rendering instanceof KImage) {
            if (rendering.clipShape !== null) {
                handleAreaAndPointAndDecoratorPlacementRendering(rendering.clipShape, bounds, boundsMap, decorationMap,
                    element)
            }
        }
    }

    private static def void handleAreaAndPointAndDecoratorPlacementRendering(KRendering rendering, Bounds parentBounds,
        Map<String, Bounds> boundsMap, Map<String, Decoration> decorationMap, KGraphElement parent) {
        var placementData = rendering.placementData
        var Bounds bounds
        var Decoration decoration = null
        var Map<String, Bounds> usedBoundsMap = boundsMap
        var Map<String, Decoration> usedDecorationMap = decorationMap
        
        
        
        // KRenderingRefs inside other renderings. This reference needs a new bounds- and decoration map to be stored
        // inside it.
        if (rendering instanceof KRenderingRef) {
            usedBoundsMap = new HashMap<String, Bounds>
            usedDecorationMap = new HashMap<String, Decoration>
            placementData = rendering.rendering.placementData
            
             // add new Property to contain the boundsMap
            rendering.properties.put(CALCULATED_BOUNDS_MAP, usedBoundsMap)
            // and the decorationMap
            rendering.properties.put(CALCULATED_DECORATION_MAP, usedDecorationMap)
        }
        
        switch (placementData) {
            KAreaPlacementData: {
                // Evaluate the area placement micro layout with the help of KLighD.
                bounds = PlacementUtil.evaluateAreaPlacement(placementData, parentBounds)
            }
            // TODO: Important.
            KPointPlacementData: {
                // Evaluate the point placement micro layout with the help of KLighD.
                bounds = PlacementUtil.evaluatePointPlacement(rendering, placementData, parentBounds)
            }
            // TODO: The rest of this...
            KDecoratorPlacementData: {...}
            default: {
                // If no placementData is defined, assume the width and height of the parent object
                // placed at the top left corner.
                bounds = new Bounds(parentBounds.width, parentBounds.height)
            }
        }
        // Decide if the bounds and decoration should be put in the boundsMap/decorationMap or in the rendering's
        // properties.
        if (usedBoundsMap === null) {
            // TODO: Important.
            rendering.setBounds(bounds)
            if (decoration !== null) {
                rendering.setDecoration(decoration)
            }
        } else {
            usedBoundsMap.put(rendering.renderingId, bounds)
            if (decoration !== null) {
                usedDecorationMap.put(rendering.renderingId, decoration)
            }
        }
        // Process modifiable styles
        processModifiableStyles(rendering, parent)
        // Calculate the bounds and decorations of all child renderings.
        if (rendering instanceof KContainerRendering) {
            handleChildren(rendering.children, rendering.childPlacement, bounds, usedBoundsMap, usedDecorationMap, parent)
        } else if (rendering instanceof KRenderingRef
            && (rendering as KRenderingRef).rendering instanceof KContainerRendering
        ) {
            val referencedRendering = (rendering as KRenderingRef).rendering as KContainerRendering
            handleChildren(referencedRendering.children, referencedRendering.childPlacement, bounds, usedBoundsMap,
                usedDecorationMap, parent)
        }
    }
        */

        // TODO: Micro layout calculation here or in Step 4 from above
        // TODO: Test this method.
        console.warn('METHOD IS BEING USED: ' + 'MicroLayoutCalculator.postprocess')

        const element = sgraph.children[0] as unknown as SKGraphElement

        for (let i = 0; i < element.data.length; i++) {
            const data = element.data[i]
            switch (data.type) {
                case K_RENDERING_REF: {
                    const krenderingref = data as KRenderingRef

                    // all references to KRenderings need to place a map with their
                    // sizes and their decoration in this case in the properties of the reference.
                    const boundsMap: Record<string, Bounds> = {}
                    const decorationMap: Record<string, Decoration> = {}
                    handleKRendering(
                        element,
                        getKRendering(krenderingref as unknown as KGraphData[])!,
                        boundsMap,
                        decorationMap
                    )
                    // add new Property to contain the boundsMap
                    krenderingref.properties[CALCULATED_BOUNDS] = boundsMap
                    // and the decorationMap
                    krenderingref.properties[CALCULATED_DECORATION_MAP] = decorationMap
                    break
                }
                case 'KRendering': {
                    handleKRendering(element, data as KRendering, null, null)
                    break
                }
            }

            // // TODO: Really find out how to convert this structure into a hierarchical Rendering.
            // console.warn('SGraph')
            // console.log(sgraph.children[0])

            // let remainingElements = Array()
            // remainingElements.push(sgraph.children[0])

            // console.log(remainingElements)
            // while (remainingElements.length > 0) {
            //     console.log(remainingElements)
            //     const modelElement = remainingElements.pop()!
            //     for (const child of modelElement.children!) {
            //         if (isSKGraphElement(child)) {
            //             remainingElements.push(child)
            //         }
            //     }
            //     const rendering = getKRendering((modelElement as unknown as SKGraphElement).data)

            //     if (rendering) {
            //         const bounds = boundsMax(Bounds.EMPTY, estimateSize(rendering, Bounds.EMPTY))
            //         rendering.properties[CALCULATED_BOUNDS] = bounds
            //     }
            //     // TODO: else only calculate insets and push those resizes
            // }

            // // const root = getKRendering((sgraph.children[0] as unknown as SKNode).data)
            // // const remainingElements = [root]
            // // while (remainingElements.length > 0) {
            // //     console.log(remainingElements)
            // //     const rendering = remainingElements.pop()
            // //     if (rendering) {
            // //         if (isContainerRendering(rendering))
            // //             for (const child of rendering.children) remainingElements.push(child)
            // //         const bounds = estimateSize(rendering, Bounds.EMPTY)
            // //         rendering.properties[CALCULATED_BOUNDS] = bounds
            // //     }
            // // }
        }
    }
}

function handleKRendering(
    element: SKGraphElement,
    rendering: KRendering,
    boundsMap: Record<string, Bounds> | null,
    decorationMap: Record<string, Decoration> | null
) {
    let bounds: Bounds
    if ('width' in element && 'height' in element) {
        // The parent rendering inherits its bounds from the element containing the rendering.
        bounds = {x:0, y:0, width: element.width as number, height: element.height as number}
    } else {
        // In this case the element is a KEdge.
        bounds = (element as SKEdge).bounds //edgeBounds(element as SKEdge)
    }

    handleAreaAndPointAndDecoratorPlacementRendering(
        rendering,
        bounds,
        boundsMap,
        decorationMap,
        element
    )

    // TODO: Continue here!
}

// TODO: Implement this if needed.
function edgeBounds(edge: SKEdge): Bounds {
    var minX = Number.POSITIVE_INFINITY
    var minY = Number.POSITIVE_INFINITY
    var maxX = Number.NEGATIVE_INFINITY
    var maxY = Number.NEGATIVE_INFINITY
    var pointList = []

    if (edge.source)
        pointList.push(edge.source.position)

    //pointList.push(edge.bendpoints)
    // ...
    return Bounds.EMPTY
}

function handleAreaAndPointAndDecoratorPlacementRendering(
    rendering: KRendering,
    parentBounds: Bounds,
    boundsMap: Record<string, Bounds> | null,
    decorationMap: Record<string, Decoration> | null,
    parent: SKGraphElement
) {
    let placementData = rendering.placementData
    let bounds: Bounds
    let decoration: Decoration | null = null
    let usedBoundsMap = boundsMap
    let usedDecorationMap = decorationMap
    
    // KRenderingRefs inside other renderings. This reference needs a new bounds- and decoration map to be stored
    if (rendering.type === K_RENDERING_REF) {
        usedBoundsMap = {}
        usedDecorationMap = {}
        placementData = (rendering as KRenderingRef).rendering.placementData // What the hell?

        // add new Property to contain the boundsMap
        rendering.properties[CALCULATED_BOUNDS_MAP] = usedBoundsMap
        // and the decorationMap
        rendering.properties[CALCULATED_DECORATION_MAP] = usedDecorationMap
    }

    switch (placementData!.type) {
        case 'KAreaPlacementData': {
            // Evaluate the area placement micro layout with the help of KLighD.
            //bounds = evaluateAreaPlacement(rendering, parentBounds) // If needed, implement evaluateAreaPlacement
            break
        }
        case 'KPointPlacementData': {
            // Evaluate the point placement micro layout with the help of KLighD.
            bounds = evaluatePointPlacementRendering(rendering, placementData as KPointPlacementData, parentBounds) // If needed, implement evaluatePointPlacement
            break
        }
        case 'KDecoratorPlacementData': {
            // Todo: Implement later
            // ...
            break
        }
        default: {
            // If no placementData is defined, assume the width and height of the parent object
            // placed at the top left corner.
            bounds = {x:0, y:0, width: parentBounds.width, height: parentBounds.height}
            break
        }
    }
    
    // Decide if the bounds and decoration should be put in the boundsMap/decorationMap or in the rendering's
    // properties.
    // TODO: Remove all forced non-nulls when 'KDecoratorPlacementData' case is implemented.
    if (!usedBoundsMap) {
        rendering.properties[CALCULATED_BOUNDS] = bounds!
        if (decoration) rendering.properties[CALCULATED_DECORATION] = decoration
    } else {
        usedBoundsMap[rendering.properties[RENDERING_ID] as string] = bounds!
        if (decoration) usedDecorationMap![rendering.properties[RENDERING_ID] as string] = decoration
    }

    // Process modifiable styles
    // TODO: Implement this if needed
    //processModifiableStyles(rendering, parent)
    // Calculate the bounds and decorations of all child renderings.
    if (isContainerRendering(rendering)) {
        handleChildren(
            rendering.children,
            rendering.childPlacement,
            bounds!,
            usedBoundsMap,
            usedDecorationMap,
            parent
        )
    } else if (isRenderingRef(rendering) && isContainerRendering(rendering.rendering)) {
        const referencedRendering = rendering.rendering as KContainerRendering
        handleChildren(referencedRendering.children, referencedRendering.childPlacement, bounds!, usedBoundsMap, usedDecorationMap, parent)
    }
}

function handleChildren(renderings: KRendering[], placement: KPlacement | undefined, parentBounds: Bounds, boundsMap: Record<string, Bounds> | null, decorationMap: Record<string, Decoration> | null, parent: SKGraphElement) {
    //if (isKGridPlacement(placement)) {
}


/*
@injectable()
export class MicroLayoutCalculator implements ILayoutPostprocessor {
    postprocess(elkGraph: ElkNode, sgraph: SGraph, index: SModelIndex): void {
        // TODO: Micro layout calculation here or in Step 4 from above
        // TODO: Test this method.
        console.warn('METHOD IS BEING USED: ' + 'MicroLayoutCalculator.postprocess')

        // TODO: Really find out how to convert this structure into a hierarchical Rendering.
        const remainingElements = sgraph.children
        while (remainingElements.length > 0) {
            //console.log(remainingElements)
            const child = remainingElements.pop()!
            // Render child
            const rendering = getKRendering((child as unknown as SKNode).data)
            if (rendering) {
                const bounds = estimateSize(rendering, Bounds.EMPTY)
                console.warn(bounds)
                rendering.properties[CALCULATED_BOUNDS] = bounds
            }

            // Add all children of the child
            for (const childChild of child.children!) remainingElements.push(childChild)
        }
    }
}
*/
