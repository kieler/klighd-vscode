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
import { HiddenModelViewer, IActionDispatcher, SModelRootImpl, TYPES, ViewerOptions } from 'sprotty'
import { DefaultLayoutConfigurator, ILayoutPostprocessor } from 'sprotty-elk'
import {
    Action,
    Bounds,
    ComputedBoundsAction,
    ElementAndAlignment,
    ElementAndBounds,
    Point,
    RequestBoundsAction,
    SGraph,
    SModelElement,
    SModelIndex,
} from 'sprotty-protocol'
import {
    Decoration,
    isContainerRendering,
    isEdge,
    isGridPlacement,
    isImage,
    isPolygon,
    isPolyline,
    isRendering,
    isRenderingRef,
    isSKGraphElement,
    K_AREA_PLACEMENT_DATA,
    K_DECORATOR_PLACEMENT_DATA,
    K_POINT_PLACEMENT_DATA,
    K_RENDERING_REF,
    KAreaPlacementData,
    KContainerRendering,
    KPlacement,
    KPointPlacementData,
    KPolygon,
    KRendering,
    KRenderingRef,
    NODE_TYPE,
    SKLabel,
    SKNode,
} from './skgraph-models'
import { boundsMax } from './micro-layout/bounds-util'
import {
    basicEstimateSize,
    estimateSize,
    evaluateAreaPlacement,
    evaluateKPosition,
    evaluatePointPlacementRendering,
} from './micro-layout/placement-util'
import { KEdge, KGraphData, KNode, SKGraphElement } from '@kieler/klighd-interactive/lib/constraint-classes'

