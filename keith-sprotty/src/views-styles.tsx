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
import { svg } from 'snabbdom-jsx';
import { VNode } from 'snabbdom/vnode';
import { isSelectable, SLabel, SNode } from 'sprotty';
import {
    HorizontalAlignment, KBackground, KColoring, KFontBold, KFontItalic, KFontName, KFontSize, KForeground,
    KHorizontalAlignment, KInvisibility, KLineCap, KLineJoin, KLineStyle, KLineWidth, KRotation, KShadow, KStyle,
    KStyleRef, KTextStrikeout, KTextUnderline, KVerticalAlignment, LineCap, LineJoin, LineStyle, SKEdge,
    SKGraphElement, SKNode, VerticalAlignment
} from './skgraph-models';
import {
    camelToKebab, fillSingleColor, isSingleColor, lineCapText, lineJoinText, lineStyleText,
    SKGraphRenderingContext, textDecorationStyleText, verticalAlignmentText
} from './views-common';


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
const GRADIENT_TRANSFORM_ROTATE_START = 'rotate('
const GRADIENT_TRANSFORM_ROTATE_END = ')'

const RGB_START = 'rgb('
const RGB_END = ')'
const URL_START = 'url(#'
const URL_END = ')'


// Default values for most Styles, that are used if no style is given Default values taken from PNodeController.java
export const DEFAULT_FONT_BOLD = false
export const DEFAULT_FONT_ITALIC = false
export const DEFAULT_FONT_NAME = 'sans-serif' // TODO: on windows this is 'arial' (if server or if client is windows?)
export const DEFAULT_FONT_SIZE = 10
export const DEFAULT_HORIZONTAL_ALIGNMENT = HorizontalAlignment.CENTER
export const DEFAULT_INVISIBILITY = false
export const DEFAULT_LINE_CAP = LineCap.CAP_FLAT
export const DEFAULT_LINE_JOIN = LineJoin.JOIN_MITER
export const DEFAULT_MITER_LIMIT = 10
export const DEFAULT_LINE_STYLE = LineStyle.SOLID
export const DEFAULT_LINE_WIDTH = 1
export const DEFAULT_FILL = {
    color: 'none'
} as ColorStyle
export const DEFAULT_CLICKABLE_FILL = {
    color: RGB_START + '0,0,0' + RGB_END,
    opacity: '0'
} as ColorStyle
export const DEFAULT_FOREGROUND = {
    color: 'black'
} as ColorStyle
export const DEFAULT_VERTICAL_ALIGNMENT = VerticalAlignment.CENTER
export const DEFAULT_SHADOW = undefined
export const DEFAULT_SHADOW_DEF = undefined
export const DEFAULT_CORNER_WIDTH = 0
export const DEFAULT_CORNER_HEIGHT = 0
export const DEFAULT_LINE_CAP_SVG = 'butt'
export const DEFAULT_LINE_JOIN_SVG = 'miter'
export const DEFAULT_MITER_LIMIT_SVG = 4
/**
 * Data class to hold each possible KStyle of any rendering. Defaults each style to undefined or its default value from PNodeController.java
 */
export class KStyles {
    kBackground: KBackground | undefined
    kForeground: KForeground | undefined
    kFontBold: KFontBold
    kFontItalic: KFontItalic
    kFontName: KFontName
    kFontSize: KFontSize
    kHorizontalAlignment: KHorizontalAlignment
    kInvisibility: KInvisibility | undefined
    kLineCap: KLineCap
    kLineJoin: KLineJoin
    kLineStyle: KLineStyle
    kLineWidth: KLineWidth
    kRotation: KRotation | undefined
    kShadow: KShadow | undefined
    kStyleRef: KStyleRef | undefined
    kTextStrikeout: KTextStrikeout | undefined
    kTextUnderline: KTextUnderline | undefined
    kVerticalAlignment: KVerticalAlignment
    constructor(initialize?: boolean) {
        if (initialize !== false) {
            this.kBackground = undefined
            this.kForeground = undefined
            this.kFontBold = {
                bold: DEFAULT_FONT_BOLD
            } as KFontBold
            this.kFontItalic = {
                italic: DEFAULT_FONT_ITALIC
            } as KFontItalic
            this.kFontName = {
                name: DEFAULT_FONT_NAME
            } as KFontName
            this.kFontSize = {
                size: DEFAULT_FONT_SIZE,
                scaleWithZoom: false // TODO: implement this
            } as KFontSize
            this.kHorizontalAlignment = {
                horizontalAlignment: DEFAULT_HORIZONTAL_ALIGNMENT
            } as KHorizontalAlignment
            this.kInvisibility = {
                invisible: DEFAULT_INVISIBILITY
            } as KInvisibility
            this.kLineCap = {
                lineCap: DEFAULT_LINE_CAP
            } as KLineCap
            this.kLineJoin = {
                lineJoin: DEFAULT_LINE_JOIN,
                miterLimit: DEFAULT_MITER_LIMIT
            } as KLineJoin
            this.kLineStyle = {
                lineStyle: DEFAULT_LINE_STYLE,
                dashOffset: 0,
                dashPattern: [0]
            } as KLineStyle
            this.kLineWidth = {
                lineWidth: DEFAULT_LINE_WIDTH
            } as KLineWidth
            this.kRotation = undefined
            this.kShadow = DEFAULT_SHADOW
            this.kStyleRef = undefined
            this.kTextStrikeout = undefined
            this.kTextUnderline = undefined
            this.kVerticalAlignment = {
                verticalAlignment: DEFAULT_VERTICAL_ALIGNMENT
            } as KVerticalAlignment
        }
    }
}

