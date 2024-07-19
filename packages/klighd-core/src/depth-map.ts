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
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { KNode, SKGraphElement } from '@kieler/klighd-interactive/lib/constraint-classes'
import { SChildElementImpl, SModelRootImpl } from 'sprotty'
import { Point, Viewport } from 'sprotty-protocol'
import {
    FullDetailRelativeThreshold,
    FullDetailScaleThreshold,
    RenderOptionsRegistry,
} from './options/render-options-registry'
import { isContainerRendering, isRendering, KRendering } from './skgraph-models'

/**
 * The possible detail level of a KNode as determined by the DepthMap
 */
export enum DetailLevel {
    FullDetails = 2,
    MinimalDetails = 1,
    OutOfBounds = 0,
}

/**
 * All DetailLevel where the children are visible
 */
type DetailWithChildren = DetailLevel.FullDetails

/**
 * Type predicate to determine whether a DetailLevel is a DetailWithChildren level
 */
export function isDetailWithChildren(detail: DetailLevel): detail is DetailWithChildren {
    return detail === DetailLevel.FullDetails
}

/**
 * All DetailLevel where the children are not visible
 */
type DetailWithoutChildren = Exclude<DetailLevel, DetailWithChildren>

type RegionIndexEntry =
    | { containingRegion: Region; providingRegion: undefined }
    | { containingRegion: undefined; providingRegion: Region }
    | { containingRegion: Region; providingRegion: Region }

/**
 * Divides Model KNodes into regions. On these detail level actions
 * are defined via the detailLevel. Also holds additional information to determine
 * the appropriate detail level, visibility and title for regions.
 */
export class DepthMap {
    /**
     * The region for immediate children of the SModelRoot,
     * aka. the root regions
     */
    rootRegions: Region[]

    /**
     * The model for which the DepthMap is generated
     */
    rootElement: SModelRootImpl

    /**
     * Maps a given node id to the containing/providing Region
     * Root Child Nodes will have a providing region and no containing Region, while all
     * other nodes will have at least a containing region
     */
    protected regionIndexMap: Map<string, RegionIndexEntry>

    /**
     * The last viewport for which we updated the state of KNodes
     */
    viewport?: Viewport

    /**
     * The threshold for which we updated the state of KNodes
     */
    lastThreshold?: number

    /**
     * Set for handling regions, that need to be checked for detail level changes.
     * Consists of the region that contain at least one child with a lower detail level.
     */
    criticalRegions: Set<Region>

    /** Singleton pattern */
    private static instance?: DepthMap

    /**
     * @param rootElement The root element of the model.
     */
    private constructor(rootElement: SModelRootImpl) {
        this.rootElement = rootElement
        this.rootRegions = []
        this.criticalRegions = new Set()
        this.regionIndexMap = new Map()
    }

    protected reset(modelRoot: SModelRootImpl): void {
        this.rootElement = modelRoot
        // rootRegions are reset below as we also want to remove the edges from the graph spanned by the regions
        this.criticalRegions.clear()
        this.viewport = undefined
        this.lastThreshold = undefined
        this.regionIndexMap.clear()

        let currentRegions = this.rootRegions
        this.rootRegions = []

        let remainingRegions: Region[] = []

        // Go through all regions and clear the references to other Regions and KNodes
        while (currentRegions.length !== 0) {
            for (const region of currentRegions) {
                remainingRegions.concat(region.children)
                region.children = []
                region.parent = undefined
            }
            currentRegions = remainingRegions
            remainingRegions = []
        }
    }

    /**
     * Returns the current DepthMap instance or undefined if its not initialized
     * @returns DepthMap | undefined
     */
    public static getDM(): DepthMap | undefined {
        return DepthMap.instance
    }

