/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019-2025 by
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
import { KGraphData, SKGraphElement } from '@kieler/klighd-interactive/lib/constraint-classes'
import Color = require('color')
import { VNode } from 'snabbdom'
import { getZoom, isSelectable, RGBColor, svg } from 'sprotty' // eslint-disable-line @typescript-eslint/no-unused-vars
import { MinimumLineWidth, UseMinimumLineWidth } from './options/render-options-registry'
import { SKGraphModelRenderer } from './skgraph-model-renderer'
import {
    HorizontalAlignment,
    isKText,
    KBackground,
    KColoring,
    KFontBold,
    KFontItalic,
    KFontName,
    KFontSize,
    KForeground,
    KHorizontalAlignment,
    KInvisibility,
    KLineCap,
    KLineJoin,
    KLineStyle,
    KLineWidth,
    KRotation,
    KShadow,
    KStyle,
    KStyleHolder,
    KStyleRef,
    KTextStrikeout,
    KTextUnderline,
    KVerticalAlignment,
    LineCap,
    LineJoin,
    LineStyle,
    SKEdge,
    SKNode,
    Underline,
    VerticalAlignment,
} from './skgraph-models'
import {
    camelToKebab,
    fillSingleColor,
    getKRendering,
    isSingleColor,
    lineCapText,
    lineJoinText,
    lineStyleText,
    textDecorationStyleText,
    verticalAlignmentText,
} from './views-common'

// ----------------------------- type string definitions for all styles ------------------------------------- //
export const K_COLORING = 'KColoringImpl'
export const K_BACKGROUND = 'KBackgroundImpl'
export const K_FOREGROUND = 'KForegroundImpl'
export const K_FONT_BOLD = 'KFontBoldImpl'
export const K_FONT_ITALIC = 'KFontItalicImpl'
export const K_FONT_NAME = 'KFontNameImpl'
export const K_FONT_SIZE = 'KFontSizeImpl'
export const K_HORIZONTAL_ALIGNMENT = 'KHorizontalAlignmentImpl'
export const K_INVISIBILITY = 'KInvisibilityImpl'
export const K_LINE_CAP = 'KLineCapImpl'
export const K_LINE_JOIN = 'KLineJoinImpl'
export const K_LINE_STYLE = 'KLineStyleImpl'
export const K_LINE_WIDTH = 'KLineWidthImpl'
export const K_ROTATION = 'KRotationImpl'
export const K_SHADOW = 'KShadowImpl'
export const K_STYLE_REF = 'KStyleRefImpl'
export const K_TEXT_STRIKEOUT = 'KTextStrikeoutImpl'
export const K_TEXT_UNDERLINE = 'KTextUnderlineImpl'
export const K_VERTICAL_ALIGNMENT = 'KVerticalAlignmentImpl'

// constants for string building
const GRADIENT_UNIT_OBJECT_BOUNDING_BOX = 'objectBoundingBox'

const RGB_START = 'rgb('
const RGB_END = ')'
const URL_START = 'url(#'
const URL_END = ')'

