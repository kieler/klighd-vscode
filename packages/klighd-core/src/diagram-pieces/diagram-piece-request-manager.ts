/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License 2.0 (EPL-2.0).
 */

import { Point, SModelElement as SModelElementSchema, ViewportResult} from "sprotty-protocol";

/**
 * A IDiagramPieceRequestGenerator manages the ordering of diagram piece
 * requests.
 */
export interface IDiagramPieceRequestManager {
    
    /**
     * Adds a diagram piece that should be requested later.
     * @param parentId The ID of the SModelElement that is the direct parent of
     *                 this diagram piece. This is necessary to determine the 
     *                 position of the piece.
     * @param diagramPiece Schema of diagram piece.
     */
    enqueue(parentId: string, diagramPiece: SModelElementSchema): void
    
    /**
     * Returns the next diagram piece that should be requested and removes it
     * from the manager.
     */
    dequeue(): SModelElementSchema | undefined

    /**
     * Resets the manager for a different diagram.
     */
    reset(): void

    /**
     * Retrieves same element as dequeue, but doesn't remove it from the manager.
     */
    front(): SModelElementSchema | undefined

    /**
     * Submit info about current viewport position to be used to prioritize the ordering of requests.
     */
    setViewport(viewportResult: ViewportResult): void
}

/**
 * This implementation of {@link IDiagramPieceRequestManager} serves as a naive
 * implementation of the interface. Diagram pieces are stored in a simple queue
 * and requested in FIFO order. The resulting behaviour is that the pieces of a
 * diagram are requested breadth-first. The position of the viewport is not 
 * taken into consideration in this approach.
 */
export class QueueDiagramPieceRequestManager implements IDiagramPieceRequestManager {

    piecesToRequest: SModelElementSchema[] = []
    enqueue(_parentId: string, diagramPiece: SModelElementSchema): void {
        this.piecesToRequest.push(diagramPiece)
    }
    dequeue(): SModelElementSchema | undefined {
        return this.piecesToRequest.shift() // FIFO, pop() would be FILO
    }
    reset(): void {
        this.piecesToRequest = []
    }
    front(): SModelElementSchema | undefined {
        if (this.piecesToRequest.length === 0) {
            return undefined
        } else {
            return this.piecesToRequest[this.piecesToRequest.length - 1]
        }
    }
    setViewport(_viewportResult: ViewportResult): void {
        console.log("QueueDiagramPieceRequestManager.setViewport is unimplemented")
    }
}

/**
 * This class provides a more sophisticated implementaion of 
 * {@link IDiagramPieceRequestManager}. In order to send diagram piece requests
 * in order of "first needed", the diagram area is divided into a grid and the
 * locations of each piece within this grid are determined. The viewport position
 * is then taken to determine which grid cell is currently in view and each
 * grid cell maintains its own queue of pieces to request. When there are no
 * more pieces in a grid cell, grid cells in a ring around that center cell are
 * checked. And if nothing is found there either, the fallback is to go through
 * all the grid cells and request the first piece that is discovered.
 */
export class GridDiagramPieceRequestManager implements IDiagramPieceRequestManager {

    idToAbsolutePositions: Map<string, Point>
    // ordering of elements per grid corresponds to layer, therefore operations on it should be FIFO
    /* https://stackoverflow.com/questions/39005798/fastest-way-of-using-coordinates-as-keys-in-javascript-hashmap */
    /**
     * These fields are used to map the diagram piece queues to their grid cell coordinates. 
     */
    gridToPieces: Map<number, SModelElementSchema []>
    readonly MAX_16BIT_SIGNED = (1 << (16 - 1)) - 1    // 32767

    /**
     * Determines how many pixels wide each grid square should be.
     *
     * FIXME: evaluate what value makes sense here. If a proper spiral loop is in place, it shouldn't be too important though.
     *        canvas width is typically between 500 and 1000 pixels, zoom level important to consider
     *        This width is constant with respect to the actual diagram, this means that for small diagrams the
     *        grid has relatively large squares and for large diagrams the squares are relatively small
     *        There might be an advantage of setting this dynamically according to the diagram size beforehand
     *        This would require some extra communication before the actual diagram requesting process begins
     */
    gridResolution = 2000

