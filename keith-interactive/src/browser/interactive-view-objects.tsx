/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019, 2020 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
/** @jsx svg */
import { svg } from 'snabbdom-jsx';
import { VNode } from 'snabbdom/vnode';
import { Direction } from './constraint-classes';
import { lockPath, arrowVertical, arrowHorizontal } from './svg-path';

const iconScale = 0.01

/**
 * Creates a rectangle.
 * @param begin The begin coordinate in the layer direction.
 * @param end The end coordinate in the layer direction.
 * @param top The top coordinate in the secondary direction.
 * @param bottom The bottom of the layer in the secondary direction.
 * @param forbidden If the layer represented by the rectangle is forbidden the colour is red.
 * @param selected Determines whether the layer represented by the rectangle is selected instead of a certain position.
 * @param direction The direction of the layer.
 */
export function createRect(begin: number, end: number, top: number, bottom: number, forbidden: boolean, selected: boolean, direction: Direction): VNode {
    let forbiddenColor = 'indianred'
    let backgroundColor = selected ? 'grey' : 'lightgrey'
    // @ts-ignore
    return <g> <rect
                    x={(direction === Direction.RIGHT || direction === Direction.UNDEFINED) ? begin : direction === Direction.LEFT ? end : top}
                    y={(direction === Direction.RIGHT || direction === Direction.UNDEFINED || direction === Direction.LEFT) ? top : direction === Direction.UP ? end : begin}
                    width={(direction === Direction.RIGHT || direction === Direction.UNDEFINED || direction === Direction.LEFT) ? Math.abs(begin - end) : bottom - top}
                    height={(direction === Direction.RIGHT || direction === Direction.UNDEFINED || direction === Direction.LEFT) ? bottom - top : Math.abs(begin - end)}
                    fill={forbidden ? forbiddenColor : backgroundColor}
                    stroke={forbidden ? forbiddenColor : 'grey'}
                    style={{ 'stroke-dasharray': "4" } as React.CSSProperties}>
                </rect>
            </g>
}

/**
 * Creates a vertical line.
 * @param mid x/y coordinate of the line.
 * @param top Start of the line on the y/x-axis.
 * @param bot End of the line on the y/x-axis.
 * @param direction The layout direction.
 */
export function createVerticalLine(mid: number, top: number, bot: number, direction: Direction): VNode {
    // @ts-ignore
    return <g> <line
                    x1={(direction === Direction.RIGHT || direction === Direction.LEFT || direction === Direction.UNDEFINED) ? mid : top}
                    y1={(direction === Direction.RIGHT || direction === Direction.LEFT || direction === Direction.UNDEFINED) ? top : mid}
                    x2={(direction === Direction.RIGHT || direction === Direction.LEFT || direction === Direction.UNDEFINED) ? mid : bot}
                    y2={(direction === Direction.RIGHT || direction === Direction.LEFT || direction === Direction.UNDEFINED) ? bot : mid}
                    fill='none'
                    stroke='grey'
                    style={{ 'stroke-dasharray': 4 } as React.CSSProperties}
                />
            </g>
}

/**
 * Creates a circle.
 * @param fill Determines whether the circle is filled.
 * @param x The x coordinate of the center.
 * @param y The y coordinate of the center.
 * @param forbidden If the layer the circle is in is forbidden the colour is red.
 */
export function renderCircle(fill: boolean, x: number, y: number, forbidden: boolean): VNode {
    let forbiddenColor = 'indianred'
    let color = forbidden ? forbiddenColor : 'grey'
    // @ts-ignore
    return  <g> <circle
                    cx={x}
                    cy={y}
                    r="2"
                    stroke={color}
                    fill={fill ? color : "none"}
                    style={{ 'stroke-width': 0.5 } as React.CSSProperties}
                />
            </g>
}

/**
 * Creates a lock icon.
 * @param xTranslate
 * @param yTranslate
 */
export function renderLock(xTranslate: number, yTranslate: number): VNode {
    const generalYOffset = 5
    let s = "translate(" + xTranslate + ","
            + (yTranslate - generalYOffset) + ") scale(" + iconScale + ", " + iconScale + ")"
            // @ts-ignore
    return  <g transform={s}
                fill="grey" stroke="none">
                <path d={lockPath}>
                </path>
            </g>
}

/**
 * Creates an arrow icon.
 * @param xTranslate
 * @param yTranslate
 * @param vertical Determines whether the arrow should be vertical or horizontal.
 */
export function renderArrow(xTranslate: number, yTranslate: number, vertical: boolean): VNode {
    let s = "translate(" + xTranslate + ","
            + yTranslate + ")"
    s += " scale(" + iconScale + ", " + iconScale + ")"
    if (vertical) {
        // @ts-ignore
        return <g transform={s}
            fill="grey" stroke="none">
            <path d={arrowVertical}/>
        </g>
    } else {
        // @ts-ignore
        return <g transform={s}
            fill="grey" stroke="none">
            <path d={arrowHorizontal}/>
        </g>
    }
}