// Default values for most Styles, that are used if no style is given Default values taken from PNodeController.java
export const DEFAULT_FONT_BOLD = false
export const DEFAULT_K_FONT_BOLD = {
    bold: DEFAULT_FONT_BOLD,
} as KFontBold
export const DEFAULT_FONT_ITALIC = false
export const DEFAULT_K_FONT_ITALIC = {
    italic: DEFAULT_FONT_ITALIC,
} as KFontItalic
export const DEFAULT_FONT_NAME = 'Overpass, sans-serif'
export const DEFAULT_K_FONT_NAME = {
    name: DEFAULT_FONT_NAME,
} as KFontName
export const DEFAULT_FONT_SIZE = 10
export const DEFAULT_K_FONT_SIZE = {
    size: DEFAULT_FONT_SIZE,
    scaleWithZoom: false, // TODO: implement this
} as KFontSize
export const DEFAULT_HORIZONTAL_ALIGNMENT = HorizontalAlignment.CENTER
export const DEFAULT_K_HORIZONTAL_ALIGNMENT = {
    horizontalAlignment: DEFAULT_HORIZONTAL_ALIGNMENT,
} as KHorizontalAlignment
export const DEFAULT_INVISIBILITY = false
export const DEFAULT_K_INVISIBILITY = {
    invisible: DEFAULT_INVISIBILITY,
} as KInvisibility
export const DEFAULT_LINE_CAP = LineCap.CAP_FLAT
export const DEFAULT_K_LINE_CAP = {
    lineCap: DEFAULT_LINE_CAP,
} as KLineCap
export const DEFAULT_LINE_JOIN = LineJoin.JOIN_MITER
export const DEFAULT_MITER_LIMIT = 10
export const DEFAULT_K_LINE_JOIN = {
    lineJoin: DEFAULT_LINE_JOIN,
    miterLimit: DEFAULT_MITER_LIMIT,
} as KLineJoin
export const DEFAULT_LINE_STYLE = LineStyle.SOLID
export const DEFAULT_K_LINE_STYLE = {
    lineStyle: DEFAULT_LINE_STYLE,
    dashOffset: 0,
    dashPattern: [0],
} as KLineStyle
export const DEFAULT_LINE_WIDTH = 1
export const DEFAULT_K_LINE_WIDTH = {
    lineWidth: DEFAULT_LINE_WIDTH,
} as KLineWidth
export const DEFAULT_FILL = {
    color: 'none',
} as ColorStyle
export const DEFAULT_CLICKABLE_FILL = {
    color: `${RGB_START}0,0,0${RGB_END}`,
    opacity: '0',
} as ColorStyle
export const DEFAULT_FOREGROUND = {
    color: 'black',
} as ColorStyle
export const DEFAULT_VERTICAL_ALIGNMENT = VerticalAlignment.CENTER
export const DEFAULT_K_VERTICAL_ALIGNMENT = {
    verticalAlignment: DEFAULT_VERTICAL_ALIGNMENT,
} as KVerticalAlignment
export const DEFAULT_SHADOW = undefined
export const DEFAULT_SHADOW_DEF = undefined
export const DEFAULT_CORNER_WIDTH = 0
export const DEFAULT_CORNER_HEIGHT = 0
export const DEFAULT_LINE_CAP_SVG = 'butt'
export const DEFAULT_LINE_JOIN_SVG = 'miter'
export const DEFAULT_MITER_LIMIT_SVG = '4'
/**
 * Data class to hold each possible KStyle of any rendering. Defaults each style to undefined or its default value from PNodeController.java
 */
export class KStyles {
    kBackground: KBackground | undefined

    kForeground: KForeground | undefined

    kFontBold: KFontBold | undefined

    kFontItalic: KFontItalic | undefined

    kFontName: KFontName | undefined

    kFontSize: KFontSize | undefined

    kHorizontalAlignment: KHorizontalAlignment | undefined

    kInvisibility: KInvisibility | undefined

    kLineCap: KLineCap | undefined

    kLineJoin: KLineJoin | undefined

    kLineStyle: KLineStyle | undefined

    kLineWidth: KLineWidth | undefined

    kRotation: KRotation | undefined

    kShadow: KShadow | undefined

    kStyleRef: KStyleRef | undefined

    kTextStrikeout: KTextStrikeout | undefined

    kTextUnderline: KTextUnderline | undefined

    kVerticalAlignment: KVerticalAlignment | undefined

    constructor(initialize?: boolean) {
        if (initialize !== false) {
            this.kBackground = undefined
            this.kForeground = undefined
            this.kFontBold = DEFAULT_K_FONT_BOLD
            this.kFontItalic = DEFAULT_K_FONT_ITALIC
            this.kFontName = DEFAULT_K_FONT_NAME
            this.kFontSize = DEFAULT_K_FONT_SIZE
            this.kHorizontalAlignment = DEFAULT_K_HORIZONTAL_ALIGNMENT
            this.kInvisibility = DEFAULT_K_INVISIBILITY
            this.kLineCap = DEFAULT_K_LINE_CAP
            this.kLineJoin = DEFAULT_K_LINE_JOIN
            this.kLineStyle = DEFAULT_K_LINE_STYLE
            this.kLineWidth = DEFAULT_K_LINE_WIDTH
            this.kRotation = undefined
            this.kShadow = DEFAULT_SHADOW
            this.kStyleRef = undefined
            this.kTextStrikeout = undefined
            this.kTextUnderline = undefined
            this.kVerticalAlignment = DEFAULT_K_VERTICAL_ALIGNMENT
        }
    }
}

/**
 * Calculates the renderings for all styles contained in styleList into an object.
 * @param styleList The list of all styles that should have their rendering calculated.
 * @param propagatedStyles The styles propagated from parent elements that should be taken into account.
 * @param stylesToPropagate The optional styles object that should be propagated further to children. It is modified in this method.
 */
