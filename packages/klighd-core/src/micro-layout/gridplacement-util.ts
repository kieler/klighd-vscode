/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2025 by
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

import { Bounds } from 'sprotty-protocol'
import { KContainerRendering, KGridPlacement, KGridPlacementData, KPosition, KRendering } from '../skgraph-models'
import {
    basicEstimateSize,
    evaluateAreaPlacement,
    evaluateAreaPlacementPositions,
    findChildArea,
    inverselyApplyBoundingBoxKPositions,
} from './placement-util'
import { asGridPlacement, asGridPlacementData, getPlacementData } from './krendering-util'
import { boundsOf, emptyBounds, moveBounds } from './bounds-util'

/**
 * Cached grid size assignment for a grid placement.
 */
export interface GridSizeAssignment {
    /** calculated widths of columns */
    calculatedColumnWidths: number[]
    /** calculated heights of rows */
    calculatedRowHeights: number[]
}

/**
 * Position of the child area inside a grid.
 */
export interface ChildAreaPosition {
    /** column index of child area */
    colId: number
    /** row index of child area */
    rowId: number
}

export const ESTIMATED_GRID_DATA = 'klighd.grid.estimatedGridData'
export const CHILD_AREA_POSITION = 'klighd.grid.childAreaPosition'

const TOLERANCE = 0.1

function isGridSizeAssignment(test: unknown): test is GridSizeAssignment {
    if (!test || typeof test !== 'object') {
        return false
    }
    const candidate = test as GridSizeAssignment
    return Array.isArray(candidate.calculatedColumnWidths) && Array.isArray(candidate.calculatedRowHeights)
}

function isChildAreaPosition(test: unknown): test is ChildAreaPosition {
    if (!test || typeof test !== 'object') {
        return false
    }
    const candidate = test as ChildAreaPosition
    return typeof candidate.colId === 'number' && typeof candidate.rowId === 'number'
}

function getPlacementProperty<T>(gridPlacement: KGridPlacement, key: string): T | undefined {
    return (gridPlacement as unknown as Record<string, unknown>)[key] as T | undefined
}

function setPlacementProperty(gridPlacement: KGridPlacement, key: string, value: unknown): void {
    ;(gridPlacement as unknown as Record<string, unknown>)[key] = value
}

function getCachedGridData(
    gridPlacement: KGridPlacement,
    container?: KContainerRendering | null
): { gridData: GridSizeAssignment | null; childAreaPosition: ChildAreaPosition | null } {
    const containerProperties = container?.properties
    const containerGridData = containerProperties?.[ESTIMATED_GRID_DATA]
    const placementGridData = getPlacementProperty<unknown>(gridPlacement, ESTIMATED_GRID_DATA)
    const gridDataCandidate = isGridSizeAssignment(containerGridData)
        ? containerGridData
        : isGridSizeAssignment(placementGridData)
          ? placementGridData
          : null

    const containerChildArea = containerProperties?.[CHILD_AREA_POSITION]
    const placementChildArea = getPlacementProperty<unknown>(gridPlacement, CHILD_AREA_POSITION)
    const childAreaCandidate = isChildAreaPosition(containerChildArea)
        ? containerChildArea
        : isChildAreaPosition(placementChildArea)
          ? placementChildArea
          : null

    return {
        gridData: gridDataCandidate
            ? {
                  calculatedColumnWidths: gridDataCandidate.calculatedColumnWidths.slice(),
                  calculatedRowHeights: gridDataCandidate.calculatedRowHeights.slice(),
              }
            : null,
        childAreaPosition: childAreaCandidate,
    }
}

function storeGridData(
    container: KContainerRendering | null | undefined,
    gridPlacement: KGridPlacement,
    gridData: GridSizeAssignment,
    childAreaPosition: ChildAreaPosition
): void {
    if (container) {
        container.properties = container.properties ?? {}
        container.properties[ESTIMATED_GRID_DATA] = {
            calculatedColumnWidths: gridData.calculatedColumnWidths.slice(),
            calculatedRowHeights: gridData.calculatedRowHeights.slice(),
        }
        container.properties[CHILD_AREA_POSITION] = { ...childAreaPosition }
    }
    setPlacementProperty(gridPlacement, ESTIMATED_GRID_DATA, {
        calculatedColumnWidths: gridData.calculatedColumnWidths.slice(),
        calculatedRowHeights: gridData.calculatedRowHeights.slice(),
    })
    setPlacementProperty(gridPlacement, CHILD_AREA_POSITION, { ...childAreaPosition })
}

