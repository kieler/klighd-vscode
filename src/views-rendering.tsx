/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
/** @jsx svg */
import { svg } from 'snabbdom-jsx'
import { KChildArea, KGraphElement, KRoundedRectangle,
    KEdge, KPolyline, KText, KLabel, KContainerRendering, KGraphData,
    KRenderingRef, KRenderingLibrary, KRoundedBendsPolyline, KForeground, K_ELLIPSE, K_RECTANGLE, K_ROUNDED_RECTANGLE,
    K_SPLINE, K_POLYLINE, K_POLYGON, K_ROUNDED_BENDS_POLYLINE, K_RENDERING_REF, K_RENDERING_LIBRARY, K_CONTAINER_RENDERING,
    K_CHILD_AREA, K_ARC, K_CUSTOM_RENDERING, K_IMAGE, K_TEXT } from "./kgraph-models"
import { KGraphRenderingContext, findBoundsAndTransformationData, getPoints, findTextBoundsAndTransformationData } from "./views-common"
import { VNode } from "snabbdom/vnode"
import { getKStyles, getSvgColorStyles, getSvgColorStyle, getSvgInvisibilityStyles, getSvgShadowStyles, getSvgLineStyles, getSvgTextStyles } from "./views-styles"
import { SVGAttributes } from 'react'

// ----------------------------- Functions for rendering different KRendering as VNodes in svg --------------------------------------------

export function renderChildArea(rendering: KChildArea, parent: KGraphElement, context: KGraphRenderingContext) {
    if (parent.areChildrenRendered) {
        console.error('This element contains multiple child areas, skipping this one.')
        return <g/>
    }
    // remember, that this parent's children are now already rendered
    parent.areChildrenRendered = true

    // Extract the styles of the rendering into a more presentable object.
    const styles = getKStyles(rendering.styles, (parent as KGraphElement).id + rendering.id)

    // Determine the bounds of the rendering first and where it has to be placed.
    const boundsAndTransformation = findBoundsAndTransformationData(rendering, styles.kRotation, parent, context)
    if (boundsAndTransformation === undefined) {
        // If no bounds are found, the rendering can not be drawn.
        return <g/>
    }

    const gAttrs: SVGAttributes<SVGGElement>  = {
        ...(boundsAndTransformation.transformation !== undefined ? {transform: boundsAndTransformation.transformation} : {})
    }

    let element = <g id = {rendering.id} {...gAttrs}>
        {context.renderChildren(parent)}
    </g>

    return element
}

