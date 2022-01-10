/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019-2022 by
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
/** @jsx svg */
import { VNode } from 'snabbdom';
import { svg } from 'sprotty'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Bounds } from 'sprotty-protocol';
import { KGraphData, KNode } from '@kieler/klighd-interactive/lib/constraint-classes';
import { DetailLevel } from './depth-map';
import { PaperShadows, SimplifySmallText, TextSimplificationThreshold, TitleScalingFactor } from './options/render-options-registry';
import { SKGraphModelRenderer } from './skgraph-model-renderer';
import {
    Arc, HorizontalAlignment, isRendering, KArc, KChildArea, KContainerRendering, KForeground, KHorizontalAlignment, KImage, KPolyline, KRendering, KRenderingLibrary, KRenderingRef, KRoundedBendsPolyline,
    KRoundedRectangle, KShadow, KText, KVerticalAlignment, K_ARC, K_CHILD_AREA, K_CONTAINER_RENDERING, K_CUSTOM_RENDERING, K_ELLIPSE, K_IMAGE, K_POLYGON, K_POLYLINE, K_RECTANGLE, K_RENDERING_LIBRARY,
    K_RENDERING_REF, K_ROUNDED_BENDS_POLYLINE, K_ROUNDED_RECTANGLE, K_SPLINE, K_TEXT, SKEdge, SKGraphElement, SKLabel, SKNode, VerticalAlignment
} from './skgraph-models';
import { BoundsAndTransformation, calculateX, findBoundsAndTransformationData, getPoints } from './views-common';
import {
    ColorStyles, DEFAULT_CLICKABLE_FILL, DEFAULT_FILL, getKStyles, getSvgColorStyle, getSvgColorStyles, getSvgLineStyles, getSvgShadowStyles, getSvgTextStyles, isInvisible,
    KStyles, LineStyles
} from './views-styles';

// ----------------------------- Functions for rendering different KRendering as VNodes in svg --------------------------------------------

/**
 * Translates a KChildArea rendering into an SVG rendering.
 * @param rendering The rendering.
 * @param parent The parent element.
 * @param propagatedStyles The styles propagated from parent elements that should be taken into account.
 * @param context The rendering context for this element.
 */
export function renderChildArea(rendering: KChildArea, parent: SKGraphElement, propagatedStyles: KStyles, context: SKGraphModelRenderer): VNode {
    if (parent.areChildAreaChildrenRendered) {
        console.error('This element contains multiple child areas, skipping this one.')
        return <g />
    }
    // remember, that this parent's children are now already rendered
    parent.areChildAreaChildrenRendered = true

    const element = <g id={rendering.renderingId}>
        {context.renderChildAreaChildren(parent)}
    </g>

    return element
}

/**
 * Translates a rectangular rendering into an SVG rendering.
 * This includes KEllipse, KRectangle and KRoundedRectangle.
 * @param rendering The rendering.
 * @param parent The parent element.
 * @param propagatedStyles The styles propagated from parent elements that should be taken into account.
 * @param context The rendering context for this element.
 * @param childOfNodeTitle If this rendering is a child of a node title. May override special renderings
 */
