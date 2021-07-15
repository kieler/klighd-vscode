/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 * 
 * Copyright 2021 by
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

import { KNode, DetailLevel, Region } from "@kieler/klighd-interactive/lib/constraint-classes";
import { SModelRoot, Viewport } from "sprotty";
import { RenderOptionsRegistry, FullDetailThreshold } from "./options/render-options-registry";
import { KContainerRendering, K_RECTANGLE } from "./skgraph-models";


/**
 * All DetailLevel where the children are visible
 */
type DetailWithChildren = DetailLevel.FullDetails

/**
 * Type predicate to determine wheter a DetailLevel is a DetailWithChilderen level
 */
function isDetailWithChildren(detail: DetailLevel): detail is DetailWithChildren {
    return detail === DetailLevel.FullDetails
}

/**
 * All DetailLevel where the children are not visible
 */
type DetailWithoutChildren = Exclude<DetailLevel, DetailWithChildren>

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
    rootRegions: Region[];

    /** 
     * The model for which the DepthMap is generated 
     */
    rootElement: SModelRoot;

    /**
     * The last viewport for which we updated the state of KNodes
     */
    viewport?: Viewport;

    /**
     * The threshold for which we updated the state of KNodes
     */
    lastThreshold?: number;

    /** 
     * Set for handling regions, that need to be checked for detail level changes.
     * Consists of the region that contain at least one child with a lower detail level.
     */
    criticalRegions: Set<Region>;

    /** Singleton pattern */
    private static instance?: DepthMap;

    /** 
     * @param rootElement The root element of the model. 
     */
    private constructor(rootElement: SModelRoot) {
        this.rootElement = rootElement
        this.rootRegions = []
        this.criticalRegions = new Set()
    }

    protected reset(model_root: SModelRoot): void {
        this.rootElement = model_root
        // rootRegions are reset below as we also want to remove the edges from the graph spaned by the regions
        this.criticalRegions.clear()
        this.viewport = undefined
        this.lastThreshold = undefined

        let current_regions = this.rootRegions
        let remaining_regions: Region[] = []

        // Go through all regions and clear the references to other Regions and KNodes
        while (current_regions.length !== 0) {
            for (const region of current_regions) {
                remaining_regions.concat(region.children)
                region.children = []
                region.elements = []
                region.parent = undefined
            }
            current_regions = remaining_regions
            remaining_regions = []
        }

        this.rootRegions = []
    }

    /**
     * Returns the current Depthmap instance or nothing if its not initilized
     * @returns Depthmap | undefined 
     */
    public static getDM(): DepthMap | undefined {
        return DepthMap.instance
    }

    /** 
     * Returns the current DepthMap instance or returns a new one.
     * @param rootElement The model root element.
     */
    public static init(rootElement: SModelRoot): void {
        let needsInit = false;
        if (!DepthMap.instance) {
            // Create new DepthMap, when there is none
            DepthMap.instance = new DepthMap(rootElement)
            needsInit = true
        } else if (DepthMap.instance.rootElement !== rootElement) {
            // Reset and reinitialize if the model changed
            DepthMap.instance.reset(rootElement)
            needsInit = true
        }

        if (needsInit) {
            for (const root_child of rootElement.children) {
                const node = root_child as KNode
                DepthMap.instance.initKNode(node)
                DepthMap.instance.initHelper(node)
            }

        }
    }

    /** 
     * Recursively finds all regions in model and initializes them.
     * 
     * @param node The current KNode checked.
     * @param region The current region being constructed.
     */
    protected initHelper(node: KNode): void {
        // Go through child nodes until there are no child nodes left.
        for (const child of node.children) {
            const childNode = child as KNode
            this.initKNode(childNode)
            this.initHelper(childNode)
        }

    }

    /**
     * All the ancestor KNodes of node should already be initialized 
     * 
     * @param node The KNode to initialize for DepthMap usage
     */
    public initKNode(node: KNode): void {
        if (node.containingRegion !== undefined && node.providingRegion !== undefined) {
            // KNode already initialized
            return
        } else if (node.parent === node.root) {
            node.containingRegion = null
            const providedRegion = new Region(node)
            providedRegion.absoluteBounds = node.bounds
            this.rootRegions.push(providedRegion)
        } else {
            node.containingRegion = (node.parent as KNode).providingRegion ?? (node.parent as KNode).containingRegion
            node.containingRegion?.elements.push(node)

            if (node.data.length > 0 && node.data[0].type == K_RECTANGLE && (node.data[0] as KContainerRendering).children[0]) {
                const providedRegion = new Region(node);

                // node should always have a containingRegion as we are not a direct SModelRoot child                
                providedRegion.parent = node.containingRegion ?? undefined;
                node.containingRegion?.children.push(providedRegion);

                let current = node.parent as KNode;
                let offsetX = 0;
                let offsetY = 0;

                while (current && !current.providingRegion) {
                    offsetX += current.bounds.x
                    offsetY += current.bounds.y
                    current = current.parent as KNode
                }

                offsetX += current?.providingRegion?.absoluteBounds?.x ?? 0
                offsetY += current?.providingRegion?.absoluteBounds?.y ?? 0

                providedRegion.absoluteBounds = {
                    x: offsetX + node.bounds.x,
                    y: offsetY + node.bounds.y,
                    width: node.bounds.width,
                    height: node.bounds.height
                }
            } else {
                node.providingRegion == null
            }

        }
    }

    /** 
     * Decides the appropriate detail level for regions based on their size in the viewport and applies that state.
     * 
     * @param viewport The current viewport. 
     */
    updateDetailLevels(viewport: Viewport, renderingOptions: RenderOptionsRegistry): void {

        const thresholdOption = renderingOptions.getValueForId(FullDetailThreshold.ID)
        const defaultThreshold = 0.2
        const fullDetailThreshold = thresholdOption ?? defaultThreshold

        if (this.viewport?.scroll === viewport.scroll
            && this.viewport?.zoom === viewport.zoom
            && this.lastThreshold === fullDetailThreshold) {
            // the viewport did not change, no need to update
            return
        }

        this.viewport = { zoom: viewport.zoom, scroll: viewport.scroll }
        this.lastThreshold = fullDetailThreshold;

        // Initialize detail level on first run.
        if (this.criticalRegions.size == 0) {
            for (const region of this.rootRegions) {
                const vis = this.computeDetailLevel(region, viewport, fullDetailThreshold)
                if (vis === DetailLevel.FullDetails) {
                    this.updateRegionDetailLevel(region, vis, viewport, fullDetailThreshold)
                }
            }
        } else {
            this.checkCriticalRegions(viewport, fullDetailThreshold)
        }
    }

    /**
     * Set detail level for the given region and recursively determine and update the chilrens detail level
     * 
     * @param region The root region
     * @param viewport The curent viewport
     * @param threshold The detail level threshold
     */
    updateRegionDetailLevel(region: Region, vis: DetailWithChildren, viewport: Viewport, threshold: number): void {
        region.setDetailLevel(vis)
        let isCritical = false;

        region.children.forEach(childRegion => {
            const childVis = this.computeDetailLevel(childRegion, viewport, threshold);
            if (childVis < vis) {
                isCritical = true
            }
            if (isDetailWithChildren(childVis)) {
                this.updateRegionDetailLevel(childRegion, childVis, viewport, threshold)
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
        region.children.forEach(childRegion => {
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
     * @param threshold The full detail threshold
     */
    checkCriticalRegions(viewport: Viewport, threshold: number): void {
        // Use set of child regions to avoid multiple checks.
        const childSet: Set<Region> = new Set()

        // All regions that are at a detail level boundary (child has lower detail level and parent is at a DetailWithChildren level).
        let toBeProcessed: Set<Region> = new Set(this.criticalRegions)

        // The regions that have become critical and therfore need to be checked as well
        let nextToBeProcessed: Set<Region> = new Set()

        while (toBeProcessed.size !== 0) {
            toBeProcessed.forEach(region => {
                const vis = this.computeDetailLevel(region, viewport, threshold);

                if (region.parent && vis !== region.parent.detail) {
                    if (region.parent) {
                        nextToBeProcessed.add(region.parent)
                        this.criticalRegions.add(region.parent)
                    }
                    if (isDetailWithChildren(vis)) {
                        this.updateRegionDetailLevel(region, vis, viewport, threshold)
                    } else {
                        this.recursiveSetOOB(region, vis)
                    }
                } else {
                    // Add children to check for detail level change.
                    region.children.forEach(childRegion => {
                        childSet.add(childRegion)
                    })
                }

            })

            toBeProcessed = nextToBeProcessed;
            nextToBeProcessed = new Set();
        }

        // Check all collected child regions of detail level.
        childSet.forEach(childRegion => {
            const vis = this.computeDetailLevel(childRegion, viewport, threshold);
            if (childRegion.parent && childRegion.parent.detail !== vis) {
                this.criticalRegions.add(childRegion.parent)
            }

            if (isDetailWithChildren(vis)) {
                this.updateRegionDetailLevel(childRegion, vis, viewport, threshold)
            } else {
                this.recursiveSetOOB(childRegion, vis)
            }
        })

        childSet.clear()
    }

    /**
     * Decides the appropriate detail level for a region
     * based on their size in the viewport and visibility
     * 
     * @param region The region in question
     * @param viewport The currenr viewport
     * @param threshold The full detail threshold
     * @returns The appropriate detail level
     */
    computeDetailLevel(region: Region, viewport: Viewport, threshold: number): DetailLevel {
        if (!this.isInBounds(region, viewport)) {
            return DetailLevel.OutOfBounds
        } else if (!region.parent) {
            // Regions without parents should always be full detail if they are visible
            return DetailLevel.FullDetails
        } else {
            const viewportSize = this.sizeInViewport(region.boundingRectangle, viewport)
            // change to full detail when relative size threshold is reached
            if (viewportSize >= threshold) {
                return DetailLevel.FullDetails
            } else {
                return DetailLevel.MinimalDetails
            }
        }
    }

    /** 
     * Checks visibility of a region with position from browser coordinates in current viewport.
     * 
     * @param region The region in question for visiblity.
     * @param viewport The current viewport.
     * @returns Boolean value indicating the visibility of the region in the current viewport. 
     */
    isInBounds(region: Region, viewport: Viewport): boolean {
        if (region.absoluteBounds) {
            const canvasBounds = this.rootElement.canvasBounds

            return region.absoluteBounds.x + region.absoluteBounds.width - viewport.scroll.x >= 0
                && region.absoluteBounds.x - viewport.scroll.x <= (canvasBounds.width / viewport.zoom)
                && region.absoluteBounds.y + region.absoluteBounds.height - viewport.scroll.y >= 0
                && region.absoluteBounds.y - viewport.scroll.y <= (canvasBounds.height / viewport.zoom)
        } else {
            // Better to assume it is visible, if information are not sufficient
            return true
        }
    }

    /** 
     * Compares the size of a node to the viewport and returns the smallest fraction of either height or width.
     * 
     * @param node The KNode in question
     * @param viewport The curent viewport
     * @returns the relative size of the KNodes shortest dimension
     */
    sizeInViewport(node: KNode, viewport: Viewport): number {
        const horizontal = node.bounds.width / (node.root.canvasBounds.width / viewport.zoom)
        const vertical = node.bounds.height / (node.root.canvasBounds.height / viewport.zoom)
        return horizontal < vertical ? horizontal : vertical
    }
}

