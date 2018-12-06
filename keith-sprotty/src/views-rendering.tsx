/** @jsx svg */
import { svg } from 'snabbdom-jsx'
import { KChildArea, KGraphElement, KEllipse, KNode, KPort, KRoundedRectangle, KRectangle,
    KSpline, KEdge, KPolyline, KPolygon, KText, KLabel, KContainerRendering, KGraphData,
    KRenderingRef, KRenderingLibrary } from "./kgraph-models"
import { KGraphRenderingContext, fillBackground, fillForeground, findById, shadowFilter,
    lineCapText, lineJoinText, lineStyleText, evaluateKPosition, camelToKebab,
    horizontalAlignmentText, verticalAlignmentText, calculateX, calculateY } from "./views-common"
import { isNullOrUndefined } from "util"
import { toDegrees } from "sprotty/lib"
import { VNode } from "snabbdom/vnode"
import { getStyles, background, foreground, DEFAULT_FOREGROUND, DEFAULT_LINE_WIDTH,
    DEFAULT_SHADOW, shadowDefinition, DEFAULT_MITER_LIMIT, DEFAULT_FONT_ITALIC,
    DEFAULT_FONT_BOLD, DEFAULT_HORIZONTAL_ALIGNMENT, DEFAULT_VERTICAL_ALIGNMENT,
    DEFAULT_SHADOW_DEF, DEFAULT_FILL } from "./views-styles"
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
    if (isNullOrUndefined(rendering.calculatedBounds)) {
        console.error('computedBounds in child Area rendering is not defined!')
        return <g/>
    }
    if (parent.areChildrenRendered) {
        console.error('This element contains multiple child areas, skipping this one.')
        return <g/>
    }
    // remember, that this parent's children are now already rendered
    parent.areChildrenRendered = true

    return <g transform = {`translate(${rendering.calculatedBounds.x}, ${rendering.calculatedBounds.y})`/*fixes chrome syntax HL: `*/}>
        {context.renderChildren(parent)/* TODO: no null rendering should appear here, but sometimes still does because of unimplemented methods*/}
    </g>
}

export function renderKEllipse(rendering: KEllipse, parent: KGraphElement, context: KGraphRenderingContext): VNode {
    const styles = getStyles(rendering.styles, parent.id + rendering.id)

    const fill = styles.kBackground === null ? DEFAULT_FILL : fillBackground((parent as KGraphElement).id + rendering.id)
    const stroke = styles.kForeground === null ? DEFAULT_FOREGROUND : fillForeground((parent as KGraphElement).id + rendering.id)
    const backgroundDefinition = styles.kBackground === null ? <g/> : background(styles.kBackground, (parent as KGraphElement).id + rendering.id)
    const foregroundDefinition = styles.kForeground === null ? <g/> : foreground(styles.kForeground, (parent as KGraphElement).id + rendering.id) // TODO: how to remove these completely? (empty <g/> elements should not be in the svg)
    const lineWidth = styles.kLineWidth === null ? DEFAULT_LINE_WIDTH : styles.kLineWidth.lineWidth
    let bounds = undefined
    if (!isNullOrUndefined(rendering.calculatedBounds)) {
        bounds = rendering.calculatedBounds
    }
    if (isNullOrUndefined(bounds) && !isNullOrUndefined(context.boundsMap)) {
        bounds = findById(context.boundsMap, rendering.id)
    }

    let decoration = undefined
    if (!isNullOrUndefined(rendering.calculatedDecoration)) {
        decoration = rendering.calculatedDecoration
        bounds = {
            x: decoration.bounds.x + decoration.origin.x,
            y: decoration.bounds.y + decoration.origin.y,
            width: decoration.bounds.width,
            height: decoration.bounds.height
        }
    }
    if (isNullOrUndefined(decoration) && !isNullOrUndefined(context.decorationMap)) {
        decoration = findById(context.decorationMap, rendering.id)
        if (!isNullOrUndefined(decoration)) {
            bounds = {
                x: decoration.bounds.x + decoration.origin.x,
                y: decoration.bounds.y + decoration.origin.y,
                width: decoration.bounds.width,
                height: decoration.bounds.height
            }
        }
    }
    if (isNullOrUndefined(decoration) && isNullOrUndefined(bounds)) {
        console.error('could not find bounds or decoration data to render this KEllipse')
        return <g/>
    }

    return <g transform = {`translate(${bounds.x}, ${bounds.y})`/*fixes chrome syntax HL: `*/}>
        {backgroundDefinition}
        {foregroundDefinition}
        <ellipse
            cx = {bounds.width / 2}
            cy = {bounds.height / 2}
            rx = {bounds.width / 2}
            ry = {bounds.height / 2}
            style = {{
                'stroke-width': lineWidth
            } as React.CSSProperties}
            stroke = {stroke}
            fill = {fill}
        />
        {renderChildRenderings(rendering, parent, context)}
    </g>
}