export function getKStyles(
    parent: SKGraphElement,
    styleHolder: KStyleHolder & KGraphData,
    propagatedStyles: KStyles,
    context: SKGraphModelRenderer,
    stylesToPropagate?: KStyles
): KStyles {
    // TODO: not all of these are implemented yet

    // Style Priority in KLighD:
    // 1. Styles propagated from immedeate parent renderings
    // 2. Styles propagated from recursive parent rendering (deeper down in the hierarchy first)
    // 3. Styles explicitly given to the rendering
    // 4. Default styles
    // Caution: Styles that are propagated do NOT apply to the rendering itself, if there are parent propagated styles. Only the children will have this propagated style as their first priority.

    // The styles to propagate start as the current propagated styles to be overwritten by new styles.
    const styles = new KStyles()
    if (stylesToPropagate !== undefined) {
        copyStyles(propagatedStyles, stylesToPropagate)
    }
    let styleList = styleHolder.styles

    if (styleList === undefined) {
        return styles
    }
    // First, check if we need to incorporate default selection styles.
    // That is the case if the parend is selected and no selection styles are available.
    if (isSelectable(parent) && parent.selected) {
        if (styleList.filter((style) => style.selection === true).length === 0) {
            // ...if no selection styles are available, apply default ones.
            if (isKText(styleHolder)) {
                styleList = styleList.concat(getDefaultTextSelectionStyles(context))
            } else if (styleHolder === getKRendering(parent.data, context)) {
                // For non-text renderings this only applies to the root rendering
                styleList = styleList.concat(getDefaultNonTextSelectionStyles(context))
            }
        }
    }

    // Then, apply all styles in order of appereance in the style list.
    for (const style of styleList) {
        // Only apply selection styles if the parent is selected.
        if (style.selection === false || (isSelectable(parent) && parent.selected)) {
            applyKStyle(style, styles, stylesToPropagate)
        }
    }
    // Finally, override with propagated styles.
    copyStyles(propagatedStyles, styles)
    return styles
}

/**
 * The default selection styles for text renderings.
 * @returns A list of default selection text styles.
 */
export function getDefaultTextSelectionStyles(context: SKGraphModelRenderer): KStyle[] {
    let backgroundColor = Color.rgb(190, 190, 190)
    if (context.backgroundColor) {
        if (context.backgroundColor.isDark()) {
            backgroundColor = context.backgroundColor.lightness(context.backgroundColor.lightness() + 25)
        } else {
            backgroundColor = context.backgroundColor.lightness(context.backgroundColor.lightness() - 25)
        }
    }

    return [
        {
            type: K_BACKGROUND,
            propagateToChildren: false,
            selection: true,
            color: {
                red: backgroundColor.red(),
                green: backgroundColor.green(),
                blue: backgroundColor.blue(),
            },
            alpha: 255,
            gradientAngle: 0,
        } as KBackground,
        {
            type: K_FONT_BOLD,
            propagateToChildren: false,
            selection: true,
            bold: true,
        } as KFontBold,
    ]
}

/**
 * The default selection styles for non-text renderings.
 * @returns A list of default selection non-text styles.
 */
export function getDefaultNonTextSelectionStyles(context: SKGraphModelRenderer): KStyle[] {
    let backgroundColor = Color.rgb(190, 190, 190)
    if (context.backgroundColor) {
        if (context.backgroundColor.isDark()) {
            backgroundColor = context.backgroundColor.lightness(context.backgroundColor.lightness() + 25)
        } else {
            backgroundColor = context.backgroundColor.lightness(context.backgroundColor.lightness() - 25)
        }
    }
    return [
        {
            type: K_BACKGROUND,
            propagateToChildren: false,
            selection: true,
            color: {
                red: backgroundColor.red(),
                green: backgroundColor.green(),
                blue: backgroundColor.blue(),
            },
            alpha: 255,
            gradientAngle: 0,
        } as KBackground,
        {
            type: K_LINE_STYLE,
            propagateToChildren: false,
            selection: true,
            lineStyle: LineStyle.DASH,
            dashOffset: 0,
        } as KLineStyle,
    ]
}

/**
 * Apply the given style to the given styles object. If it should be propagated, also apply it to the stylesToPropagage object.
 * @param style The style to apply.
 * @param styles The styles object the style should be applied to.
 * @param stylesToPropagage The styles object that gets propagated.
 */