export function renderRectangularShape(
    rendering: KContainerRendering,
    parent: SKGraphElement,
    boundsAndTransformation: BoundsAndTransformation,
    styles: KStyles,
    stylesToPropagate: KStyles,
    context: SKGraphModelRenderer,
    childOfNodeTitle?: boolean): VNode {

    const gAttrs = {
        ...(boundsAndTransformation.transformation !== undefined ? { transform: boundsAndTransformation.transformation } : {})
    }

    // Check the invisibility first. If this rendering is supposed to be invisible, do not render it,
    // only render its children transformed by the transformation already calculated.
    if (isInvisible(styles)) {
        return <g {...gAttrs}>
            {renderChildRenderings(rendering, parent, stylesToPropagate, context, childOfNodeTitle)}
        </g>
    }

    // Default case. Calculate all svg objects and attributes needed to build this rendering from the styles and the rendering.
    const colorStyles = getSvgColorStyles(styles, context, parent)
    // objects rendered here that have no background should get a invisible, but clickable background so that users do not click through the non-available background.
    if (colorStyles.background === DEFAULT_FILL) {
        colorStyles.background = DEFAULT_CLICKABLE_FILL
    }
    const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(PaperShadows)
    const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined

    const lineStyles = getSvgLineStyles(styles, parent, context)

    // Create the svg element for this rendering.
    let element: VNode | undefined = undefined
    switch (rendering.type) {
        case K_ARC: {
            const kArcRendering = rendering as KArc

            let sweepFlag = 0
            let angle = kArcRendering.arcAngle
            // For a negative angle, rotate the other way around.
            if (angle < 0) {
                angle = -angle
                sweepFlag = 1
            }
            // If the angle is bigger than or equal to 360 degrees, use the same rendering as a KEllipse via fallthrough to that rendering instead.
            if (angle < 360) {
                // Calculation to get the start and endpoint of the arc from the angles given.
                // Reduce the width and height by half the linewidth on both sides, so the ellipse really stays within the given bounds.
                const width = boundsAndTransformation.bounds.width - styles.kLineWidth.lineWidth
                const height = boundsAndTransformation.bounds.height - styles.kLineWidth.lineWidth
                const rX = width / 2
                const rY = height / 2
                const midX = rX + styles.kLineWidth.lineWidth / 2
                const midY = rY + styles.kLineWidth.lineWidth / 2
                const startX = midX + rX * Math.cos(kArcRendering.startAngle * Math.PI / 180)
                const startY = midY - rY * Math.sin(kArcRendering.startAngle * Math.PI / 180)
                const endAngle = kArcRendering.startAngle + kArcRendering.arcAngle
                const endX = midX + rX * Math.cos(endAngle * Math.PI / 180)
                const endY = midY - rY * Math.sin(endAngle * Math.PI / 180)


                // If the angle is bigger or equal 180 degrees, use the large arc as of the w3c path specification
                // https://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
                const largeArcFlag = angle >= 180 ? 1 : 0
                // Rotation is not handled via KArcs but via KRotations, so leave this value as 0.
                const rotate = 0

                // The main arc.
                let d = `M${startX},${startY}A${rX},${rY},${rotate},${largeArcFlag},${sweepFlag},${endX},${endY}`
                switch (kArcRendering.arcType) {
                    case Arc.OPEN: {
                        // Open chords do not have any additional lines.
                        break
                    }
                    case Arc.CHORD: {
                        // Add a straight line from the end to the beginning point.
                        d += `L${startX},${startY}`
                        break
                    }
                    case Arc.PIE: {
                        // Add a straight line from the end to the center and then back to the beginning point.
                        d += `L${midX},${midY}L${startX},${startY}`
                        break
                    }
                }

                element = <g id={rendering.renderingId} {...gAttrs}>
                    {...renderSVGArc(lineStyles, colorStyles, shadowStyles, d, styles.kShadow)}
                    {renderChildRenderings(rendering, parent, stylesToPropagate, context, childOfNodeTitle)}
                </g>
                break
            } else {
                // Fallthrough to KEllipse case.
            }
        }
        // eslint-disable-next-line
        case K_ELLIPSE: {
            element = <g id={rendering.renderingId} {...gAttrs}>
                {...renderSVGEllipse(boundsAndTransformation.bounds, lineStyles, colorStyles, shadowStyles, styles.kShadow)}
                {renderChildRenderings(rendering, parent, stylesToPropagate, context, childOfNodeTitle)}
            </g>
            break
        }
        case K_RECTANGLE:
        case K_ROUNDED_RECTANGLE: {
            // like this the rx and ry will be undefined during the rendering of a roundedRectangle and therefore those fields will be left out.
            // Rounded rectangles work in svg just like regular rectangles just with those two added variables, so this call will result in a regular rectangle.

            // Rendering-specific attributes
            const rx = (rendering as KRoundedRectangle).cornerWidth
            const ry = (rendering as KRoundedRectangle).cornerHeight

            element = <g id={rendering.renderingId} {...gAttrs}>
                {...renderSVGRect(boundsAndTransformation.bounds, rx, ry, lineStyles, colorStyles, shadowStyles, styles.kShadow)}
                {renderChildRenderings(rendering, parent, stylesToPropagate, context, childOfNodeTitle)}
            </g>
            break
        }
        case K_IMAGE: {
            // TODO: clipShape is not used yet.
            const id = (rendering as KImage).bundleName + ':' + (rendering as KImage).imagePath
            const extension = id.slice(id.lastIndexOf('.') + 1)
            const image = 'data:image/' + extension + ';base64,' + sessionStorage.getItem(id)
            element = <g id={rendering.renderingId} {...gAttrs}>
                {...renderSVGImage(boundsAndTransformation.bounds, shadowStyles, image, styles.kShadow)}
            </g>
            break
        }
        default: {
            // This case can never happen. If it still does, happy debugging!
            throw new Error('Rendering is neither an KArc, KEllipse, KImage, nor a KRectangle or KRoundedRectangle!')
        }
    }

    if (element && context.depthMap) {
        const region = context.depthMap.getProvidingRegion(parent as KNode, context.viewport, context.renderOptionsRegistry)
        if (region && region.detail !== DetailLevel.FullDetails && parent.children.length > 1) {
            const offsetY = region.regionTitleHeight ?? 0
            const offsetX = region.regionTitleIndentation ?? 0
            const bounds = Math.min(region.boundingRectangle.bounds.height - offsetY, region.boundingRectangle.bounds.width - offsetX)
            const size = 50
            let scalingFactor = Math.max(bounds, 0) / size
            // Use zoom for constant size in viewport.
            if (context.viewport) {
                scalingFactor = Math.min(1 / context.viewport.zoom, scalingFactor)
            }

            const y = scalingFactor > 0 ? offsetY / scalingFactor : 0
            const x = scalingFactor > 0 ? offsetX / scalingFactor : 0
            const placeholder = <g
                transform={`scale(${scalingFactor}, ${scalingFactor}) translate(${x}, ${y})`}>
                <circle cx="11" cy="11" r="8" stroke="#000000" fill="none" />
                <line x1="21" x2="16.65" y1="21" y2="16.65" stroke="#000000" style={{'stroke-linecap': 'round', 'stroke-width': '2'}}/>
                <line x1="11" x2="11" y1="8" y2="14" stroke="#000000" stroke-linecap="round" />
                <line x1="8" x2="14" y1="11" y2="11" stroke="#000000" stroke-linecap="round" />
            </g>
            element.children ? element.children.push(placeholder) : element.children = [placeholder]
        }
    }

    return element as VNode
}

/**
 * Translates a line rendering into an SVG rendering.
 * This includes all subclasses of and the KPolyline rendering itself.
 * @param rendering The rendering.
 * @param parent The parent element.
 * @param propagatedStyles The styles propagated from parent elements that should be taken into account.
 * @param context The rendering context for this element.
 * @param childOfNodeTitle If this rendering is a child of a node title. May override special renderings
 */
