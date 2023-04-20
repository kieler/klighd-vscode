/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019-2023 by
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
import { VNode, VNodeStyle } from 'snabbdom';
import { svg } from 'sprotty'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { SKGraphModelRenderer } from './skgraph-model-renderer';
import {
    Arc,
    KArc,
    KContainerRendering,
    KImage,
    KRoundedRectangle,
    SKGraphElement
} from './skgraph-models';
import { BoundsAndTransformation } from './views-common';
import { renderChildRenderings, renderKRendering, renderSVGArc, renderSVGEllipse, renderSVGImage, renderSVGRect } from './views-rendering';
import {
    ColorStyles,
    KStyles, LineStyles
} from './views-styles';

export function renderKArc(
    rendering: KContainerRendering,
    parent: SKGraphElement,
    boundsAndTransformation: BoundsAndTransformation,
    styles: KStyles,
    stylesToPropagate: KStyles,
    context: SKGraphModelRenderer,
    colorStyles: ColorStyles,
    lineStyles: LineStyles,
    shadowStyles: string | undefined,
    lineWidth: number,
    gAttrs: {
        transform?: string | undefined
        style?: VNodeStyle | undefined
    },
    childOfNodeTitle?: boolean): VNode {
    const kArcRendering = rendering as KArc
    let element: VNode | undefined = undefined
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
        const width = boundsAndTransformation.bounds.width - lineWidth
        const height = boundsAndTransformation.bounds.height - lineWidth
        const rX = width / 2
        const rY = height / 2
        const midX = rX + lineWidth / 2
        const midY = rY + lineWidth / 2
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

        element = (
          <g
            id={rendering.properties['klighd.lsp.rendering.id'] as string}
            {...gAttrs}
          >
            {...renderSVGArc(
              lineStyles,
              colorStyles,
              shadowStyles,
              d,
              styles.kShadow
            )}
            {renderChildRenderings(
              rendering,
              parent,
              stylesToPropagate,
              context,
              childOfNodeTitle
            )}
          </g>
        );
    } else {
        // Fallthrough to KEllipse case.
    }
    return element as VNode
}

export function renderKEllipse(
    rendering: KContainerRendering,
    parent: SKGraphElement,
    boundsAndTransformation: BoundsAndTransformation,
    styles: KStyles,
    stylesToPropagate: KStyles,
    context: SKGraphModelRenderer,
    colorStyles: ColorStyles,
    lineStyles: LineStyles,
    shadowStyles: string | undefined,
    lineWidth: number,
    gAttrs: {
    transform?: string | undefined;
    style?: VNodeStyle | undefined;
    },
    childOfNodeTitle?: boolean): VNode {
    return (
        <g
        id={rendering.properties["klighd.lsp.rendering.id"] as string}
        {...gAttrs}
        >
        {...renderSVGEllipse(
            boundsAndTransformation.bounds,
            lineWidth,
            lineStyles,
            colorStyles,
            shadowStyles,
            styles.kShadow
        )}
        {renderChildRenderings(
            rendering,
            parent,
            stylesToPropagate,
            context,
            childOfNodeTitle
        )}
        </g>
    );
}

export function renderKRoundedRectangle(
    rendering: KContainerRendering,
    parent: SKGraphElement,
    boundsAndTransformation: BoundsAndTransformation,
    styles: KStyles,
    stylesToPropagate: KStyles,
    context: SKGraphModelRenderer,
    colorStyles: ColorStyles,
    lineStyles: LineStyles,
    shadowStyles: string | undefined,
    lineWidth: number,
    gAttrs: {
      transform?: string | undefined;
      style?: VNodeStyle | undefined;
    },
    childOfNodeTitle?: boolean): VNode {
    // like this the rx and ry will be undefined during the rendering of a roundedRectangle and therefore those fields will be left out.
    // Rounded rectangles work in svg just like regular rectangles just with those two added variables, so this call will result in a regular rectangle.

    // Rendering-specific attributes
    const rx = (rendering as KRoundedRectangle).cornerWidth;
    const ry = (rendering as KRoundedRectangle).cornerHeight;

    return (
        <g
        id={rendering.properties['klighd.lsp.rendering.id'] as string}
        {...gAttrs}
        >
        {...renderSVGRect(
            boundsAndTransformation.bounds,
            lineWidth,
            rx,
            ry,
            lineStyles,
            colorStyles,
            shadowStyles,
            styles.kShadow
        )}
        {renderChildRenderings(
            rendering,
            parent,
            stylesToPropagate,
            context,
            childOfNodeTitle
        )}
        </g>
    );
}

export function renderKImage(
    rendering: KContainerRendering,
    parent: SKGraphElement,
    boundsAndTransformation: BoundsAndTransformation,
    styles: KStyles,
    stylesToPropagate: KStyles,
    context: SKGraphModelRenderer,
    shadowStyles: string | undefined,
    gAttrs: {
      transform?: string | undefined;
      style?: VNodeStyle | undefined;
    },
    childOfNodeTitle?: boolean): VNode {
    const clipShape = (rendering as KImage).clipShape
    const fullImagePath = (rendering as KImage).bundleName + ':' + (rendering as KImage).imagePath
    const id = rendering.properties['klighd.lsp.rendering.id'] as string
    const clipId = `${id}$clip`
    const extension = fullImagePath.slice(fullImagePath.lastIndexOf('.') + 1)
    const image = 'data:image/' + extension + ';base64,' + sessionStorage.getItem(fullImagePath)
    let clipPath: VNode | undefined = undefined

    // Render the clip shape within an SVG clipPath element to be used as a clipping mask for the image.
    if (clipShape !== undefined) {
        clipShape.isClipRendering = true
        const outerClipShape = renderKRendering(clipShape, parent, stylesToPropagate, context, childOfNodeTitle)
        // renderings start with an outermost <g> element. If that is the case, remove that element and use its child instead.
        if (outerClipShape?.sel === 'g' && outerClipShape?.children !== undefined) {
            clipPath = <clipPath
                id={clipId}> 
                    {outerClipShape?.children[0]}
            </clipPath>
        }
        gAttrs.style = {
            clipPath: `url(#${clipId})`
        }
    }
    // Render the image.
    return (
        <g id={id} {...gAttrs}>
        {...clipPath ? [clipPath] : []}
        {...renderSVGImage(
            boundsAndTransformation.bounds,
            shadowStyles,
            image,
            styles.kShadow
        )}
        </g>
    );
}

