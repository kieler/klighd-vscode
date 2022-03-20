
import { NodeMargin, NodeScalingFactor } from './options/render-options-registry';
import { KPolyline, K_POLYGON, K_POLYLINE, K_ROUNDED_BENDS_POLYLINE, K_SPLINE, SKEdge, SKNode } from './skgraph-models';
import { SKGraphModelRenderer } from './skgraph-model-renderer';
import { PointToPointLine } from 'sprotty'
import { Bounds, Dimension, Point } from 'sprotty-protocol'
import { BoundsAndTransformation } from './views-common';

/**
 * A class for some helper methods used calculate the scale to be used for graphs elements and
 * for actually scaling them.
 */
export class ScalingUtil {

    private constructor() {
        // private constructor as this class should not be instantiated
    }

    /**
     * @param node the bounds of the node to scale
     * @param parent the dimensions of the parent of the node to scale
     * @param margin the margin node shall retain to parent
     * @returns the maximum scale at which node retains the margin to parent
     */
    public static maxParentScale(node: Bounds, parent: Dimension, margin: number): number {
        // the maximum scale that keeps the node in bounds height wise
        const maxHeightScale = (parent.height - 2 * margin) / node.height
        // the maximum scale that keeps the node in bounds width wise
        const maxWidthScale = (parent.width - 2 * margin) / node.width

        return Math.min(maxHeightScale, maxWidthScale)
    }

    /** For some elements a and b determine the maximum scale to which they can be scaled without violating the margin in one dimension
     *  this is used by maxSiblingScaling to determine the max scale for width and height separately
     *
     * @param offset_a the offset of a
     * @param length_a the length of a
     * @param offset_b the offset of b
     * @param length_b the length of b
     * @param available the available space for both a and b
     * @param margin the margin to preserve between a and b
     * @returns the calculated maximum scale
     */
    private static maxSiblingScaleDimension(offset_a: number, length_a: number, offset_b: number, length_b: number, available: number, margin: number): number {

        // There are three scenarios that can happen
        // either a is before b,
        // b is before a,
        // or a and b overlap
        //
        // In the last case we can just use one as we never want a scale below one and we take the maximum of both dimensions outside this function
        // In the other two cases we need to solve one of the following two equations for scale
        // result_a.offset = result_b.offset + result_b.length + margin
        // result_b.offset = result_a.offset + result_a.length + margin
        // both with
        // result_a = scaleDimension(offset_a, length_a, available, scale)
        // result_b = scaleDimension(offset_b, length_b, available, scale)
        //
        // result_a and result_b should only be positive and larger than one if that is the case present
        // below we have solve both equations and take the maximum of the solution to all three cases as the result.

        const fa = (offset_a * length_a) / (available - length_a)
        const fb = (offset_b * length_b) / (available - length_b)

        const numerator = offset_a + fa - offset_b - fb

        const result_1 = (numerator - margin) / (fa - fb + length_b)
        const result_2 = (-numerator - margin) / (fb - fa + length_a)

        return Math.max(result_1, result_2, 1)
    }