    /**
     * Determines how far around the center point of the viewport to search for nodes to request. The value used
     * here needs to be suitable for both the gridResolution and diagram size.
     */
    maxRingCount = 2

    /**
     * The last known grid position of the viewport.
     */
    currentGridPosition = {x: 0, y: 0}

    /**
     * Transforms a coordinate pair (x,y) to a 32 bit integer. x and y must be 
     * between 0 and 32767 which is a sufficiently large domain for this application.
     * The value of x is stored in the first 16 bits and the value of y is stored in
     * the last 16 bits.
     * @param point The coordinate to be transformed to an integer encoding.
     * @returns Integer representing the coordinate pair.
     */
    getKey(point: Point): number {
        const x = point.x
        const y = point.y
        if (x > this.MAX_16BIT_SIGNED || y > this.MAX_16BIT_SIGNED) {
            throw new Error("Invalid x or y coordinates");
        }
        return (x << 16) | y
    }

    /**
     * Transforms a 32 bit integer to a pair (x,y). The encoding is explained in
     * {@link GridDiagramPieceRequestManager.getKey}
     * @param key Integer to be transformed to coordinate pair.
     * @returns Coordinate pair in the form {x: valueX, y: valueY}.
     */
    getCoords(key: number): Point {
        if (key > 2147352576 + 32766) {
            throw new Error("Invalid key");
        }
        const keyX = (key >> 16)
        const keyY = (key & 0xFFFF)
        return { x: keyX, y: keyY }
    }

    /**
     * Generates coordinate pairs which form a square around the origin (0,0) with a distance n
     * from the center in exactly one or both components of the coordinate. Or expressed more 
     * mathematically:
     * 
     * All pairs must be of the form (+-n,v) or (v,+-n) with -n <= v <= n
     * 
     * @param n Distance of the ring from the origin.
     * @returns List of coordinate pairs: [{x: .., y: ..}, ..]
     */
    ringCoords(n: number): Point[] {
        /*
         * Ring with n = 2
         *
         *     X X X X X
         *     X       X
         *     X       X
         *     X       X
         *     X X X X X
         */

        const result = []
        // first get all edge coordinates
        for (let i = (-(n - 1)); i <= (n - 1); i++) {
            result.push({x: -n, y: i})
        }
        for (let i = (-(n - 1)); i <= (n - 1); i++) {
            result.push({x: n, y: i})
        }
        for (let i = (-(n - 1)); i <= (n - 1); i++) {
            result.push({x: i, y: -n})
        }
        for (let i = (-(n - 1)); i <= (n - 1); i++) {
            result.push({x: i, y: n})
        }
        // push corner coordinates
        result.push({x: -n, y: -n})
        result.push({x: -n, y: n})
        result.push({x: n, y: -n})
        result.push({x: n, y: n})
        return result
    }

