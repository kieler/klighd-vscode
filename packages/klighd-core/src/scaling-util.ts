import { Bounds, Dimension } from 'sprotty-protocol'


/**
 * @param node the bounds of the node to scale
 * @param parent the dimensions of the parent of the node to scale
 * @param margin the margin node shall retain to parent
 * @returns the maximum scale at which node retains the margin to parent
 */
export function maxParentScale(node: Bounds, parent: Dimension, margin: number): number {
    // the maximum scale that keeps the node in bounds height wise
    const maxHeightScale = (parent.height - 2 * margin) / node.height
    // the maximum scale that keeps the node in bounds width wise
    const maxWidthScale  = (parent.width  - 2 * margin) / node.width

    return Math.min(maxHeightScale, maxWidthScale)
}


function inverseScaleDimension(offset_a: number, length_a: number, offset_b: number, length_b: number, available: number, margin: number): number {
    // we want to find positive scale so that
    // result_a = scaleDimension(offset_a, length_a, available, scale)
    // result_b = scaleDimension(offset_b, length_b, available, scale)
    // result_a.offset = result_b.offset + result_b.length
    // || result_b.offset = result_a.offset + result_a.length

    const fa = (offset_a * length_a) / (available - length_a)
    const fb = (offset_b * length_b) / (available - length_b)

    const numerator = offset_a + fa - offset_b - fb

    const result_1 = ( numerator - margin) / (fa - fb + length_b)
    const result_2 = (-numerator - margin) / (fb - fa + length_a)

    // the scale should be at least one and at most one of the results should be positive
    return Math.max(result_1, result_2, 1)
}

/**
 * Calculate the maximum scale at which node and sibling retain the given margin between them
 * @param node the bounds of node to scale
 * @param parent the dimensions of the parent of the node to scale
 * @param sibling a sibling og the nod to scale
 * @param margin the margin node and sibling shall retain when both scaled by the result
 * @returns the maximum scale at which node and sibling retain margin between them
 */
export function maxSiblingScale(node: Bounds, parent:Dimension, sibling: Bounds, margin: number) : number {

    // calculate the scale for each dimension at which we reach our sibling
    const result_1 = inverseScaleDimension(node.x, node.width, sibling.x, sibling.width, parent.width, margin)
    const result_2 = inverseScaleDimension(node.y, node.height, sibling.y, sibling.height, parent.height, margin)

    // take the max as that which ever is further is relevant for bounding us, but should be at least 1
    return Math.max(result_1, result_2, 1)
}


/**
 * Scale bounds in the specified dimensions by the specified scale
 * @param originalBounds the bounds to scale
 * @param availableSpace the space available to scale the bounds
 * @param scale the scale by which to scale
 * @returns the scaled bounds
 */
export function calculateScaledBounds(originalBounds: Bounds, availableSpace: Dimension, scale: number) : Bounds {
    const originalWidth = originalBounds.width
    const originalHeight = originalBounds.height
    const originalX = originalBounds.x
    const originalY = originalBounds.y

    // Calculate the new x and y indentation:
    // width required of scaled rendering
    const {length: newWidth, offset: newX} = scaleDimension(originalX, originalWidth, availableSpace.width, scale)

    // Same for y axis, just with switched dimensional variables.
    const {length: newHeight, offset: newY} = scaleDimension(originalY, originalHeight, availableSpace.height, scale)
    return {x: newX, y : newY, width: newWidth, height: newHeight}
}

export function scaleDimension(offset: number, length: number, available: number, scale: number) : {offset:number, length:number}{
    const newLength = length * scale;
    const prefix = offset
    const postfix = available - offset - length
    const newOffset = offset - prefix * (newLength - length) / (prefix + postfix)
    return {offset: newOffset, length: newLength}
}

export function upscaleBounds(effectiveScale: number, maxScale: number, childBounds: Bounds, parentBounds: Dimension, margin:number,  siblings: Bounds[] = []) : {bounds: Bounds, scale: number} {

  // we want that the effectiveScale * desiredScale = maxScale
  // so that the we effectively up scale to maxScale
  const desiredScale = maxScale / effectiveScale;

  // the maximum scale at which the child still fits into the parent
  const parentScaling = maxParentScale(childBounds, parentBounds, margin)

  // some maximum scale at which the child does not interfere with its siblings
  const siblingScaling = siblings.map((siblingBounds) => maxSiblingScale(childBounds, parentBounds, siblingBounds, margin))

  // the most restrictive scale between our desired scale and the maximum imposed by the parent and siblings
  const preferredScale = Math.min(desiredScale, parentScaling, ...siblingScaling)

  // we never want to shrink, should only be relevant if our desired scale is less than 1
  const scalingFactor = Math.max(1, preferredScale)

  const newBounds = calculateScaledBounds(childBounds, parentBounds, scalingFactor)

  return {bounds:newBounds, scale: scalingFactor}
}