    /**
     * Calculate the maximum scale at which node and sibling retain the given margin between them
     * @param node the bounds of the node to scale
     * @param parent the dimensions of the parent of the node to scale
     * @param sibling a sibling of the node to scale
     * @param margin the margin node and sibling shall retain when both scaled by the result
     * @returns the maximum scale at which node and sibling retain margin between them
     */
    public static maxSiblingScale(node: Bounds, parent: Dimension, sibling: Bounds, margin: number): number {

        // calculate the scale for each dimension at which we reach our sibling
        const result_1 = ScalingUtil.maxSiblingScaleDimension(node.x, node.width, sibling.x, sibling.width, parent.width, margin)
        const result_2 = ScalingUtil.maxSiblingScaleDimension(node.y, node.height, sibling.y, sibling.height, parent.height, margin)

        // take the max as that which ever is further is relevant for bounding us, but should be at least 1
        return Math.max(result_1, result_2, 1)
    }
    /**
     * Scale bounds in the specified dimensions by the specified scale
     * @param originalBounds the bounds to scale
     * @param availableSpace the space available to scale the bounds
     * @param scale the scale factor by which to scale
     * @returns the scaled bounds
     */
    private static calculateScaledBounds(originalBounds: Bounds, availableSpace: Dimension, scale: number): Bounds {
        const originalWidth = originalBounds.width
        const originalHeight = originalBounds.height
        const originalX = originalBounds.x
        const originalY = originalBounds.y

        // Calculate the new x offset and width:
        const { length: newWidth, offset: newX } = ScalingUtil.scaleDimension(originalX, originalWidth, availableSpace.width, scale)

        // Same for y offset and height
        const { length: newHeight, offset: newY } = ScalingUtil.scaleDimension(originalY, originalHeight, availableSpace.height, scale)

        return { x: newX, y: newY, width: newWidth, height: newHeight }
    }

    /** Scale along one axis taking up space before and after the element at an equal ratio
     *
     * @param offset the start of the element in the scaled dimension
     * @param length the length of the element in the scaled dimension
     * @param available the space available in the scaled dimension
     * @param scale the factor by which to scale the element
     * @returns the scaled length and adjusted offset
     */
    private static scaleDimension(offset: number, length: number, available: number, scale: number): { offset: number, length: number } {
        // calculate the scaled length
        const newLength = length * scale;
        // space before the element to be scaped
        const prefix = offset
        // space after the element to be scaled
        const postfix = available - offset - length
        // new offset after taking space from before and after the scaled element at an equal ratio
        const newOffset = offset - prefix * (newLength - length) / (prefix + postfix)
        return { offset: newOffset, length: newLength }
    }

    /**
     * Calculate where a point ends up after scaling some bound
     * @param originalBounds The original bounds before scaling
     * @param newBounds The bounds after scaling
     * @param originalPoint The point before scaling
     * @returns The point after scaling
     */
    public static calculateScaledPoint(originalBounds: Bounds, newBounds: Bounds, originalPoint: Point): Point {

        let newX
        let newY

        if (originalBounds.width == 0 || newBounds.width == 0) {
            newX = originalPoint.x - originalBounds.x + newBounds.x
        } else {
            const relativeX = originalBounds.width == 0 ? 0 : (originalPoint.x - originalBounds.x) / originalBounds.width
            newX = newBounds.x + relativeX * newBounds.width
        }

        if (originalBounds.height == 0 || newBounds.height == 0) {
            newY = originalPoint.y - originalBounds.y + newBounds.y
        } else {
            const relativeY = originalBounds.height == 0 ? 0 : (originalPoint.y - originalBounds.y) / originalBounds.height
            newY = newBounds.y + relativeY * newBounds.height
        }

        return { x: newX, y: newY }
    }

    static calculateUpscale(effectiveScale: number, maxScale: number, childBounds: Bounds, parentBounds: Dimension, margin: number, siblings: Bounds[] = []): number {
        // we want that the effectiveScale * desiredScale = maxScale
        // so that the we effectively up scale to maxScale
        const desiredScale = maxScale / effectiveScale;

        if (desiredScale < 1) {
            return 1;
        }

        // the maximum scale at which the child still fits into the parent
        const parentScaling = ScalingUtil.maxParentScale(childBounds, parentBounds, margin)

        let preferredScale = Math.min(desiredScale, parentScaling)

        for (const sibling of siblings) {
            if (preferredScale <= 1) {
                return 1
            }
            const siblingScaling = ScalingUtil.maxSiblingScale(childBounds, parentBounds, sibling, margin)
            preferredScale = Math.min(preferredScale, siblingScaling)
        }

        // we never want to scale down
        return Math.max(1, preferredScale)
    }