const CALCULATED_BOUNDS = 'klighd.lsp.calculated.bounds'
const CALCULATED_BOUNDS_MAP = 'klighd.lsp.calculated.bounds.map'
const CALCULATED_DECORATION = 'klighd.lsp.calculated.decoration'
const CALCULATED_DECORATION_MAP = 'klighd.lsp.calculated.decoration.map'
const RENDERING_ID = 'klighd.lsp.rendering.id'
const EXPANDED = 'klighd.lsp.expanded' // Unused.
const EXPAND = 'de.cau.cs.kieler.klighd.expand' // Currently always undefined property.

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

        const root = model.children[0] as SKNode
        const remainingElements: SKGraphElement[] = [root]

        while (remainingElements.length > 0) {
            const modelElement = remainingElements.pop()!
            for (const child of modelElement.children) {
                if (isSKGraphElement(child)) {
                    remainingElements.push(child)
                }
            }
            const rendering = getKRendering(modelElement.data)

            if (rendering) {
                // TODO: Find out how to get the real minimal size.
                const minSize = (modelElement as KNode).size as Bounds // Seems to be most accurate guess for now (may even be correct).
                //const minSize = root.size as Bounds
                //const minSize = Bounds.EMPTY
                const size = boundsMax(minSize, estimateSize(rendering, Bounds.EMPTY))
                //const size = estimateSize(rendering, Bounds.EMPTY)

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
function getKRendering(datas: KGraphData[] | undefined): KRendering | undefined {
    if (datas)
        // TODO: Returning nothing for KRenderingRefs is not correct,
        // but currently does not change anything,
        // as else the KRendering has no data relevant for layouting.
        for (const data of datas) {
            if (isRendering(data))
                if (data.type === K_RENDERING_REF) console.log('KRenderingLibrary lookup not implemented')
                else return data
            else if (!data) console.log('No KRenderingLibrary for KRenderingRef in context') // TODO: Really understand what should be done here.
        }
    else return undefined
}

/**
 * Layout postprocessor that calculates the KLighD macro layout
 */
@injectable()
export class MicroLayoutCalculator implements ILayoutPostprocessor {
    postprocess(elkGraph: ElkNode, sgraph: SGraph, index: SModelIndex): void {
        const element = sgraph.children[0] as unknown as SKGraphElement
        prepareRenderingLayout(element)
    }
}

function prepareRenderingLayout(element: SKGraphElement) {
    // TODO: Micro layout calculation here or in Step 4 from above
    // TODO: Test this method.
    console.warn('METHOD IS BEING USED: ' + 'prepareRenderingLayout')

    if (!element.data) return

    for (let i = 0; i < element.data.length; i++) {
        const data = element.data[i]
        // FIXME: Data == null case needs to be covered.
        if (!data) continue
        if (isRenderingRef(data)) {
            // all references to KRenderings need to place a map with their
            // sizes and their decoration in this case in the properties of the reference.
            let boundsMap: Record<string, Bounds> = {}
            let decorationMap: Record<string, Decoration> = {}
            const rendering = getKRendering([data])
            if (!rendering) continue
            handleKRendering(element, rendering, boundsMap, decorationMap)
            // add new Property to contain the boundsMap
            data.properties[CALCULATED_BOUNDS_MAP] = boundsMap
            // and the decorationMap
            data.properties[CALCULATED_DECORATION_MAP] = decorationMap
            break
        } else if (isRendering(data)) {
            handleKRendering(element, data, null, null)
            break
        }
    }
    // TODO: Replace the following with correct checks.
    // if (isKLabeledGraphElement(element))
    if ('labels' in element)
        for (const label of element.labels as SKGraphElement[]) prepareRenderingLayout(label as unknown as SKLabel)

    if (element.type === NODE_TYPE) {
        //let node = element as unknown as SNodeImpl // TODO: Find out if this is the right cast, and `node.outgoingEdges` works as intended.
        // TODO: Correctly search for expansion property.
        if (true || element.properties[EXPAND])
            for (const child of element.children) // TODO: Change this when we differentiate between different kinds of children ('edges' and 'ports')
                prepareRenderingLayout(child as unknown as SKGraphElement)
        // for (const edge of node.outgoingEdges)
        //     // ...

        // FIXME: Same problem
        // for (const port of element.ports)
        //     // ...
    }

    // PROXY STUFF (Skipped for now)
    // ...
}

function handleKRendering(
    element: SKGraphElement,
    rendering: KRendering,
    boundsMap: Record<string, Bounds> | null,
    decorationMap: Record<string, Decoration> | null
) {
    let bounds: Bounds
    if ('size' in element) {
        // The parent rendering inherits its bounds from the element containing the rendering.
        bounds = element.size as Bounds
    } else {
        // In this case the element is a KEdge.
        bounds = edgeBounds(element as KEdge)
    }

    // Calculate the bounds of the rendering.
    handleAreaAndPointAndDecoratorPlacementRendering(rendering, bounds, boundsMap, decorationMap, element)

    // Calculate the bounds for the junction point rendering.
    if (isPolyline(rendering))
        if (rendering.junctionPointRendering)
            handleAreaAndPointAndDecoratorPlacementRendering(
                rendering.junctionPointRendering,
                bounds,
                boundsMap,
                decorationMap,
                element
            )

    // Calculate the bounds for the clip shape.
    if (isImage(rendering))
        if (rendering.clipShape)
            handleAreaAndPointAndDecoratorPlacementRendering(
                rendering.clipShape,
                bounds,
                boundsMap,
                decorationMap,
                element
            )
}

// TODO: Implement this if needed.
function edgeBounds(edge: KEdge): Bounds {
    var minX = Number.POSITIVE_INFINITY
    var minY = Number.POSITIVE_INFINITY
    var maxX = Number.NEGATIVE_INFINITY
    var maxY = Number.NEGATIVE_INFINITY
    var pointList = []

    if (edge.source) pointList.push(edge.source.position)

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
        // TODO: Fully implement KRenderingRef lookup, then remove the '?'.
        placementData = (getKRendering([rendering]) as KRenderingRef).rendering?.placementData // What the hell?

        // add new Property to contain the boundsMap
        rendering.properties[CALCULATED_BOUNDS_MAP] = usedBoundsMap
        // and the decorationMap
        rendering.properties[CALCULATED_DECORATION_MAP] = usedDecorationMap
    }

    switch (placementData?.type) {
        case K_AREA_PLACEMENT_DATA: {
            // Evaluate the area placement micro layout with the help of KLighD.
            bounds = evaluateAreaPlacement(placementData as KAreaPlacementData, parentBounds)
            break
        }
        case K_POINT_PLACEMENT_DATA: {
            // Evaluate the point placement micro layout with the help of KLighD.
            bounds = evaluatePointPlacementRendering(rendering, placementData as KPointPlacementData, parentBounds)
            break
        }
        case K_DECORATOR_PLACEMENT_DATA: {
            basicEstimateSize(rendering, Bounds.EMPTY)
            // Decorator placements can only be evaluated if the path they should decorate is known.
            // to call KLighD's DecoratorPlacementUtil#evaluateDecoratorPlacement the points of the path of the
            // parent rendering have to be stored.
            let path: Point[]
            // Todo: Can't figure out parent rendering currenlty.
            let parentRendering // = rendering.eContainer

            // Get inset from parent region
            let leftInset = 0
            let topInset = 0
            if (isEdge(parent)) {
                // TODO: Implement this method in SKGraphUtils
                // if (isDecendant(parent.target, parent.source))
                // TODO: Get parent insets.
                if (true) {
                    leftInset // = parent.source.insets.left
                    topInset // = parent.source.insets.top
                } else {
                    leftInset // = parent.source.parent.insets.left
                    topInset // = parent.source.parent.insets.top
                }
            }
            // TODO: Remove forced non-nulls later.
            if (isPolygon(parentRendering!)) {
                let points = []
                for (const point of (parentRendering as KPolygon).points) {
                    const position = evaluateKPosition(point, parentBounds, true)
                    const x = position.x + leftInset
                    const y = position.y + topInset
                    points.push({ x: x, y: y })
                }
                path = points
            } else if (isPolyline(parentRendering!)) {
                // TODO: Continue here!
            }
            break
        }
        default: {
            // If no placementData is defined, assume the width and height of the parent object
            // placed at the top left corner.
            bounds = { x: 0, y: 0, width: parentBounds.width, height: parentBounds.height }
            break
        }
    }

    // Decide if the bounds and decoration should be put in the boundsMap/decorationMap or in the rendering's
    // properties.
    // TODO: Remove all forced non-nulls when 'KDecoratorPlacementData' case is implemented.
    if (!usedBoundsMap) {
        console.log(rendering.type)
        console.log(rendering.properties[CALCULATED_BOUNDS])
        rendering.properties[CALCULATED_BOUNDS] = bounds!
        console.log(rendering.properties[CALCULATED_BOUNDS])
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
        handleChildren(rendering.children, rendering.childPlacement, bounds!, usedBoundsMap, usedDecorationMap, parent)
    } else if (isRenderingRef(rendering) && isContainerRendering(rendering.rendering)) {
        const referencedRendering = rendering.rendering as KContainerRendering
        handleChildren(
            referencedRendering.children,
            referencedRendering.childPlacement,
            bounds!,
            usedBoundsMap,
            usedDecorationMap,
            parent
        )
    }
}

function handleChildren(
    renderings: KRendering[] | undefined,
    placement: KPlacement | undefined,
    parentBounds: Bounds,
    boundsMap: Record<string, Bounds> | null,
    decorationMap: Record<string, Decoration> | null,
    parent: SKGraphElement
) {
    if (placement && isGridPlacement(placement) && renderings)
        handleGridPlacementRendering(renderings, placement, parentBounds, boundsMap, decorationMap, parent)
    else if (renderings)
        for (const childRendering of renderings)
            handleAreaAndPointAndDecoratorPlacementRendering(
                childRendering,
                parentBounds,
                boundsMap,
                decorationMap,
                parent
            )
}

function handleGridPlacementRendering(
    renderings: KRendering[],
    placement: KPlacement,
    parentBounds: Bounds,
    boundsMap: Record<string, Bounds> | null,
    decorationMap: Record<string, Decoration> | null,
    parent: SKGraphElement
) {
    // TODO: Do the thing!
    return
}

// JAVA EQUIVALENT:
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