export function renderLine(rendering: KPolyline,
    parent: SKGraphElement | SKEdge,
    boundsAndTransformation: BoundsAndTransformation,
    styles: KStyles,
    stylesToPropagate: KStyles,
    context: SKGraphModelRenderer,
    childOfNodeTitle?: boolean): VNode {

    const gAttrs = {
        ...(boundsAndTransformation.transformation !== undefined ? { transform: boundsAndTransformation.transformation } : {})
    }

    // Check the invisibility first. If this rendering is supposed to be invisible, do not render it,
    // only render its children transformed by the transformation already calculated.
    if (isInvisible(styles)) {
        return <g {...gAttrs}>
            {renderChildRenderings(rendering, parent, stylesToPropagate, context, childOfNodeTitle)}
        </g>
    }

    // Default case. Calculate all svg objects and attributes needed to build this rendering from the styles and the rendering.
    const colorStyles = getSvgColorStyles(styles, context, parent)

    const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(PaperShadows)
    const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
    const lineStyles = getSvgLineStyles(styles, parent, context)

    const points = getPoints(parent, rendering, boundsAndTransformation)
    if (points.length === 0) {
        return <g>
            {renderChildRenderings(rendering, parent, stylesToPropagate, context, childOfNodeTitle)}
        </g>
    }

    // now define the line's path.
    let path = ''
    switch (rendering.type) {
        case K_SPLINE: {
            path += `M${points[0].x},${points[0].y}`
            for (let i = 1; i < points.length; i = i + 3) {
                const remainingPoints = points.length - i
                if (remainingPoints === 1) {
                    // if one routing point is left, draw a straight line to there.
                    path += `L${points[i].x},${points[i].y}`
                } else if (remainingPoints === 2) {
                    // if two routing points are left, draw a quadratic bezier curve with those two points.
                    path += `Q${points[i].x},${points[i].y} ${points[i + 1].x},${points[i + 1].y}`
                } else {
                    // if three or more routing points are left, draw a cubic bezier curve with those points.
                    path += `C${points[i].x},${points[i].y} `
                        + `${points[i + 1].x},${points[i + 1].y} `
                        + `${points[i + 2].x},${points[i + 2].y}`
                }
            }
            break
        }
        case K_POLYLINE: // Fall through to next case. KPolylines are just KPolygons without the closing end.
        case K_POLYGON: {
            path += `M${points[0].x},${points[0].y}`
            for (let i = 1; i < points.length; i++) {
                path += `L${points[i].x},${points[i].y}`
            }
            if (rendering.type === K_POLYGON) {
                path += 'Z'
            }
            break
        }
        case K_ROUNDED_BENDS_POLYLINE: {
            // Rendering-specific attributes
            const bendRadius = (rendering as KRoundedBendsPolyline).bendRadius

            // now define the rounded polyline's path.
            path += `M${points[0].x},${points[0].y}`
            for (let i = 1; i < points.length - 1; i++) {
                const p0 = points[i - 1]
                const p = points[i]
                const p1 = points[i + 1]
                // last point
                const x0 = p0.x
                const y0 = p0.y
                // current point where a bend should be rendered
                const xp = p.x
                const yp = p.y
                // next point
                const x1 = p1.x
                const y1 = p1.y
                // distance between the last point and the current point
                const dist0 = Math.sqrt((x0 - xp) * (x0 - xp) + (y0 - yp) * (y0 - yp))
                // distance between the current point and the next point
                const dist1 = Math.sqrt((x1 - xp) * (x1 - xp) + (y1 - yp) * (y1 - yp))
                // If the previous / next point is too close, use a smaller bend radius
                const usedBendRadius = Math.min(bendRadius, dist0 / 2, dist1 / 2)
                // start and end points of the bend
                let xs, ys, xe, ye
                if (usedBendRadius === 0) {
                    // Avoid division by zero if two points are identical.
                    xs = xp
                    ys = yp
                    xe = xp
                    ye = yp
                } else {
                    xs = xp + (usedBendRadius * (x0 - xp)) / dist0
                    ys = yp + (usedBendRadius * (y0 - yp)) / dist0
                    xe = xp + (usedBendRadius * (x1 - xp)) / dist1
                    ye = yp + (usedBendRadius * (y1 - yp)) / dist1
                }
                // draw a line to the start of the bend point (from the last end of its bend)
                // and then draw the bend with the control points of the point itself and the bend end point.
                path += `L${xs},${ys}Q${xp},${yp} ${xe},${ye}`
            }
            if (points.length > 1) {
                const lastPoint = points[points.length - 1]
                path += `L${lastPoint.x},${lastPoint.y}`
            }
            break
        }
    }

    // Create the svg element for this rendering.
    // Only apply the fast shadow to KPolygons, other shadows are not allowed there.
    const element = <g id={rendering.renderingId} {...gAttrs}>
        {...renderSVGLine(lineStyles, colorStyles, shadowStyles, path, rendering.type == K_POLYGON ? styles.kShadow : undefined)}
        {renderChildRenderings(rendering, parent, stylesToPropagate, context, childOfNodeTitle)}
    </g>
    return element
}

/**
 * Translates a text rendering into an SVG text rendering.
 * @param rendering The rendering.
 * @param parent The parent element.
 * @param propagatedStyles The styles propagated from parent elements that should be taken into account.
 * @param context The rendering context for this element.
 * @param childOfNodeTitle If this rendering is a child of a node title. May override special renderings
 */
export function renderKText(rendering: KText,
    parent: SKGraphElement | SKLabel,
    boundsAndTransformation: BoundsAndTransformation,
    styles: KStyles,
    context: SKGraphModelRenderer,
    childOfNodeTitle?: boolean): VNode {
    // Find the text to write first.
    let text = undefined
    // KText elements as renderings of labels have their text in the KLabel, not the KText
    if ('text' in parent) { // if parent is KLabel
        text = parent.text
    } else {
        text = rendering.text
    }
    // If no text can be found, return here.
    if (text === undefined) return <g />

    // The text split into an array for each individual line
    const lines = text.split('\n')


    // Check the invisibility first. If this rendering is supposed to be invisible, do not render it,
    // only render its children transformed by the transformation already calculated.
    if (isInvisible(styles)) {
        return <g />
    }

    // Default case. Calculate all svg objects and attributes needed to build this rendering from the styles and the rendering.
    const colorStyle = getSvgColorStyle(styles.kForeground as KForeground, context)

    const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(PaperShadows)
    const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
    const textStyles = getSvgTextStyles(styles)

    // Replace text with rectangle, if the text is too small.
    const simplifySmallTextOption = context.renderOptionsRegistry.getValue(SimplifySmallText)
    const simplifySmallText = simplifySmallTextOption ?? false // Only enable, if option is found.
    if (simplifySmallText && !rendering.isNodeTitle && !childOfNodeTitle) {
        const simplificationThreshold = context.renderOptionsRegistry.getValueOrDefault(TextSimplificationThreshold)

        const proportionalHeight = 0.5 // height of replacement compared to full text height
        if (context.viewport && rendering.calculatedTextBounds
            && rendering.calculatedTextBounds.height * context.viewport.zoom <= simplificationThreshold) {
            const replacements: VNode[] = []
            lines.forEach((line, index) => {
                const xPos = boundsAndTransformation && boundsAndTransformation.bounds.x ? boundsAndTransformation.bounds.x : 0
                const yPos = boundsAndTransformation && boundsAndTransformation.bounds.y && rendering.calculatedTextLineHeights && boundsAndTransformation.bounds.height ?
                    boundsAndTransformation.bounds.y - boundsAndTransformation.bounds.height / 2 + rendering.calculatedTextLineHeights[index] / 2 * proportionalHeight : 0
                const width = rendering.calculatedTextLineWidths ? rendering.calculatedTextLineWidths[index] : 0
                const height = rendering.calculatedTextLineHeights ? rendering.calculatedTextLineHeights[index] * proportionalHeight : 0
                // Generate rectangle for each line with color style.
                const curLine = colorStyle ? <rect x={xPos} y={yPos} width={width} height={height} fill={colorStyle.color} />
                    : <rect x={xPos} y={yPos} width={width} height={height} fill="#000000" />
                replacements.push(curLine)
            });
            return <g id={rendering.renderingId} {...{}}>
                {...replacements}
            </g>
        }

    }

    // The svg style of the resulting text element.
    const opacity = context.mListener.hasDragged ? 0.1 : parent.opacity
    const style = {
        ...{ 'dominant-baseline': textStyles.dominantBaseline },
        ...{ 'font-family': textStyles.fontFamily },
        ...{ 'font-size': textStyles.fontSize },
        ...{ 'font-style': textStyles.fontStyle },
        ...{ 'font-weight': textStyles.fontWeight },
        ...{ 'text-decoration-line': textStyles.textDecorationLine },
        ...{ 'text-decoration-style': textStyles.textDecorationStyle },
        ...{ 'opacity': opacity },
        ...(colorStyle ? { 'fill-opacity': colorStyle.opacity } : {})
    }

    // The attributes to be contained in the returned text node.
    const attrs = {
        x: boundsAndTransformation.bounds.x,
        style: style,
        ...(colorStyle ? { fill: colorStyle.color } : {}),
        ...(shadowStyles ? {filter: shadowStyles} : {}),
        ...{ 'xml:space': 'preserve' } // This attribute makes the text size adjustment include any trailing white spaces.
    } as any

    let elements: VNode[]
    if (lines.length === 1) {
        // If the text has only one line, just put the text in the text node directly.
        attrs.y = boundsAndTransformation.bounds.y;
        // Force any SVG renderer rendering this text to use the exact width calculated for it.
        // This avoids overlapping texts or too big gaps at the cost of slightly bigger/tighter glyph spacings
        // when viewed in a different SVG viewer after exporting.
        if (rendering.calculatedTextLineWidths) {
            attrs.textLength = rendering.calculatedTextLineWidths[0]
            attrs.lengthAdjust = 'spacingAndGlyphs'
        }
        
        elements = [
            <text {...attrs}>
                {...lines}
            </text>
        ]
    } else {
        // Otherwise, put each line of text in a separate <text> element.
        const calculatedTextLineWidths = rendering.calculatedTextLineWidths
        const calculatedTextLineHeights = rendering.calculatedTextLineHeights
        let currentY = boundsAndTransformation.bounds.y ? boundsAndTransformation.bounds.y : 0
        if (rendering.calculatedTextLineWidths) {
            attrs.lengthAdjust = 'spacingAndGlyphs'
        }

        elements = []
        lines.forEach((line, index) => {
            const currentElement = <text
                {...attrs}
                y={currentY}
                {...(calculatedTextLineWidths ? { textLength: calculatedTextLineWidths[index] } : {})}
            >{line}</text>

            elements.push(currentElement)
            currentY = calculatedTextLineHeights ? currentY + calculatedTextLineHeights[index] : currentY
        });

    }

    const gAttrs = {
        ...(boundsAndTransformation.transformation !== undefined ? { transform: boundsAndTransformation.transformation } : {})
    }
    // build the element from the above defined attributes and children
    return <g id={rendering.renderingId} {...gAttrs}>
        {...elements}
    </g>
}