export function renderKRectangle(rendering: KRectangle, parent: KGraphElement | KNode | KPort, context: KGraphRenderingContext): VNode {
    const roundedRendering = rendering as KRoundedRectangle
    // like this the rx and ry will be undefined during the rendering of a roundedRectangle and therefore those fields will be left out.
    // Rounded rectangles work in svg just like regular rectangles just with those two added variables, so this call will result in a regular rectangle.
    return renderKRoundedRectangle(roundedRendering, parent, context)
}

export function renderKRoundedRectangle(rendering: KRoundedRectangle, parent: KGraphElement | KNode | KPort, context: KGraphRenderingContext): VNode {
    const styles = getStyles(rendering.styles, (parent as KGraphElement).id + rendering.id)

    const fill = styles.kBackground === null ? DEFAULT_FILL : fillBackground((parent as KGraphElement).id + rendering.id)
    const stroke = styles.kForeground === null ? DEFAULT_FOREGROUND : fillForeground((parent as KGraphElement).id + rendering.id)
    const backgroundDefinition = styles.kBackground === null ? <g/> : background(styles.kBackground, (parent as KGraphElement).id + rendering.id)
    const foregroundDefinition = styles.kForeground === null ? <g/> : foreground(styles.kForeground, (parent as KGraphElement).id + rendering.id) // TODO: how to remove these completely? (empty <g/> elements should not be in the svg)
    const lineWidth = styles.kLineWidth === null ? DEFAULT_LINE_WIDTH : styles.kLineWidth.lineWidth
    const opacity = styles.kInvisibility === null || styles.kInvisibility.invisible === false ? undefined : 0
    const shadow = styles.kShadow === undefined ? DEFAULT_SHADOW : shadowFilter((parent as KGraphElement).id + rendering.id)
    const shadowDef = styles.kShadow === undefined ? DEFAULT_SHADOW_DEF : shadowDefinition(styles.kShadow, (parent as KGraphElement).id + rendering.id)
    let width = undefined
    let height = undefined
    let x = undefined
    let y = undefined
    const rx = rendering.cornerWidth
    const ry = rendering.cornerHeight

    // findBounds(width, height, x, y, rendering.calculatedBounds, context.boundsMap) // TODO: maybe do it like this
    if (!isNullOrUndefined(rendering.calculatedBounds)) {
        // sizes are in the calculatedBounds of the rendering
        width = rendering.calculatedBounds.width
        height = rendering.calculatedBounds.height
        x = rendering.calculatedBounds.x
        y = rendering.calculatedBounds.y
    }
    // if no sizes have been found yet, they should be in the boundsMap
    if (isNullOrUndefined(x) && !isNullOrUndefined(context.boundsMap)) {
        // sizes should be found in the boundsMap in the context
        const bounds = findById(context.boundsMap, rendering.id)
        if (isNullOrUndefined(bounds)) {
            console.error('the boundsMap does not contain the id for this rendering.')
            console.error('boundsMap:')
            console.error(context.boundsMap)
            console.error('id:')
            console.error(rendering.id)
        } else {
            width = bounds.width
            height = bounds.height
            x = bounds.x
            y = bounds.y
        }
    }
    if (isNullOrUndefined(x)) { // if no value is found for x (and therefore also y) try to use the size of the parent itself, otherwise rendering will fail.
        console.error('calculatedBounds of this rendering are undefined or null and no bounds map in the rendering library can be found!')
        if (!('size' in parent)) { // if parent is not a KNode or KPort
            console.error('Rectangle renderings are only possible for KNodes or KPorts')
            return <g/>
        }
        width = parent.size.width
        height = parent.size.height
    }
    
    // translate for each rectangle, so the children have that as their new origin point
    return <g transform = {`translate(${x}, ${y})`/*fixes chrome syntax HL: `*/}>
        {backgroundDefinition}
        {foregroundDefinition}
        {shadowDef}
        <rect
            opacity = {opacity}
            x = {0}
            y = {0}
            width  = {width}
            height = {height}
            {...(rx ? {rx: rx} : {})}
            {...(ry ? {ry: ry} : {})}
            style = {{
                'stroke-width': lineWidth
            } as React.CSSProperties}
            stroke = {stroke}
            fill = {fill}
            filter = {shadow}
        />
        {renderChildRenderings(rendering, parent, context)}
    </g>
}

