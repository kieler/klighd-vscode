/** @jsx svg */
import { svg } from 'snabbdom-jsx'
import { KChildArea, KGraphElement, KEllipse, KNode, KPort, KRoundedRectangle, KRectangle,
    KSpline, KEdge, KPolyline, KPolygon, KText, KLabel, KContainerRendering, KGraphData,
    KRenderingRef, KRenderingLibrary, KRoundedBendsPolyline, KForeground } from "./kgraph-models"
import { KGraphRenderingContext, findBoundsAndTransformationData, addDefinitions, getPoints, findTextBoundsAndTransformationData } from "./views-common"
import { VNode } from "snabbdom/vnode"
import { getKStyles, getSvgColorStyles, getSvgColorStyle, getSvgInvisibilityStyles, getSvgShadowStyles, getSvgLineStyles, getSvgTextStyles } from "./views-styles"
import { SVGAttributes } from 'react';
// import * as snabbdom from 'snabbdom-jsx'
// const JSX = {createElement: snabbdom.svg}


// ----------- Rendering Class names ----------- //
const K_RENDERING_REF = 'KRenderingRefImpl'
const K_RENDERING_LIBRARY = 'KRenderingLibraryImpl'
const K_CHILD_AREA = 'KChildAreaImpl'
const K_CONTAINER_RENDERING = 'KContainerRenderingImpl'
const K_ARC = 'KArcImpl'
const K_CUSTOM_RENDERING = 'KCustomRenderingImpl'
const K_ELLIPSE = 'KEllipseImpl'
const K_IMAGE = 'KImageImpl'
const K_POLYLINE = 'KPolylineImpl'
const K_POLYGON = 'KPolygonImpl'
const K_ROUNDED_BENDS_POLYLINE = 'KRoundedBendsPolylineImpl'
const K_SPLINE = 'KSplineImpl'
const K_RECTANGLE = 'KRectangleImpl'
const K_ROUNDED_RECTANGLE = 'KRoundedRectangleImpl'
const K_TEXT = 'KTextImpl'

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

    let element = <g {...gAttrs}>
        {context.renderChildren(parent)}
    </g>

    return element
}

export function renderKEllipse(rendering: KEllipse, parent: KGraphElement, context: KGraphRenderingContext): VNode {
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
    const colorStyles = getSvgColorStyles(styles, parent, rendering)
    const shadowStyles = getSvgShadowStyles(styles, parent, rendering)
    const lineStyles = getSvgLineStyles(styles, parent, rendering)

    // Create the svg element for this rendering.
    let element = <g {...gAttrs}>
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
            stroke = {colorStyles.foreground.color}
            fill = {colorStyles.background.color}
            filter = {shadowStyles.filter}
        />
        {renderChildRenderings(rendering, parent, context)}
    </g>

    // Check if additional definitions for the colors or shadow need to be added to the svg element.
    addDefinitions(element, colorStyles, shadowStyles)

    return element
}

export function renderKRectangle(rendering: KRectangle, parent: KGraphElement | KNode | KPort, context: KGraphRenderingContext): VNode {
    const roundedRendering = rendering as KRoundedRectangle
    // like this the rx and ry will be undefined during the rendering of a roundedRectangle and therefore those fields will be left out.
    // Rounded rectangles work in svg just like regular rectangles just with those two added variables, so this call will result in a regular rectangle.
    return renderKRoundedRectangle(roundedRendering, parent, context)
}

export function renderKRoundedRectangle(rendering: KRoundedRectangle, parent: KGraphElement | KNode | KPort, context: KGraphRenderingContext): VNode {
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
    const colorStyles = getSvgColorStyles(styles, parent, rendering)
    const shadowStyles = getSvgShadowStyles(styles, parent, rendering)
    const lineStyles = getSvgLineStyles(styles, parent, rendering)

    // Rendering-specific attributes
    const rx = rendering.cornerWidth
    const ry = rendering.cornerHeight

    // Create the svg element for this rendering.
    let element = <g {...gAttrs}>
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
            stroke = {colorStyles.foreground.color}
            fill = {colorStyles.background.color}
            filter = {shadowStyles.filter}
        />
        {renderChildRenderings(rendering, parent, context)}
    </g>

    // Check if additional definitions for the colors or shadow need to be added to the svg element.
    addDefinitions(element, colorStyles, shadowStyles)

    return element
}

export function renderKSpline(rendering: KSpline, parent: KGraphElement | KEdge, context: KGraphRenderingContext): VNode {
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
    const colorStyles = getSvgColorStyles(styles, parent, rendering)
    const shadowStyles = getSvgShadowStyles(styles, parent, rendering)
    const lineStyles = getSvgLineStyles(styles, parent, rendering)

    const points = getPoints(parent, rendering, boundsAndTransformation)
    if (points.length === 0) {
        return <g>
            {renderChildRenderings(rendering, parent, context)}
        </g>
    }

    // now define the spline's path.
    let path = `M${points[0].x},${points[0].y}`
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

    // Create the svg element for this rendering.
    let element = <g {...gAttrs}>
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
            stroke = {colorStyles.foreground.color}
            fill = {colorStyles.background.color}
            filter = {shadowStyles.filter}
        />
        {renderChildRenderings(rendering, parent, context)}
    </g>

    // Check if additional definitions for the colors or shadow need to be added to the svg element.
    addDefinitions(element, colorStyles, shadowStyles)

    return element
}

