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
import { KStyle, KBackground, KForeground, KFontBold, KFontItalic, KFontName, KFontSize, KInvisibility,
    KHorizontalAlignment, KLineCap, KLineJoin, KLineStyle, KLineWidth, KRotation, KShadow, KTextStrikeout,
    KTextUnderline, KVerticalAlignment, HorizontalAlignment, LineCap, LineJoin, LineStyle,
    VerticalAlignment, KStyleRef, KColoring, KGraphElement, KRendering, KText } from "./kgraph-models"
import { VNode } from "snabbdom/vnode"
import { shadowId, isSingleColor, fillSingleColor,
    shadowFilter, lineCapText, lineJoinText, lineStyleText, camelToKebab, verticalAlignmentText, textDecorationStyleText, KGraphRenderingContext } from "./views-common"

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
const RGBA_START = 'rgba('
const RGBA_END = ')'
const URL_START = 'url(#'
const URL_END = ')'

/**
 * calculates the renderings for all styles contained in styleList into an object
 * @param styleList The list of all styles that should have their rendering calculated
 * @param parent the containing node of these styles
 */
export function getKStyles(styleList: KStyle[], id: string): KStyles { // TODO: not all of these are implemented yet
    let styles = new KStyles
    if (styleList === undefined) {
        return styles
    }
    for (let style of styleList) {
        if (style.selection === false) { // TODO: check if element is selected and decide from there
            switch (style.type) {
                case K_COLORING: {
                    console.error('A style can not be a ' + style.type + ' by itself, it needs to be a subclass of it.')
                    break
                }
                case K_BACKGROUND: {
                    styles.kBackground = style as KBackground
                    break
                }
                case K_FOREGROUND: {
                    styles.kForeground = style as KForeground
                    break
                }
                case K_FONT_BOLD: {
                    styles.kFontBold = style as KFontBold
                    break
                }
                case K_FONT_ITALIC: {
                    styles.kFontItalic = style as KFontItalic
                    break
                }
                case K_FONT_NAME: {
                    styles.kFontName = style as KFontName // TODO: have a deeper look at svg fonts
                    break
                }
                case K_FONT_SIZE: {
                    styles.kFontSize = style as KFontSize
                    break
                }
                case K_HORIZONTAL_ALIGNMENT: {
                    styles.kHorizontalAlignment = style as KHorizontalAlignment
                    break
                }
                case K_INVISIBILITY: {
                    styles.kInvisibility = style as KInvisibility
                    break
                }
                case K_LINE_CAP: {
                    styles.kLineCap = style as KLineCap
                    break
                }
                case K_LINE_JOIN: {
                    styles.kLineJoin = style as KLineJoin
                    break
                }
                case K_LINE_STYLE: {
                    styles.kLineStyle = style as KLineStyle
                    break
                }
                case K_LINE_WIDTH: {
                    styles.kLineWidth = style as KLineWidth
                    break
                }
                case K_ROTATION: {
                    styles.kRotation = style as KRotation
                    break
                }
                case K_SHADOW: {
                    styles.kShadow = style as KShadow
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
                    break
                }
                case K_TEXT_UNDERLINE: {
                    styles.kTextUnderline = style as KTextUnderline
                    break
                }
                case K_VERTICAL_ALIGNMENT: {
                    styles.kVerticalAlignment = style as KVerticalAlignment
                    break
                }
                default: {
                    console.error('Unexpected Style found while rendering: ' + style.type)
                    break
                }
            }
        }
    }
    return styles
}

/**
 * Default values for most Styles, that are used if no style is given Default values taken from PNodeController.java
 */
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
export const DEFAULT_FILL = 'none'
export const DEFAULT_FOREGROUND = 'black'
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
    constructor() {
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
        }as KVerticalAlignment
    }
}

// ----------------------------- Functions for rendering different KStyles as VNodes in svg --------------------------------------------