export function applyKStyle(style: KStyle, styles: KStyles, stylesToPropagage?: KStyles): void {
    switch (style.type) {
        case K_COLORING: {
            console.error(`A style can not be a ${style.type} by itself, it needs to be a subclass of it.`)
            break
        }
        case K_BACKGROUND: {
            styles.kBackground = style as KBackground
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kBackground = styles.kBackground
            }
            break
        }
        case K_FOREGROUND: {
            styles.kForeground = style as KForeground
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kForeground = styles.kForeground
            }
            break
        }
        case K_FONT_BOLD: {
            styles.kFontBold = style as KFontBold
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kFontBold = styles.kFontBold
            }
            break
        }
        case K_FONT_ITALIC: {
            styles.kFontItalic = style as KFontItalic
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kFontItalic = styles.kFontItalic
            }
            break
        }
        case K_FONT_NAME: {
            styles.kFontName = style as KFontName
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kFontName = styles.kFontName
            }
            break
        }
        case K_FONT_SIZE: {
            styles.kFontSize = style as KFontSize
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kFontSize = styles.kFontSize
            }
            break
        }
        case K_HORIZONTAL_ALIGNMENT: {
            styles.kHorizontalAlignment = style as KHorizontalAlignment
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kHorizontalAlignment = styles.kHorizontalAlignment
            }
            break
        }
        case K_INVISIBILITY: {
            styles.kInvisibility = style as KInvisibility
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kInvisibility = styles.kInvisibility
            }
            break
        }
        case K_LINE_CAP: {
            styles.kLineCap = style as KLineCap
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kLineCap = styles.kLineCap
            }
            break
        }
        case K_LINE_JOIN: {
            styles.kLineJoin = style as KLineJoin
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kLineJoin = styles.kLineJoin
            }
            break
        }
        case K_LINE_STYLE: {
            styles.kLineStyle = style as KLineStyle
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kLineStyle = styles.kLineStyle
            }
            break
        }
        case K_LINE_WIDTH: {
            styles.kLineWidth = style as KLineWidth
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kLineWidth = styles.kLineWidth
            }
            break
        }
        case K_ROTATION: {
            styles.kRotation = style as KRotation
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kRotation = styles.kRotation
            }
            break
        }
        case K_SHADOW: {
            styles.kShadow = style as KShadow
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kShadow = styles.kShadow
            }
            break
        }
        case K_STYLE_REF: {
            console.error(`The style ${style.type} is not implemented yet.`)
            // style as KStyleRef
            // special case! TODO: how to handle this? Never seen this in any rendering
            break
        }
        case K_TEXT_STRIKEOUT: {
            console.error(`The style ${style.type} is not implemented yet.`)
            styles.kTextStrikeout = style as KTextStrikeout
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kTextStrikeout = styles.kTextStrikeout
            }
            break
        }
        case K_TEXT_UNDERLINE: {
            styles.kTextUnderline = style as KTextUnderline
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kTextUnderline = styles.kTextUnderline
            }
            break
        }
        case K_VERTICAL_ALIGNMENT: {
            styles.kVerticalAlignment = style as KVerticalAlignment
            if (style.propagateToChildren === true && stylesToPropagage !== undefined) {
                stylesToPropagage.kVerticalAlignment = styles.kVerticalAlignment
            }
            break
        }
        default: {
            console.error(`Unexpected Style found while rendering: ${style.type}`)
            break
        }
    }
}

/**
 * Copies the content from one to the other KStyles object.
 * @param from The KStyles to copy from.
 * @param to The KStyles to copy to.
 */
export function copyStyles(from: KStyles, to: KStyles): void {
    to.kBackground = from.kBackground ?? to.kBackground
    to.kForeground = from.kForeground ?? to.kForeground
    to.kFontBold = from.kFontBold ?? to.kFontBold
    to.kFontItalic = from.kFontItalic ?? to.kFontItalic
    to.kFontName = from.kFontName ?? to.kFontName
    to.kFontSize = from.kFontSize ?? to.kFontSize
    to.kHorizontalAlignment = from.kHorizontalAlignment ?? to.kHorizontalAlignment
    to.kInvisibility = from.kInvisibility ?? to.kInvisibility
    to.kLineCap = from.kLineCap ?? to.kLineCap
    to.kLineJoin = from.kLineJoin ?? to.kLineJoin
    to.kLineStyle = from.kLineStyle ?? to.kLineStyle
    to.kLineWidth = from.kLineWidth ?? to.kLineWidth
    to.kRotation = from.kRotation ?? to.kRotation
    to.kShadow = from.kShadow ?? to.kShadow
    to.kStyleRef = from.kStyleRef ?? to.kStyleRef
    to.kTextStrikeout = from.kTextStrikeout ?? to.kTextStrikeout
    to.kTextUnderline = from.kTextUnderline ?? to.kTextUnderline
    to.kVerticalAlignment = from.kVerticalAlignment ?? to.kVerticalAlignment
}