// TODO: if the parent element is not an edge, use the rendering.points instead of edge.routingPoints
export function renderKSpline(rendering: KSpline, edge: KGraphElement | KEdge, context: KGraphRenderingContext): VNode {
    // TODO: implement junction point rendering
    if (!('routingPoints' in edge)) { // parent has to be a KEdge, other elements will not have a Polyline as their rendering
        console.error('Polyline renderings are only possible for KEdges')
        return <g/>
    }
    const styles = getStyles(rendering.styles, (edge as KGraphElement).id + rendering.id)
    const stroke = styles.kForeground === null ? DEFAULT_FOREGROUND : fillForeground((edge as KGraphElement).id + rendering.id)
    const lineCap = styles.kLineCap === null ? undefined : lineCapText(styles.kLineCap)
    const lineWidth = styles.kLineWidth === null ? DEFAULT_LINE_WIDTH : styles.kLineWidth.lineWidth
    const lineJoin = styles.kLineJoin === null ? undefined : lineJoinText(styles.kLineJoin)
    const lineStyle = styles.kLineStyle === null ? undefined : lineStyleText(styles.kLineStyle, lineWidth)
    const miterLimit = styles.kLineJoin.miterLimit === null ? DEFAULT_MITER_LIMIT : styles.kLineJoin.miterLimit
    const foregroundDefinition = styles.kForeground === null ? <g/> : foreground(styles.kForeground, (edge as KGraphElement).id + rendering.id)

    const firstPoint = edge.routingPoints[0]
    let minX = firstPoint.x
    let maxX = firstPoint.x
    let minY = firstPoint.y
    let maxY = firstPoint.y
    for (let i = 1; i < edge.routingPoints.length - 1; i++) {
        const p = edge.routingPoints[i]
        if (p.x < minX) {
            minX = p.x
        }
        if (p.x > maxX) {
            maxX = p.x
        }
        if (p.y < minY) {
            minX = p.y
        }
        if (p.y > maxY) {
            maxY = p.y
        }
    }
    // hack to avoid paths with no width / height. These paths will not get drawn by chrome due to a bug in their svg renderer TODO: find a fix if there is any better way
    const EPSILON = 0.001
    if (edge.routingPoints.length > 1) {
        let lastPoint = edge.routingPoints[edge.routingPoints.length - 1]
        let lastX = lastPoint.x
        let lastY = lastPoint.y
        // if this path has no width and the last point does not add anything to that, we need to shift one value by a tiny, invisible value so the width will now be bigger than 0.
        if (maxX - minX === 0 && lastX === maxX) {
            lastX += EPSILON
            edge.routingPoints[edge.routingPoints.length - 1] = {x: lastX, y: lastY}
        }
        // same for Y
        if (maxY - minY === 0 && lastY === maxY) {
            lastY += EPSILON
            edge.routingPoints[edge.routingPoints.length - 1] = {x: lastX, y: lastY}
        }
    }

    // now define the spline's path.
    let path = `M ${firstPoint.x},${firstPoint.y}`
    for (let i = 1; i < edge.routingPoints.length; i = i + 3) {
        let remainingPoints = edge.routingPoints.length - i
        if (remainingPoints === 1) {
            // if one routing point is left, draw a straight line to there.
            path += ` L ${edge.routingPoints[i].x},${edge.routingPoints[i].y}`
        } else if (remainingPoints === 2) {
            // if two routing points are left, draw a quadratic bezier curve with those two points.
            path += ` Q ${edge.routingPoints[i].x},${edge.routingPoints[i].y} ${edge.routingPoints[i + 1].x},${edge.routingPoints[i + 1].y}`
        } else  {
            // if three or more routing points are left, draw a cubic bezier curve with those points.
            path += ` C ${edge.routingPoints[i].x},${edge.routingPoints[i].y} ${edge.routingPoints[i + 1].x},${edge.routingPoints[i + 1].y} ${edge.routingPoints[i + 2].x},${edge.routingPoints[i + 2].y}`
        }
    }

    return <g>
    {foregroundDefinition}
        <path 
            d = {path}
            stroke = {stroke}
            fill = 'none'
            style = {{
                'stroke-linecap': lineCap,
                'stroke-linejoin': lineJoin,
                'stroke-width': lineWidth,
                'stroke-dasharray': lineStyle,
                'stroke-miterlimit': miterLimit
            } as React.CSSProperties}
        />
        {renderChildRenderings(rendering, edge, context)}
    </g>
}