    /**
     * Returns the current DepthMap instance or returns a new one.
     * @param rootElement The model root element.
     */
    public static init(rootElement: SModelRootImpl): DepthMap {
        if (!DepthMap.instance) {
            // Create new DepthMap, when there is none
            DepthMap.instance = new DepthMap(rootElement)
        } else if (DepthMap.instance.rootElement !== rootElement) {
            // Reset and reinitialize if the model changed
            DepthMap.instance.reset(rootElement)
        }
        return DepthMap.instance
    }

    /**
     * It is generally advised to initialize the elements from root to leaf
     *
     * @param element The KGraphElement to initialize for DepthMap usage
     */
    public initKGraphElement(
        element: SChildElementImpl & SKGraphElement,
        viewport: Viewport,
        renderingOptions: RenderOptionsRegistry
    ): RegionIndexEntry {
        let entry = this.regionIndexMap.get(element.id)
        if (entry) {
            // KNode already initialized
            return entry
        }

        const relativeThreshold = renderingOptions.getValueOrDefault(FullDetailRelativeThreshold)

        const scaleThreshold = renderingOptions.getValueOrDefault(FullDetailScaleThreshold)

        if (element.parent === element.root && element instanceof KNode) {
            const providedRegion = new Region(element)
            providedRegion.absolutePosition = element.bounds

            entry = { providingRegion: providedRegion, containingRegion: undefined }

            providedRegion.detail = this.computeDetailLevel(providedRegion, viewport, relativeThreshold, scaleThreshold)

            this.rootRegions.push(providedRegion)

            element.properties.absoluteScale = 1
            element.properties.absoluteX = element.bounds.x
            element.properties.absoluteY = element.bounds.y
        } else {
            // parent should always exist because we're traversing root to leaf
            const parentEntry = this.initKGraphElement(element.parent as KNode, viewport, renderingOptions)

            entry = {
                containingRegion: parentEntry.providingRegion ?? parentEntry.containingRegion,
                providingRegion: undefined,
            }

            const kRendering = this.findRendering(element)
            if (
                element instanceof KNode &&
                kRendering &&
                isContainerRendering(kRendering) &&
                kRendering.children.length !== 0
            ) {
                entry = { containingRegion: entry.containingRegion, providingRegion: new Region(element) }

                entry.providingRegion.detail = this.computeDetailLevel(
                    entry.providingRegion,
                    viewport,
                    relativeThreshold,
                    scaleThreshold
                )

                entry.providingRegion.parent = entry.containingRegion
                entry.containingRegion.children.push(entry.providingRegion)

                const current = element.parent as KNode

                // compute own absolute scale and absolute position based on parent position
                const parentAbsoluteScale = (element.parent as any).properties.absoluteScale
                const scaleFactor = (element.parent as any).properties['org.eclipse.elk.topdown.scaleFactor'] ?? 1
                element.properties.absoluteScale = parentAbsoluteScale * scaleFactor
                
                element.properties.absoluteX = (current.properties.absoluteX as number) +
                    element.bounds.x * (element.properties.absoluteScale as number)
                element.properties.absoluteY = (current.properties.absoluteY as number) +
                    element.bounds.y * (element.properties.absoluteScale as number)

                entry.providingRegion.absolutePosition = {
                    x: element.properties['absoluteX'] as number,
                    y: element.properties['absoluteY'] as number,
                }
            }
        }

        this.regionIndexMap.set(element.id, entry)
        return entry
    }

    /**
     * Finds the KRendering in the given graph element.
     * @param element The graph element to look up the rendering for.
     * @returns The KRendering.
     */
    findRendering(element: SKGraphElement): KRendering | undefined {
        for (const data of element.data) {
            if (data !== null && isRendering(data)) {
                return data
            }
        }
        return undefined
    }

    public getContainingRegion(
        element: SChildElementImpl & SKGraphElement,
        viewport: Viewport,
        renderOptions: RenderOptionsRegistry
    ): Region | undefined {
        // initKGraphELement already checks if it is already initialized and if it is returns the existing value
        return this.initKGraphElement(element, viewport, renderOptions).containingRegion
    }

