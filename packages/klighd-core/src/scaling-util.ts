import { Bounds, Dimension, Viewport } from 'sprotty-protocol'

export function maxParentScale(node: Bounds, parent: Bounds): number {
    // the maximum scale that keeps the node in bounds height wise
    const maxHeightScale = parent.height / node.height
    // the maximum scale that keeps the node in bounds width wise
    const maxWidthScale = parent.width / node.width

    return Math.max(maxHeightScale, maxWidthScale)
}

/*
* Calculates at what scale we reach the desired screen size based on our model size and the viewport
*/
export function desiredScale(desiredSize: number, originalSize: number, viewport: Viewport) : number{
    return desiredSize / (originalSize * viewport.zoom)
}

export function calculateScaledBounds(originalBounds: Bounds, availableSpace: Dimension, scale: number) : Bounds {
    const originalWidth = originalBounds.width
    const originalHeight = originalBounds.height
    const originalX = originalBounds.x
    const originalY = originalBounds.y

    // Calculate the new x and y indentation:
    // width required of scaled rendering
    const newWidth = originalWidth * scale
    // space to the left of the rendering without scaling...
    const spaceL = originalX
    // ...and to its right
    const spaceR = availableSpace.width - originalX - originalWidth
    // New x value after taking space off both sides at an equal ratio
    const newX = originalX - spaceL * (newWidth - originalWidth) / (spaceL + spaceR)

    // Same for y axis, just with switched dimensional variables.
    const newHeight = originalHeight * scale
    const spaceT = originalY
    const spaceB = availableSpace.height - originalY - originalHeight
    const newY = originalY - spaceT * (newHeight - originalHeight) / (spaceT + spaceB)
    return {x: newX, y : newY, width: newWidth, height: newHeight}
}

export function upscaleBounds(currentSize: number, desiredSize: number, childBounds: Bounds, parentBounds: Bounds, viewport: Viewport) : {bounds: Bounds, scale: number} {

  const desiredHightScale = desiredScale(desiredSize, currentSize, viewport);
  const parentScaling = maxParentScale(childBounds, parentBounds)

  const preferredScale = Math.min(desiredHightScale, parentScaling)

  const scalingFactor = Math.max(1, preferredScale)

  const newBounds = calculateScaledBounds(childBounds, parentBounds, scalingFactor)

  return {bounds:newBounds, scale: scalingFactor}
}
