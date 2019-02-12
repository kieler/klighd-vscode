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
import {
    selectFeature, RectangularNode, RectangularPort, SLabel, RGBColor, SEdge, SParentElement, Bounds, Point, boundsFeature
} from "sprotty/lib"

export interface KGraphElement extends SParentElement {
    trace: string | undefined
    data: KGraphData[]
    // additional field to remember, if this element's children have already been rendered.
    areChildrenRendered: boolean
}

export class KNode extends RectangularNode implements KGraphElement {
    trace: string | undefined
    data: KGraphData[]
    persistentEntries: PersistentEntry[]
    areChildrenRendered = false
    hasFeature(feature: symbol): boolean {
        return feature === selectFeature
    }
}

export class KPort extends RectangularPort implements KGraphElement {
    trace: string | undefined
    data: KGraphData[]
    areChildrenRendered = false
    hasFeature(feature: symbol): boolean {
        return feature === selectFeature
   }
}

export class KLabel extends SLabel implements KGraphElement {
    trace: string | undefined
    data: KGraphData[]
    areChildrenRendered = false
    hasFeature(feature: symbol): boolean {
        // The boundsFeature here is additionally needed because bounds of labels need to be
        // estimated during the estimateTextBounds action.
        return feature === selectFeature || feature === boundsFeature
    }
}

export class KEdge extends SEdge implements KGraphElement {
    trace: string | undefined
    data: KGraphData[]
    areChildrenRendered = false
    hasFeature(feature: symbol): boolean {
        return feature === selectFeature
    }
}

export interface KGraphData {
    persistentEntries: PersistentEntry[]
    type: string
}

export interface KStyleHolder {
    id: string
    styles: KStyle[]
}

export interface KIdentifier extends KGraphData {
    id: string
}

export interface KRendering extends KGraphData, KStyleHolder {
    placementData: KPlacementData
    actions: KAction[]
    // not in the original java model, but is included in messages to remove the need to call '[Grid]?PlacementUtil.evaluate[Grid|Area|Point]Placement'
    // and similar methods on client side for every rendering
    calculatedBounds: Bounds
    calculatedDecoration: Decoration
}

export interface KChildArea extends KRendering {}

export interface KContainerRendering extends KRendering {
    children: KRendering[]
    childPlacement: KPlacement
}

export interface KArc extends KContainerRendering {
    startAngle: number
    arcAngle: number
    arcType: Arc
    test: Position
}

export interface KCustomRendering extends KContainerRendering { // will this even work
    className: string
    bundleName: string
    figureObject: object
}

export interface KEllipse extends KContainerRendering {}

export interface KImage extends KContainerRendering { // TODO: will this even work
    bundleName: string
    imagePath: string
    imageObject: object
    clipShape: KRendering
}

export interface KPolyline extends KContainerRendering {
    points: KPosition[]
    junctionPointRendering: KRendering
}

export interface KPolygon extends KPolyline {}

export interface KRoundedBendsPolyline extends KPolyline {
    bendRadius: number
}

export interface KSpline extends KPolyline {}

export interface KRectangle extends KContainerRendering {}

export interface KRoundedRectangle extends KContainerRendering {
    cornerWidth: number
    cornerHeight: number
}

export interface KRenderingRef extends KRendering {
    rendering: KRendering
    // not in the original java model, but is included in messages to remove the need to call 'PlacementUtil.estimateSize' on client side
    calculatedBoundsMap: Map<string, Bounds>
    calculatedDecorationMap: Map<string, number>
}

export interface KText extends KRendering {
    text: string
    cursorSelectable: boolean
    editable: boolean
    // Not in the original model, but here to store the precalculated bounds this text alone takes.
    calculatedTextBounds: Bounds
}

export interface KRenderingLibrary extends KGraphData {
    renderings: KStyleHolder[]
}

export interface PersistentEntry {
    key: string
    value: string
}

export interface KPlacement {}

export interface KGridPlacement extends KPlacement {
    numColumns: number
    topLeft: KPosition
    bottomRight: KPosition
}

export interface KPlacementData {}

export interface KAreaPlacementData extends KPlacementData {
    topLeft: KPosition
    bottomRight: KPosition
}

export interface KGridPlacementData extends KAreaPlacementData {
    minCellWidth: number
    minCellHeight: number
    flexibleWidth: number
    flexibleHeight: number
}

export interface KDecoratorPlacementData extends KPlacementData {
    absolute: number
    xOffset: number
    yOffset: number
    rotateWithLine: boolean
    width: number
    height: number
    relative: number
}

export interface KPointPlacementData extends KPlacementData {
    referencePoint: KPosition
    horizontalAlignment: HorizontalAlignment
    verticalAlignment: VerticalAlignment
    horizontalMargin: number
    verticalMargin: number
    minWidth: number
    minHeight: number
}

export interface KAction {
    actionId: string
    trigger: Trigger
    altPressed: boolean
    ctrlCmdPressed: boolean
    shiftPressed: boolean
}

export enum Arc {
    OPEN = 0,
    CHORD = 1,
    PIE = 2
}

export interface KPosition {
    x: KXPosition // TODO: has <?> in java
    y: KYPosition
}