    public getProvidingRegion(
        node: SChildElementImpl & KNode,
        viewport: Viewport,
        renderOptions: RenderOptionsRegistry
    ): Region | undefined {
        // initKGraphElement already checks if it is already initialized and if it is returns the existing value
        return this.initKGraphElement(node, viewport, renderOptions).providingRegion
    }

    /**
     * Decides the appropriate detail level for regions based on their size in the viewport and applies that state.
     *
     * @param viewport The current viewport.
     */
    updateDetailLevels(viewport: Viewport, renderingOptions: RenderOptionsRegistry): void {
        const relativeThreshold = renderingOptions.getValueOrDefault(FullDetailRelativeThreshold)

        const scaleThreshold = renderingOptions.getValueOrDefault(FullDetailScaleThreshold)

        this.viewport = { zoom: viewport.zoom, scroll: viewport.scroll }
        this.lastThreshold = relativeThreshold

        // Initialize detail level on first run.
        if (this.criticalRegions.size === 0) {
            for (const region of this.rootRegions) {
                const vis = this.computeDetailLevel(region, viewport, relativeThreshold, scaleThreshold)
                if (vis === DetailLevel.FullDetails) {
                    this.updateRegionDetailLevel(region, vis, viewport, relativeThreshold, scaleThreshold)
                }
            }
        } else {
            this.checkCriticalRegions(viewport, relativeThreshold, scaleThreshold)
        }
    }

    /**
     * Set detail level for the given region and recursively determine and update the children's detail level
     *
     * @param region The root region
     * @param viewport The current viewport
     * @param relativeThreshold The detail level threshold
     */
    updateRegionDetailLevel(
        region: Region,
        vis: DetailWithChildren,
        viewport: Viewport,
        relativeThreshold: number,
        scaleThreshold: number
    ): void {
        region.setDetailLevel(vis)
        let isCritical = false

        region.children.forEach((childRegion) => {
            const childVis = this.computeDetailLevel(childRegion, viewport, relativeThreshold, scaleThreshold)
            if (childVis < vis) {
                isCritical = true
            }
            if (isDetailWithChildren(childVis)) {
                this.updateRegionDetailLevel(childRegion, childVis, viewport, relativeThreshold, scaleThreshold)
            } else {
                this.recursiveSetOOB(childRegion, childVis)
            }
        })

        if (isCritical) {
            this.criticalRegions.add(region)
        }
    }

    recursiveSetOOB(region: Region, vis: DetailWithoutChildren): void {
        region.setDetailLevel(vis)
        // region is not/no longer the parent of a detail level boundary as such it is not critical
        this.criticalRegions.delete(region)
        region.children.forEach((childRegion) => {
            // bail early when child is less or equally detailed already
            if (vis < childRegion.detail) {
                this.recursiveSetOOB(childRegion, vis)
            }
        })
    }

    /**
     * Looks for a change in detail level for all critical regions.
     * Applies the level change and manages the critical regions.
     *
     * @param viewport The current viewport
     * @param relativeThreshold The full detail threshold
     */
    checkCriticalRegions(viewport: Viewport, relativeThreshold: number, scaleThreshold: number): void {
        // All regions that are at a detail level boundary (child has lower detail level and parent is at a DetailWithChildren level).
        let toBeProcessed: Set<Region> = new Set(this.criticalRegions)

        // The regions that have become critical and therefore need to be checked as well
        let nextToBeProcessed: Set<Region> = new Set()

        while (toBeProcessed.size !== 0) {
            for (const region of toBeProcessed) {
                const vis = this.computeDetailLevel(region, viewport, relativeThreshold, scaleThreshold)
                region.setDetailLevel(vis)

                if (region.parent && vis !== region.parent.detail) {
                    nextToBeProcessed.add(region.parent)
                    this.criticalRegions.add(region.parent)
                }

                if (isDetailWithChildren(vis)) {
                    this.updateRegionDetailLevel(region, vis, viewport, relativeThreshold, scaleThreshold)
                } else {
                    this.recursiveSetOOB(region, vis)
                }
            }

            toBeProcessed = nextToBeProcessed
            nextToBeProcessed = new Set()
        }
    }

