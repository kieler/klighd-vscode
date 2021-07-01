/*
* This program and the accompanying materials are made available under the
* terms of the Eclipse Public License 2.0 which is available at
* http://www.eclipse.org/legal/epl-2.0.
*
* SPDX-License-Identifier: EPL-2.0
*/

import { KNode, DetailLevel, DetailReference } from "klighd-interactive/lib/constraint-classes";
import { VNode } from "snabbdom/vnode";
import { Bounds, SModelRoot, Viewport } from "sprotty";
import { RenderOptionsRegistry, FullDetailThreshold } from "./options/render-options-registry";
import { KContainerRendering, KText, K_RECTANGLE } from "./skgraph-models";


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
     * Stores the last rendered VNode such that in case of pan / zoom actions the {@link VNode} is not redrawn
     */
    lastRender?: VNode | VNode[];

    /** 
     * The model for which the DepthMap is generated 
     */
    rootElement: SModelRoot;

    /**  
     * A quick lookup map with the id of the bounding child area of a region as key.
     */
    regionMap: Map<string, Region>;

    /**
     * The last viewport for which we updated the state of KNodes
     */
    viewport?: Viewport;

    zoomActionsSinceRenders: number;

    maxZoomActionsUntilRender = 5;

    /**
     * The threshold for which we updated the state of KNodes
     */
    lastThreshold?: number;

    /** 
     * Set for handling regions, that need to be checked for detail level changes.
     * Consists of the region that contain at least one child with a lower detail level.
     */
    criticalRegions: Set<Region>;

    /**
     *  Lookup set for quickly checking macro and super state titles. 
     */
    titleMap: Set<KText>

    /** Singleton pattern */
    private static instance?: DepthMap;

    /** 
     * @param rootElement The root element of the model. 
     */
    private constructor(rootElement: SModelRoot) {
        this.rootElement = rootElement
        this.rootRegions = []
        this.regionMap = new Map()
        this.titleMap = new Set()
        this.criticalRegions = new Set()
        this.zoomActionsSinceRenders = 0
    }

    protected reset(model_root: SModelRoot): void {
        this.rootElement = model_root
        // rootRegions are reset below as we also want to remove the edges from the graph spaned by the regions
        this.regionMap.clear()
        this.titleMap.clear()
        this.criticalRegions.clear()
        this.viewport = undefined
        this.lastThreshold = undefined
        this.lastRender = undefined
        this.zoomActionsSinceRenders = 0

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
                const region = new Region(node)
                region.absoluteBounds = node.bounds
                DepthMap.instance.rootRegions.push(region)
                DepthMap.instance.addRegionToMap(region)
                DepthMap.instance.initHelper(node, 0, region, node.bounds.x, node.bounds.y)
            }

        }
    }

    /** 
     * Recursively finds all regions in model and initializes them.
     * 
     * @param node The current KNode checked.
     * @param depth The current nesting depth of regions.
     * @param region The current region being constructed.
     */
    protected initHelper(node: KNode, depth: number, region: Region, offsetX: number, offsetY: number): void {
        // Go through child nodes until there are no child nodes left.
        for (const child of node.children) {
            // Add the current node as element of region.
            region.elements.push(child as KNode);

            (child as KNode).detailReference = region.detailReference

            // When the bounding rectangle of a new child area is reached, a new region is created.
            if ((child as KNode).data.length > 0 && (child as KNode).data[0].type === K_RECTANGLE
                && ((child as KNode).data[0] as unknown as KContainerRendering).children[0]) {
                const nextRegion = new Region(child as KNode)
                nextRegion.absoluteBounds = {
                    x: offsetX + (child as KNode).bounds.x,
                    y: offsetY + (child as KNode).bounds.y,
                    width: (child as KNode).bounds.width,
                    height: (child as KNode).bounds.height
                }
                nextRegion.parent = region
                region.children.push(nextRegion)
                // In the models parent child structure a child can occur multiple times.
                this.addRegionToMap(nextRegion)
                // Continue with the children of the new region.
                this.initHelper((child as KNode), (depth + 1), nextRegion, nextRegion.absoluteBounds.x, nextRegion.absoluteBounds.y)
            } else {
                // Continue with the other children on the current depth level.
                this.initHelper((child as KNode), depth, region, offsetX + (child as KNode).bounds.x, offsetY + (child as KNode).bounds.y)
            }
        }

    }

    /** 
     * Adds a region to the depth map.
     * 
     * @param depth The nesting depth the region is put into. 
     * @param region The region to add. 
     */
    protected addRegionToMap(region: Region): void {
        this.regionMap.set(region.boundingRectangle.id, region)
    }

    /** 
     * Find the region that contains the node,
     *  this should be the first ancestor that is a region
     * @param node The KNode to search for. 
     */
    findRegionWithElement(node: KNode): Region | undefined {
        let current = node.parent as KNode;
        while (current) {

            const region = this.getRegion(current.id);

            if (region) {
                return region
            }

            current = current.parent as KNode
        }
        return undefined
    }

    /** 
     * Finds region with corresponding rectangle id of a child area.
     * @param id ID of the rectangle the child area is in. 
     */
    getRegion(id: string): Region | undefined {
        return this.regionMap.get(id)
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

        if (viewport.zoom !== this.viewport?.zoom) this.zoomActionsSinceRenders += 1
        if (this.zoomActionsSinceRenders > this.maxZoomActionsUntilRender) {
            this.zoomActionsSinceRenders = 0
            this.lastRender = undefined
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
            if (vis < childRegion.detailReference.detailLevel) {
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

                if (region.parent && vis !== region.parent.detailReference.detailLevel) {
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
            if (childRegion.parent && childRegion.parent.detailReference.detailLevel !== vis) {
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



/**
 * Combines KNodes into regions. These correspond to child areas. A region can correspond to 
 * a region or a super state in the model. Also manages the boundaries, title candidates, 
 * tree structure of the model and application of detail level of its KNodes.
 */
export class Region {
    /** All KNodes specifically in the region. */
    elements: KNode[]
    /** The rectangle of the child area in which the region lies. */
    boundingRectangle: KNode
    /** Gained using browser position and rescaling and are therefore not perfect. */
    absoluteBounds: Bounds
    /** the refernce to the regions current detail level that is shared with all children */
    detailReference: DetailReference
    /** The immediate parent region of this region. */
    parent?: Region
    /** All immediate child regions of this region */
    children: Region[]
    /** Determines if the region has a title by default. */
    hasTitle: boolean
    /** Contains a macro state title, if there is at least one in the region. */
    macroStateTitle?: KText
    /** Contains a super state title, if there is one. */
    superStateTitle?: KText
    /** Determines if there is at least one macro state in the region. */
    hasMacroState: boolean
    /** Determines if there are more than one macro state in the region. */
    hasMultipleMacroStates: boolean

    /** Constructor initializes element array for region. */
    constructor(boundingRectangle: KNode) {
        this.boundingRectangle = boundingRectangle
        this.elements = []
        this.children = []
        this.hasTitle = false
        this.detailReference = { detailLevel: DetailLevel.FullDetails }
    }

    /** 
     * Applies the detail level to all elements of a region.
     * @param level the detail leveel to apply
     */
    setDetailLevel(level: DetailLevel): void {
        if (level !== DetailLevel.OutOfBounds && level !== this.detailReference.detailLevel) {
            const dm = DepthMap.getDM();
            if (dm) {
                // clear the lastRender as we need to rerender
                dm.lastRender = undefined
                dm.zoomActionsSinceRenders = 0
            }
        }

        this.detailReference.detailLevel = level
    }
}