/**
 * Renders all child renderings of the given container rendering.
 * @param parentRendering The parent rendering.
 * @param parent The parent element containing this rendering.
 * @param propagatedStyles The styles propagated from parent elements that should be taken into account.
 * @param context The rendering context for this element.
 * @param childOfNodeTitle If this rendering is a child of a node title. May override special renderings
 */
export function renderChildRenderings(parentRendering: KContainerRendering, parentElement: SKGraphElement, propagatedStyles: KStyles,
    context: SKGraphModelRenderer, childOfNodeTitle?: boolean): (VNode | undefined)[] {
    // children only should be rendered if the parentElement is not a shadow
    if (!(parentElement instanceof SKNode) || !parentElement.shadow) {
        const renderings: (VNode | undefined)[] = []
        for (const childRendering of parentRendering.children) {
            const rendering = getRendering([childRendering], parentElement, propagatedStyles, context, childOfNodeTitle)
            renderings.push(rendering)
        }
        return renderings
    }
    return []
}

export function renderError(rendering: KRendering): VNode {
    return <text>
        {'Rendering cannot be drawn!\n' +
            'Type: ' + rendering.type + '\n' +
            'ID: ' + rendering.renderingId}
    </text>
}

/**
 * Renders some SVG shape, possibly with an added shadow, as given by the svgFunction. If a simple shadow
 * should be added, it is added as four copies of the SVG shape with rgba(0,0,0,0.1) and the
 * offsets defined by the kShadow, if a nice shadow should be added, it is added via SVG filter.
 * 
 * @param kShadow The shadow definition for the rendering, or undefined if no shadow should be added
 * @param shadowStyles specific shadow filter ID, if this element should be drawn with a smooth shadow and no simple one.
 * @param svgFunction The callback function rendering the wanted SVG shape. x and y are the offsets
 *  for the renderings additional to any other offsets, here for the shadows, kShadow is the shadow
 *  definition as given to this function as well and the params are the other params given to this
 *  function.
 * @param params The further parameters needed to call the svgFunction other than an x, y, shadowStyles, and
 *  kShadow.
 * @returns the svg shapes generated by the svg function, with the correct shadow.
 */
export function renderWithShadow<T extends any[]>(
    kShadow: KShadow | undefined,
    shadowStyles: string | undefined,
    svgFunction: (x: number | undefined, y: number | undefined, shadowStyles: string | undefined, kShadow: KShadow | undefined, ...params: T) => VNode,
    ...params: T): VNode[] {
    // If a shadowStyle is given to this function, we want 'nice' shadows using the filter string.
    if (shadowStyles !== undefined) {
        return [svgFunction(undefined, undefined, shadowStyles, undefined, ...params)]
    }

    // Otherwise see if there is a shadow definition and render it the 'fast' KIELER-style.
    if (kShadow) {
        // Shadow rendered as four copies of the SVG shape with some defaults set due to the shadow and the original rectangle.
        return [
            svgFunction(4 * kShadow.xOffset / 4, 4 * kShadow.yOffset / 4, undefined, kShadow, ...params),
            svgFunction(3 * kShadow.xOffset / 4, 3 * kShadow.yOffset / 4, undefined, kShadow, ...params),
            svgFunction(2 * kShadow.xOffset / 4, 2 * kShadow.yOffset / 4, undefined, kShadow, ...params),
            svgFunction(1 * kShadow.xOffset / 4, 1 * kShadow.yOffset / 4, undefined, kShadow, ...params),
            svgFunction(undefined, undefined, undefined, undefined, ...params)
        ]
    } else {
        return [svgFunction(undefined, undefined, undefined, undefined, ...params)]
    }
}

// ------- All functions turning the rendering data into an SVG with potential shadow style. ---------- //

/**
 * Renders a rectangle with all given information.
 * 
 * @param bounds bounds data calculated for this rectangle.
 * @param rx rx parameter of SVG rect
 * @param ry ry parameter of SVG rect
 * @param lineStyles style information for lines (stroke etc.)
 * @param colorStyles style information for color
 * @param shadowStyles specific shadow filter ID, if this element should be drawn with a smooth shadow and no simple one.
 * @param kShadow general shadow information.
 * @returns An array of SVG <rects> resulting from this. Only multiple <rect>s if a simple shadow effect should be applied.
 */
