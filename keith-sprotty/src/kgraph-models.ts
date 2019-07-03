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

import { Bounds, boundsFeature, Point, RectangularNode, RectangularPort, RGBColor, SEdge, selectFeature, SLabel, SParentElement } from 'sprotty/lib';

/**
 * This is the superclass of all elements of a graph such as nodes, edges, ports,
 * and labels. A graph element may contain an arbitrary number of additional
 * data instances.
 * Represents its java counterpart in KLighD.
 */
export interface KGraphElement extends SParentElement {
    /**
     * May contain a trace that points back to the server instance where this element was created.
     */
    trace?: string
    data: KGraphData[]
    /**
     * Additional field to remember, if this element's children have already been rendered.
     */
    areChildrenRendered: boolean
}

/**
 * Represents its java counterpart in KLighD.
 */
export class KNode extends RectangularNode implements KGraphElement {
    trace?: string
    data: KGraphData[]
    areChildrenRendered = false
    hasFeature(feature: symbol): boolean {
        return feature === selectFeature
    }
}

/**
 * Represents its java counterpart in KLighD.
 */
export class KPort extends RectangularPort implements KGraphElement {
    trace?: string
    data: KGraphData[]
    areChildrenRendered = false
    hasFeature(feature: symbol): boolean {
        return feature === selectFeature
    }
}

/**
 * Represents its java counterpart in KLighD.
 */
export class KLabel extends SLabel implements KGraphElement {
    trace?: string
    data: KGraphData[]
    areChildrenRendered = false
    hasFeature(feature: symbol): boolean {
        // The boundsFeature here is additionally needed because bounds of labels need to be
        // estimated during the estimateTextBounds action.
        return feature === selectFeature || feature === boundsFeature
    }
}

/**
 * Represents its java counterpart in KLighD.
 */
export class KEdge extends SEdge implements KGraphElement {
    trace?: string
    data: KGraphData[]
    junctionPoints: Point[]
    areChildrenRendered = false
    hasFeature(feature: symbol): boolean {
        return feature === selectFeature
    }
}

/**
 * This class can be extended to hold arbitrary additional data for
 * graph elements, such as layout or rendering information.
 * Represents its java counterpart in KLighD.
 */
export interface KGraphData {
    type: string
}

/**
 * Element to define styles without attaching them to a specific rendering.
 * Represents its java counterpart in KLighD.
 */
export interface KStyleHolder {
    id: string
    styles: KStyle[]
}

/**
 * Abstract class to define members of a shapeType.
 * Represents its java counterpart in KLighD.
 */
export interface KRendering extends KGraphData, KStyleHolder {
    actions: KAction[]
    // not in the original java model, but is included in messages to remove the need to call '[Grid]?PlacementUtil.evaluate[Grid|Area|Point]Placement'
    // and similar methods on client side for every rendering
    /**
     * The server pre-calculated bounds for this rendering.
     */
    calculatedBounds?: Bounds
    /**
     * The server pre-calculated decoration for this rendering.
     */
    calculatedDecoration?: Decoration
}

/**
 * Define a child area inside of a rendering to force children being placed inside the defined area.
 * Represents its java counterpart in KLighD.
 */
export interface KChildArea extends KRendering { }

/**
 * KRendering that can have Children.
 * Represents its java counterpart in KLighD.
 */
export interface KContainerRendering extends KRendering {
    children: KRendering[]
}

/**
 * Draws an arc. Needs the startingAngle of the arc (0° = rightmost vertical line) on an ellipse and the angle the arc should cover (counterclockwise on the same ellipse).
 * Represents its java counterpart in KLighD.
 */
export interface KArc extends KContainerRendering {
    startAngle: number
    arcAngle: number
    arcType: Arc
    test: Position
}

/**
 * Represents its java counterpart in KLighD.
 */
export interface KCustomRendering extends KContainerRendering {
    className: string
    bundleName: string
    figureObject: object
}

/**
 * Define an ellipse shape that fits inside the space defined (a) by the node it is attached to or (b) by the placementData that is attached to the rendering.
 * Represents its java counterpart in KLighD.
 */
export interface KEllipse extends KContainerRendering { }

/**
 * Use an image instead of defining the renderings completely by yourself.
 * Represents its java counterpart in KLighD.
 */
export interface KImage extends KContainerRendering {
    bundleName: string
    imagePath: string
    imageObject: object
    clipShape: KRendering
}