export function renderKPolyline(rendering: KPolyline, parent: KGraphElement | KEdge, context: KGraphRenderingContext, closedEnd?: boolean): VNode {
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
    const colorStyles = getSvgColorStyles(styles, parent, rendering)
    const shadowStyles = getSvgShadowStyles(styles, parent, rendering)
    const lineStyles = getSvgLineStyles(styles, parent, rendering)

    const points = getPoints(parent, rendering, boundsAndTransformation)
    if (points.length === 0) {
        return <g>
            {renderChildRenderings(rendering, parent, context)}
        </g>
    }

    // now define the polyline's path.
    let path = `M${points[0].x},${points[0].y}`
    for (let i = 1; i < points.length; i++) {
        path += `L${points[i].x},${points[i].y}`
    }
    if (closedEnd) {
        path += 'Z'
    }

    // Create the svg element for this rendering.
    let element = <g {...gAttrs}>
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
            stroke = {colorStyles.foreground.color}
            fill = {colorStyles.background.color}
            filter = {shadowStyles.filter}
        />
        {renderChildRenderings(rendering, parent, context)}
    </g>

    // Check if additional definitions for the colors or shadow need to be added to the svg element.
    addDefinitions(element, colorStyles, shadowStyles)

    return element
}

export function renderKRoundedBendsPolyline(rendering: KRoundedBendsPolyline, parent: KGraphElement | KEdge, context: KGraphRenderingContext): VNode {
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
    const colorStyles = getSvgColorStyles(styles, parent, rendering)
    const shadowStyles = getSvgShadowStyles(styles, parent, rendering)
    const lineStyles = getSvgLineStyles(styles, parent, rendering)

    const points = getPoints(parent, rendering, boundsAndTransformation)
    if (points.length === 0) {
        return <g>
            {renderChildRenderings(rendering, parent, context)}
        </g>
    }

    // Rendering-specific attributes
    const bendRadius = rendering.bendRadius

    // now define the rounded polyline's path.
    let path = `M${points[0].x},${points[0].y}`
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
        // draw a line to the start of the bend point (from the last end of its bend) and then draw the bend with the control points of the point itself and the bend end point.
        path += `L${xs},${ys}Q${xp},${yp} ${xe},${ye}`
    }
    if (points.length > 1) {
        let lastPoint = points[points.length - 1]
        path += `L${lastPoint.x},${lastPoint.y}`
    }

    // Create the svg element for this rendering.
    let element = <g {...gAttrs}>
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
            stroke = {colorStyles.foreground.color}
            fill = {colorStyles.background.color}
            filter = {shadowStyles.filter}
        />
        {renderChildRenderings(rendering, parent, context)}
    </g>

    // Check if additional definitions for the colors or shadow need to be added to the svg element.
    addDefinitions(element, colorStyles, shadowStyles)

    return element
}

export function renderKPolygon(rendering: KPolygon, parent: KGraphElement, context: KGraphRenderingContext): VNode {
    // A polygon is just a polyline with a closed end.
    return renderKPolyline(rendering, parent, context, true)
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
    const colorStyle = getSvgColorStyle(styles.kForeground as KForeground, parent, rendering, true)
    const shadowStyles = getSvgShadowStyles(styles, parent, rendering)
    const textStyles = getSvgTextStyles(styles, parent, rendering)

    // The svg style of the resulting text element. If the text is only 1 line, the alignment-baseline attribute has to be
    // contained in the general style, otherwise it has to be repeated in every contained <tspan> element.
    let style = {
        ...{'font-family': textStyles.fontName},
        ...{'font-size': styles.kFontSize.size + 'pt'},
        ...{'font-style': textStyles.italic},
        ...{'font-weight': textStyles.bold},
        ...(lines.length === 1 ? {'alignment-baseline': textStyles.verticalAlignment} : {}),
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
        fill: colorStyle.color,
        filter: shadowStyles.filter,
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
                    style = {{
                        'alignment-baseline': textStyles.verticalAlignment, // Somehow, svg ignores this style on its parent. So put it here for every individual tspan.
                    } as React.CSSProperties}
                    x = {boundsAndTransformation.bounds.x}
                    {...(dy ? {dy: dy} : {})}
                >{line}</tspan>
            )
            dy = '1.1em' // Have a distance of 1.1em for every new line after the first one.
        });
    }

    // build the element from the above defined attributes and children
    let element = <g {...gAttrs}>
        <text {...attrs}>
            {...children}
        </text>
    </g>

    // Check if additional definitions for the color or shadow need to be added to the svg element.
    if (colorStyle.definition) {
        (element.children as (string | VNode)[]).push(colorStyle.definition)
    }
    if (shadowStyles.definition) {
        (element.children as (string | VNode)[]).push(shadowStyles.definition)
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
            case K_ELLIPSE: {
                return renderKEllipse(data as KEllipse, parent, context)
            }
            case K_IMAGE: {
                console.error('The rendering for ' + data.type + ' is not implemented yet.')
                // data as KImage
                break
            }
            case K_POLYLINE: {
                return renderKPolyline(data as KPolyline, parent, context)
            }
            case K_POLYGON: {
                return renderKPolygon(data as KPolygon, parent, context)
            }
            case K_ROUNDED_BENDS_POLYLINE: {
                return renderKRoundedBendsPolyline(data as KRoundedBendsPolyline, parent, context)
            }
            case K_SPLINE: {
                return renderKSpline(data as KSpline, parent, context)
            }
            case K_RECTANGLE: {
                return renderKRectangle(data as KRectangle, parent, context)
            }
            case K_ROUNDED_RECTANGLE: {
                return renderKRoundedRectangle(data as KRoundedRectangle, parent, context)
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