// TODO: if the parent element is not an edge, use the rendering.points instead of edge.routingPoints
export function renderKPolyline(rendering: KPolyline, edge: KGraphElement | KEdge, context: KGraphRenderingContext): VNode {
    // TODO: implement junction point rendering
    if (!('routingPoints' in edge)) { // parent has to be a KEdge, other elements will not have a Polyline as their rendering
        console.error('Polyline renderings are only possible for KEdges')
        return <g/>
    }
    const styles = getStyles(rendering.styles, (edge as KGraphElement).id + rendering.id)
    const stroke = styles.kForeground === null ? DEFAULT_FOREGROUND : fillForeground((edge as KGraphElement).id + rendering.id)
    const lineCap = styles.kLineCap === null ? undefined : lineCapText(styles.kLineCap)
    const lineWidth = styles.kLineWidth === null ? DEFAULT_LINE_WIDTH : styles.kLineWidth.lineWidth
    const lineJoin = styles.kLineJoin === null ? undefined : lineJoinText(styles.kLineJoin)
    const lineStyle = styles.kLineStyle === null ? undefined : lineStyleText(styles.kLineStyle, lineWidth)
    const miterLimit = styles.kLineJoin.miterLimit === null ? DEFAULT_MITER_LIMIT : styles.kLineJoin.miterLimit
    const foregroundDefinition = styles.kForeground === null ? <g/> : foreground(styles.kForeground, (edge as KGraphElement).id + rendering.id)

    const firstPoint = edge.routingPoints[0]
    let minX = firstPoint.x
    let maxX = firstPoint.x
    let minY = firstPoint.y
    let maxY = firstPoint.y
    let path = `M ${firstPoint.x},${firstPoint.y}`
    for (let i = 1; i < edge.routingPoints.length - 1; i++) {
        const p = edge.routingPoints[i]
        path += ` L ${p.x},${p.y}`

        if (p.x < minX) {
            minX = p.x
        }
        if (p.x > maxX) {
            maxX = p.x
        }
        if (p.y < minY) {
            minX = p.y
        }
        if (p.y > maxY) {
            maxY = p.y
        }
    }
    // hack to avoid paths with no width / height. These paths will not get drawn by chrome due to a bug in their svg renderer
    const EPSILON = 0.001
    if (edge.routingPoints.length > 1) {
        let lastPoint = edge.routingPoints[edge.routingPoints.length - 1]
        let lastX = lastPoint.x
        let lastY = lastPoint.y
        // if this path has no width and the last point does not add anything to that, we need to shift one value by a tiny, invisible value so the width will now be bigger than 0.
        if (maxX - minX === 0 && lastX === maxX) {
            lastX += EPSILON
        }
        // same for Y
        if (maxY - minY === 0 && lastY === maxY) {
            lastY += EPSILON
        }
        path += ` L ${lastX},${lastY}`
    }
    return <g>
    {foregroundDefinition}
        <path 
            d = {path}
            stroke = {stroke}
            fill = 'none'
            style = {{
                'stroke-linecap': lineCap,
                'stroke-linejoin': lineJoin,
                'stroke-width': lineWidth,
                'stroke-dasharray': lineStyle,
                'stroke-miterlimit': miterLimit
            } as React.CSSProperties}
        />
        {renderChildRenderings(rendering, edge, context)}
    </g>
}