    /**
     * Calculate upscaled bounds for a graph element
     *
     * @param effectiveScale the effective scale at the position the element will be rendered
     * @param maxScale the maximum factor to upscale the element by
     * @param childBounds the bounds of the element to scale
     * @param parentBounds the bounds of the parent of the element to scale
     * @param margin the margin to keep between the element and its parent as well as it and its siblings,
     *   it is assumed that the element does not violate this margin at normal scale (1)
     * @param siblings the bounds of the elements siblings that should be taken into account while scaling
     * @returns the upscaled local bounds and local scale
     */
    public static upscaleBounds(effectiveScale: number, maxScale: number, childBounds: Bounds, parentBounds: Dimension, margin: number, siblings: Bounds[] = []): { bounds: Bounds, scale: number } {

        const scalingFactor = ScalingUtil.calculateUpscale(effectiveScale, maxScale, childBounds, parentBounds, margin, siblings)
        const newBounds = ScalingUtil.calculateScaledBounds(childBounds, parentBounds, scalingFactor)

        return { bounds: newBounds, scale: scalingFactor }
    }

    /**
     * Determine the intersections between the bounding box of bounds and the line
     * @param bounds the bounding box to intersect
     * @param line the line to intersect
     * @returns the intersection points (0 - 4), might contain duplicates when going through a corner
     */
    public static intersections(bounds: Bounds, line: PointToPointLine): Point[] {

        const tl = bounds as Point
        const tr = Point.add(bounds, { x: 0, y: bounds.height })
        const bl = Point.add(bounds, { x: bounds.width, y: 0 })
        const br = Point.add(bounds, { x: bounds.width, y: bounds.height })

        const top = new PointToPointLine(tl, tr)
        const bottom = new PointToPointLine(bl, br)
        const left = new PointToPointLine(tl, bl)
        const right = new PointToPointLine(tr, br)

        return [line.intersection(top), line.intersection(bottom), line.intersection(left), line.intersection(right)].filter(p => p !== undefined).map(p => p as Point)
    }

    /**
     *
     * @param point the point to calculate the distance to
     * @returns Function that can be used to sort by distance to point
     */
    public static sortByDist(point: Point): (a: Point, b: Point) => number {
        return (a: Point, b: Point) => {
            const a_dist = Point.euclideanDistance(a, point)
            const b_dist = Point.euclideanDistance(b, point)
            if (a_dist > b_dist) {
                return 1
            } else if (b_dist > a_dist) {
                return -1
            } else {
                return 0
            }
        }
    }

