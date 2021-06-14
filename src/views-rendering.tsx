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
import { SVGAttributes } from 'react';
import { svg } from 'snabbdom-jsx';
import { VNode } from 'snabbdom/vnode';
import { KGraphData, KNode } from '@kieler/keith-interactive/lib/constraint-classes';
import { KeithInteractiveMouseListener } from '@kieler/keith-interactive/lib/keith-interactive-mouselistener';
import { SimplifySmallText, TextSimplificationThreshold, TitleScalingFactor, UseSmartZoom } from './options';
import { SKGraphModelRenderer } from './skgraph-model-renderer';
import {
    Arc, isRendering, KArc, KChildArea, KContainerRendering, KForeground, KImage, KPolyline, KRendering, KRenderingLibrary, KRenderingRef, KRoundedBendsPolyline,
    KRoundedRectangle, KText, K_ARC, K_CHILD_AREA, K_CONTAINER_RENDERING, K_CUSTOM_RENDERING, K_ELLIPSE, K_IMAGE, K_POLYGON, K_POLYLINE, K_RECTANGLE, K_RENDERING_LIBRARY,
    K_RENDERING_REF, K_ROUNDED_BENDS_POLYLINE, K_ROUNDED_RECTANGLE, K_SPLINE, K_TEXT, SKEdge, SKGraphElement, SKLabel, SKNode
} from './skgraph-models';
import { findBoundsAndTransformationData, findTextBoundsAndTransformationData, getPoints } from './views-common';
import {
    DEFAULT_CLICKABLE_FILL, DEFAULT_FILL, getKStyles, getSvgColorStyle, getSvgColorStyles, getSvgLineStyles, getSvgShadowStyles, getSvgTextStyles, isInvisible, KStyles
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

    let element = <g id={rendering.renderingId}>
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
 */
export function renderRectangularShape(rendering: KContainerRendering, parent: SKGraphElement, propagatedStyles: KStyles,
    context: SKGraphModelRenderer, mListener: KeithInteractiveMouseListener): VNode {

    // The styles that should be propagated to the children of this rendering. Will be modified in the getKStyles call.
    const stylesToPropagate = new KStyles

    // Extract the styles of the rendering into a more presentable object.
    const styles = getKStyles(parent, rendering.styles, propagatedStyles, stylesToPropagate)

    // Determine the bounds of the rendering first and where it has to be placed.
    const boundsAndTransformation = findBoundsAndTransformationData(rendering, styles.kRotation, parent, context)
    if (boundsAndTransformation === undefined) {
        // If no bounds are found, the rendering can not be drawn.
        return renderError(rendering)
    }

    const gAttrs: SVGAttributes<SVGGElement> = {
        ...(boundsAndTransformation.transformation !== undefined ? { transform: boundsAndTransformation.transformation } : {})
    }

    // Check the invisibility first. If this rendering is supposed to be invisible, do not render it,
    // only render its children transformed by the transformation already calculated.
    if (isInvisible(styles)) {
        return <g {...gAttrs}>
            {renderChildRenderings(rendering, parent, stylesToPropagate, context, mListener)}
        </g>
    }

    // Default case. Calculate all svg objects and attributes needed to build this rendering from the styles and the rendering.
    const colorStyles = getSvgColorStyles(styles, context, parent)
    // objects rendered here that have no background should get a invisible, but clickable background so that users do not click through the non-available background.
    if (colorStyles.background === DEFAULT_FILL) {
        colorStyles.background = DEFAULT_CLICKABLE_FILL
    }
    const shadowStyles = getSvgShadowStyles(styles, context)
    const lineStyles = getSvgLineStyles(styles, parent, context)

    // Create the svg element for this rendering.
    let element: VNode
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
                    <path
                        d={d}
                        style={{
                            'stroke-linecap': lineStyles.lineCap,
                            'stroke-linejoin': lineStyles.lineJoin,
                            'stroke-width': lineStyles.lineWidth,
                            'stroke-dasharray': lineStyles.dashArray,
                            'stroke-miterlimit': lineStyles.miterLimit,
                            'opacity': colorStyles.opacity,
                            'stroke-opacity': colorStyles.foreground.opacity,
                            'fill-opacity': colorStyles.background.opacity
                        } as React.CSSProperties}
                        stroke={colorStyles.foreground.color}
                        fill={colorStyles.background.color}
                        filter={shadowStyles}
                    />
                    {renderChildRenderings(rendering, parent, stylesToPropagate, context, mListener)}
                </g>
                break
            } else {
                // Fallthrough to KEllipse case.
            }
        }
        case K_ELLIPSE: {
            element = <g id={rendering.renderingId} {...gAttrs}>
                <ellipse
                    cx={boundsAndTransformation.bounds.width / 2}
                    cy={boundsAndTransformation.bounds.height / 2}
                    rx={boundsAndTransformation.bounds.width / 2}
                    ry={boundsAndTransformation.bounds.height / 2}
                    style={{
                        'stroke-linecap': lineStyles.lineCap,
                        'stroke-linejoin': lineStyles.lineJoin,
                        'stroke-width': lineStyles.lineWidth,
                        'stroke-dasharray': lineStyles.dashArray,
                        'stroke-miterlimit': lineStyles.miterLimit,
                        'opacity': colorStyles.opacity,
                        'stroke-opacity': colorStyles.foreground.opacity,
                        'fill-opacity': colorStyles.background.opacity
                    } as React.CSSProperties}
                    stroke={colorStyles.foreground.color}
                    fill={colorStyles.background.color}
                    filter={shadowStyles}
                />
                {renderChildRenderings(rendering, parent, stylesToPropagate, context, mListener)}
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
                <rect
                    width={boundsAndTransformation.bounds.width}
                    height={boundsAndTransformation.bounds.height}
                    {...(rx ? { rx: rx } : {})}
                    {...(ry ? { ry: ry } : {})}
                    style={{
                        'stroke-linecap': lineStyles.lineCap,
                        'stroke-linejoin': lineStyles.lineJoin,
                        'stroke-width': lineStyles.lineWidth,
                        'stroke-dasharray': lineStyles.dashArray,
                        'stroke-miterlimit': lineStyles.miterLimit,
                        'opacity': colorStyles.opacity,
                        'stroke-opacity': colorStyles.foreground.opacity,
                        'fill-opacity': colorStyles.background.opacity
                    } as React.CSSProperties}
                    stroke={colorStyles.foreground.color}
                    fill={colorStyles.background.color}
                    filter={shadowStyles}
                />
                {renderChildRenderings(rendering, parent, stylesToPropagate, context, mListener)}
            </g>
            break
        }
        case K_IMAGE: {
            // TODO: clipShape is not used yet.
            const id = (rendering as KImage).bundleName + ':' + (rendering as KImage).imagePath
            const extension = id.slice(id.lastIndexOf('.') + 1)
            const image = 'data:image/' + extension + ';base64,' + sessionStorage.getItem(id)
            element = <g id={rendering.renderingId} {...gAttrs}>
                <image
                    width={boundsAndTransformation.bounds.width}
                    height={boundsAndTransformation.bounds.height}
                    href={image}
                />
            </g>
            break
        }
        default: {
            // This case can never happen. If it still does, happy debugging!
            throw new Error('Rendering is neither an KArc, KEllipse, KImage, nor a KRectangle or KRoundedRectangle!')
        }
    }

    // Use indirect titles or placeholder to fill collapsed region.
    const smartZoomOption = context.renderingOptions.getOption(UseSmartZoom.ID)
    const useSmartZoomDefault = false
    const useSmartZoom = smartZoomOption ? smartZoomOption : useSmartZoomDefault
    if (useSmartZoom) {
        let region = context.depthMap.getRegion((parent as KNode).id)
        if (region && !region.expansionState && !region.hasTitle) {
            // Render indirect region titles.
            if (region.superStateTitle) {
                const titleSVG = renderKText(region.superStateTitle, region.boundingRectangle, propagatedStyles, context, mListener)
                element.children ? element.children.push(titleSVG) : element.children = [titleSVG]
            } else if (region.macroStateTitle && !region.hasMultipleMacroStates) {
                const titleSVG = renderKText(region.macroStateTitle, region.boundingRectangle, propagatedStyles, context, mListener)
                element.children ? element.children.push(titleSVG) : element.children = [titleSVG]
                // If there is no title draw placeholder.
            } else {
                const size = 50
                const scaleX = region.boundingRectangle.bounds.width / size
                const scaleY = region.boundingRectangle.bounds.height / size
                let scalingFactor = scaleX > scaleY ? scaleY : scaleX
                // Use zoom for constant size in viewport.
                if (context.viewport) {
                    scalingFactor = scalingFactor > 1 / context.viewport.zoom ? 1 / context.viewport.zoom : scalingFactor
                }
                let placeholder = <g
                    id="ZoomPlaceholder"
                    height={size}
                    width={size} >
                    <g transform={`scale(${scalingFactor},${scalingFactor})`}>
                        <circle cx="25" cy="25" r="20" stroke="#000000" fill="none" />
                        <line x1="25" x2="25" y1="10" y2="40" stroke="#000000" stroke-linecap="round" />
                        <line x1="10" x2="40" y1="25" y2="25" stroke="#000000" stroke-linecap="round" />
                        <line x1="39" x2="50" y1="39" y2="50" stroke="#000000" stroke-linecap="round" />
                    </g>
                </g>
                element.children ? element.children.push(placeholder) : element.children = [placeholder]
            }
        }
    }
    return element
}