export function renderKPolygon(rendering: KPolygon, parent: KGraphElement, context: KGraphRenderingContext): VNode {
    const styles = getStyles(rendering.styles, parent.id + rendering.id)
    let stroke: string | null = styles.kForeground === null ? DEFAULT_FOREGROUND : fillForeground(parent.id + rendering.id)
    const fill = styles.kBackground === null ? DEFAULT_FILL : fillBackground((parent as KGraphElement).id + rendering.id)
    const lineCap = styles.kLineCap === null ? undefined : lineCapText(styles.kLineCap)
    const lineWidth = styles.kLineWidth === null ? DEFAULT_LINE_WIDTH : styles.kLineWidth.lineWidth
    const lineJoin = styles.kLineJoin === null ? undefined : lineJoinText(styles.kLineJoin)
    const lineStyle = styles.kLineStyle === null ? undefined : lineStyleText(styles.kLineStyle, lineWidth)
    const miterLimit = styles.kLineJoin.miterLimit === null ? DEFAULT_MITER_LIMIT : styles.kLineJoin.miterLimit
    const foregroundDefinition = styles.kForeground === null ? <g/> : foreground(styles.kForeground, (parent as KGraphElement).id + rendering.id)
    const backgroundDefinition = styles.kBackground === null ? <g/> : background(styles.kBackground, (parent as KGraphElement).id + rendering.id)

    // hack to fix the border being drawn although it should not
    // FIXME: find out, how to not have to use this hack.
    if (lineWidth === 0) {
        stroke = null
    }

    let bounds = undefined
    if (!isNullOrUndefined(rendering.calculatedBounds)) {
        bounds = rendering.calculatedBounds
    }
    if (isNullOrUndefined(bounds) && !isNullOrUndefined(context.boundsMap)) {
        bounds = findById(context.boundsMap, rendering.id)
    }

    let decoration = undefined
    if (!isNullOrUndefined(rendering.calculatedDecoration)) {
        decoration = rendering.calculatedDecoration
        bounds = {
            x: decoration.bounds.x + decoration.origin.x,
            y: decoration.bounds.y + decoration.origin.y,
            width: decoration.bounds.width,
            height: decoration.bounds.height
        }
    }
    if (isNullOrUndefined(decoration) && !isNullOrUndefined(context.decorationMap)) {
        decoration = findById(context.decorationMap, rendering.id)
        if (!isNullOrUndefined(decoration)) {
            bounds = {
                x: decoration.bounds.x + decoration.origin.x,
                y: decoration.bounds.y + decoration.origin.y,
                width: decoration.bounds.width,
                height: decoration.bounds.height
            }
        }
    }
    if (isNullOrUndefined(decoration) && isNullOrUndefined(bounds)) {
        console.error('could not find bounds or decoration data to render this KPolygon')
        return <g/>
    }

    const firstPoint = evaluateKPosition(rendering.points[0], bounds, true)
    let path = `M ${firstPoint.x + bounds.x},${firstPoint.y + bounds.y}`
    for (let i = 1; i < rendering.points.length; i++) {
        const p = evaluateKPosition(rendering.points[i], bounds, true)
        path += ` L ${p.x + bounds.x},${p.y + bounds.y}`
    }
    path += ' Z'

    // TODO: when replacing snabbdom with react or something similar: have all styles as attributes and in camelCase
    return <g {...decoration ? {transform: `translate(${decoration.origin.x},${decoration.origin.y}) rotate(${toDegrees(decoration.rotation)}) translate(${-decoration.origin.x},${-decoration.origin.y})`} : {}}>
        {backgroundDefinition}
        {foregroundDefinition}
        <path 
            d = {path}
            {...(stroke ? {stroke: stroke} : {})}
            fill = {fill}
            style = {{
                'stroke-linecap': lineCap,
                'stroke-linejoin': lineJoin,
                'stroke-width': lineWidth,
                'stroke-dasharray': lineStyle,
                'stroke-miterlimit': miterLimit
            } as React.CSSProperties}
        />
        {renderChildRenderings(rendering, parent, context)}
    </g>
}