/**
 * Creates a polyline between two or more points.
 * Represents its java counterpart in KLighD.
 */
export interface KPolyline extends KContainerRendering {
    points: KPosition[]
    junctionPointRendering: KRendering
}

/**
 * Creates a polygon based on a list of points. The polygon is a closed figure (last point = first point) even when not defined explicitly.
 * Represents its java counterpart in KLighD.
 */
export interface KPolygon extends KPolyline { }

/**
 * A polyline with rounded corners at its bendpoints.
 * Represents its java counterpart in KLighD.
 */
export interface KRoundedBendsPolyline extends KPolyline {
    bendRadius: number
}

/**
 * Creates a rounded edge.
 * Represents its java counterpart in KLighD.
 */
export interface KSpline extends KPolyline { }

/**
 * Define a rectangle by adding the topLeft and bottomRight coordinates.
 * Represents its java counterpart in KLighD.
 */
export interface KRectangle extends KContainerRendering { }

/**
 * The rounded rectangle is used to create a rectangle with rounded corners. Corner width and height need to be passed in order to define the style of the corners.
 * Represents its java counterpart in KLighD.
 */
export interface KRoundedRectangle extends KContainerRendering {
    cornerWidth: number
    cornerHeight: number
}

/**
 * References an already defined rendering to make redefining unneccessary.
 * Represents its java counterpart in KLighD.
 */
export interface KRenderingRef extends KRendering {
    rendering: KRendering
    // not in the original java model, but is included in messages to remove the need to call 'PlacementUtil.estimateSize' on client side
    calculatedBoundsMap: Map<string, Bounds>
    calculatedDecorationMap: Map<string, number>
}

/**
 * Display text. Text can be positioned by adding Horizontal or VerticalAlignment and can be clipped if there is not enough space to display all of it without overlapping other
 * elements.
 * Represents its java counterpart in KLighD.
 */
export interface KText extends KRendering {
    text: string
    cursorSelectable: boolean
    editable: boolean
    // Not in the original model, but here to store the precalculated bounds this text alone takes.
    /**
     * The server pre-calculated bounds for this text.
     */
    calculatedTextBounds?: Bounds
}

/**
 * Instances of this class may be employed in @see KGraphElement for accommodating
 * @see KRendering that are shared by multiple other @see KGraphElement
 * and referenced by means of @see KRenderingRef .<br>
 * A @see KRenderingRef can only represent a KRendering that is listed in the library here.
 * Represents its java counterpart in KLighD.
 */
export interface KRenderingLibrary extends KGraphData {
    renderings: KStyleHolder[]
}

/**
 * Performs action (ID) on event (@see Trigger ).
 * Represents its java counterpart in KLighD.
 */
export interface KAction {
    actionId: string
    trigger: Trigger
    altPressed: boolean
    ctrlCmdPressed: boolean
    shiftPressed: boolean
}

/**
 * The literals mirror the constants java.awt.geom.Arc2D#OPEN, java.awt.geom.Arc2D#CHORD, and java.awt.geom.Arc2D#PIE.
 * This is to be leveraged in implementation, so be careful while modifying this enumeration.
 * Represents its java counterpart in KLighD.
 */
export enum Arc {
    /**
     * Plain arc without any closing line connection from end to beginning.
     */
    OPEN = 0,
    /**
     * Arc with a straight closing line connection from end to beginning via the arc's center.
     */
    CHORD = 1,
    /**
     * Arc with a straight closing line connection from end to beginning.
     */
    PIE = 2
}

/*
 * Used to set an absolute Position of a single point by defining x and y coordinates of this point relative to the parent.
 * The position can be set with absolute values or relative to the parent dimensions.
 * Represents its java counterpart in KLighD.
 */
export interface KPosition {
    x: KXPosition // TODO: has <?> in java
    y: KYPosition
}

/**
 * Define an x-position by setting absolute and relative position respective to a parent rendering.
 * Both parameters are always included in the calculation of the resulting position. See Subtypes for formula.
 * Can overlap the parent by setting negative values.
 * Represents its java counterpart in KLighD.
 */
export interface KXPosition {
    type: string
    absolute: number
    relative: number
}

/**
 * Defines a position starting at the leftmost point of the parent rendering.
 * pos = (L+absolute) + (R-L)*relative = (R-absolute) - widthOfParent*relative
 * Represents its java counterpart in KLighD.
 */