export enum HorizontalAlignment {
    LEFT = 0,
    CENTER = 1,
    RIGHT = 2
}

export enum VerticalAlignment {
    TOP = 0,
    CENTER = 1,
    BOTTOM = 2
}

export enum Trigger {
    SINGLECLICK = 0,
    DOUBLECLICK = 1,
    SINGLE_OR_MULTICLICK = 2,
    MIDDLE_SINGLECLICK = 3,
    MIDDLE_DOUBLECLICK = 4,
    MIDDLE_SINGLE_OR_MULTICLICK = 5
}

export interface KXPosition {
    type: string
    absolute: number
    relative: number
}

export interface KLeftPosition extends KXPosition {}

export interface KRightPosition extends KXPosition {}

export interface KYPosition {
    type: string
    absolute: number
    relative: number
}

export interface KTopPosition extends KYPosition {}

export interface KBottomPosition extends KYPosition {}

export interface KStyle {
    persistentEntries: PersistentEntry[]
    type: string
    propagateToChildren: boolean
    modifierId: string
    selection: boolean
}

export interface KColoring extends KStyle {
    color: RGBColor
    alpha: number
    targetColor: RGBColor
    targetAlpha: number
    gradientAngle: number
}

export interface KBackground extends KColoring {}

export interface KForeground extends KColoring {}

export interface KFontBold extends KStyle {
    bold: boolean
}

export interface KFontItalic extends KStyle {
    italic: boolean
}

export interface KFontName extends KStyle {
    name: string
}

export interface KFontSize extends KStyle {
    size: number
    scaleWithZoom: boolean
}

export interface KHorizontalAlignment extends KStyle {
    horizontalAlignment: HorizontalAlignment
}

export interface KInvisibility extends KStyle {
    invisible: boolean
}

export interface KLineCap extends KStyle {
    lineCap: LineCap
}

export interface KLineJoin extends KStyle {
    lineJoin: LineJoin
    miterLimit: number
}

export interface KLineStyle extends KStyle {
    lineStyle: LineStyle
    dashPattern: number[]
    dashOffset: number
}

export interface KLineWidth extends KStyle {
    lineWidth: number
}

export interface KRotation extends KStyle {
    rotation: number
    rotationAnchor: KPosition
}

export interface KShadow extends KStyle {
    xOffset: number
    yOffset: number
    blur: number
    color: RGBColor
}

export interface KStyleRef extends KStyle {
    styleHolder: KStyleHolder
    // referencedTypes: Class<KStyle>
}

export interface KTextStrikeout extends KStyle {
    struckOut: boolean
    color: RGBColor
}

export interface KTextUnderline extends KStyle {
    underline: Underline
    color: RGBColor
}

export interface KVerticalAlignment extends KStyle {
    verticalAlignment: VerticalAlignment
}

export enum LineCap {
    CAP_FLAT = 0,
    CAP_ROUND = 1,
    CAP_SQUARE = 2
}

export enum LineJoin {
    JOIN_MITER = 0,
    JOIN_ROUND = 1,
    JOIN_BEVEL = 2
}

export enum LineStyle {
    SOLID = 0,
    DASH = 1,
    DOT = 2,
    DASHDOT = 3,
    DASHDOTDOT = 4,
    CUSTOM = 5
}

export enum Underline {
    NONE = 0,
    SINGLE = 1,
    DOUBLE = 2,
    ERROR = 3,
    SQUIGGLE = 4,
    LINK = 5
}

export interface Decoration {
    origin: Point
    bounds: Bounds
    rotation: number
}


// ----------- Rendering Class names ----------- //
export const K_RENDERING_REF = 'KRenderingRefImpl'
export const K_RENDERING_LIBRARY = 'KRenderingLibraryImpl'
export const K_CHILD_AREA = 'KChildAreaImpl'
export const K_CONTAINER_RENDERING = 'KContainerRenderingImpl'
export const K_ARC = 'KArcImpl'
export const K_CUSTOM_RENDERING = 'KCustomRenderingImpl'
export const K_ELLIPSE = 'KEllipseImpl'
export const K_IMAGE = 'KImageImpl'
export const K_POLYLINE = 'KPolylineImpl'
export const K_POLYGON = 'KPolygonImpl'
export const K_ROUNDED_BENDS_POLYLINE = 'KRoundedBendsPolylineImpl'
export const K_SPLINE = 'KSplineImpl'
export const K_RECTANGLE = 'KRectangleImpl'
export const K_ROUNDED_RECTANGLE = 'KRoundedRectangleImpl'
export const K_TEXT = 'KTextImpl'

export function isRendering(test: KGraphData): boolean {
    const type = test.type
    return type === K_RENDERING_REF
    || type === K_CHILD_AREA
    || type === K_CONTAINER_RENDERING
    || type === K_ARC
    || type === K_CUSTOM_RENDERING
    || type === K_ELLIPSE
    || type === K_IMAGE
    || type === K_POLYLINE
    || type === K_POLYGON
    || type === K_ROUNDED_BENDS_POLYLINE
    || type === K_SPLINE
    || type === K_RECTANGLE
    || type === K_ROUNDED_RECTANGLE
    || type === K_TEXT
}