export function renderKText(rendering: KText, parent: KGraphElement | KLabel, context: KGraphRenderingContext): VNode {
    const styles = getStyles(rendering.styles, (parent as KGraphElement).id + rendering.id)

    let text = null
    // KText elements as renderings of labels have their text in the KLabel, not the KText
    if ('text' in parent) { // if parent is KLabel 
        text = parent.text
    } else {
        text = rendering.text
    }
    if (isNullOrUndefined(text)) return <g/>

    const italic = styles.kFontItalic.italic === DEFAULT_FONT_ITALIC ? null : 'italic'
    const bold = styles.kFontBold.bold === DEFAULT_FONT_BOLD ? null : 'bold'
    const fontName = camelToKebab(styles.kFontName.name)

    const fill = styles.kForeground === null ? DEFAULT_FOREGROUND : fillForeground((parent as KGraphElement).id + rendering.id)

    const horizontalAlignment = horizontalAlignmentText(styles.kHorizontalAlignment.horizontalAlignment === null ? DEFAULT_HORIZONTAL_ALIGNMENT : styles.kHorizontalAlignment.horizontalAlignment)
    const verticalAlignment = verticalAlignmentText(styles.kVerticalAlignment.verticalAlignment === null ? DEFAULT_VERTICAL_ALIGNMENT : styles.kVerticalAlignment.verticalAlignment)

    const foregroundDefinition = styles.kForeground === null ? <g/> : foreground(styles.kForeground, (parent as KGraphElement).id + rendering.id)
    let x = undefined
    let y = undefined
    if (!isNullOrUndefined(rendering.calculatedBounds)) {
        x = calculateX(rendering.calculatedBounds.x, rendering.calculatedBounds.width, styles.kHorizontalAlignment)
        y = calculateY(rendering.calculatedBounds.y, rendering.calculatedBounds.height, styles.kVerticalAlignment)
    }
    // if no bounds have been found yet, they should be in the boundsMap
    if (isNullOrUndefined(x) && !isNullOrUndefined(context.boundsMap)) {
        const bounds = findById(context.boundsMap, rendering.id)
        if (isNullOrUndefined(bounds)) {
            console.error('the boundsMap does not contain the id for this rendering.')
        } else {
            x = calculateX(bounds.x, bounds.width, styles.kHorizontalAlignment)
            y = calculateY(bounds.y, bounds.height, styles.kVerticalAlignment)
        }
    }

    // TODO: maybe if foregroundDefinition is undefined just render the text without surrounding g
    return <g>
        {foregroundDefinition}
        <text
            style = {{
                'font-family': fontName,
                'font-size': styles.kFontSize.size + 'pt',
                'font-style': italic,
                'font-weight': bold,
                'alignment-baseline': verticalAlignment, // TODO: this might still not be correct vertical alignment, 'baseline' is not high enough for lower letters like g, y, p, q
                'text-anchor': horizontalAlignment
            } as React.CSSProperties}
            x = {x}
            y = {y}
            fill = {fill}
            {...{'xml:space' : "preserve"}/* This attribute makes the text size estimation include any trailing white spaces. */}
        >{text}</text>
    </g>
}

export function renderChildRenderings(parentRendering: KContainerRendering, parentElement: KGraphElement, context: KGraphRenderingContext): (VNode | null)[] {
    let renderings : (VNode | null)[] = []
    for (let childRendering of parentRendering.children) {
        let rendering = getRendering([childRendering], parentElement, context)
        renderings.push(rendering)
    }
    return renderings
}

export function getRendering(datas: KGraphData[], parent: KGraphElement, context: KGraphRenderingContext): VNode | null { // TODO: not all of these are implemented yet
    for (let data of datas) {
        if (data === null)
            continue
        if (data.type === K_RENDERING_REF) {
            var id = (data as KRenderingRef).id
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
                console.error('The rendering for ' + data.type + ' is not implemented yet.')
                // data as KRoundedBendsPolyline
                break
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
    return null
}