/**
 * Calculates the renderings for all styles contained in styleList into an object.
 * @param styleList The list of all styles that should have their rendering calculated.
 * @param propagatedStyles The styles propagated from parent elements that should be taken into account.
 * @param stylesToPropagage The optional styles object that should be propagated further to childern. It is modified in this method.
 */
export function getKStyles(parent: SKGraphElement, styleList: KStyle[], propagatedStyles: KStyles, stylesToPropagage?: KStyles): KStyles {
    // TODO: not all of these are implemented yet
    let styles = new KStyles(false)
    // Include all propagated styles.
    copyStyles(propagatedStyles, styles)
    if (stylesToPropagage !== undefined) {
        copyStyles(propagatedStyles, stylesToPropagage)
    }

    if (styleList === undefined) {
        return styles
    }

    // First, apply all non-selection styles.
    for (let style of styleList) {
        if (style.selection === false) {
            applyKStyle(style, styles, stylesToPropagage)
        }
    }
    // Then, override with selection styles, if any are available.
    for (let style of styleList) {
        if (isSelectable(parent) && parent.selected && style.selection === true) {
            applyKStyle(style, styles, stylesToPropagage)
        }
    }
    return styles
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
            console.error('A style can not be a ' + style.type + ' by itself, it needs to be a subclass of it.')
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
            styles.kFontName = style as KFontName // TODO: have a deeper look at svg fonts
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
            console.error('The style ' + style.type + ' is not implemented yet.')
            // style as KStyleRef
            // special case! TODO: how to handle this? Never seen this in any rendering
            break
        }
        case K_TEXT_STRIKEOUT: {
            console.error('The style ' + style.type + ' is not implemented yet.')
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
            console.error('Unexpected Style found while rendering: ' + style.type)
            break
        }
    }
}

/**
 * Copies the content from one to the other KStyles object.
 * @param from The KStyles to copy from.
 * @param to The KStyles to copy to.
 */
export function copyStyles(from: KStyles, to: KStyles) {
    to.kBackground = from.kBackground
    to.kForeground = from.kForeground
    to.kFontBold = from.kFontBold
    to.kFontItalic = from.kFontItalic
    to.kFontName = from.kFontName
    to.kFontSize = from.kFontSize
    to.kHorizontalAlignment = from.kHorizontalAlignment
    to.kInvisibility = from.kInvisibility
    to.kLineCap = from.kLineCap
    to.kLineJoin = from.kLineJoin
    to.kLineStyle = from.kLineStyle
    to.kLineWidth = from.kLineWidth
    to.kRotation = from.kRotation
    to.kShadow = from.kShadow
    to.kStyleRef = from.kStyleRef
    to.kTextStrikeout = from.kTextStrikeout
    to.kTextUnderline = from.kTextUnderline
    to.kVerticalAlignment = from.kVerticalAlignment
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
    const startColorStop = <stop
        offset={0}
        style={{
            'stop-color': start.color,
            'stop-opacity': start.opacity
        } as React.CSSProperties}
    />
    const endColorStop = <stop
        offset={1}
        style={{
            'stop-color': end.color,
            'stop-opacity': end.opacity
        } as React.CSSProperties}
    />
    let angleFloat = angle === undefined ? 0 : angle

    const gradientAttributes = {
        id: colorId,
        // If the gradient is not rotated, the attributes for rotation should not be added.
        ...(angleFloat === 0 ? {} : { gradientUnits: GRADIENT_UNIT_OBJECT_BOUNDING_BOX }),
        ...(angleFloat === 0 ? {} : { gradientTransform: GRADIENT_TRANSFORM_ROTATE_START + angle + GRADIENT_TRANSFORM_ROTATE_END })
    }
    return <linearGradient {...gradientAttributes}>
        {startColorStop}
        {endColorStop}
    </linearGradient>
}