/**
 * Translates a line rendering into an SVG rendering.
 * This includes all subclasses of and the KPolyline rendering itself.
 * @param rendering The rendering.
 * @param parent The parent element.
 * @param propagatedStyles The styles propagated from parent elements that should be taken into account.
 * @param context The rendering context for this element.
 */
export function renderLine(rendering: KPolyline, parent: SKGraphElement | SKEdge, propagatedStyles: KStyles,
    context: SKGraphModelRenderer, mListener: KeithInteractiveMouseListener): VNode {
    // The styles that should be propagated to the children of this rendering. Will be modified in the getKStyles call.
    const stylesToPropagate = new KStyles

    // Extract the styles of the rendering into a more presentable object.
    const styles = getKStyles(parent, rendering.styles, propagatedStyles, stylesToPropagate)

    // Determine the bounds of the rendering first and where it has to be placed.
    // TODO: KPolylines are a special case of container renderings: their bounds should not be given down to their child renderings.
    const boundsAndTransformation = findBoundsAndTransformationData(rendering, styles.kRotation, parent, context, true)
    if (boundsAndTransformation === undefined) {
        // If no bounds are found, the rendering can not be drawn.
        return renderError(rendering)
    }

    const gAttrs: SVGAttributes<SVGGElement> = {
        ...(boundsAndTransformation.transformation !== undefined ? { transform: boundsAndTransformation.transformation } : {})
    }

    // Check the invisibility first. If this rendering is supposed to be invisible, do not render it,
    // only render its children transformed by the transformation already calculated.
    if (isInvisible(styles)) {
        return <g {...gAttrs}>
            {renderChildRenderings(rendering, parent, stylesToPropagate, context, mListener)}
        </g>
    }

    // Default case. Calculate all svg objects and attributes needed to build this rendering from the styles and the rendering.
    const colorStyles = getSvgColorStyles(styles, context, parent)
    const shadowStyles = getSvgShadowStyles(styles, context)
    const lineStyles = getSvgLineStyles(styles, parent, context)

    const points = getPoints(parent, rendering, boundsAndTransformation)
    if (points.length === 0) {
        return <g>
            {renderChildRenderings(rendering, parent, stylesToPropagate, context, mListener)}
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
                let lastPoint = points[points.length - 1]
                path += `L${lastPoint.x},${lastPoint.y}`
            }
            break
        }
    }

    // Create the svg element for this rendering.
    let element = <g id={rendering.renderingId} {...gAttrs}>
        <path
            d={path}
            style={{
                'stroke-linecap': lineStyles.lineCap,
                'stroke-linejoin': lineStyles.lineJoin,
                'stroke-width': lineStyles.lineWidth,
                'stroke-dasharray': lineStyles.dashArray,
                'stroke-miterlimit': lineStyles.miterLimit,
                'opacity': colorStyles.opacity,
                'stroke-opacity': colorStyles.foreground.opacity,
                'fill-opacity': colorStyles.background.opacity
            } as React.CSSProperties}
            stroke={colorStyles.foreground.color}
            fill={colorStyles.background.color}
            filter={shadowStyles}
        />
        {renderChildRenderings(rendering, parent, stylesToPropagate, context, mListener)}
    </g>
    return element
}