export function renderSVGRect(bounds: Bounds, rx: number, ry: number, lineStyles: LineStyles, colorStyles: ColorStyles, shadowStyles: string | undefined, kShadow: KShadow | undefined): VNode[] {
    return renderWithShadow(kShadow, shadowStyles, renderSingleSVGRect, bounds, rx, ry, lineStyles, colorStyles)
}

/**
 * Renders a rectangle with all given information.
 * If the rendering is a shadow (has a kShadow parameter), all stroke attributes are ignored (no stroke on the shadow) and a
 * black fill with 0.1 alpha is returned.
 * 
 * @param x x offset of the rectangle, to be used for shadows only.
 * @param y y offset of the rectangle, to be used for shadows only.
 * @param shadowStyles specific shadow filter ID, if this element should be drawn with a smooth shadow and no simple one.
 * @param kShadow shadow information. Controls what this method does.
 * @param bounds bounds data calculated for this rectangle.
 * @param rx rx parameter of SVG rect
 * @param ry ry parameter of SVG rect
 * @param lineStyles style information for lines (stroke etc.)
 * @param colorStyles style information for color
 * @returns A single SVG <rect>.
 */
export function renderSingleSVGRect(x: number | undefined, y: number | undefined, shadowStyles: string | undefined, kShadow: KShadow | undefined, bounds: Bounds, rx: number, ry: number, lineStyles: LineStyles, colorStyles: ColorStyles): VNode {
    return <rect
        width={bounds.width}
        height={bounds.height}
        {...(x ? { x: x } : {})}
        {...(y ? { y: y } : {})}
        {...(rx ? { rx: rx } : {})}
        {...(ry ? { ry: ry } : {})}
        style={{
            ...(kShadow ? {} : {'stroke-linecap': lineStyles.lineCap}),
            ...(kShadow ? {} : {'stroke-linejoin': lineStyles.lineJoin}),
            ...(kShadow ? {} : {'stroke-width': lineStyles.lineWidth}),
            ...(kShadow ? {} : {'stroke-dasharray': lineStyles.dashArray}),
            ...(kShadow ? {} : {'stroke-miterlimit': lineStyles.miterLimit}),
            'opacity': kShadow ? colorStyles.opacity ? String(Number(colorStyles.opacity) * 0.1) : '0.1' : colorStyles.opacity,
            ...(kShadow ? {} : {'stroke-opacity': colorStyles.foreground.opacity}),
            ...(kShadow || colorStyles.background.opacity ? {'fill-opacity': kShadow ? '1' : colorStyles.background.opacity} : {})
        }}
        {...(kShadow ? {} : {stroke: colorStyles.foreground.color})}
        {...(kShadow ? {fill:'rgb(0,0,0)'} : {fill: colorStyles.background.color})}
        {...(shadowStyles ? {filter: shadowStyles} : {})}
    />
}

/**
 * Renders an image with all given information.
 * 
 * @param bounds bounds data calculated for this image.
 * @param image The image href string
 * @param kShadow shadow information.
 * @returns An array of SVG elements, here <image>s and <rect>s resulting from this. <rect>s are added if a shadow effect should be applied.
 */
export function renderSVGImage(bounds: Bounds, shadowStyles: string | undefined, image: string, kShadow: KShadow | undefined): VNode[] {
    return renderWithShadow(kShadow, shadowStyles, renderSingleSVGImage, bounds, image)
}

/**
 * Renders an image with all given information.
 * If the rendering is a shadow, a shadow rect is drawn instead.
 * 
 * @param x x offset of the image, to be used for shadows only.
 * @param y y offset of the image, to be used for shadows only.
 * @param kShadow shadow information. Controls what this method does.
 * @param bounds bounds data calculated for this image.
 * @param image The image href string
 * @returns A single SVG <rect>.
 */
export function renderSingleSVGImage(x: number | undefined, y: number | undefined, shadowStyles: string | undefined, kShadow: KShadow | undefined, bounds: Bounds, image: string): VNode {
    // A shadow of an image is just a rectangle.
    if (kShadow) {
        return <rect
            {...(x ? { x: x } : {})}
            {...(y ? { y: y } : {})}
            width={bounds.width}
            height={bounds.height}
            style={{
                'opacity': '0.1'
            }}
            fill='rgb(0,0,0)'
        />
    } else {
        return <image
            width={bounds.width}
            height={bounds.height}
            href={image}
            {...(shadowStyles ? {filter: shadowStyles} : {})}
        />
    }
}

/**
 * Renders an arc with all given information.
 * 
 * @param lineStyles style information for lines (stroke etc.)
 * @param colorStyles style information for color
 * @param shadowStyles specific shadow filter ID, if this element should be drawn with a smooth shadow and no simple one.
 * @param path The 'd' attribute for SVG <path>
 * @param kShadow general shadow information.
 * @returns An array of SVG <path>s resulting from this. Only multiple <path>s if a simple shadow effect should be applied.
 */
export function renderSVGArc(lineStyles: LineStyles, colorStyles: ColorStyles, shadowStyles: string | undefined, path: string, kShadow: KShadow | undefined): VNode[] {
    return renderWithShadow(kShadow, shadowStyles, renderSingleSVGArc, lineStyles, colorStyles, path)
} 

/**
 * Renders an arc with all given information.
 * If the rendering is a shadow (has a kShadow parameter), all stroke attributes are ignored (no stroke on the shadow) and a
 * black fill with 0.1 alpha is returned.
 * 
 * @param x x offset of the arc, to be used for shadows only.
 * @param y y offset of the arc, to be used for shadows only.
 * @param shadowStyles specific shadow filter ID, if this element should be drawn with a smooth shadow and no simple one.
 * @param kShadow shadow information. Controls what this method does.
 * @param lineStyles style information for lines (stroke etc.)
 * @param colorStyles style information for color
 * @param path The 'd' attribute for the SVG <path>
 * @returns A single SVG <path>.
 */