// ----------------------------- Functions for rendering different KStyles as VNodes in svg --------------------------------------------

/**
 * SVG element for color gradient definition.
 * @param colorId The unique identifying string for this color.
 * @param start The SVG data for the start color of the gradient.
 * @param end The SVG data for the end color of the gradient.
 * @param angle The angle at which the gradient should flow.
 */
export function colorDefinition(colorId: string, start: ColorStyle, end: ColorStyle, angle: number | undefined): VNode {
    const startColorStop = (
        <stop
            offset={0}
            style={{
                'stop-color': start.color,
                ...(start.opacity ? { 'stop-opacity': start.opacity } : {}),
            }}
        />
    )
    const endColorStop = (
        <stop
            offset={1}
            style={{
                'stop-color': end.color,
                ...(end.opacity ? { 'stop-opacity': end.opacity } : {}),
            }}
        />
    )
    let angleFloat = angle === undefined ? 0 : angle

    // Calculate the x and y lengths a line of angle 'angle' would have in a 1x1 box.

    // First, normalize the angle to be 0<=angle<360
    angleFloat %= 360
    if (angleFloat < 0) {
        angleFloat += 360
    }
    // Convert the angle to radians
    const angleRad = (angleFloat / 180) * Math.PI

    let x
    let y

    if (angleRad <= (1 / 4) * Math.PI || angleRad > (7 / 4) * Math.PI) {
        x = 1
        y = -Math.tan((0 / 2) * Math.PI - angleRad)
    } else if (angleRad <= (3 / 4) * Math.PI) {
        x = Math.tan((1 / 2) * Math.PI - angleRad)
        y = 1
    } else if (angleRad <= (5 / 4) * Math.PI) {
        x = -1
        y = Math.tan((2 / 2) * Math.PI - angleRad)
    } else {
        // or: else if (angleRad <= 7/4 * Math.PI) {
        x = -Math.tan((3 / 2) * Math.PI - angleRad)
        y = -1
    }

    // Now, turn these lengths into x1/x2 and y1/y2 coordinates within the box such that 0<=var<=1,
    // centered within the box.
    let x1
    let x2
    let y1
    let y2
    if (x >= 0) {
        const halfRemain = (1 - x) / 2
        x1 = halfRemain
        x2 = halfRemain + x
    } else {
        const halfRemain = (1 + x) / 2
        x1 = halfRemain - x
        x2 = halfRemain
    }

    if (y >= 0) {
        const halfRemain = (1 - y) / 2
        y1 = halfRemain
        y2 = halfRemain + y
    } else {
        const halfRemain = (1 + y) / 2
        y1 = halfRemain - y
        y2 = halfRemain
    }

    const gradientAttributes = {
        id: colorId,
        // If the gradient is not rotated, the attributes for rotation should not be added.
        ...(angleFloat === 0 ? {} : { gradientUnits: GRADIENT_UNIT_OBJECT_BOUNDING_BOX }),
        ...(angleFloat === 0 ? {} : { x1 }),
        ...(angleFloat === 0 ? {} : { x2 }),
        ...(angleFloat === 0 ? {} : { y1 }),
        ...(angleFloat === 0 ? {} : { y2 }),
    }
    return (
        <linearGradient {...gradientAttributes}>
            {startColorStop}
            {endColorStop}
        </linearGradient>
    )
}

/**
 * SVG element for a shadow definition.
 * @param shadowId The unique identifying string for this shadow.
 * @param color The color of the shadow.
 * @param blur The amount of blur of the shadow.
 * @param xOffset The x-offset of the shadow.
 * @param yOffset The y-offset of the shadow.
 */