/**
 * Determines the number of columns in the grid.
 *
 * @param gridPlacement the grid placement
 * @param children the children renderings
 * @return the number of columns
 */
function getColumnCount(gridPlacement: KGridPlacement, children: KRendering[]): number {
    const setColumns = gridPlacement.numColumns
    return setColumns === -1 ? children.length : setColumns < 1 ? 1 : setColumns
}

/**
 * Determines the number of rows in the grid.
 *
 * @param childCount the number of children
 * @param numColumns the number of columns
 * @return the number of rows
 */
function getRowCount(childCount: number, numColumns: number): number {
    return childCount === 0 ? 0 : Math.floor((childCount - 1) / numColumns) + 1
}

/**
 * The grid placement evaluation algorithm, ported from the Java {@code GridPlacer}.
 */
class GridPlacer {
    private readonly gridPlacement: KGridPlacement

    private readonly children: KRendering[]

    private readonly container: KContainerRendering | null

    private readonly numColumns: number

    private readonly numRows: number

    private readonly topLeft: KPosition | null

    private readonly bottomRight: KPosition | null

    private readonly estimatedGridData: GridSizeAssignment

    private childAreaPosition: ChildAreaPosition

    private readonly flexibleCols: boolean[]

    private readonly flexibleRows: boolean[]

    private readonly columnMaxMinWidth: number[]

    private readonly rowMaxMinHeight: number[]

    private readonly minOverallWidth: number

    private readonly minOverallHeight: number

    /**
     * Constructor.
     *
     * @param gridPlacement
     *            the grid placement definition
     * @param children
     *            the children renderings
     * @param container
     *            the container rendering (optional, used for caching)
     */
    constructor(gridPlacement: KGridPlacement, children: KRendering[], container?: KContainerRendering | null) {
        this.gridPlacement = gridPlacement
        this.children = children
        this.container = container ?? null

        this.numColumns = getColumnCount(gridPlacement, children)
        this.numRows = getRowCount(children.length, this.numColumns)
        this.topLeft = gridPlacement.topLeft ?? null
        this.bottomRight = gridPlacement.bottomRight ?? null

        const cached = getCachedGridData(gridPlacement, this.container)
        this.childAreaPosition = cached.childAreaPosition ?? this.detectChildAreaPosition()

        this.flexibleCols = new Array<boolean>(this.numColumns).fill(true)
        this.flexibleRows = new Array<boolean>(this.numRows).fill(true)
        this.columnMaxMinWidth = new Array<number>(this.numColumns).fill(0)
        this.rowMaxMinHeight = new Array<number>(this.numRows).fill(0)

        const gridSizingAvailable = cached.gridData !== null
        for (let i = 0; i < children.length; i++) {
            const rendering = children[i]
            const column = i % this.numColumns
            const row = Math.floor(i / this.numColumns)

            const gridData = asGridPlacementData(getPlacementData(rendering))

            let childMinSize: Bounds
            if (gridSizingAvailable) {
                childMinSize = boundsOf(
                    cached.gridData?.calculatedColumnWidths[column] ?? 0,
                    cached.gridData?.calculatedRowHeights[row] ?? 0
                )
            } else {
                childMinSize = basicEstimateSize(rendering, emptyBounds())
                childMinSize = inverselyApplyBoundingBoxKPositions(
                    childMinSize,
                    gridData?.topLeft,
                    gridData?.bottomRight
                )
            }

            if (gridData) {
                this.flexibleCols[column] &&= gridData.flexibleWidth ?? true
                this.flexibleRows[row] &&= gridData.flexibleHeight ?? true
            }

            this.columnMaxMinWidth[column] = Math.max(
                gridData?.minCellWidth ?? 0,
                childMinSize.width,
                this.columnMaxMinWidth[column]
            )
            this.rowMaxMinHeight[row] = Math.max(
                gridData?.minCellHeight ?? 0,
                childMinSize.height,
                this.rowMaxMinHeight[row]
            )
        }

        this.estimatedGridData =
            cached.gridData !== null
                ? cached.gridData
                : {
                      calculatedColumnWidths: this.columnMaxMinWidth.slice(),
                      calculatedRowHeights: this.rowMaxMinHeight.slice(),
                  }

        if (!gridSizingAvailable) {
            storeGridData(this.container, this.gridPlacement, this.estimatedGridData, this.childAreaPosition)
        }

        let minOverallWidth = 0
        for (const width of this.columnMaxMinWidth) {
            minOverallWidth += width
        }
        let minOverallHeight = 0
        for (const height of this.rowMaxMinHeight) {
            minOverallHeight += height
        }
        this.minOverallWidth = minOverallWidth
        this.minOverallHeight = minOverallHeight
    }