export function renderSingleSVGArc(x: number | undefined, y: number | undefined, shadowStyles: string | undefined, kShadow: KShadow | undefined, lineStyles: LineStyles, colorStyles: ColorStyles, path: string): VNode {
    return <path
        {...(x && y ? { transform: `translate(${x},${y})` } : {})}
        d={path}
        style={{
            ...(kShadow ? {} : {'stroke-linecap': lineStyles.lineCap}),
            ...(kShadow ? {} : {'stroke-linejoin': lineStyles.lineJoin}),
            ...(kShadow ? {} : {'stroke-width': lineStyles.lineWidth}),
            ...(kShadow ? {} : {'stroke-dasharray': lineStyles.dashArray}),
            ...(kShadow ? {} : {'stroke-miterlimit': lineStyles.miterLimit}),
            'opacity': kShadow ? colorStyles.opacity ? String(Number(colorStyles.opacity) * 0.1) : '0.1' : colorStyles.opacity,
            ...(kShadow ? {} : {'stroke-opacity': colorStyles.foreground.opacity}),
            ...(kShadow || colorStyles.background.opacity ? {'fill-opacity': kShadow ? '1' : colorStyles.background.opacity} : {})
        }}
        {...(kShadow ? {} : {stroke: colorStyles.foreground.color})}
        {...(kShadow ? {fill:'rgb(0,0,0)'} : {fill: colorStyles.background.color})}
        {...(shadowStyles ? {filter: shadowStyles} : {})}
    />
}

/**
 * Renders an ellipse with all given information.
 * 
 * @param lineStyles style information for lines (stroke etc.)
 * @param colorStyles style information for color
 * @param shadowStyles specific shadow filter ID, if this element should be drawn with a smooth shadow and no simple one.
 * @param kShadow general shadow information.
 * @returns An array of SVG <ellipse>s resulting from this. Only multiple <ellipse>s if a simple shadow effect should be applied.
 */
export function renderSVGEllipse(bounds: Bounds, lineStyles: LineStyles, colorStyles: ColorStyles, shadowStyles: string | undefined, kShadow: KShadow | undefined): VNode[] {
    return renderWithShadow(kShadow, shadowStyles, renderSingleSVGEllipse, bounds, lineStyles, colorStyles)
}

/**
 * Renders an ellipse with all given information.
 * If the rendering is a shadow (has a kShadow parameter), all stroke attributes are ignored (no stroke on the shadow) and a
 * black fill with 0.1 alpha is returned.
 * 
 * @param x x offset of the ellipse, to be used for shadows only.
 * @param y y offset of the ellipse, to be used for shadows only.
 * @param shadowStyles specific shadow filter ID, if this element should be drawn with a smooth shadow and no simple one.
 * @param kShadow shadow information. Controls what this method does.
 * @param bounds bounds data calculated for this ellipse.
 * @param lineStyles style information for lines (stroke etc.)
 * @param colorStyles style information for color
 * @returns A single SVG <ellipse>.
 */
export function renderSingleSVGEllipse(x: number | undefined, y: number | undefined, shadowStyles: string | undefined, kShadow: KShadow | undefined, bounds: Bounds, lineStyles: LineStyles, colorStyles: ColorStyles): VNode {
    return <ellipse
        {...(x && y ? { transform: `translate(${x},${y})` } : {})}
        cx={bounds.width / 2}
        cy={bounds.height / 2}
        rx={bounds.width / 2}
        ry={bounds.height / 2}
        style={{
            ...(kShadow ? {} : {'stroke-linecap': lineStyles.lineCap}),
            ...(kShadow ? {} : {'stroke-linejoin': lineStyles.lineJoin}),
            ...(kShadow ? {} : {'stroke-width': lineStyles.lineWidth}),
            ...(kShadow ? {} : {'stroke-dasharray': lineStyles.dashArray}),
            ...(kShadow ? {} : {'stroke-miterlimit': lineStyles.miterLimit}),
            'opacity': kShadow ? colorStyles.opacity ? String(Number(colorStyles.opacity) * 0.1) : '0.1' : colorStyles.opacity,
            ...(kShadow ? {} : {'stroke-opacity': colorStyles.foreground.opacity}),
            ...(kShadow || colorStyles.background.opacity ? {'fill-opacity': kShadow ? '1' : colorStyles.background.opacity} : {})
        }}
        {...(kShadow ? {} : {stroke: colorStyles.foreground.color})}
        {...(kShadow ? {fill:'rgb(0,0,0)'} : {fill: colorStyles.background.color})}
        {...(shadowStyles ? {filter: shadowStyles} : {})}
    />
}

/**
 * Renders a rendering with a specific path (polyline, polygon, etc.) with all given information.
 * 
 * @param lineStyles style information for lines (stroke etc.)
 * @param colorStyles style information for color
 * @param shadowStyles specific shadow filter ID, if this element should be drawn with a smooth shadow and no simple one.
 * @param path The 'd' attribute for the SVG <path>
 * @param kShadow general shadow information.
 * @returns An array of SVG <path>s resulting from this. Only multiple <path>s if a simple shadow effect should be applied.
 */
export function renderSVGLine(lineStyles: LineStyles, colorStyles: ColorStyles, shadowStyles: string | undefined, path: string, kShadow: KShadow | undefined): VNode[] {
    return renderWithShadow(kShadow, shadowStyles, renderSingleSVGLine, lineStyles, colorStyles, path)
}

/**
 * Renders a rendering with a specific path (polyline, polygon, etc.) with all given information.
 * If the rendering is a shadow (has a kShadow parameter), all stroke attributes are ignored (no stroke on the shadow) and a
 * black fill with 0.1 alpha is returned.
 * 
 * @param x x offset of the line, to be used for shadows only.
 * @param y y offset of the line, to be used for shadows only.
 * @param shadowStyles specific shadow filter ID, if this element should be drawn with a smooth shadow and no simple one.
 * @param kShadow shadow information. Controls what this method does.
 * @param lineStyles style information for lines (stroke etc.)
 * @param colorStyles style information for color
 * @param path The 'd' attribute for the SVG <path>.
 * @returns A single SVG <path>.
 */
export function renderSingleSVGLine(x: number | undefined, y: number | undefined, shadowStyles: string | undefined, kShadow: KShadow | undefined, lineStyles: LineStyles, colorStyles: ColorStyles, path: string): VNode {
    return <path
        {...(x && y ? { transform: `translate(${x},${y})` } : {})}
        d={path}
        style={{
            ...(kShadow ? {} : {'stroke-linecap': lineStyles.lineCap}),
            ...(kShadow ? {} : {'stroke-linejoin': lineStyles.lineJoin}),
            ...(kShadow ? {} : {'stroke-width': lineStyles.lineWidth}),
            ...(kShadow ? {} : {'stroke-dasharray': lineStyles.dashArray}),
            ...(kShadow ? {} : {'stroke-miterlimit': lineStyles.miterLimit}),
            'opacity': kShadow ? colorStyles.opacity ? String(Number(colorStyles.opacity) * 0.1) : '0.1' : colorStyles.opacity,
            ...(kShadow ? {} : {'stroke-opacity': colorStyles.foreground.opacity}),
            ...(kShadow || colorStyles.background.opacity ? {'fill-opacity': kShadow ? '1' : colorStyles.background.opacity} : {})
        }}
        {...(kShadow ? {} : {stroke: colorStyles.foreground.color})}
        {...(kShadow ? {fill:'rgb(0,0,0)'} : {fill: colorStyles.background.color})}
        {...(shadowStyles ? {filter: shadowStyles} : {})}
    />
}