export function renderRectangularShape(rendering: KContainerRendering, parent: KGraphElement, context: KGraphRenderingContext): VNode {
    // Extract the styles of the rendering into a more presentable object.
    const styles = getKStyles(rendering.styles, (parent as KGraphElement).id + rendering.id)

    // Determine the bounds of the rendering first and where it has to be placed.
    const boundsAndTransformation = findBoundsAndTransformationData(rendering, styles.kRotation, parent, context)
    if (boundsAndTransformation === undefined) {
        // If no bounds are found, the rendering can not be drawn.
        return <g/>
    }

    const gAttrs: SVGAttributes<SVGGElement>  = {
        ...(boundsAndTransformation.transformation !== undefined ? {transform: boundsAndTransformation.transformation} : {})
    }

    // Check the invisibilityStyle first. If this rendering is supposed to be invisible, do not render it,
    // only render its children transformed by the transformation already calculated.
    const invisibilityStyles = getSvgInvisibilityStyles(styles)

    if (invisibilityStyles.opacity === 0) {
        return <g {...gAttrs}>
            {renderChildRenderings(rendering, parent, context)}
        </g>
    }

    // Default case. Calculate all svg objects and attributes needed to build this rendering from the styles and the rendering.
    const colorStyles = getSvgColorStyles(styles, context)
    const shadowStyles = getSvgShadowStyles(styles, context)
    const lineStyles = getSvgLineStyles(styles, parent, rendering)

    // Create the svg element for this rendering.
    let element: VNode
    switch (rendering.type) {
        case K_ELLIPSE: {
            element = <g id = {rendering.id} {...gAttrs}>
                <ellipse
                    opacity = {invisibilityStyles.opacity}
                    cx = {boundsAndTransformation.bounds.width / 2}
                    cy = {boundsAndTransformation.bounds.height / 2}
                    rx = {boundsAndTransformation.bounds.width / 2}
                    ry = {boundsAndTransformation.bounds.height / 2}
                    style = {{
                        'stroke-linecap': lineStyles.lineCap,
                        'stroke-linejoin': lineStyles.lineJoin,
                        'stroke-width': lineStyles.lineWidth,
                        'stroke-dasharray': lineStyles.lineStyle,
                        'stroke-miterlimit': lineStyles.miterLimit
                    } as React.CSSProperties}
                    stroke = {colorStyles.foreground}
                    fill = {colorStyles.background}
                    filter = {shadowStyles}
                />
                {renderChildRenderings(rendering, parent, context)}
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

            element = <g id = {rendering.id} {...gAttrs}>
                <rect
                    opacity = {invisibilityStyles.opacity}
                    width  = {boundsAndTransformation.bounds.width}
                    height = {boundsAndTransformation.bounds.height}
                    {...(rx ? {rx: rx} : {})}
                    {...(ry ? {ry: ry} : {})}
                    style = {{
                        'stroke-linecap': lineStyles.lineCap,
                        'stroke-linejoin': lineStyles.lineJoin,
                        'stroke-width': lineStyles.lineWidth,
                        'stroke-dasharray': lineStyles.lineStyle,
                        'stroke-miterlimit': lineStyles.miterLimit
                    } as React.CSSProperties}
                    stroke = {colorStyles.foreground}
                    fill = {colorStyles.background}
                    filter = {shadowStyles}
                />
                {renderChildRenderings(rendering, parent, context)}
            </g>
            break
        }
        default: {
            // This case can never happen. If it still does, happy debugging!
            throw new Error("Rendering is neither an KEllipse, nor a KRectangle or KRoundedRectangle!")
        }
    }

    return element
}

