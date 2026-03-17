import { Bounds } from 'sprotty-protocol'
import { KContainerRendering, KGridPlacement, KRendering } from '../skgraph-models'
import { basicEstimateSize, findChildArea, inverselyApplyBoundingBoxKPositions } from './placement-util'
import { asGridPlacement, asGridPlacementData, getPlacementData } from './krendering-util'
import { boundsMax } from './bounds-util'

export function estimateGridSize(container: KContainerRendering, parentBounds: Bounds): Bounds {
    // TODO: Test this method
    // TODO: Comment this method
    console.warn('METHOD IS BEING USED: ' + 'estimateGridSize')

    let { numColumns } = container.childPlacement as KGridPlacement
    const childRenderings = container.children

    let numRows
    if (numColumns === -1) {
        numColumns = childRenderings.length
        numRows = 1
    } else if (numColumns < 2) {
        numColumns = 1
        numRows = childRenderings.length
    } else numRows = (childRenderings.length + numColumns - 1) / numColumns

    const minColumnWidths = new Array<number>(numColumns)
    const minRowHeights = new Array<number>(numRows)

    let childAreaRowId = -1
    let childAreaColId = -1

    for (let k = 0; k < childRenderings.length; k++) {
        const currentChild = childRenderings[k]

        const row = k / numColumns
        const col = k - row * numColumns

        const path: KRendering[] = []
        if (findChildArea(currentChild, path)) {
            childAreaColId = col
            childAreaRowId = row
        }

        const cellSize = basicEstimateSize(currentChild, Bounds.EMPTY)
        const gridData = asGridPlacementData(getPlacementData(currentChild))

        if (gridData) {
            const tL = gridData.topLeft
            const bR = gridData.bottomRight

            inverselyApplyBoundingBoxKPositions(cellSize, tL, bR)
        }

        minRowHeights[row] = Math.max(minRowHeights[row], cellSize.height)
        minColumnWidths[row] = Math.max(minColumnWidths[row], cellSize.width)
    }

    // TODO: Store deliver, toggle it, and restore it later.
    // const deliver = container.deliver

    // TODO: Maybe revert to this version here.
    /*
    const pSpacing = container.properties[ESTIMATED_GRID_DATA]
    
    if (isGridSizeAssignment(pSpacing)) {
        pSpacing.calculatedColumnWidths = minColumnWidths
        pSpacing.calculatedRowHeights = minRowHeights
    } else {
        container.properties[ESTIMATED_GRID_DATA] = 
    }
    */

    // Could be as easy as this.
    container.properties[ESTIMATED_GRID_DATA] = {
        calculatedColumnWidths: minColumnWidths,
        calculatedRowHeights: minRowHeights,
    }

    // TODO: Expand this, if there is need to revert to it.
    /*
    const pCAPos = container.properties[CHILD_AREA_POSITION]
    // ...
    */

    // Could be as easy as this 2.
    container.properties[CHILD_AREA_POSITION] = { colId: childAreaColId, rowId: childAreaRowId }

    // TODO: Restore deliver here.
    // container.deliver(deliver)

    const childBounds = { x: 0, y: 0, width: 0, height: 0 }

    for (const width of minColumnWidths) childBounds.width += width
    for (const height of minRowHeights) childBounds.height += height

    // TODO: May break here, depends on what we know at this point.
    if (container.childPlacement) {
        const placement = asGridPlacement(container.childPlacement)
        if (placement) inverselyApplyBoundingBoxKPositions(childBounds, placement.topLeft, placement.bottomRight)
    }

    // TODO: Differs from original code, but else parentBounds is unused, this seems to be the implication.
    return boundsMax(childBounds, parentBounds)
}

/**
 * A data holder class for the spacing of the grid calculated during the size estimation.
 * Represents its java counterpart in KLighD.
 */
/*
interface GridSizeAssignment {
    calculatedColumnWidths: number[]
    calculatedRowHeights: number[]
}

// Maybe clean this method
function isGridSizeAssignment(test: unknown): test is GridSizeAssignment {
    return test && (test as any).calculatedColumnWidths && (test as any).calculatedRowHeights
}
*/

// TODO: IMPORTANT: Collect all properties and store them somewhere like this for easier access.
export const ESTIMATED_GRID_DATA = 'klighd.grid.estimatedGridData'
export const CHILD_AREA_POSITION = 'klighd.grid.childAreaPosition'

export function evaluateGridPlacement(
    gridPlacement: KGridPlacement,
    children: KRendering[] | null,
    parentBounds: Bounds
): Bounds[] | null {
    // TODO: Test this method
    // TODO: Comment this method
    console.warn('METHOD IS BEING USED: ' + 'evaluateGridPlacement')
    if (parentBounds === Bounds.EMPTY && children) return new Array<Bounds>(children.length).fill(Bounds.EMPTY)
    // const placer =
    return null
}

// TODO: Port GridPlacer-class