    /**
     * Detects the position of a child area inside the grid.
     *
     * @return the child area position
     */
    private detectChildAreaPosition(): ChildAreaPosition {
        let childAreaColId = -1
        let childAreaRowId = -1
        for (let i = 0; i < this.children.length; i++) {
            const path: KRendering[] = []
            if (findChildArea(this.children[i], path)) {
                childAreaColId = i % this.numColumns
                childAreaRowId = Math.floor(i / this.numColumns)
            }
        }
        return { colId: childAreaColId, rowId: childAreaRowId }
    }

    /**
     * Evaluates the grid placement for the given parent bounds.
     *
     * @param parentBounds
     *            the parent bounds
     * @return array of bounds for each child
     */
    evaluate(parentBounds: Bounds): Bounds[] {
        if (this.children.length === 0) {
            return []
        }

        const result = new Array<Bounds>(this.children.length)
        if (parentBounds.width === 0 || parentBounds.height === 0) {
            return result.fill(emptyBounds())
        }

        let cachedWidth = 0
        for (const width of this.estimatedGridData.calculatedColumnWidths) {
            cachedWidth += width
        }
        let cachedHeight = 0
        for (const height of this.estimatedGridData.calculatedRowHeights) {
            cachedHeight += height
        }

        const gridBounds = evaluateAreaPlacementPositions(this.topLeft, this.bottomRight, parentBounds)

        let calculatedColumnWidth: number[]
        let calculatedRowHeight: number[]

        if (this.childAreaPosition.colId > -1 && this.childAreaPosition.rowId > -1) {
            calculatedColumnWidth = this.estimatedGridData.calculatedColumnWidths.slice()
            calculatedRowHeight = this.estimatedGridData.calculatedRowHeights.slice()

            if (gridBounds.width - cachedWidth > TOLERANCE && this.childAreaPosition.colId < this.numColumns) {
                calculatedColumnWidth[this.childAreaPosition.colId] =
                    (calculatedColumnWidth[this.childAreaPosition.colId] ?? 0) + (gridBounds.width - cachedWidth)
            }
            if (gridBounds.height - cachedHeight > TOLERANCE && this.childAreaPosition.rowId < this.numRows) {
                calculatedRowHeight[this.childAreaPosition.rowId] =
                    (calculatedRowHeight[this.childAreaPosition.rowId] ?? 0) + (gridBounds.height - cachedHeight)
            }
        } else {
            const numFlexibleCols = this.flexibleCols.filter(Boolean).length
            const numFlexibleRows = this.flexibleRows.filter(Boolean).length
            calculatedColumnWidth = this.computeCellSizes(
                gridBounds.width,
                this.minOverallWidth,
                this.columnMaxMinWidth,
                numFlexibleCols,
                this.flexibleCols
            )
            calculatedRowHeight = this.computeCellSizes(
                gridBounds.height,
                this.minOverallHeight,
                this.rowMaxMinHeight,
                numFlexibleRows,
                this.flexibleRows
            )
        }

        const startX = gridBounds.x
        const startY = gridBounds.y
        let currentX = startX
        let currentY = startY

        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i]
            const gridData = asGridPlacementData(getPlacementData(child))
            const column = i % this.numColumns
            const row = Math.floor(i / this.numColumns)

            const cellBounds = boundsOf(calculatedColumnWidth[column] ?? 0, calculatedRowHeight[row] ?? 0)
            const localBounds = gridData ? evaluateAreaPlacement(gridData, cellBounds) : cellBounds

            result[i] = moveBounds(localBounds, currentX, currentY)