export interface KLeftPosition extends KXPosition { }

/**
 * Defines a position starting at the rightmost point R of the parent rendering.
 * pos = (R-absolute) - (R-L)*relative = (R-absolute) - widthOfParent*relative
 * Represents its java counterpart in KLighD.
 */
export interface KRightPosition extends KXPosition { }

/**
 * Define an y-position by setting absolute and relative position respective to a parent rendering.
 * Both parameters are always included in the calculation of the resulting position. See Subtypes for formula.
 * Can overlap the parent by setting negative values.
 * Represents its java counterpart in KLighD.
 */
export interface KYPosition {
    type: string
    absolute: number
    relative: number
}

/**
 * Defines a position starting at the highest point H of the parent rendering.
 * pos = (H+absolute) + (B-H)*relative
 * pos = (H+absolute) + heightOfParent*relative
 * Represents its java counterpart in KLighD.
 */
export interface KTopPosition extends KYPosition { }

/**
 * Defines a position starting at the bottom point B of the parent rendering.
 * pos = (B-absolute) - (B-H-absolute)*relative
 * pos = (B-absolute) - heightOfParent*relative
 * Represents its java counterpart in KLighD.
 */
export interface KBottomPosition extends KYPosition { }

/**
 * Represents its java counterpart in KLighD.
 */
export enum HorizontalAlignment {
    LEFT = 0,
    CENTER = 1,
    RIGHT = 2
}

/**
 * Represents its java counterpart in KLighD.
 */
export enum VerticalAlignment {
    TOP = 0,
    CENTER = 1,
    BOTTOM = 2
}

/**
 * Trigger presets to determine when to execute actions.
 * Represents its java counterpart in KLighD.
 */
export enum Trigger {
    /**
     * Fires on a left button's single click.
     * Note: Corresponding actions are not fired on the first click of a double, tripple, ... click.
     * Thus, triggering the actions is delayed by the system wide double click period for assuring the absence of subsequent clicks.
     * TODO: check if this is also true on the client!
     */
    SINGLECLICK = 0,
    /**
     * Fires on left button's double (and more) click(s).
     */
    DOUBLECLICK = 1,
    /**
     * Fires on left button's first click regardless if more clicks follow within the system wide double click period.
     */
    SINGLE_OR_MULTICLICK = 2,
    /**
     * Fires on middle button's single click.
     * Note: Corresponding actions are not fired on the first click of a double, tripple, ... click.
     * Thus, triggering the actions is delayed by the system wide double click period for assuring the absence of subsequent clicks.
     */
    MIDDLE_SINGLECLICK = 3,
    /**
     * Fires on middle button's double (and more) click(s).
     */
    MIDDLE_DOUBLECLICK = 4,
    /**
     * Fires on middle button's first click regardless if more clicks follow within the system wide double click period.
     */
    MIDDLE_SINGLE_OR_MULTICLICK = 5
}

/**
 * Adds additional StyleInformation to a rendering.
 * Can be set to propagate to children to make redefining styles unnecessary.
 * Represents its java counterpart in KLighD.
 */
export interface KStyle {
    type: string
    propagateToChildren: boolean
    modifierId: string
    selection: boolean
}

/**
 * Defines the alphaChannel and Color of an Object.
 * Represents its java counterpart in KLighD.
 */
export interface KColoring extends KStyle {
    color: RGBColor
    alpha: number
    targetColor: RGBColor
    targetAlpha: number
    gradientAngle: number
}

/**
 * Defines the Backgroundcolor and its alphaChannel of a rendering.
 * Represents its java counterpart in KLighD.
 */
export interface KBackground extends KColoring { }

/**
 * Defines the Foregroundcolor and its alphaChannel of a rendering.
 * Represents its java counterpart in KLighD.
 */
export interface KForeground extends KColoring { }

/**
 * FontStyle to dertermine whether to draw it bold or not.
 * Represents its java counterpart in KLighD.
 */
export interface KFontBold extends KStyle {
    bold: boolean
}

/**
 * FontStyle to dertermine whether to draw it italic or not.
 * Represents its java counterpart in KLighD.
 */
export interface KFontItalic extends KStyle {
    italic: boolean
}

/**
 * FontStyle to determine a desired font.
 * Represents its java counterpart in KLighD.
 */
export interface KFontName extends KStyle {
    name: string
}