/**
 * Looks up the KRendering in the given data pool and generates a SVG rendering from that.
 * @param datas The list of possible KRenderings and additional data.
 * @param parent The parent element containing this rendering.
 * @param propagatedStyles The styles propagated from parent elements that should be taken into account.
 * @param context The rendering context for this rendering.
 * @param childOfNodeTitle If this rendering is a child of a node title. May override special renderings
 */
export function getRendering(datas: KGraphData[], parent: SKGraphElement, propagatedStyles: KStyles,
    context: SKGraphModelRenderer, childOfNodeTitle?: boolean): VNode | undefined {
    const kRenderingLibrary = datas.find(data => data !== null && data.type === K_RENDERING_LIBRARY)

    if (kRenderingLibrary !== undefined) {
        // register the rendering library if found in the parent node
        context.kRenderingLibrary = kRenderingLibrary as KRenderingLibrary
    }

    const kRendering = getKRendering(datas, context)

    if (kRendering === undefined) {
        return undefined
    }

    return renderKRendering(kRendering, parent, propagatedStyles, context, childOfNodeTitle)
}

/**
 * Translates any KRendering into an SVG rendering.
 * @param kRendering The rendering.
 * @param parent The parent element.
 * @param propagatedStyles The styles propagated from parent elements that should be taken into account.
 * @param context The rendering context for this element.
 * @param childOfNodeTitle If this rendering is a child of a node title. May override special renderings
 */
export function renderKRendering(kRendering: KRendering,
    parent: SKGraphElement | SKLabel,
    propagatedStyles: KStyles,
    context: SKGraphModelRenderer,
    childOfNodeTitle?: boolean): VNode | undefined { // TODO: not all of these are implemented yet

    // The styles that should be propagated to the children of this rendering. Will be modified in the getKStyles call.
    const stylesToPropagate = new KStyles
    // Extract the styles of the rendering into a more presentable object.
    const styles = getKStyles(parent, kRendering.styles, propagatedStyles, stylesToPropagate)

    // Determine the bounds of the rendering first and where it has to be placed.
    const isEdge = [K_POLYLINE,  K_POLYGON, K_ROUNDED_BENDS_POLYLINE, K_SPLINE].includes(kRendering.type)
    const boundsAndTransformation = findBoundsAndTransformationData(kRendering, styles, parent, context, isEdge)
    if (boundsAndTransformation === undefined) {
        // If no bounds are found, the rendering can not be drawn.
        return renderError(kRendering)
    }

    const providingRegion = context.depthMap?.getProvidingRegion(parent as KNode, context.viewport, context.renderOptionsRegistry)

    // Check if this is a title rendering. If we have a title, create that rendering, remember where it should be and how much space it has.
    // If we are zoomed in far enough, return that rendering, otherwise put it into the list to be rendered on top by the element rendering.

    // The rectangle that may be drawn behind the title rendering to highlight the overlay
    let overlayRectangle: VNode | undefined = undefined
    // remembers if this rendering is a title rendering and should therefore be rendered overlaying the other renderings.
    let isOverlay = false
    
    // If this rendering is the main title rendering of the element, either render it usually if
    // zoomed in far enough or remember it to be rendered later scaled up and overlayed on top of the parent rendering.
    if (context.depthMap && boundsAndTransformation.bounds.width && boundsAndTransformation.bounds.height && kRendering.isNodeTitle) {
        // Scale to limit of bounding box or max size.
        const titleScalingFactorOption = context.renderOptionsRegistry.getValueOrDefault(TitleScalingFactor) as number
        let maxScale = titleScalingFactorOption
        if (context.viewport) {
            maxScale = maxScale / context.viewport.zoom
        }
        if (providingRegion && providingRegion.detail !== DetailLevel.FullDetails && parent.children.length > 1
            || kRendering.calculatedBounds && kRendering.calculatedBounds.height * context.viewport.zoom <= titleScalingFactorOption * kRendering.calculatedBounds.height) {
            isOverlay = true

            let boundingBox = boundsAndTransformation.bounds
            // For KTexts the x and y coordinates define the origin of the baseline, not the bounding box.
            if (kRendering.type === K_TEXT) {
                boundingBox = findBoundsAndTransformationData(kRendering, styles, parent, context, isEdge, true)?.bounds ?? boundingBox
            }
            
            
            const parentBounds = providingRegion ? providingRegion.boundingRectangle.bounds : (parent as KNode).bounds
            const originalWidth = boundingBox.width
            const originalHeight = boundingBox.height
            const originalX = boundingBox.x
            const originalY = boundingBox.y

            const maxScaleX = parentBounds.width / originalWidth
            const maxScaleY = parentBounds.height / originalHeight
            // Don't let scalingfactor get too big.
            let scalingFactor = Math.min(maxScaleX, maxScaleY, maxScale)
            // Make sure we never scale down.
            scalingFactor = Math.max(scalingFactor,  1)

            // Calculate the new x and y indentation:
            // width required of scaled rendering
            const newWidth = originalWidth * scalingFactor
            // space to the left of the rendering without scaling...
            const spaceL = originalX
            // ...and to its right
            const spaceR = parentBounds.width - originalX - originalWidth
            // New x value after taking space off both sides at an equal ratio
            const newX = originalX - spaceL * (newWidth - originalWidth) / (spaceL + spaceR)

            // Same for y axis, just with switched dimensional variables.
            const newHeight = originalHeight * scalingFactor
            const spaceT = originalY
            const spaceB = parentBounds.height - originalY - originalHeight
            const newY = originalY - spaceT * (newHeight - originalHeight) / (spaceT + spaceB)

            // Apply the new bounds and scaling as the element's transformation.
            const translateAndScale = `translate(${newX},${newY})scale(${scalingFactor})`
            if (!providingRegion) {
                // Add the transformations necessary for correct placement
                const positionOffset = context.positions[context.positions.length - 1]
                boundsAndTransformation.transformation = positionOffset + translateAndScale
            } else {
                boundsAndTransformation.transformation = translateAndScale
            }
            // For text renderings, recalculate the required bounds the text needs with the updated data.
            if (kRendering.type === K_TEXT && (kRendering as KText).calculatedTextBounds) {
                const rendering = kRendering as KText
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const textWidth = rendering.calculatedTextBounds!.width

                // text centered in its new bounding box around local 0,0 coordinates
                styles.kHorizontalAlignment = {
                    horizontalAlignment: HorizontalAlignment.CENTER
                } as KHorizontalAlignment
                styles.kVerticalAlignment = {
                    verticalAlignment: VerticalAlignment.CENTER
                } as KVerticalAlignment
                boundsAndTransformation.bounds = {
                    x: calculateX(0, originalWidth, styles.kHorizontalAlignment, textWidth),
                    y: originalHeight * 0.5,
                    width: originalWidth,
                    height: originalHeight
                }
            } else {
                // Offsets are already applied in the transformation, so set them to 0 here.
                boundsAndTransformation.bounds = {
                    x: 0,
                    y: 0,
                    width: originalWidth,
                    height: originalHeight
                }
            }
            if (providingRegion) {
                // Store exact height of title text
                providingRegion.regionTitleHeight = newHeight
                providingRegion.regionTitleIndentation = newX
            }
            // Draw white background for overlaying titles
            if (context.depthMap && kRendering.isNodeTitle && ((providingRegion && providingRegion.detail === DetailLevel.FullDetails) || !providingRegion)
                && kRendering.calculatedBounds && kRendering.calculatedBounds.height * context.viewport.zoom <= titleScalingFactorOption * kRendering.calculatedBounds.height
                // Don't draw if the rendering is an empty KText
                && (kRendering.type !== K_TEXT || (kRendering as KText).text !== "")) {
                overlayRectangle = <rect x={0} y={0} width={originalWidth} height={originalHeight} fill="white" opacity="0.8" stroke="black"/>
            }
        }
    }
    // Add the transformations to be able to positon the title correctly and above other elements
    context.positions[context.positions.length - 1] += (boundsAndTransformation?.transformation ?? "")

    let svgRendering: VNode
    switch (kRendering.type) {
        case K_CONTAINER_RENDERING: {
            console.error('A rendering can not be a ' + kRendering.type + ' by itself, it needs to be a subclass of it.')
            return undefined
        }
        case K_CHILD_AREA: {
            svgRendering = renderChildArea(kRendering as KChildArea, parent, propagatedStyles, context)
            break
        }
        case K_CUSTOM_RENDERING: {
            console.error('The rendering for ' + kRendering.type + ' is not implemented yet.')
            // data as KCustomRendering
            return undefined
        }
        case K_ARC:
        case K_ELLIPSE:
        case K_IMAGE:
        case K_RECTANGLE:
        case K_ROUNDED_RECTANGLE: {
            svgRendering = renderRectangularShape(kRendering as KContainerRendering, parent, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle || isOverlay)
            break
        }
        case K_POLYLINE:
        case K_POLYGON:
        case K_ROUNDED_BENDS_POLYLINE:
        case K_SPLINE: {
            svgRendering = renderLine(kRendering as KPolyline, parent, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle || isOverlay)
            break
        }
        case K_TEXT: {
            svgRendering = renderKText(kRendering as KText, parent, boundsAndTransformation, styles, context, childOfNodeTitle || isOverlay)
            break
        }
        default: {
            console.error('The rendering is of an unknown type:' + kRendering.type)
            return undefined
        }
    }
    // Put the rectangle for the overlay behind the rendering itself.
    if (overlayRectangle) {
        svgRendering.children?.unshift(overlayRectangle)
    }
    if (isOverlay) {
        // Don't render this now if we have an overlay, but remember it to be put on top by the node rendering.
        context.titles[context.titles.length - 1].push(svgRendering)
        return <g></g>
    } else {
        return svgRendering
    }
}