export function definition(colorId: string, start: string, end: string, angle: number | undefined): VNode {
    const startColorStop = <stop
        offset = {0}
        style = {{
            'stop-color': start
        } as React.CSSProperties}
    />
    const endColorStop = <stop
        offset = {1}
        style = {{
            'stop-color': end
        } as React.CSSProperties}
    />
    let angleFloat = angle === undefined ? 0 : angle

    const gradientAttributes = {
        id: colorId,
        // If the gradient is not rotated, the attributes for rotation should not be added.
        ...(angleFloat === 0 ? {} : {gradientUnits : GRADIENT_UNIT_OBJECT_BOUNDING_BOX}),
        ...(angleFloat === 0 ? {} : {gradientTransform : GRADIENT_TRANSFORM_ROTATE_START + angle + GRADIENT_TRANSFORM_ROTATE_END})
    }
    return <linearGradient {...gradientAttributes}>
        {startColorStop}
        {endColorStop}
    </linearGradient>
}

export function getSvgShadowStyles(styles: KStyles, parent: KGraphElement, rendering: KRendering): ShadowStyles {
    return {
        filter: styles.kShadow === undefined ? DEFAULT_SHADOW : shadowFilter((parent as KGraphElement).id + rendering.id),
        definition: styles.kShadow === undefined ? DEFAULT_SHADOW_DEF : shadowDefinition(styles.kShadow, (parent as KGraphElement).id + rendering.id)
    }
}

export function getSvgColorStyles(styles: KStyles, parent: KGraphElement, rendering: KRendering, context: KGraphRenderingContext): ColorStyles {
    const foreground = getSvgColorStyle(styles.kForeground as KForeground, parent, rendering, context, true)
    const background = getSvgColorStyle(styles.kBackground as KBackground, parent, rendering, context, false)
    return {
        foreground: foreground === undefined ? DEFAULT_FOREGROUND : foreground,
        background: background === undefined ? DEFAULT_FILL       : background
    }
}


export function getSvgColorStyle(coloring: KColoring, parent: KGraphElement, rendering: KRendering, context: KGraphRenderingContext, isForeground: boolean): string | undefined {
    let colorId
    if (coloring === undefined) {
        return colorId
    }
    if (isSingleColor(coloring)) {
        return fillSingleColor(coloring)
    }
    colorId = ''
    let start
    let end
    let angle
    if (coloring.alpha === undefined || coloring.alpha === 255) {
        let startColors = coloring.color.red   + ','
                        + coloring.color.green + ','
                        + coloring.color.blue
        colorId += startColors
        start = RGB_START + startColors + RGB_END
    } else {
        let startColors = coloring.color.red + ','
                        + coloring.color.green + ','
                        + coloring.color.blue + ','
                        + coloring.alpha / 255
        colorId +=  startColors
        start = RGBA_START + startColors + RGBA_END
    }
    colorId += '$'
    if (coloring.targetAlpha === undefined || coloring.targetAlpha === 255) {
        let endColors = coloring.targetColor.red   + ','
                      + coloring.targetColor.green + ','
                      + coloring.targetColor.blue
        colorId += endColors
        end = RGB_START + endColors + RGB_END
    } else {
        let endColors = coloring.targetColor.red + ','
                      + coloring.targetColor.green + ','
                      + coloring.targetColor.blue + ','
                      + coloring.targetAlpha / 255
        colorId +=  endColors
        end = RGBA_START + endColors + RGBA_END
    }
    if (coloring.gradientAngle !== 0) {
        angle = coloring.gradientAngle
        colorId += '$' + angle
    }

    if (!context.colorDefs.has(colorId)) {
        context.colorDefs.set(colorId, definition(colorId, start, end, angle))
    }
    return URL_START + colorId + URL_END
}

export function getSvgInvisibilityStyles(styles: KStyles): InvisibilityStyles {
    return {
        opacity: styles.kInvisibility === undefined || styles.kInvisibility.invisible === false ? undefined : 0
    }
}