/**
 * FontStyle to determine the size of the font.
 * Represents its java counterpart in KLighD.
 */
export interface KFontSize extends KStyle {
    size: number
    scaleWithZoom: boolean
}

/**
 * Represents its java counterpart in KLighD.
 */
export interface KHorizontalAlignment extends KStyle {
    horizontalAlignment: HorizontalAlignment
}

/**
 * Defines whether an object is visible or not.
 * Represents its java counterpart in KLighD.
 */
export interface KInvisibility extends KStyle {
    invisible: boolean
}

/**
 * Implements different line ending styles.
 * Represents its java counterpart in KLighD.
 */
export interface KLineCap extends KStyle {
    lineCap: LineCap
}

/**
 * Represents its java counterpart in KLighD.
 */
export interface KLineJoin extends KStyle {
    lineJoin: LineJoin
    miterLimit: number
}

/**
 * Defines the line style of a rendering by setting one of the available values of the LineStyle enumeration.
 * 'dashPattern' and 'dashOffset' are evaluated if and only if the literal 'CUSTOM' is chosen.
 * Represents its java counterpart in KLighD.
 */
export interface KLineStyle extends KStyle {
    lineStyle: LineStyle
    dashPattern: number[]
    dashOffset: number
}

/**
 * Specifies a lineWidth for a rendering.
 * Represents its java counterpart in KLighD.
 */
export interface KLineWidth extends KStyle {
    lineWidth: number
}

/**
 * Specifies the (clockwise) rotation of the corresponding KRendering.
 * Represents its java counterpart in KLighD.
 */
export interface KRotation extends KStyle {
    rotation: number
    rotationAnchor: KPosition
}

/**
 * Represents its java counterpart in KLighD.
 */
export interface KShadow extends KStyle {
    xOffset: number
    yOffset: number
    blur: number
    color: RGBColor
}

/**
 * Special KStyle allowing to reference the styles of another KRendering or KStyleHolder in general.
 * Represents its java counterpart in KLighD.
 */
export interface KStyleRef extends KStyle {
    styleHolder: KStyleHolder
    // referencedTypes: Class<KStyle>
}

/**
 * FontStyle to add a strikeout to an text element.
 * Represents its java counterpart in KLighD.
 */
export interface KTextStrikeout extends KStyle {
    struckOut: boolean
    color: RGBColor
}

/**
 * FontStyle to add an unterline to an text element.
 * Represents its java counterpart in KLighD.
 */
export interface KTextUnderline extends KStyle {
    underline: Underline
    color: RGBColor
}

/**
 * Represents its java counterpart in KLighD.
 */
export interface KVerticalAlignment extends KStyle {
    verticalAlignment: VerticalAlignment
}

/**
 * LineCapStyles analog to SWT LineCapStyles.
 * Represents its java counterpart in KLighD.
 */
export enum LineCap {
    CAP_FLAT = 0,
    CAP_ROUND = 1,
    CAP_SQUARE = 2
}

/**
 * Represents its java counterpart in KLighD.
 */
export enum LineJoin {
    JOIN_MITER = 0,
    JOIN_ROUND = 1,
    JOIN_BEVEL = 2
}

/**
 * LineStyles analog to SWT LineStyles.
 * Represents its java counterpart in KLighD.
 */
export enum LineStyle {
    SOLID = 0,
    DASH = 1,
    DOT = 2,
    DASHDOT = 3,
    DASHDOTDOT = 4,
    CUSTOM = 5
}

/**
 * The style of an underline. Analog to SWT Underline.
 * Represents its java counterpart in KLighD.
 */
export enum Underline {
    NONE = 0,
    SINGLE = 1,
    DOUBLE = 2,
    ERROR = 3,
    SQUIGGLE = 4,
    LINK = 5
}

/**
 * A data holder class for the result of evaluating a decorator.
 * Represents its java counterpart in KLighD.
 */
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

/**
 * Returns if the given parameter is a KRendering.
 * instanceof cannot be used, because every rendering received by the server is typed as KGraphData and the real type can only be inferred using the type attribute.
 * @param test The potential KRendering.
 */
export function isRendering(test: KGraphData): test is KRendering {
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

/**
 * Returns if the given parameter is a KContainerRendering.
 * @param test The potential KContainerRendering.
 */
export function isContainerRendering(test: KGraphData): test is KContainerRendering {
    const type = test.type
    return type === K_CONTAINER_RENDERING
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
}