/**
 * Looks up the first KRendering in the list of data and returns it. KRenderingReferences are handled and dereferenced as well, so only 'real' renderings are returned.
 * @param datas The list of possible renderings.
 * @param context The rendering context for this rendering.
 */
export function getKRendering(datas: KGraphData[], context: SKGraphModelRenderer): KRendering | undefined {
    for (const data of datas) {
        if (data === null)
            continue
        if (data.type === K_RENDERING_REF) {
            if (context.kRenderingLibrary) {
                const id = (data as KRenderingRef).renderingId
                for (const rendering of context.kRenderingLibrary.renderings) {
                    if ((rendering as KRendering).renderingId === id) {
                        context.boundsMap = (data as KRenderingRef).calculatedBoundsMap
                        context.decorationMap = (data as KRenderingRef).calculatedDecorationMap
                        return rendering as KRendering
                    }
                }
            } else {
                console.log("No KRenderingLibrary for KRenderingRef in context");
            }
        }
        if (isRendering(data)) {
            return data
        }
    }
    return undefined
}

/**
 * Renders all junction points of the given edge.
 * @param edge The edge the junction points should be rendered for.
 * @param context The rendering context for this rendering.
 */
export function getJunctionPointRenderings(edge: SKEdge, context: SKGraphModelRenderer): VNode[] {
    const kRenderingLibrary = edge.data.find(data => data !== null && data.type === K_RENDERING_LIBRARY)

    if (kRenderingLibrary !== undefined) {
        // register the rendering library if found in the parent node
        context.kRenderingLibrary = kRenderingLibrary as KRenderingLibrary
    }

    const kRendering = getKRendering(edge.data, context)

    if (kRendering === undefined) {
        return []
    }

    // The rendering of an edge has to be a KPolyline or a sub type of KPolyline except KPolygon,
    // or a KCustomRendering providing a KCustomConnectionFigureNode.
    let junctionPointRendering: KRendering
    switch (kRendering.type) {
        case K_CUSTOM_RENDERING: {
            console.error('The rendering for ' + kRendering.type + ' is not implemented yet.')
            // junctionPointRendering = ?
            return []
        }
        case K_POLYLINE:
        case K_ROUNDED_BENDS_POLYLINE:
        case K_SPLINE: {
            junctionPointRendering = (kRendering as KPolyline).junctionPointRendering
            break
        }
        default: {
            console.error('The rendering of an edge has to be a KPolyline or a sub type of KPolyline except KPolygon, ' +
                'or a KCustomRendering providing a KCustomConnectionFigureNode, but is ' + kRendering.type)
            return []
        }
    }

    if (edge.junctionPoints.length === 0 || junctionPointRendering === undefined) {
        return []
    }
    // Render each junction point.
    const vNode = renderKRendering(junctionPointRendering, edge, new KStyles, context)
    if (vNode === undefined) {
        return []
    }

    const renderings: VNode[] = []
    edge.junctionPoints.forEach(junctionPoint => {
        const junctionPointVNode = <g transform={`translate(${junctionPoint.x},${junctionPoint.y})`}>
            {vNode}
        </g>
        renderings.push(junctionPointVNode)
    })
    return renderings
}