    /**
     * Decides the appropriate detail level for a region
     * based on their size in the viewport and visibility
     *
     * @param region The region in question
     * @param viewport The current viewport
     * @param relativeThreshold The full detail threshold
     * @returns The appropriate detail level
     */
    computeDetailLevel(
        region: Region,
        viewport: Viewport,
        relativeThreshold: number,
        scaleThreshold: number
    ): DetailLevel {
        if (!this.isInBounds(region, viewport)) {
            return DetailLevel.OutOfBounds
        }
        if (!region.parent) {
            // Regions without parents should always be full detail if they are visible
            return DetailLevel.FullDetails
        }
        const viewportSize = this.scaleMeasureInViewport(region.boundingRectangle, viewport)
        const scale = viewport.zoom * (region.boundingRectangle.properties.absoluteScale as number)
        // change to full detail when relative size threshold is reached or the scaling within the region is big enough to be readable.
        if (viewportSize >= relativeThreshold || scale > scaleThreshold) {
            return DetailLevel.FullDetails
        }
        return DetailLevel.MinimalDetails
    }

    /**
     * Checks visibility of a region with position from browser coordinates in current viewport.
     *
     * @param region The region in question for visibility.
     * @param viewport The current viewport.
     * @returns Boolean value indicating the visibility of the region in the current viewport.
     */
    isInBounds(region: Region, viewport: Viewport): boolean {
        if (region.absolutePosition) {
            const { canvasBounds } = this.rootElement

            return (
                region.absolutePosition.x + region.boundingRectangle.bounds.width - viewport.scroll.x >= 0 &&
                region.absolutePosition.x - viewport.scroll.x <= canvasBounds.width / viewport.zoom &&
                region.absolutePosition.y + region.boundingRectangle.bounds.height - viewport.scroll.y >= 0 &&
                region.absolutePosition.y - viewport.scroll.y <= canvasBounds.height / viewport.zoom
            )
        }
        // Better to assume it is visible, if information are not sufficient
        return true
    }

    /**
     * Compares the size of a node to the viewport and returns the smallest fraction of either height or width.
     *
     * @param node The KNode in question
     * @param viewport The current viewport
     * @returns the relative size of the KNodes shortest dimension
     */
    scaleMeasureInViewport(node: KNode, viewport: Viewport): number {
        const horizontal = node.bounds.width / (node.root.canvasBounds.width / viewport.zoom)
        const vertical = node.bounds.height / (node.root.canvasBounds.height / viewport.zoom)
        const absoluteScale = node.properties.absoluteScale as number
        const scaleMeasure = Math.min(horizontal, vertical)
        return scaleMeasure * absoluteScale
    }
}

/**
 * Combines KNodes into regions. These correspond to child areas. A region can correspond to
 * a region or a super state in the model. Also manages the boundaries, title candidates,
 * tree structure of the model and application of detail level of its KNodes.
 */
export class Region {
    /** The rectangle of the child area in which the region lies. */
    boundingRectangle: KNode

    /** The absolute position of the boundingRectangle based on the layout information of the SModel. */
    absolutePosition: Point

    /** the regions current detail level that is used by all children */
    detail: DetailLevel

    /** The immediate parent region of this region. */
    parent?: Region

    /** All immediate child regions of this region */
    children: Region[]

    /** Constructor initializes element array for region. */
    constructor(boundingRectangle: KNode) {
        this.boundingRectangle = boundingRectangle
        this.children = []
        this.detail = DetailLevel.FullDetails
    }

    /**
     * Applies the detail level to all elements of a region.
     * @param level the detail level to apply
     */
    setDetailLevel(level: DetailLevel): void {
        this.detail = level
    }
}