export function renderLine(rendering: KPolyline, parent: KGraphElement | KEdge, context: KGraphRenderingContext): VNode {
    // TODO: implement junction point rendering

    // Extract the styles of the rendering into a more presentable object.
    const styles = getKStyles(rendering.styles, (parent as KGraphElement).id + rendering.id)

    // Determine the bounds of the rendering first and where it has to be placed.
    // TODO: KPolylines are a special case of container renderings: their bounds should not be given down to their child renderings.
    const boundsAndTransformation = findBoundsAndTransformationData(rendering, styles.kRotation, parent, context, true)
    if (boundsAndTransformation === undefined) {
        // If no bounds are found, the rendering can not be drawn.
        return <g/>
    }

    const gAttrs: SVGAttributes<SVGGElement>  = {
        ...(boundsAndTransformation.transformation !== undefined ? {transform: boundsAndTransformation.transformation} : {})
    }

    // Check the invisibilityStyle first. If this rendering is supposed to be invisible, do not render it,
    // only render its children transformed by the transformation already calculated.
    const invisibilityStyles = getSvgInvisibilityStyles(styles)

    if (invisibilityStyles.opacity === 0) {
        return <g {...gAttrs}>
            {renderChildRenderings(rendering, parent, context)}
        </g>
    }

    // Default case. Calculate all svg objects and attributes needed to build this rendering from the styles and the rendering.
    const colorStyles = getSvgColorStyles(styles, context)
    const shadowStyles = getSvgShadowStyles(styles, context)
    const lineStyles = getSvgLineStyles(styles, parent, rendering)

    const points = getPoints(parent, rendering, boundsAndTransformation)
    if (points.length === 0) {
        return <g>
            {renderChildRenderings(rendering, parent, context)}
        </g>
    }

    // now define the line's path.
    let path = ''
    switch (rendering.type) {
        case K_SPLINE: {
            path += `M${points[0].x},${points[0].y}`
            for (let i = 1; i < points.length; i = i + 3) {
                let remainingPoints = points.length - i
                if (remainingPoints === 1) {
                    // if one routing point is left, draw a straight line to there.
                    path += `L${points[i].x},${points[i].y}`
                } else if (remainingPoints === 2) {
                    // if two routing points are left, draw a quadratic bezier curve with those two points.
                    path += `Q${points[i].x},${points[i].y} ${points[i + 1].x},${points[i + 1].y}`
                } else  {
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
                let lastPoint = points[points.length - 1]
                path += `L${lastPoint.x},${lastPoint.y}`
            }
            break
        }
    }

    // Create the svg element for this rendering.
    let element = <g id = {rendering.id} {...gAttrs}>
        <path
            opacity = {invisibilityStyles.opacity}
            d = {path}
            style = {{
                'stroke-linecap': lineStyles.lineCap,
                'stroke-linejoin': lineStyles.lineJoin,
                'stroke-width': lineStyles.lineWidth,
                'stroke-dasharray': lineStyles.lineStyle,
                'stroke-miterlimit': lineStyles.miterLimit
            } as React.CSSProperties}
            stroke = {colorStyles.foreground}
            fill = {colorStyles.background}
            filter = {shadowStyles}
        />
        {renderChildRenderings(rendering, parent, context)}
    </g>
    return element
}

export function renderKText(rendering: KText, parent: KGraphElement | KLabel, context: KGraphRenderingContext): VNode {
    // Find the text to write first.
    let text = undefined
    // KText elements as renderings of labels have their text in the KLabel, not the KText
    if ('text' in parent) { // if parent is KLabel
        text = parent.text
    } else {
        text = rendering.text
    }
    // If no text can be found, return here.
    if (text === undefined) return <g/>

    // The text split into an array for each individual line
    let lines = text.split("\n")

    // Extract the styles of the rendering into a more presentable object.
    const styles = getKStyles(rendering.styles, (parent as KGraphElement).id + rendering.id)

    // Determine the bounds of the rendering first and where it has to be placed.
    const boundsAndTransformation = findTextBoundsAndTransformationData(rendering, styles, parent, context, lines.length)
    if (boundsAndTransformation === undefined) {
        // If no bounds are found, the rendering can not be drawn.
        return <g/>
    }

    const gAttrs: SVGAttributes<SVGGElement>  = {
        ...(boundsAndTransformation.transformation !== undefined ? {transform: boundsAndTransformation.transformation} : {})
    }

    // Check the invisibilityStyle first. If this rendering is supposed to be invisible, do not render it,
    // only render its children transformed by the transformation already calculated.
    const invisibilityStyles = getSvgInvisibilityStyles(styles)

    if (invisibilityStyles.opacity === 0) {
        return <g/>
    }

    // Default case. Calculate all svg objects and attributes needed to build this rendering from the styles and the rendering.
    const colorStyle = getSvgColorStyle(styles.kForeground as KForeground, context)
    const shadowStyles = getSvgShadowStyles(styles, context)
    const textStyles = getSvgTextStyles(styles, parent, rendering)

    // The svg style of the resulting text element. If the text is only 1 line, the alignment-baseline attribute has to be
    // contained in the general style, otherwise it has to be repeated in every contained <tspan> element.
    let style = {
        ...{'font-family': textStyles.fontName},
        ...{'font-size': styles.kFontSize.size + 'pt'},
        ...{'font-style': textStyles.italic},
        ...{'font-weight': textStyles.bold},
        ...{'dominant-baseline': textStyles.verticalAlignment},
        ...{'text-decoration-line': textStyles.textDecorationLine},
        ...{'text-decoration-style': textStyles.textDecorationStyle}
    }

    // The children to be contained in the returned text node.
    let children: any[]

    // The attributes to be contained in the returned text node.
    let attrs = {
        opacity: invisibilityStyles.opacity,
        style: style,
        ...(boundsAndTransformation.bounds.y ? {y: boundsAndTransformation.bounds.y} : {}),
        fill: colorStyle,
        filter: shadowStyles,
        ...{'xml:space' : "preserve"} // This attribute makes the text size estimation include any trailing white spaces.
    } as any

    if (lines.length === 1) {
        // If the text has only one line, just put the text in the text node directly.
        attrs.x = boundsAndTransformation.bounds.x;
        children = [lines[0]]
    } else {
        // Otherwise, put each line of text in a separate <tspan> element.
        let dy: string | undefined = undefined
        children = []
        lines.forEach((line, index) => {
            // If the line is just a blank line, add a dummy space character so the size estimation will
            // include this character without rendering anything further visible to the screen.
            // Also, the <tspan> attribute dy needs at least one character per text so the offset is correctly applied.
            if (line === "") {
                line = " "
            }
            children.push(
                <tspan
                    x = {boundsAndTransformation.bounds.x}
                    {...(dy ? {dy: dy} : {})}
                >{line}</tspan>
            )
            dy = '1.1em' // Have a distance of 1.1em for every new line after the first one.
        });
    }

    // build the element from the above defined attributes and children
    let element
    if (gAttrs.transform === undefined) {
        element = <text id = {rendering.id} {...attrs}>
            {...children}
        </text>
    } else {
        element = <g id = {rendering.id} {...gAttrs}>
            <text {...attrs}>
                {...children}
            </text>
        </g>
    }

    return element
}

export function renderChildRenderings(parentRendering: KContainerRendering, parentElement: KGraphElement, context: KGraphRenderingContext): (VNode | undefined)[] {
    let renderings: (VNode | undefined)[] = []
    for (let childRendering of parentRendering.children) {
        let rendering = getRendering([childRendering], parentElement, context)
        renderings.push(rendering)
    }
    return renderings
}

export function getRendering(datas: KGraphData[], parent: KGraphElement, context: KGraphRenderingContext): VNode | undefined { // TODO: not all of these are implemented yet
    for (let data of datas) {
        if (data === null)
            continue
        if (data.type === K_RENDERING_REF) {
            const id = (data as KRenderingRef).id
            for (let rendering of context.kRenderingLibrary.renderings) {
                if (rendering.id === id) {
                    context.boundsMap = (data as KRenderingRef).calculatedBoundsMap
                    context.decorationMap = (data as KRenderingRef).calculatedDecorationMap
                    data = rendering as any // TODO: fix: persistentEntry is missing
                }
            }
        }
        switch (data.type) {
            case K_RENDERING_LIBRARY: {
                // register the rendering library if found in the parent node
                context.kRenderingLibrary = data as KRenderingLibrary
                break
            }
            case K_CONTAINER_RENDERING: {
                console.error('A rendering can not be a ' + data.type + ' by itself, it needs to be a subclass of it.')
                break
            }
            case K_CHILD_AREA: {
                return renderChildArea(data as KChildArea, parent, context)
            }
            case K_ARC: {
                console.error('The rendering for ' + data.type + ' is not implemented yet.')
                // data as KArc
                break
            }
            case K_CUSTOM_RENDERING: {
                console.error('The rendering for ' + data.type + ' is not implemented yet.')
                // data as KCustomRendering
                break
            }
            case K_ELLIPSE:
            case K_RECTANGLE:
            case K_ROUNDED_RECTANGLE: {
                return renderRectangularShape(data as KContainerRendering, parent, context)
            }
            case K_IMAGE: {
                console.error('The rendering for ' + data.type + ' is not implemented yet.')
                // data as KImage
                break
            }
            case K_POLYLINE:
            case K_POLYGON:
            case K_ROUNDED_BENDS_POLYLINE:
            case K_SPLINE: {
                return renderLine(data as KPolyline, parent, context)
            }
            case K_TEXT: {
                return renderKText(data as KText, parent, context)
            }
            default: {
                // do nothing. The data is something other than a rendering
                break
            }
        }
    }
    return undefined
}