/**
 * SVG element for a shadow definition.
 * @param shadowId The unique identifying string for this shadow.
 * @param color The color of the shadow.
 * @param blur The amound of blur of the shadow.
 * @param xOffset The x-offset of the shadow.
 * @param yOffset The y-offset of the shadow.
 */
export function shadowDefinition(shadowId: string, color: string | undefined, blur: number, xOffset: number, yOffset: number): VNode {
    // stdDev of 1 looks closest to KIELER style shadows, but looks nicer with this blur
    // TODO: ultimately, this should be using the blur parameter again.
    // TODO: use the color given in the shadow.
    // TODO: maybe calculate the blurClip depending on the calculated size of the rendering and the x- and y-offset.
    const STD_DEV = 1
    const blurClip = 25
    return <filter
        id={shadowId}
        // Extend the region around the element in which the shadow should be rendered.
        x={`-${blurClip}%`}
        y={`-${blurClip}%`}
        width={`${100 + 2 * blurClip}%`}
        height={`${100 + 2 * blurClip}%`}>
        <feGaussianBlur
            in='SourceAlpha'
            stdDeviation={STD_DEV}
        />
        <feOffset
            // A smaller offset causes the blur not to overlap too much.
            dx={xOffset / 4}
            dy={yOffset / 4}
            result='offsetblur'
        />
        <feFlood
            // TODO: these colors
            // flood-color = 'flood-color-of-feDropShadow'
            // flood-opacity = 'flood-opacity-of-feDropShadow'
        />
        <feComposite
            in2='offsetblur'
            operator='in'
        />
        <feMerge>
            <feMergeNode />
            <feMergeNode
                in='SourceGraphic'
            />
        </feMerge>
    </filter>

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
export function getSvgShadowStyles(styles: KStyles, context: SKGraphRenderingContext): string | undefined {
    const shadow = styles.kShadow
    if (shadow === undefined) {
        return undefined
    }
    // Every shadow ID should start with an 's'.
    let shadowId = 's'
    let color
    let blur = shadow.blur
    let xOffset = shadow.xOffset
    let yOffset = shadow.yOffset
    // Extract the color and also put it in the ID.
    if (shadow.color !== undefined) {
        let shadowColor = shadow.color.red + ','
            + shadow.color.green + ','
            + shadow.color.blue
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
export function getSvgColorStyles(styles: KStyles, context: SKGraphRenderingContext, parent: SKGraphElement | SKEdge): ColorStyles {
    const foreground = getSvgColorStyle(styles.kForeground as KForeground, context)
    const background = getSvgColorStyle(styles.kBackground as KBackground, context)
    const grayedOutColor = {color: 'grey', opacity: '255'}

    if (parent instanceof SKEdge && parent.moved) {
        // edge should be greyed out
        return {
            foreground: grayedOutColor,
            background: background === undefined ? DEFAULT_FILL : grayedOutColor,
            opacity: parent instanceof SNode || parent instanceof SLabel ? parent.opacity : 1
        }
    }

    if (parent instanceof SKNode && parent.shadow) {
        // colors of the shadow node
        return {
            foreground: grayedOutColor,
            background: background === undefined ? DEFAULT_FILL : {color: 'gainsboro', opacity: '255'},
            opacity: parent instanceof SNode ? parent.opacity : 1
        }
    }

    return {
        foreground: foreground === undefined ? DEFAULT_FOREGROUND : foreground,
        background: background === undefined ? DEFAULT_FILL : background,
        opacity: parent instanceof SNode || parent instanceof SLabel ? parent.opacity : 1
    }
}


/**
 * The same as getSvgColorStyles, only that it only handles one of the two styles.
 * @param coloring The KColoring of which the color string should be returned.
 * @param context The rendering context.
 * @see getSvgColorStyles
 */
export function getSvgColorStyle(coloring: KColoring | undefined, context: SKGraphRenderingContext): ColorStyle | undefined {
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
    let start = {} as ColorStyle
    let end = {} as ColorStyle
    let angle
    if (coloring.alpha !== undefined && coloring.alpha !== 255) {
        start.opacity = (coloring.alpha / 255).toString()
    }
    let startColor = coloring.color.red + ','
        + coloring.color.green + ','
        + coloring.color.blue
    colorId += startColor
    start.color = RGB_START + startColor + RGB_END

    // Separate the individual parts in the ID to guarantee uniqueness.
    colorId += '$'
    // Do the same for the end color.
    if (coloring.targetAlpha !== undefined && coloring.targetAlpha !== 255) {
        end.opacity = (coloring.targetAlpha / 255).toString()
    }
    let endColor = coloring.targetColor.red + ','
        + coloring.targetColor.green + ','
        + coloring.targetColor.blue
    colorId += endColor
    end.color = RGB_START + endColor + RGB_END

    // Add the angle of the gradient to the ID.
    if (coloring.gradientAngle !== 0) {
        angle = coloring.gradientAngle
        colorId += '$' + angle
    }

    // Remember the color definition to be added at the top level of the SVG, if the same color has not been defined previously.
    if (!context.renderingDefs.has(colorId)) {
        context.renderingDefs.set(colorId, colorDefinition(colorId, start, end, angle))
    }
    // Return the reference of the above defined ID to be put in the fill or stroke attribute of any SVG element.
    return {
        color: URL_START + colorId + URL_END
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
 */
export function getSvgLineStyles(styles: KStyles): LineStyles {
    const lineWidth = styles.kLineWidth === undefined ? DEFAULT_LINE_WIDTH : styles.kLineWidth.lineWidth
    const lineCap = styles.kLineCap === undefined ? undefined : lineCapText(styles.kLineCap)
    const lineJoin = styles.kLineJoin === undefined ? undefined : lineJoinText(styles.kLineJoin)
    const miterLimit = styles.kLineJoin.miterLimit === undefined ? DEFAULT_MITER_LIMIT : styles.kLineJoin.miterLimit
    return {
        lineWidth: lineWidth === DEFAULT_LINE_WIDTH ? undefined : lineWidth + 'px',
        lineCap: lineCap === DEFAULT_LINE_CAP_SVG ? undefined : lineCap,
        lineJoin: lineJoin === DEFAULT_LINE_JOIN_SVG ? undefined : lineJoin,
        dashArray: styles.kLineStyle === undefined ? undefined : lineStyleText(styles.kLineStyle, lineWidth),
        // Note: Here the miter limit value is also omitted if the value equals KGraph's default value of 10, because otherwise the resulting SVG would
        // always contain the miterLimit style to be set to 10, even though it is not intended by the creator of the KGraph model and it would not
        // even make any difference in the rendering. Here I cannot distinguish if the model creator really wanted to have the specific miter limit of 10
        // or if he just does not care. As the first case seems rare, I prefer a cleaner resulting svg here.
        miterLimit: lineJoin !== 'miter' || miterLimit === DEFAULT_MITER_LIMIT_SVG || miterLimit === DEFAULT_MITER_LIMIT ? undefined : miterLimit
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
        dominantBaseline: verticalAlignmentText(styles.kVerticalAlignment.verticalAlignment === undefined ?
            DEFAULT_VERTICAL_ALIGNMENT : styles.kVerticalAlignment.verticalAlignment),
        fontFamily: styles.kFontName === undefined ? undefined : camelToKebab(styles.kFontName.name),
        // Convert pt to px here with a default value of 96 dpi(px/in) and 72pt/in, making this a conversion from in to px.
        fontSize: styles.kFontSize === undefined ? undefined : styles.kFontSize.size * 96 / 72 + 'px',
        fontStyle: styles.kFontItalic.italic === DEFAULT_FONT_ITALIC ? undefined : 'italic',
        fontWeight: styles.kFontBold.bold === DEFAULT_FONT_BOLD ? undefined : 'bold',
        textDecorationLine: styles.kTextUnderline === undefined ? undefined : 'underline',
        textDecorationStyle: styles.kTextUnderline === undefined ? undefined : textDecorationStyleText(styles.kTextUnderline as KTextUnderline)
        // textDecorationColor: styles.kTextUnderline === undefined ? undefined : textDecorationColor(styles.kTextUnderline as KTextUnderline),
        // TODO: textDecorationColorDefinition:
    }
}

/**
 * Data class holding the SVG attributes for a single color
 */
export interface ColorStyle {
    color: string,
    opacity: string | undefined
}

/**
 * Data class holding the different SVG attributes for color related styles.
 */
export interface ColorStyles {
    foreground: ColorStyle,
    background: ColorStyle,
    opacity: number
}

/**
 * Data class holding the different SVG attributes for line related styles.
 */
export interface LineStyles {
    lineWidth: string | undefined,
    lineCap: 'butt' | 'round' | 'square' | undefined,
    lineJoin: 'bevel' | 'miter' | 'round' | undefined,
    dashArray: string | undefined,
    miterLimit: number | undefined
}

/**
 * Data class holding the different SVG attributes for text related styles.
 */
export interface TextStyles {
    dominantBaseline: string | undefined,
    fontFamily: string | undefined,
    fontSize: string | undefined,
    fontStyle: string | undefined,
    fontWeight: string | undefined,
    textDecorationLine: string | undefined,
    textDecorationStyle: string | undefined,
}