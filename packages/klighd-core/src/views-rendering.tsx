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
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
/** @jsx svg */
import { svg } from 'snabbdom-jsx'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { VNode } from 'snabbdom/vnode';
import { KGraphData, KNode } from '@kieler/klighd-interactive/lib/constraint-classes';
import { KlighdInteractiveMouseListener } from '@kieler/klighd-interactive/lib/klighd-interactive-mouselistener';
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
import { SimplifySmallText, TextSimplificationThreshold, TitleScalingFactor, TitleOverlayThreshold } from './options/render-options-registry';
import { DetailLevel } from './depth-map';

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
 */
export function renderRectangularShape(rendering: KContainerRendering, parent: SKGraphElement, propagatedStyles: KStyles,
    context: SKGraphModelRenderer, mListener: KlighdInteractiveMouseListener): VNode {
    // The styles that should be propagated to the children of this rendering. Will be modified in the getKStyles call.
    const stylesToPropagate = new KStyles
    // Extract the styles of the rendering into a more presentable object.
    const styles = getKStyles(parent, rendering.styles, propagatedStyles, stylesToPropagate)

    // Determine the bounds of the rendering first and where it has to be placed.
    const boundsAndTransformation = findBoundsAndTransformationData(rendering, styles.kRotation, parent, context)
    // Add the transformations to be able to positon the title correctly and above other elements
    context.positions[context.positions.length - 1] += (boundsAndTransformation?.transformation ?? "")
    if (boundsAndTransformation === undefined) {
        // If no bounds are found, the rendering can not be drawn.
        return renderError(rendering)
    }

    const gAttrs = {
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
                        }}
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
        // eslint-disable-next-line
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
                    }}
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
                    }}
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

    if (element && context.depthMap) {
        const region = context.depthMap.getProvidingRegion(parent as KNode, context.viewport, context.renderingOptions)
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
            const placeholder = <g id="ZoomPlaceholder"
                transform={`scale(${scalingFactor}, ${scalingFactor}) translate(${x}, ${y})`}>
                <g height={size} width={size}>
                    <circle cx="11" cy="11" r="8" stroke="#000000" fill="none" />
                    <line x1="21" x2="16.65" y1="21" y2="16.65" stroke="#000000" stroke-linecap="round" />
                    <line x1="11" x2="11" y1="8" y2="14" stroke="#000000" stroke-linecap="round" />
                    <line x1="8" x2="14" y1="11" y2="11" stroke="#000000" stroke-linecap="round" />
                </g>
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
 */
export function renderLine(rendering: KPolyline, parent: SKGraphElement | SKEdge, propagatedStyles: KStyles,
    context: SKGraphModelRenderer, mListener: KlighdInteractiveMouseListener): VNode {
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

    const gAttrs = {
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
    const element = <g id={rendering.renderingId} {...gAttrs}>
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
            }}
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
    context: SKGraphModelRenderer, mListener: KlighdInteractiveMouseListener): VNode {
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

    // Extract the styles of the rendering into a more presentable object.
    const styles = getKStyles(parent, rendering.styles, propagatedStyles)

    // Determine the bounds of the rendering first and where it has to be placed.
    const boundsAndTransformation = findTextBoundsAndTransformationData(rendering, styles, parent, context, lines.length)
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
    const textStyles = getSvgTextStyles(styles)

    // Replace text with rectangle, if the text is too small.
    const region = context.depthMap?.getProvidingRegion(parent as KNode, context.viewport, context.renderingOptions)

    const simplifySmallTextOption = context.renderingOptions.getValueForId(SimplifySmallText.ID)
    const simplifySmallText = simplifySmallTextOption ?? false // Only enable, if option is found.
    if (simplifySmallText && (!region || region.detail === DetailLevel.FullDetails) && !rendering.isNodeTitle) {
        const simplificationThresholdOption = context.renderingOptions.getValueForId(TextSimplificationThreshold.ID)
        const simplificationThreshold = simplificationThresholdOption ?? TextSimplificationThreshold.DEFAULT

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
    const opacity = mListener.hasDragged ? 0.1 : parent.opacity
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
        filter: shadowStyles,
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

        const overlayThresholdOption = context.renderingOptions.getValueForId(TitleOverlayThreshold.ID)
        const overlayThreshold = overlayThresholdOption ?? TitleOverlayThreshold.DEFAULT

        if (context.depthMap) {
            if (boundsAndTransformation.bounds.width && boundsAndTransformation.bounds.height && rendering.isNodeTitle) {

                // Check whether or not the parent node is a child area.
                // If the parent is a child area, the text is a title of the region.
                // For macro states this is reached via explicit call to renderKText with the parent being the correct child area.
                const region = context.depthMap.getProvidingRegion(parent as KNode, context.viewport, context.renderingOptions)
                if (region) {
                    if (region.detail !== DetailLevel.FullDetails && parent.children.length > 1
                        || (rendering.calculatedTextBounds && rendering.calculatedTextBounds.height * context.viewport.zoom <= overlayThreshold)) {
                        // Scale to limit of bounding box or max size.
                        const titleScalingFactorOption = context.renderingOptions.getValueForId(TitleScalingFactor.ID)
                        let maxScale = titleScalingFactorOption ?? TitleScalingFactor.DEFAULT
                        // Indentation used in the layouting in pixels.
                        if (context.viewport) {
                            maxScale = maxScale / context.viewport.zoom
                        }
                        const scaleX = (region.boundingRectangle.bounds.width - attrs.x) / boundsAndTransformation.bounds.width
                        const scaleY = region.boundingRectangle.bounds.height / boundsAndTransformation.bounds.height
                        let scalingFactor = scaleX > scaleY ? scaleY : scaleX
                        // Don't let scalingfactor get too big.
                        scalingFactor = scalingFactor > maxScale ? maxScale : scalingFactor
                        // Make sure scalingfactor is not below 1.
                        scalingFactor = scalingFactor > 1 ? scalingFactor : 1

                        // Smooth transition between overlay title and normal title.
                        if (rendering.calculatedTextBounds) {
                            const t = Math.max((overlayThreshold - rendering.calculatedTextBounds.height * context.viewport.zoom), 0) / 3
                            if (t <= 1) {
                                scalingFactor = (1 - t) * 1 + t * scalingFactor
                            }
                        }
                        // Set the indentation.
                        attrs.x /= scalingFactor
                        // Remove spacing to the left for region titles.
                        boundsAndTransformation.transformation = `scale(${scalingFactor},${scalingFactor})`
                        // Calculate exact height of title text
                        region.regionTitleHeight = scalingFactor * (boundsAndTransformation.bounds.height)
                        region.regionTitleIndentation = boundsAndTransformation.bounds.x ?? 0
                    }
                }
                else {
                    if (rendering.calculatedTextBounds && rendering.calculatedTextBounds.height * context.viewport.zoom <= overlayThreshold) {
                        const titleScalingFactorOption = context.renderingOptions.getValueForId(TitleScalingFactor.ID)
                        const defaultFactor = 1
                        let maxScale = titleScalingFactorOption ?? defaultFactor
                        // Indentation used in the layouting in pixels.
                        if (context.viewport) {
                            maxScale = maxScale / context.viewport.zoom
                        }
                        const scaleX = ((parent as KNode).bounds.width - attrs.x) / boundsAndTransformation.bounds.width
                        const scaleY = (parent as KNode).bounds.height / boundsAndTransformation.bounds.height
                        let scalingFactor = scaleX > scaleY ? scaleY : scaleX
                        // Don't let scalingfactor get too big.
                        scalingFactor = scalingFactor > maxScale ? maxScale : scalingFactor
                        // Make sure scalingfactor is not below 1.
                        scalingFactor = scalingFactor > 1 ? scalingFactor : 1
                        // Smooth transition between overlay title and normal title.
                        if (rendering.calculatedTextBounds) {
                            const t = (overlayThreshold - rendering.calculatedTextBounds.height * context.viewport.zoom) / 3
                            if (t <= 1) {
                                scalingFactor = (1 - t) * 1 + t * scalingFactor
                            }
                        }
                        // Keep the scaled title centered by moving it to the left by the half of the growth in width.
                        attrs.x -= (scalingFactor * boundsAndTransformation.bounds.width - boundsAndTransformation.bounds.width) / (2 * scalingFactor)

                        // Remove spacing to the left for region titles.
                        boundsAndTransformation.transformation = `scale(${scalingFactor},${scalingFactor})`
                    }
                }
            }
        }
        // Draw white background for overlaying titles
        if (rendering.isNodeTitle && ((region && region.detail === DetailLevel.FullDetails) || !region)
            && rendering.calculatedTextBounds && rendering.calculatedTextBounds.height * context.viewport.zoom <= overlayThreshold) {
            // Adapt y value to place the rectangle on the top of the text. 
            attrs.y -= (boundsAndTransformation.bounds.height ?? 0) / 2
            // Adapt position of text in rectangle to place text in center
            const attrs2 = { ...attrs }
            attrs2.x += (boundsAndTransformation.bounds.width ?? 0) / 2
            attrs2.y += (boundsAndTransformation.bounds.height ?? 0) / 2
            attrs2.style["dominant-baseline"] = "middle"
            attrs2.attrs = { "text-anchor": "middle" }
            // Add a rectangle behind the title
            elements = [
                <g>
                    <rect x={attrs.x} y={attrs.y} width={boundsAndTransformation.bounds.width} height={boundsAndTransformation.bounds.height} fill="white" opacity="0.8" stroke="black"> </rect>
                    <text {...attrs2}>
                        {...lines}
                    </text>
                </g>
            ]
        } else {
            elements = [
                <text {...attrs}>
                    {...lines}
                </text>
            ]
        }
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
    if (region || !rendering.isNodeTitle) {
        // build the element from the above defined attributes and children
        return <g id={rendering.renderingId} {...gAttrs}>
            {...elements}
        </g>
    } else {
        // Add the transformations necessary for correct placement
        gAttrs.transform = gAttrs.transform != undefined ? context.positions.pop() + gAttrs.transform : context.positions.pop()
        context.titles[context.titles.length - 1].push(<g id={rendering.renderingId} {...gAttrs}>
            {...elements}
        </g>)
        return <g></g>
    }
}

/**
 * Renders all child renderings of the given container rendering.
 * @param parentRendering The parent rendering.
 * @param parent The parent element containing this rendering.
 * @param propagatedStyles The styles propagated from parent elements that should be taken into account.
 * @param context The rendering context for this element.
 */
export function renderChildRenderings(parentRendering: KContainerRendering, parentElement: SKGraphElement, propagatedStyles: KStyles,
    context: SKGraphModelRenderer, mListener: KlighdInteractiveMouseListener): (VNode | undefined)[] {
    // children only should be rendered if the parentElement is not a shadow
    if (!(parentElement instanceof SKNode) || !parentElement.shadow) {
        const renderings: (VNode | undefined)[] = []
        for (const childRendering of parentRendering.children) {
            const rendering = getRendering([childRendering], parentElement, propagatedStyles, context, mListener)
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
    context: SKGraphModelRenderer, mListener: KlighdInteractiveMouseListener): VNode | undefined {
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
    context: SKGraphModelRenderer, mListener: KlighdInteractiveMouseListener): VNode | undefined { // TODO: not all of these are implemented yet

    if (context.depthMap && context.depthMap.getContainingRegion(parent as KNode, context.viewport, context.renderingOptions)?.detail !== DetailLevel.FullDetails) {
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
 * @param mListener The mouse listener
 */
export function getJunctionPointRenderings(edge: SKEdge, context: SKGraphModelRenderer, mListener: KlighdInteractiveMouseListener): VNode[] {
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