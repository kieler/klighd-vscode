import { Bounds, Dimension, Point} from 'sprotty-protocol'
import { PointToPointLine } from 'sprotty'

/**
 * A class for some helper methods used calculate the scale to be used for graphs elements and
 * for actually scaling them.
 */
export class ScalingUtil {

    private constructor(){
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
        const maxWidthScale  = (parent.width  - 2 * margin) / node.width

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
    private static inverseScaleDimension(offset_a: number, length_a: number, offset_b: number, length_b: number, available: number, margin: number): number {

        // we want to find positive scale so that the following equations hold
        // result_a = scaleDimension(offset_a, length_a, available, scale)
        // result_b = scaleDimension(offset_b, length_b, available, scale)
        // result_a.offset = result_b.offset + result_b.length + margin
        // || result_b.offset = result_a.offset + result_a.length + margin

        const fa = (offset_a * length_a) / (available - length_a)
        const fb = (offset_b * length_b) / (available - length_b)

        const numerator = offset_a + fa - offset_b - fb

        const result_1 = ( numerator - margin) / (fa - fb + length_b)
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
    public static maxSiblingScale(node: Bounds, parent: Dimension, sibling: Bounds, margin: number) : number {

        // calculate the scale for each dimension at which we reach our sibling
        const result_1 = ScalingUtil.inverseScaleDimension(node.x, node.width, sibling.x, sibling.width, parent.width, margin)
        const result_2 = ScalingUtil.inverseScaleDimension(node.y, node.height, sibling.y, sibling.height, parent.height, margin)

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
    private static calculateScaledBounds(originalBounds: Bounds, availableSpace: Dimension, scale: number) : Bounds {
        const originalWidth = originalBounds.width
        const originalHeight = originalBounds.height
        const originalX = originalBounds.x
        const originalY = originalBounds.y

        // Calculate the new x offset and width:
        const {length: newWidth, offset: newX} = ScalingUtil.scaleDimension(originalX, originalWidth, availableSpace.width, scale)

        // Same for y offset and height
        const {length: newHeight, offset: newY} = ScalingUtil.scaleDimension(originalY, originalHeight, availableSpace.height, scale)

        return {x: newX, y : newY, width: newWidth, height: newHeight}
    }

    private static scaleDimension(offset: number, length: number, available: number, scale: number) : {offset:number, length:number}{
        const newLength = length * scale;
        const prefix = offset
        const postfix = available - offset - length
        const newOffset = offset - prefix * (newLength - length) / (prefix + postfix)
        return {offset: newOffset, length: newLength}
    }

    /**
     * Calculate where a point ends up after scaling some bound
     * @param originalBounds The original bounds before scaling
     * @param newBounds The bounds after scaling
     * @param originalPoint The point before scaling
     * @returns The point after scaling
     */
    public static calculateScaledPoint(originalBounds: Bounds, newBounds: Bounds, originalPoint: Point) : Point {

        let newX
        let newY

        if (originalBounds.width == 0 || newBounds.width == 0) {
            newX = originalPoint.x - originalBounds.x + newBounds.x
        } else {
            const relativeX =  originalBounds.width == 0 ? 0 : (originalPoint.x - originalBounds.x) / originalBounds.width
            newX = newBounds.x + relativeX * newBounds.width
        }

        if (originalBounds.height == 0 || newBounds.height == 0) {
            newY = originalPoint.y - originalBounds.y + newBounds.y
        } else {
            const relativeY =  originalBounds.height == 0 ? 0 : (originalPoint.y - originalBounds.y) / originalBounds.height
            newY =  newBounds.y + relativeY * newBounds.height
        }

        return {x: newX, y: newY}
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
    public static upscaleBounds(effectiveScale: number, maxScale: number, childBounds: Bounds, parentBounds: Dimension, margin:number,  siblings: Bounds[] = []) : {bounds: Bounds, scale: number} {

        // we want that the effectiveScale * desiredScale = maxScale
        // so that the we effectively up scale to maxScale
        const desiredScale = maxScale / effectiveScale;

        // the maximum scale at which the child still fits into the parent
        const parentScaling = ScalingUtil.maxParentScale(childBounds, parentBounds, margin)

        let preferredScale = Math.min(desiredScale, parentScaling)

        for (const sibling of siblings) {
            if (preferredScale <= 1) {
                break
            }
            const siblingScaling = ScalingUtil.maxSiblingScale(childBounds, parentBounds, sibling, margin)
            preferredScale = Math.min(preferredScale, siblingScaling)
        }

      // we never want to shrink, should only be relevant if our desired scale is less than 1
      const scalingFactor = Math.max(1, preferredScale)

      const newBounds = ScalingUtil.calculateScaledBounds(childBounds, parentBounds, scalingFactor)

      return {bounds:newBounds, scale: scalingFactor}
    }

    /**
     * Determine the intersections between the bounding box of bounds and the line
     * @param bounds the bounding box to intersect
     * @param line the line to intersect
     * @returns the intersection points (0 - 4), might contain duplicates when going thru a corner
     */
    public static intersections(bounds: Bounds, line: PointToPointLine ) : Point[] {

        const  tl = bounds as Point
        const  tr = Point.add(bounds, {x: 0           , y: bounds.height})
        const  bl = Point.add(bounds, {x: bounds.width, y: 0            })
        const  br = Point.add(bounds, {x: bounds.width, y: bounds.height})

        const top    = new PointToPointLine(tl, tr)
        const bottom = new PointToPointLine(bl, br)
        const left   = new PointToPointLine(tl, bl)
        const right  = new PointToPointLine(tr, br)

        return [line.intersection(top), line.intersection(bottom), line.intersection(left), line.intersection(right)].filter(p => p !== undefined).map(p => p as Point)
    }

    /**
     *
     * @param point the point to calculate the distance to
     * @returns Function that can be used to sort by distance to point
     */
    public static sort_by_dist(point: Point) : (a:Point, b:Point)=>number {
        return (a: Point,b: Point) => {
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
}