export function shadowDefinition(
    shadowId: string,
    color: string | undefined,
    blur: number,
    xOffset: number,
    yOffset: number
): VNode {
    // stdDev of 1 looks closest to KIELER style shadows, but looks nicer with this blur
    // TODO: ultimately, this should be using the blur parameter again.
    // TODO: use the color given in the shadow.
    // TODO: maybe calculate the blurClip depending on the calculated size of the rendering and the x- and y-offset.
    const STD_DEV = 1
    const blurClip = 25
    return (
        <filter
            id={shadowId}
            // Extend the region around the element in which the shadow should be rendered.
            x={`-${blurClip}%`}
            y={`-${blurClip}%`}
            width={`${100 + 2 * blurClip}%`}
            height={`${100 + 2 * blurClip}%`}
        >
            <feGaussianBlur in="SourceAlpha" stdDeviation={STD_DEV} />
            <feOffset
                // A smaller offset causes the blur not to overlap too much.
                dx={xOffset / 4}
                dy={yOffset / 4}
                result="offsetblur"
            />
            <feFlood
            // TODO: these colors
            // flood-color = 'flood-color-of-feDropShadow'
            // flood-opacity = 'flood-opacity-of-feDropShadow'
            />
            <feComposite in2="offsetblur" operator="in" />
            <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
    )

    // The above definition is equivalent to this shorthand SVG, but not all SVG renderers support and understand this (such as Inkscape).
    // As every shadow is defined exactly once in the final SVG, this additional code does not add too much to the overall file size.
    // <feDropShadow
    //     dx={ xOffset / 4 }
    //     dy={ yOffset / 4 }
    //     stdDeviation={ STD_DEV }
    // />
}

/**
 * Returns the identifying string for the given shadow style, that can be put into the SVG 'filter' attribute.
 * Also remembers the shadow definition in the rendering context to be added to the top of the final SVG.
 * @param styles The KStyles of the rendering.
 * @param context The rendering context.
 */
export function getSvgShadowStyles(styles: KStyles, context: SKGraphModelRenderer): string | undefined {
    const shadow = styles.kShadow
    if (shadow === undefined) {
        return undefined
    }
    // Every shadow ID should start with an 's'.
    let shadowId = 's'
    let color
    const { blur } = shadow
    const { xOffset } = shadow
    const { yOffset } = shadow
    // Extract the color and also put it in the ID.
    if (shadow.color !== undefined) {
        const shadowColor = `${shadow.color.red},${shadow.color.green},${shadow.color.blue}`
        shadowId += shadowColor
        color = RGB_START + shadowColor + RGB_END
    }
    // Separator for unique identification.
    shadowId += '$'
    // Add the blur to the ID.
    if (blur !== undefined) {
        shadowId += blur
    }
    shadowId += '$'
    // Add the x- and y-offset to the ID.
    if (xOffset !== undefined) {
        shadowId += xOffset
    }
    shadowId += '$'
    if (yOffset !== undefined) {
        shadowId += yOffset
    }
    // Remember the shadow definition to be added at the top level of the SVG, if the same shadow has not been defined previously.
    if (!context.renderingDefs.has(shadowId)) {
        context.renderingDefs.set(shadowId, shadowDefinition(shadowId, color, blur, xOffset, yOffset))
    }
    // Return the reference of the above defined ID to be put in the filter attribute of any SVG element.
    return URL_START + shadowId + URL_END
}

/**
 * Returns the identifying strings for the given foreground- and background styles that can be put in the SVG 'stroke' and 'fill' attributes,
 * depending on the rendering the styles have to be applied for.
 * The identifying string can either be a simple rgb color reference (such as rgb(0,0,0) for black), a rgba color reference (such as rgba(0,0,0,128) for a transparent black)
 * or a url for a gradient color definition that is remembered in the rendering context and has to be added to the SVG later.
 * @param styles The KStyles of the rendering.
 * @param context The rendering context.
 */
export function getSvgColorStyles(
    styles: KStyles,
    context: SKGraphModelRenderer,
    parent: SKGraphElement | SKEdge
): ColorStyles {
    const foreground = getSvgColorStyle(styles.kForeground as KForeground, context)
    const background = getSvgColorStyle(styles.kBackground as KBackground, context)
    const grayedOutColor = { color: 'grey', opacity: '255' }

    if (parent instanceof SKEdge && parent.moved) {
        // edge should be greyed out
        return {
            foreground: grayedOutColor,
            background: background === undefined ? DEFAULT_FILL : grayedOutColor,
            opacity: String(parent.opacity),
        }
    }

    if (parent instanceof SKNode && parent.shadow) {
        // colors of the shadow node
        return {
            foreground: grayedOutColor,
            background: background === undefined ? DEFAULT_FILL : { color: 'gainsboro', opacity: '255' },
            opacity: String(parent.opacity),
        }
    }

    if (parent instanceof SKNode && parent.highlight) {
        return {
            foreground: { color: '#03A9F4', opacity: '255' },
            background: background === undefined ? DEFAULT_FILL : background,
            opacity: parent.opacity.toString(),
        }
    }

    return {
        foreground: foreground === undefined ? DEFAULT_FOREGROUND : foreground,
        background: background === undefined ? DEFAULT_FILL : background,
        opacity: String(parent.opacity),
    }
}