/**
 * Translates a text rendering into an SVG text rendering.
 * @param rendering The rendering.
 * @param parent The parent element.
 * @param propagatedStyles The styles propagated from parent elements that should be taken into account.
 * @param context The rendering context for this element.
 * @param mListener The mouse listener.
 */
export function renderKText(rendering: KText, parent: SKGraphElement | SKLabel, propagatedStyles: KStyles,
    context: SKGraphModelRenderer, mListener: KeithInteractiveMouseListener): VNode {

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
    let lines = text.split('\n')

    // Extract the styles of the rendering into a more presentable object.
    const styles = getKStyles(parent, rendering.styles, propagatedStyles)

    // Determine the bounds of the rendering first and where it has to be placed.
    let boundsAndTransformation = findTextBoundsAndTransformationData(rendering, styles, parent, context, lines.length)
    if (boundsAndTransformation === undefined) {
        // If no bounds are found, the rendering can not be drawn.
        return renderError(rendering)
    }

    // Check the invisibility first. If this rendering is supposed to be invisible, do not render it,
    // only render its children transformed by the transformation already calculated.
    if (isInvisible(styles)) {
        return <g />
    }

    // Default case. Calculate all svg objects and attributes needed to build this rendering from the styles and the rendering.
    const colorStyle = getSvgColorStyle(styles.kForeground as KForeground, context)
    const shadowStyles = getSvgShadowStyles(styles, context)
    var textStyles = getSvgTextStyles(styles)

    // Replace text with rectangle, if the text is too small.
    const region = context.depthMap.getRegion(parent.id)
    const simplifySmallTextOption = context.renderingOptions.getOption(SimplifySmallText.ID)
    const simplifySmallText = simplifySmallTextOption ? simplifySmallTextOption.currentValue : false // Only enable, if option is found.
    if (simplifySmallText && (!region || (region && region.expansionState))) {
        const simplificationThresholdOption = context.renderingOptions.getOption(TextSimplificationThreshold.ID)
        const defaultThreshold = 3
        const simplificationThreshold = simplificationThresholdOption ? simplificationThresholdOption.currentValue : defaultThreshold
        const proportionalHeight = 0.5 // height of replacement compared to full text height
        if (context.viewport && rendering.calculatedTextBounds
            && rendering.calculatedTextBounds.height * context.viewport.zoom <= simplificationThreshold) {
            let replacements: VNode[] = []
            lines.forEach((line, index) => {
                const xPos = boundsAndTransformation && boundsAndTransformation.bounds.x ? boundsAndTransformation.bounds.x : 0
                const yPos = boundsAndTransformation && boundsAndTransformation.bounds.y && rendering.calculatedTextLineHeights && boundsAndTransformation.bounds.height ?
                    boundsAndTransformation.bounds.y - boundsAndTransformation.bounds.height / 2 + rendering.calculatedTextLineHeights[index] / 2 * proportionalHeight : 0
                const width = rendering.calculatedTextLineWidths ? rendering.calculatedTextLineWidths[index] : 0
                const height = rendering.calculatedTextLineHeights ? rendering.calculatedTextLineHeights[index] * proportionalHeight : 0
                // Generate rectangle for each line with color style.
                let curLine = colorStyle ? <rect x={xPos} y={yPos} width={width} height={height} fill={colorStyle.color} />
                    : <rect x={xPos} y={yPos} width={width} height={height} fill="#000000" />
                replacements.push(curLine)
            });
            return <g id={rendering.renderingId} {...{}}>
                {...replacements}
            </g>
        }

    }

    // The svg style of the resulting text element. If the text is only 1 line, the alignment-baseline attribute has to be
    // contained in the general style, otherwise it has to be repeated in every contained <tspan> element.
    const opacity = mListener.hasDragged ? 0.1 : parent.opacity
    let style = {
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

    // The children to be contained in the returned text node.
    let children: any[]

    // The attributes to be contained in the returned text node.
    let attrs = {
        x: boundsAndTransformation.bounds.x,
        style: style,
        ...(colorStyle ? { fill: colorStyle.color } : {}),
        filter: shadowStyles,
        ...{ 'xml:space': 'preserve' } // This attribute makes the text size estimation include any trailing white spaces.
    } as any

    let elements: VNode[]
    if (lines.length === 1) {
        // If the text has only one line, just put the text in the text node directly.
        attrs.y = boundsAndTransformation.bounds.y;
        // Render a space character for size estimation if the string is empty
        let line = lines[0]
        if (line === '') {
            line = ' '
        }

        children = [line]
        // Force any SVG renderer rendering this text to use the exact width calculated by this renderer.
        // This avoids overlapping texts or too big gaps at the cost of slightly bigger/tighter glyph spacings
        // when viewed in a different SVG viewer after exporting.
        if (rendering.calculatedTextLineWidths) {
            attrs.textLength = rendering.calculatedTextLineWidths[0]
            attrs.lengthAdjust = 'spacingAndGlyphs'
        }

        // If there is a collapsed region or state, scale title of region or single macro state.
        const smartZoomOption = context.renderingOptions.getOption(UseSmartZoom.ID)
        const useSmartZoom = smartZoomOption ? smartZoomOption.currentValue : false // Only enable, if option is found.
        if (useSmartZoom) {
            if (boundsAndTransformation.bounds.width && boundsAndTransformation.bounds.height
                && (rendering.isNodeTitle || (text !== '-' && text !== '+'))) {
                // Check whether or not the parent node is a child area.
                // If the parent is a child area, the text is a title of the region.
                // For macro states this is reached via explicit call to renderKText with the parent being the correct child area.
                let region = context.depthMap.getRegion((parent as KNode).id)
                if (region) {
                    // To avoid drawing a placeholder, when there is a region title.
                    // Avoid setting when called with macro or super state title.
                    if (!context.depthMap.titleMap.has(rendering)) {
                        region.hasTitle = true
                    }
                    if (!region.expansionState) {
                        // Scale to limit of bounding box or max size.
                        const titleScalingFactorOption = context.renderingOptions.getOption(TitleScalingFactor.ID)
                        const defaultFactor = 1
                        let maxScale = titleScalingFactorOption ? titleScalingFactorOption.currentValue : defaultFactor
                        // Indentation used in the layouting in pixels.
                        const indentation = 14
                        if (context.viewport) {
                            maxScale = maxScale / context.viewport.zoom
                            // Rescale indentation as this is applied before the scaling.
                            attrs.x = indentation * context.viewport.zoom / maxScale
                        }
                        const scaleX = (region.boundingRectangle.bounds.width - indentation) / boundsAndTransformation.bounds.width
                        const scaleY = region.boundingRectangle.bounds.height / boundsAndTransformation.bounds.height
                        let scalingFactor = scaleX > scaleY ? scaleY : scaleX
                        scalingFactor = scalingFactor > maxScale ? maxScale : scalingFactor
                        // Remove spacing to the left for region titles.
                        boundsAndTransformation.transformation = `scale(${scalingFactor},${scalingFactor})`
                    }
                }
            }
        }

        elements = [
            <text {...attrs}>
                {...children}
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
            // If the line is just a blank line, add a dummy space character so the size estimation will
            // include this character without rendering anything further visible to the screen.
            // Also, the <tspan> attribute dy needs at least one character per text so the offset is correctly applied.
            if (line === '') {
                line = ' '
            }
            const currentElement = <text
                {...attrs}
                y={currentY}
                {...(calculatedTextLineWidths ? { textLength: calculatedTextLineWidths[index] } : {})}
            >{line}</text>

            elements.push(currentElement)
            currentY = calculatedTextLineHeights ? currentY + calculatedTextLineHeights[index] : currentY
        });
    }

    // If there is a super state use the name as a title.
    // If there is one macro state in a child area, change the area title to the name of the macro state.
    // If there are multiple macro states set the flag.
    if (rendering.isNodeTitle && !context.depthMap.titleMap.has(rendering)) {
        context.depthMap.titleMap.add(rendering)
        let region = context.depthMap.findRegionWithElement(parent as KNode)
        if (region) {
            // Handle super states
            // If there is just one child region apply super state title.
            if (region.children.length == 1) {
                region.children.forEach(childRegion => {
                    if (!childRegion.superStateTitle) {
                        childRegion.superStateTitle = rendering
                    }
                });
                // Otherwise find correct region via id.
            } else {
                region.children.forEach(childRegion => {
                    let position = -1
                    let curPos = childRegion.boundingRectangle.id.indexOf(rendering.text)
                    if (curPos > position) {
                        position = curPos
                        childRegion.superStateTitle = rendering
                    }
                });
            }
            // Handle macro states
            if (region.hasMacroState && region.macroStateTitle !== rendering) {
                region.hasMultipleMacroStates = true
                // Needed if macro states are searched more than once.
                // Check for title in child regions as macro state titles get lifted one node.
                region.children.forEach((child) => {
                    if (region && child.macroStateTitle && region.macroStateTitle && child.macroStateTitle === rendering) {
                        region.hasMultipleMacroStates = false
                    }
                });
            } else if (!region.hasMacroState) {
                region.macroStateTitle = rendering
                region.hasMacroState = true
            }
        }
    }

    const gAttrs: SVGAttributes<SVGGElement> = {
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
 */
export function renderChildRenderings(parentRendering: KContainerRendering, parentElement: SKGraphElement, propagatedStyles: KStyles,
    context: SKGraphModelRenderer, mListener: KeithInteractiveMouseListener): (VNode | undefined)[] {
    // children only should be rendered if the parentElement is not a shadow
    if (!(parentElement instanceof SKNode) || !parentElement.shadow) {
        let renderings: (VNode | undefined)[] = []
        for (let childRendering of parentRendering.children) {
            let rendering = getRendering([childRendering], parentElement, propagatedStyles, context, mListener)
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
 * Looks up the KRendering in the given data pool and generates a SVG rendering from that.
 * @param datas The list of possible KRenderings and additional data.
 * @param parent The parent element containing this rendering.
 * @param propagatedStyles The styles propagated from parent elements that should be taken into account.
 * @param context The rendering context for this rendering.
 * @param mListener The mouse listener.
 */
export function getRendering(datas: KGraphData[], parent: SKGraphElement, propagatedStyles: KStyles,
    context: SKGraphModelRenderer, mListener: KeithInteractiveMouseListener): VNode | undefined {
    const kRenderingLibrary = datas.find(data => data !== null && data.type === K_RENDERING_LIBRARY)

    if (kRenderingLibrary !== undefined) {
        // register the rendering library if found in the parent node
        context.kRenderingLibrary = kRenderingLibrary as KRenderingLibrary
    }

    const kRendering = getKRendering(datas, context)

    if (kRendering === undefined) {
        return undefined
    }

    return renderKRendering(kRendering, parent, propagatedStyles, context, mListener)
}

/**
 * Translates any KRendering into an SVG rendering.
 * @param kRendering The rendering.
 * @param parent The parent element.
 * @param propagatedStyles The styles propagated from parent elements that should be taken into account.
 * @param context The rendering context for this element.
 * @param mListener The mouse listener.
 */
export function renderKRendering(kRendering: KRendering, parent: SKGraphElement, propagatedStyles: KStyles,
    context: SKGraphModelRenderer, mListener: KeithInteractiveMouseListener): VNode | undefined { // TODO: not all of these are implemented yet

    // Handle expansion and collapse of regions
    const smartZoomOption = context.renderingOptions.getOption(UseSmartZoom.ID)
    const useSmartZoom = smartZoomOption ? smartZoomOption.currentValue : false // Only enable, if option is found.
    if (useSmartZoom && (parent as KNode).expansionState === false) {
        return undefined
    }

    switch (kRendering.type) {
        case K_CONTAINER_RENDERING: {
            console.error('A rendering can not be a ' + kRendering.type + ' by itself, it needs to be a subclass of it.')
            return undefined
        }
        case K_CHILD_AREA: {
            return renderChildArea(kRendering as KChildArea, parent, propagatedStyles, context)
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
            return renderRectangularShape(kRendering as KContainerRendering, parent, propagatedStyles, context, mListener)
        }
        case K_POLYLINE:
        case K_POLYGON:
        case K_ROUNDED_BENDS_POLYLINE:
        case K_SPLINE: {
            return renderLine(kRendering as KPolyline, parent, propagatedStyles, context, mListener)
        }
        case K_TEXT: {
            return renderKText(kRendering as KText, parent, propagatedStyles, context, mListener)
        }
        default: {
            console.error('The rendering is of an unknown type:' + kRendering.type)
            return undefined
        }
    }
}

/**
 * Looks up the first KRendering in the list of data and returns it. KRenderingReferences are handled and dereferenced as well, so only 'real' renderings are returned.
 * @param datas The list of possible renderings.
 * @param context The rendering context for this rendering.
 */
export function getKRendering(datas: KGraphData[], context: SKGraphModelRenderer): KRendering | undefined {
    for (let data of datas) {
        if (data === null)
            continue
        if (data.type === K_RENDERING_REF) {
            const id = (data as KRenderingRef).renderingId
            for (let rendering of context.kRenderingLibrary.renderings) {
                if ((rendering as KRendering).renderingId === id) {
                    context.boundsMap = (data as KRenderingRef).calculatedBoundsMap
                    context.decorationMap = (data as KRenderingRef).calculatedDecorationMap
                    return rendering as KRendering
                }
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
 * @param mListener The mouse listener
 */
export function getJunctionPointRenderings(edge: SKEdge, context: SKGraphModelRenderer, mListener: KeithInteractiveMouseListener): VNode[] {
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
    const vNode = renderKRendering(junctionPointRendering, edge, new KStyles, context, mListener)
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