            currentX += cellBounds.width
            if (column === this.numColumns - 1) {
                currentY += cellBounds.height
                currentX = startX
            }
        }

        return result
    }

    /**
     * Computes the cell sizes given available space.
     *
     * @param availableSize
     *            the available size
     * @param requiredSize
     *            the minimum required size
     * @param requiredSizes
     *            the minimum sizes per cell
     * @param countFlexibleSizes
     *            number of flexible cells
     * @param flexibleSizes
     *            flexibility flags per cell
     * @return computed sizes per cell
     */
    private computeCellSizes(
        availableSize: number,
        requiredSize: number,
        requiredSizes: number[],
        countFlexibleSizes: number,
        flexibleSizes: boolean[]
    ): number[] {
        const result = new Array<number>(requiredSizes.length).fill(0)

        const overSize = availableSize - requiredSize
        const overSized = overSize > 0
        const overSizeShare = !overSized ? 0 : overSize / (countFlexibleSizes === 0 ? 1 : countFlexibleSizes)

        let remainingSize = availableSize

        for (let i = 0; i < requiredSizes.length; i++) {
            if (remainingSize >= 0) {
                result[i] = requiredSizes[i]
                if (overSized && (flexibleSizes[i] || (countFlexibleSizes === 0 && i + 1 === requiredSizes.length))) {
                    result[i] += overSizeShare
                }
                remainingSize -= result[i]
            } else {
                break
            }
        }

        return result
    }
}

/**
 * Returns the minimal size of a container with a grid child placement and updates the
 * cached grid data used by {@link evaluateGridPlacement}.
 */
export function estimateGridSize(container: KContainerRendering, parentBounds: Bounds): Bounds {
    const gridPlacement = asGridPlacement(container.childPlacement)
    if (!gridPlacement) {
        return boundsOf(parentBounds)
    }

    let { numColumns } = gridPlacement
    const childRenderings = container.children
    let numRows: number

    if (numColumns === -1) {
        numColumns = childRenderings.length
        numRows = 1
    } else if (numColumns < 2) {
        numColumns = 1
        numRows = childRenderings.length
    } else {
        numRows = Math.floor((childRenderings.length + numColumns - 1) / numColumns)
    }

    const minColumnWidths = new Array<number>(numColumns).fill(0)
    const minRowHeights = new Array<number>(numRows).fill(0)

    let childAreaRowId = -1
    let childAreaColId = -1

    for (let k = 0; k < childRenderings.length; k++) {
        const currentChild = childRenderings[k]
        const row = Math.floor(k / numColumns)
        const col = k - row * numColumns

        const path: KRendering[] = []
        if (findChildArea(currentChild, path)) {
            childAreaColId = col
            childAreaRowId = row
        }

        let cellSize = basicEstimateSize(currentChild, emptyBounds())
        const gridData = asGridPlacementData(getPlacementData(currentChild))

        if (gridData) {
            const innerSize = inverselyApplyBoundingBoxKPositions(cellSize, gridData.topLeft, gridData.bottomRight)
            cellSize = boundsOf(
                innerSize.x,
                innerSize.y,
                Math.max(innerSize.width, gridData.minCellWidth ?? 0),
                Math.max(innerSize.height, gridData.minCellHeight ?? 0)
            )
        }

        minRowHeights[row] = Math.max(minRowHeights[row], cellSize.height)
        minColumnWidths[col] = Math.max(minColumnWidths[col], cellSize.width)
    }

    const gridData: GridSizeAssignment = {
        calculatedColumnWidths: minColumnWidths,
        calculatedRowHeights: minRowHeights,
    }
    const childAreaPosition: ChildAreaPosition = {
        colId: childAreaColId,
        rowId: childAreaRowId,
    }
    storeGridData(container, gridPlacement, gridData, childAreaPosition)

    let childWidth = 0
    for (const width of minColumnWidths) {
        childWidth += width
    }
    let childHeight = 0
    for (const height of minRowHeights) {
        childHeight += height
    }

    const childBounds = inverselyApplyBoundingBoxKPositions(
        boundsOf(0, 0, childWidth, childHeight),
        gridPlacement.topLeft,
        gridPlacement.bottomRight
    )

    return childBounds
}

/**
 * Evaluates the grid placement for the given parent bounds.
 */
export function evaluateGridPlacement(
    gridPlacement: KGridPlacement,
    children: KRendering[] | null,
    parentBounds: Bounds,
    container?: KContainerRendering | null
): Bounds[] {
    if (!children || children.length === 0) {
        return []
    }
    if (parentBounds.width === 0 || parentBounds.height === 0) {
        return new Array<Bounds>(children.length).fill(emptyBounds())
    }
    const placer = new GridPlacer(gridPlacement, children, container)
    return placer.evaluate(parentBounds)
}

export function getGridPlacementData(data: unknown): KGridPlacementData | null {
    if (data && typeof data === 'object' && 'type' in data) {
        return asGridPlacementData(data as KGridPlacementData)
    }
    return null
}