/**
 * The same as getSvgColorStyles, only that it only handles one of the two styles.
 * @param coloring The KColoring of which the color string should be returned.
 * @param context The rendering context.
 * @see getSvgColorStyles
 */
export function getSvgColorStyle(
    coloring: KColoring | undefined,
    context: SKGraphModelRenderer
): ColorStyle | undefined {
    if (coloring === undefined || coloring.color === undefined) {
        return undefined
    }
    // If the color is a single color, just return its corresponding rgb resp. rgba color.
    if (isSingleColor(coloring)) {
        return fillSingleColor(coloring)
    }
    // Otherwise, build an ID for the gradient color to refer to the definition described below.
    // Every color ID should start with a 'c'.
    let colorId = 'c'
    const start = {} as ColorStyle
    const end = {} as ColorStyle
    let angle
    if (coloring.alpha !== undefined && coloring.alpha !== 255) {
        start.opacity = (coloring.alpha / 255).toString()
    }
    const startColor = `${coloring.color.red},${coloring.color.green},${coloring.color.blue}`
    colorId += startColor
    start.color = RGB_START + startColor + RGB_END

    // Separate the individual parts in the ID to guarantee uniqueness.
    colorId += '$'
    // Do the same for the end color.
    if (coloring.targetAlpha !== undefined && coloring.targetAlpha !== 255) {
        end.opacity = (coloring.targetAlpha / 255).toString()
    }
    const endColor = `${(coloring.targetColor as RGBColor).red},${(coloring.targetColor as RGBColor).green},${
        (coloring.targetColor as RGBColor).blue
    }`
    colorId += endColor
    end.color = RGB_START + endColor + RGB_END

    // Add the angle of the gradient to the ID.
    if (coloring.gradientAngle !== 0) {
        angle = coloring.gradientAngle
        colorId += `$${angle}`
    }

    // Remember the color definition to be added at the top level of the SVG, if the same color has not been defined previously.
    if (!context.renderingDefs.has(colorId)) {
        context.renderingDefs.set(colorId, colorDefinition(colorId, start, end, angle))
    }
    // Return the reference of the above defined ID to be put in the fill or stroke attribute of any SVG element.
    return {
        color: URL_START + colorId + URL_END,
        // no opacity needed here as it is already in the gradient color definition.
    } as ColorStyle
}

/**
 * Returns if the rendering should be rendered or if it is invisible and only its children are relevant.
 * @param styles The KStyles of the rendering.
 */
export function isInvisible(styles: KStyles): boolean {
    return styles.kInvisibility !== undefined && styles.kInvisibility.invisible
}

/**
 * Returns the SVG strings for line styles that can be applied to the following SVG attributes:
 * 'stroke-linecap' has to be set to the lineCap style,
 * 'stroke-linejoin' has to be set to the lineJoin style,
 * 'stroke-width' has to be set to the lineWidth style,
 * 'stroke-dasharray' has to be set to the dashArray style,
 * 'stroke-miterlimit' has to be set to the miterLimit style. (This is not a string, but a number.)
 * @param styles The KStyles of the rendering.
 * @param target The target of the line
 * @param context The current rendering context
 */