    enqueue(parentId: string, diagramPiece: SModelElementSchema): void {
        if (diagramPiece.type === "node") {
            const castPiece = diagramPiece as any
            if (this.idToAbsolutePositions.get(parentId) !== undefined) {
                // if parent is already known, child position is calculated relative to its parent
                const parentPos = this.idToAbsolutePositions.get(parentId)!
                this.idToAbsolutePositions.set(diagramPiece.id, Point.add(parentPos, castPiece.position))
            } else {
                // otherwise the element must be a top level element
                this.idToAbsolutePositions.set(diagramPiece.id, castPiece.position)
            }

            // add pieces to grid
            const gridX = Math.floor((this.idToAbsolutePositions.get(diagramPiece.id)!.x + castPiece.size.width / 2) / this.gridResolution)
            const gridY = Math.floor((this.idToAbsolutePositions.get(diagramPiece.id)!.y + castPiece.size.height / 2) / this.gridResolution)
            // const test = this.gridToPieces.get(gridPoint)
            const key = this.getKey({ x: gridX, y: gridY })
            if (this.gridToPieces.get(key) !== undefined) {
                this.gridToPieces.get(key)!.push(diagramPiece)
            } else {
                this.gridToPieces.set(key, [diagramPiece])
            }

        } else {
            // DO NOT DO ANYTHING WITH NON NODE ELEMENTS
            // FIXME: execution probably should reach here and should throw an error
            //        but maybe caller should not worry about this
            
            //        In current implementation the caller just passes all types of
            //        elements, so we simply silently ignore wrong elements here
        }
    }
    dequeue(): SModelElementSchema | undefined {
        // if something exists in current grid position return that
        const key = this.getKey(this.currentGridPosition)
        const list = this.gridToPieces.get(key)
        if (list !== undefined && list.length > 0) {
            return list.shift()
        } else {
            // check for next closest piece
            let piece: SModelElementSchema | undefined = undefined

            // here we compute the coordinates of rings around the current central point
            // A spiral could be another way to approach this: https://stackoverflow.com/questions/398299/looping-in-a-spiral
            for (let i = 1; i <= this.maxRingCount; i++) {
                const ring = this.ringCoords(i)
                for (let j = 0; j < ring.length; j++) {
                    const value = this.gridToPieces.get(this.getKey(Point.add(this.currentGridPosition, ring[j])))!
                    if (value !== undefined && value.length > 0) {
                        piece = value.shift()!
                        return piece
                    }
                }
            }

            // have to do this because of:
            /* Type 'IterableIterator<number>' is not an array type or a string type.
             * Use compiler option '--downlevelIteration' to allow iterating of
             * iterators.ts(2569) */
            // Otherwise could do for (key of this.gridToPieces.keys())

            // fallback if nothing in immediate area
            const gridArray = Array.from(this.gridToPieces.keys())
            for (const square of gridArray) {
                const value = this.gridToPieces.get(square)!
                if (value.length > 0) {
                    piece = value.shift()!
                    return piece
                }
            }
        }
    }
    reset(): void {
        this.idToAbsolutePositions = new Map<string, Point>()
        this.gridToPieces = new Map<number, SModelElementSchema[]>()
        this.currentGridPosition = {x: 0, y: 0}
    }
    front(): SModelElementSchema | undefined {
        // if something exists in current grid position return that
        const key = this.getKey(this.currentGridPosition)
        const list = this.gridToPieces.get(key)
        if (list !== undefined && list.length > 0) {
            return list[list.length - 1]
        } else {
            // check for next closest piece
            let piece: SModelElementSchema | undefined = undefined

            for (let i = 1; i <= this.maxRingCount; i++) {
                const ring = this.ringCoords(i)
                for (let j = 0; j < ring.length; j++) {
                    const value = this.gridToPieces.get(this.getKey(ring[j]))!
                    if (value !== undefined && value.length > 0) {
                        piece = value[value.length - 1]
                        return piece
                    }
                }
            }

            // fallback if nothing in immediate area
            const gridArray = Array.from(this.gridToPieces.keys())
            for (const square of gridArray) {
                const value = this.gridToPieces.get(square)!
                if (value.length > 0) {
                    piece = value[value.length - 1]
                    return piece
                }
            }
        }
    }
    setViewport(viewportResult: ViewportResult): void {
        const viewport = viewportResult.viewport
        const canvasBounds = viewportResult.canvasBounds
        const gridX = Math.floor((viewport.scroll.x + (canvasBounds.width / 2) / viewport.zoom) / this.gridResolution)
        const gridY = Math.floor((viewport.scroll.y + (canvasBounds.height / 2) / viewport.zoom) / this.gridResolution)
        this.currentGridPosition = {x: gridX, y: gridY}
    }
}