export function getSvgLineStyles(styles: KStyles, parent: KGraphElement, rendering: KRendering): LineStyles {
    const lineWidth = styles.kLineWidth === undefined ? DEFAULT_LINE_WIDTH : styles.kLineWidth.lineWidth
    const lineCap = styles.kLineCap === undefined ? undefined : lineCapText(styles.kLineCap)
    const lineJoin = styles.kLineJoin === undefined ? undefined : lineJoinText(styles.kLineJoin)
    const miterLimit = styles.kLineJoin.miterLimit === undefined ? DEFAULT_MITER_LIMIT : styles.kLineJoin.miterLimit
    return {
        lineWidth: lineWidth === DEFAULT_LINE_WIDTH ? undefined : lineWidth + 'px',
        lineCap: lineCap === DEFAULT_LINE_CAP_SVG ? undefined : lineCap,
        lineJoin: lineJoin === DEFAULT_LINE_JOIN_SVG ? undefined : lineJoin,
        lineStyle: styles.kLineStyle === undefined ? undefined : lineStyleText(styles.kLineStyle, lineWidth),
        // Note: Here the miter limit value is also omitted if the value equals KGraph's default value of 10, because otherwise the resulting SVG would
        // always contain the miterLimit style to be set to 10, even though it is not intended by the creator of the KGraph model and it would not
        // even make any difference in the rendering. Here I cannot distinguish if the model creator really wanted to have the specific miter limit of 10
        // or if he just does not care. As the first case seems rare, I prefer a cleaner resulting svg here.
        miterLimit: lineJoin !== 'miter' || miterLimit === DEFAULT_MITER_LIMIT_SVG || miterLimit === DEFAULT_MITER_LIMIT ? undefined : miterLimit
    }
}

export function getSvgTextStyles(styles: KStyles, parent: KGraphElement, rendering: KText): TextStyles {
    return {
        italic: styles.kFontItalic.italic === DEFAULT_FONT_ITALIC ? undefined : 'italic',
        bold: styles.kFontBold.bold === DEFAULT_FONT_BOLD ? undefined : 'bold',
        fontName: styles.kFontName === undefined ? undefined : camelToKebab(styles.kFontName.name),
        verticalAlignment: verticalAlignmentText(styles.kVerticalAlignment.verticalAlignment === undefined ?
            DEFAULT_VERTICAL_ALIGNMENT : styles.kVerticalAlignment.verticalAlignment),
        textDecorationLine: styles.kTextUnderline === undefined ? undefined : 'underline',
        textDecorationStyle: styles.kTextUnderline === undefined ? undefined : textDecorationStyleText(styles.kTextUnderline as KTextUnderline)
        // textDecorationColor: styles.kTextUnderline === undefined ? undefined : textDecorationColor(styles.kTextUnderline as KTextUnderline),
        // TODO: textDecorationColorDefinition:
    }
}

export interface ShadowStyles {
    filter: string | undefined,
    definition: VNode | undefined
}

export interface ColorStyles {
    foreground: string | undefined,
    background: string | undefined
}

export interface InvisibilityStyles {
    opacity: number | undefined
}

export interface LineStyles {
    lineWidth: string | undefined,
    lineCap: 'butt' | 'round' | 'square' | undefined,
    lineJoin: 'bevel' | 'miter' | 'round' | undefined,
    lineStyle: string | undefined,
    miterLimit: number | undefined
}

export interface TextStyles {
    italic: string | undefined,
    bold: string | undefined,
    fontName: string | undefined,
    verticalAlignment: string | undefined,
    textDecorationLine: string | undefined,
    textDecorationStyle: string | undefined,
}

export function shadowDefinition(style: KShadow, id: string): VNode {
    // stdDev of 1 looks closest to KIELER style shadows, but looks nicer with this blur
    const STD_DEV = 1
    const blurClip = 25
    return <defs>
        <filter
            id = {shadowId(id)}
            x = {`-${blurClip}%`}
            y = {`-${blurClip}%`}
            width = {`${100 + 2 * blurClip}%`}
            height = {`${100 + 2 * blurClip}%`}
        >
            <feDropShadow
                dx = {style.xOffset / 4}
                dy = {style.yOffset / 4}
                stdDeviation = {STD_DEV}
            />
        </filter>
    </defs>
}