export function getSvgLineStyles(styles: KStyles, target: SKGraphElement, context: SKGraphModelRenderer): LineStyles {
    // The line width as requested by the element
    let lineWidth = styles.kLineWidth === undefined ? DEFAULT_LINE_WIDTH : styles.kLineWidth.lineWidth
    const useLineWidthOption = context.renderOptionsRegistry.getValue(UseMinimumLineWidth)
    // Only enable, if option is found.
    const useMinimumLineWidth = useLineWidthOption ?? false
    if (!context.forceRendering && useMinimumLineWidth) {
        // The line witdh in px that the drawn line should not be less than.
        const minimumLineWidth = context.renderOptionsRegistry.getValueOrDefault(MinimumLineWidth)
        // The line width the requested one would have when rendered in the current zoom level.
        const realLineWidth = lineWidth * getZoom(target)
        if (realLineWidth !== 0 && realLineWidth < minimumLineWidth) {
            // scale the used line width up to appear as big as the minimum line width requested.
            lineWidth *= minimumLineWidth / realLineWidth
        }
    }
    const lineCap = styles.kLineCap === undefined ? undefined : lineCapText(styles.kLineCap)
    const lineJoin = styles.kLineJoin === undefined ? undefined : lineJoinText(styles.kLineJoin)
    const miterLimit = styles.kLineJoin?.miterLimit === undefined ? DEFAULT_MITER_LIMIT : styles.kLineJoin.miterLimit
    return {
        lineWidth: lineWidth === DEFAULT_LINE_WIDTH ? undefined : `${lineWidth}px`,
        lineCap: lineCap === DEFAULT_LINE_CAP_SVG ? undefined : lineCap,
        lineJoin: lineJoin === DEFAULT_LINE_JOIN_SVG ? undefined : lineJoin,
        dashArray: styles.kLineStyle === undefined ? undefined : lineStyleText(styles.kLineStyle, lineWidth),
        dashOffset: styles.kLineStyle === undefined ? undefined : styles.kLineStyle.dashOffset?.toString(),
        // Note: Here the miter limit value is also omitted if the value equals KGraph's default value of 10, because otherwise the resulting SVG would
        // always contain the miterLimit style to be set to 10, even though it is not intended by the creator of the KGraph model and it would not
        // even make any difference in the rendering. Here I cannot distinguish if the model creator really wanted to have the specific miter limit of 10
        // or if he just does not care. As the first case seems rare, I prefer a cleaner resulting svg here.
        miterLimit:
            lineJoin !== 'miter' || String(miterLimit) === DEFAULT_MITER_LIMIT_SVG || miterLimit === DEFAULT_MITER_LIMIT
                ? undefined
                : String(miterLimit),
    }
}

/**
 * Returns the SVG strings for text styles that can be applied to the following SVG attributes:
 * 'dominant-baseline' has to be set to the dominantBaseline style,
 * 'font-family' has to be set to the fontFamily style,
 * 'font-size' has to be set to the fontSize style,
 * 'font-style' has to be set to the fontStyle style,
 * 'font-weight' has to be set to the fontWeight style,
 * 'text-decoration-line' has to be set to the textDecorationLine style,
 * 'text-decoration-style' has to be set to the textDecorationStyle style.
 * @param styles The KStyles of the rendering.
 */
export function getSvgTextStyles(styles: KStyles): TextStyles {
    return {
        dominantBaseline: verticalAlignmentText(
            styles.kVerticalAlignment?.verticalAlignment === undefined
                ? DEFAULT_VERTICAL_ALIGNMENT
                : styles.kVerticalAlignment.verticalAlignment
        ),
        fontFamily: styles.kFontName === undefined ? undefined : camelToKebab(styles.kFontName.name),
        // Convert pt to px here with a default value of 96 dpi(px/in) and 72pt/in, making this a conversion from in to px.
        fontSize: styles.kFontSize === undefined ? undefined : `${(styles.kFontSize.size * 96) / 72}px`,
        fontStyle:
            styles.kFontItalic === undefined || styles.kFontItalic.italic === DEFAULT_FONT_ITALIC
                ? undefined
                : 'italic',
        fontWeight: styles.kFontBold === undefined || styles.kFontBold.bold === DEFAULT_FONT_BOLD ? undefined : 'bold',
        textDecorationLine:
            styles.kTextUnderline === undefined || styles.kTextUnderline.underline === Underline.NONE
                ? undefined
                : 'underline',
        textDecorationStyle:
            styles.kTextUnderline === undefined
                ? undefined
                : textDecorationStyleText(styles.kTextUnderline as KTextUnderline),
        // textDecorationColor: styles.kTextUnderline === undefined ? undefined : textDecorationColor(styles.kTextUnderline as KTextUnderline),
        // TODO: textDecorationColorDefinition:
    }
}

/**
 * Data class holding the SVG attributes for a single color
 */
export interface ColorStyle {
    color: string
    opacity: string | undefined
}

/**
 * Data class holding the different SVG attributes for color related styles.
 */
export interface ColorStyles {
    foreground: ColorStyle
    background: ColorStyle
    opacity: string
}

/**
 * Data class holding the different SVG attributes for line related styles.
 */
export interface LineStyles {
    lineWidth: string | undefined
    lineCap: 'butt' | 'round' | 'square' | undefined
    lineJoin: 'bevel' | 'miter' | 'round' | undefined
    dashArray: string | undefined
    dashOffset: string | undefined
    miterLimit: string | undefined
}

/**
 * Data class holding the different SVG attributes for text related styles.
 */
export interface TextStyles {
    dominantBaseline: string | undefined
    fontFamily: string | undefined
    fontSize: string | undefined
    fontStyle: string | undefined
    fontWeight: string | undefined
    textDecorationLine: string | undefined
    textDecorationStyle: string | undefined
}