    /**
     * For lines calculate new line points to account for node scaling
     * For polygons (arrow head) adjusts position to new line end point and perform scaling
     */
    public static performLineScaling(rendering: KPolyline,
        edge: SKEdge,
        parent: SKNode,
        source: SKNode,
        target: SKNode,
        boundsAndTransformation: BoundsAndTransformation,
        context: SKGraphModelRenderer,
        gAttrs: { transform?: string | undefined },
        points: Point[]
    ): Point[] {
        const sourceScaled = source.calculateScaledBounds(context);
        const targetScaled = target.calculateScaledBounds(context);
        const parentScaled = parent.calculateScaledBounds(context);

        const start = points[0]
        const end = points[points.length - 1]

        const scaledStart = ScalingUtil.calculateScaledPoint(source.bounds, sourceScaled.relativeBounds, start)
        const scaledEnd = ScalingUtil.calculateScaledPoint(target.bounds, targetScaled.relativeBounds, end)

        let maxCoordPerPoint = 1
        switch (rendering.type) {
            case K_SPLINE:
                maxCoordPerPoint = 3
            // fallthrough
            case K_ROUNDED_BENDS_POLYLINE:
            case K_POLYLINE: {

                const newPoints: Point[] = []

                let i = 1

                // skip points in the start node
                out: while (i < points.length) {
                    const remainingPoints = points.length - i

                    const z = Math.min(maxCoordPerPoint, remainingPoints)

                    for (let j = i; j < i + z; j++) {
                        if (Bounds.includes(sourceScaled.relativeBounds, points[j])) {
                            i += z
                            continue out;
                        }
                    }
                    break;
                }

                // determine new start point
                const startChoice = calculateEndPoint(i, newPoints, true) ?? scaledStart;

                newPoints.push(startChoice)


                // keep points not in end node
                while (i < points.length) {
                    const remainingPoints = points.length - i

                    const z = Math.min(maxCoordPerPoint, remainingPoints)

                    const p = points[i + z - 1]

                    if (
                        !Bounds.includes(targetScaled.relativeBounds, p)
                    ) {
                        for (let j = 0; j < z; j++) {
                            newPoints.push(points[i])
                            i++
                        }
                    } else {
                        break
                    }
                }

                // determine new end point

                const endChoice = calculateEndPoint(i, newPoints, false) ?? scaledEnd;

                newPoints.push(endChoice)

                edge.movedEndsBy = { start: Point.subtract(startChoice, points[0]), end: Point.subtract(endChoice, points[points.length - 1]) }
                return newPoints;
            }
            case K_POLYGON: {
                // this is reached for the arrow heads of edges
                // it adjusts the arrow head to match the changed edge position and also scales the arrow head similar to how nodes are scaled
                if (edge.movedEndsBy && edge.routingPoints.length > 0) {
                    let newPoint = boundsAndTransformation.bounds as Point

                    if (Bounds.includes(boundsAndTransformation.bounds, edge.routingPoints[0])) {
                        newPoint = Point.add(edge.movedEndsBy.start, boundsAndTransformation.bounds)
                    } else if (Bounds.includes(boundsAndTransformation.bounds, edge.routingPoints[edge.routingPoints.length - 1])) {
                        newPoint = Point.add(edge.movedEndsBy.end, boundsAndTransformation.bounds)
                    }

                    const targetScale = context.renderOptionsRegistry.getValueOrDefault(NodeScalingFactor)
                    const margin = context.renderOptionsRegistry.getValueOrDefault(NodeMargin)

                    const parentScale = ScalingUtil.maxParentScale(boundsAndTransformation.bounds, parent.bounds, margin)

                    const desiredScale = targetScale / (parentScaled.effectiveChildScale * context.viewport.zoom)
                    const preferredScale = Math.min(desiredScale, parentScale)

                    const scale = Math.max(preferredScale, 1)

                    // translate arrow head to origin, then scale, then translate to new position
                    gAttrs.transform = "translate(" + newPoint.x + "," + newPoint.y + ") scale(" + scale + ") translate(" + -boundsAndTransformation.bounds.x + "," + -boundsAndTransformation.bounds.y + ") " + (gAttrs.transform ?? "")
                }
                break
            }
            default:
                console.error("Unexpected Line Type: ", rendering.type)
        }
        return points

        function calculateEndPoint(i: number, newPoints: any[], start: boolean): Point | void {
            if (i < points.length) {

                let choice;

                const remainingPoints = points.length - i;
                const z = Math.min(maxCoordPerPoint, remainingPoints);

                const prev = points[i - 1];
                const next = points[i + z - 1];

                const edge = new PointToPointLine(prev, next);

                const target = (start ? sourceScaled : targetScaled).relativeBounds

                const intersections = ScalingUtil.intersections(target, edge);

                intersections.sort(ScalingUtil.sortByDist(start ? next : prev));

                if (intersections.length > 0) {
                    choice = intersections[0];
                }

                // keep the control points of the current point if they are not in the target
                if (!start)
                    if (z >= 2 && !Bounds.includes(target, points[i])) {
                        newPoints.push(points[i]);
                        if (z == 3 && !Bounds.includes(target, points[i + 1])) {
                            newPoints.push(points[i + 1]);
                        }
                    }

                return choice;
            }
        }

    }
}
