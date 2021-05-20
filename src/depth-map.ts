
import { KNode } from "@kieler/keith-interactive/lib/constraint-classes";
import { Bounds, SModelRoot, Viewport } from "sprotty";
import { RenderingOptions, ExpandCollapseThreshold } from "./options";
import { KContainerRendering, KText, K_RECTANGLE } from "./skgraph-models";

const EXPANDED = true
const COLLAPSED = false

/**
 * Divides Model KNodes into regions. These are then saved in the 2D depthArray,
 * where the first index corresponds to nesting depth. On these expand and collapse actions
 * are defined via the expansionState. Also holds additional information to determine
 * the appropriate expansion state, visibility and title for regions.
 */
export class DepthMap {
    /** 
     * Stores all regions sorted by nesting depth. The first index corresponds
     * to the nesting depth and the second index is for each region of that depth. 
     */
    depthArray: Region[][];
    /** Used to access the model and monitor switching of models. */
    rootElement: SModelRoot;
    /** A quick lookup map with the id of the bounding child area of a region as key. */
    regionMap: Map<String, Region>;

    viewport?: Viewport;

    /** 
     * Set for handling regions, that need to be checked for expansion state.
     * Consists of the last expanded regions in the hierarchy.
    */
    criticalRegions: Set<Region>;
    /** Rendering options for adjusting functions. */
    renderingOptions: RenderingOptions
    /** Will be changed to true, when all micro layouting, etc. is done. */
    isCompleteRendering: boolean = false
    /** Lookup map for quickly checking macro and super state titles. */
    titleMap: Map<KText, KText>
    /** Threshold and compensation margin for error in absolute bounds positions. */
    absoluteVisibilityBuffer: number = 500
    /** Singleton pattern */
    private static instance: DepthMap;

    /** 
     * Singleton pattern
     * @param rootElement The root element of the model. 
     */
    private constructor(rootElement: SModelRoot) {
        this.rootElement = rootElement
    }

    /** 
     * Returns the current DepthMap instance or returns a new one.
     * @param rootElement The model root element.
     */
    public static getInstance(rootElement: SModelRoot): DepthMap {
        // Create new DepthMap, when there is none or the model is switched.
        if (!DepthMap.instance || DepthMap.instance.rootElement !== rootElement) {
            DepthMap.instance = new DepthMap(rootElement);
            DepthMap.instance.init()
        }
        return DepthMap.instance
    }

    /** Create a new DepthMap. */
    protected init() {
        this.regionMap = new Map()
        this.titleMap = new Map()
        this.criticalRegions = new Set()
        for (let child of this.rootElement.children) {
            this.depthArray = []
            this.initHelper((child as KNode), 0)
        }
        this.findParentsAndChildren()
    }

    /** 
     * Recursively finds all regions in model and initializes them.
     * 
     * @param node The current KNode checked.
     * @param depth The current nesting depth of regions.
     * @param region The current region being constructed.
     */
    protected initHelper(node: KNode, depth: number, region?: Region) {
        // Get or create current depthArray and region.
        this.depthArray[depth] = this.depthArray[depth] ? this.depthArray[depth] : []
        let curRegion = region ? region : this.createRegion(node.parent as KNode)
        // Go through child nodes until there are no child nodes left.
        if (node.children.length !== 0) {
            for (let child of node.children) {
                // Handle immediate children of the root element seperately.
                if (!(child.parent.id === "$root")) {
                    // Add the current node as element of region.
                    curRegion.elements.push(child as KNode)
                    // When the bounding rectangle of a new child area is reached, a new region is created.
                    if ((child as KNode).data.length > 0 && (child as KNode).data[0].type === K_RECTANGLE
                        && ((child as KNode).data[0] as KContainerRendering).children[0]) {
                        let nextRegion = this.createRegion(child as KNode)
                        // In the models parent child structure a child can occur multiple times.
                        if (!this.regionMap.has(curRegion.boundingRectangle.id)) {
                            this.addRegionToMap(depth, curRegion)
                        }
                        // Continue with the children of the new region.
                        this.initHelper((child as KNode), (depth + 1), nextRegion)
                    } else {
                        // Continue with the other children on the current depth level.
                        this.initHelper((child as KNode), depth, curRegion)
                    }
                } else {
                    this.initHelper((child as KNode), depth)
                }
            }
        } else {
            // Add the last regions, if there are no more child nodes
            if (!this.regionMap.has(curRegion.boundingRectangle.id)) {
                this.addRegionToMap(depth, curRegion)
            }
        }
    }

    /** 
     * Initializes a new region.
     * 
     * @param boundingRectangle The rectangle of the child area the region is inside of 
     * @returns The new region object. 
     */
    protected createRegion(boundingRectangle?: KNode): Region {
        let region = new Region()
        if (boundingRectangle) {
            region.boundingRectangle = boundingRectangle
        }
        region.children = new Set()
        region.hasTitle = false
        return region
    }

    /** 
     * Adds a region to the depth map.
     * 
     * @param depth The nesting depth the region is put into. 
     * @param region The region to add. 
     */
    protected addRegionToMap(depth: number, region: Region) {
        if (region.boundingRectangle && this.depthArray[depth]) {
            this.depthArray[depth].push(region)
            this.regionMap.set(region.boundingRectangle.id, region)
        }
    }

    /** Goes through each region from the bottom up to determine parent children structure. */
    protected findParentsAndChildren() {
        for (let i = this.depthArray.length - 1; i >= 0; i--) {
            for (let curDepth of this.depthArray) {
                for (let region of curDepth) {
                    if (region.boundingRectangle) {
                        this.findParentsAndChildrenHelper(region, region.boundingRectangle.parent as KNode)
                    }
                }
            }
        }
    }

    /** 
     * Goes through parents of a node until a new region is reached and add corresponding parent and child entries.
     * 
     * @param region The region for which the parent region is searched for.
     * @param node The curent node the function is on to traverse the model. 
     */
    protected findParentsAndChildrenHelper(region: Region, node: KNode) {
        const parentRegion = this.regionMap.get(node.id)
        if (parentRegion) {
            region.parent = parentRegion
            parentRegion.children.add(region)
        } else if (node.parent) {
            this.findParentsAndChildrenHelper(region, node.parent as KNode)
        }
    }


    /** 
     * Goes through all elements of each region to find the region with the specified KNode.
     * @param node The KNode to search for. 
     */
    findRegionWithElement(node: KNode): Region | undefined {
        for (let curDepth of this.depthArray) {
            for (let region of curDepth) {
                for (let element of region.elements) {
                    if (element === node) {
                        return region
                    }
                }
            }
        }
        return undefined
    }

    /** 
     * Finds region with corresponding rectangle id of a child area.
     * @param id ID of the rectangle the child area is in. 
     */
    getRegion(id: String): Region | undefined {
        return this.regionMap.get(id)
    }

    /** 
     * Decides the appropriate collapsed or expanded state for region based on their size in the viewport and applies that state.
     * When the native resolution of the graph is reached, all visible regions will be expanded.
     * Also collapses all invisible states.
     * 
     * @param viewport The current viewport. 
     */
    expandCollapse(viewport: Viewport) {

        if (this.viewport?.scroll === viewport.scroll && this.viewport?.zoom === viewport.zoom) {
            return
        }

        this.viewport = { zoom: viewport.zoom, scroll: viewport.scroll }

        // Load Render Options
        if (!this.renderingOptions) {
            this.renderingOptions = RenderingOptions.getInstance()
        }
        const thresholdOption = this.renderingOptions.getOption(ExpandCollapseThreshold.ID)
        const defaultThreshold = 0.2
        const expandCollapseThreshold = thresholdOption ? thresholdOption.currentValue : defaultThreshold
        // Initialize expansion states on first run.
        if (this.criticalRegions.size == 0) {
            let firstRegion: Region
            let breakCheck = false
            for (let curDepth of this.depthArray) {
                for (let region of curDepth) {
                    firstRegion = region
                    if (this.getExpansionState(firstRegion, viewport, expandCollapseThreshold)) {
                        this.searchUntilCollapse(firstRegion, viewport, expandCollapseThreshold)
                    }
                    breakCheck = true
                    break
                }
                if (breakCheck) {
                    break
                }
            }
        } else {
            this.checkCriticalRegions(viewport, expandCollapseThreshold)
        }
    }

    /**
     * Finds the regions with the lowest nesting level, that need to be collapsed and applies the state to it
     * as well as all children until the model is exhausted.
     * 
     * @param region The root region
     * @param viewport The curent viewport
     * @param threshold The expand/collapse threshold
     */
    searchUntilCollapse(region: Region, viewport: Viewport, threshold: number) {
        region.setExpansionState(true)
        region.children.forEach(childRegion => {
            if (childRegion.boundingRectangle) {
                if (this.sizeInViewport(childRegion.boundingRectangle, viewport) <= threshold) {
                    this.criticalRegions.add(region)
                    this.applyExpansionState(childRegion, false)
                } else {
                    this.searchUntilCollapse(childRegion, viewport, threshold)
                }
            }
        })
    }

    /** Applies expansion state recursively to all children */
    applyExpansionState(region: Region, expansionState: boolean) {
        region.setExpansionState(expansionState)
        region.children.forEach(childRegion => {
            this.applyExpansionState(childRegion, expansionState)
        })
    }

    /**
     * Looks for a change in expansion state for all critical regions.
     * Applies this state and manages the critical regions.
     * 
     * @param viewport The current viewport
     * @param threshold The expand/collapse threshold
     */
    checkCriticalRegions(viewport: Viewport, threshold: number) {
        // Use set of child regions to avoid multiple checks.
        let childSet: Set<Region> = new Set()
        // All regions here are currently expanded.
        this.criticalRegions.forEach(region => {
            // Collapse either if the parent region is collapsed or the expansion state changes.
            if (region.parent && region.parent.expansionState == COLLAPSED || !this.getExpansionState(region, viewport, threshold)) {
                region.setExpansionState(false)
                this.criticalRegions.delete(region)
                if (region.parent) {
                    this.criticalRegions.add(region.parent)
                }
                // Collapse all children.
                region.children.forEach(childRegion => {
                    childRegion.setExpansionState(false)
                })
            } else {
                // Add children to check for expansion state change.
                region.children.forEach(childRegion => {
                    childSet.add(childRegion)
                })
            }
        })
        // Check all collected child regions of expanded states.
        childSet.forEach(childRegion => {
            if (this.getExpansionState(childRegion, viewport, threshold)) {
                childRegion.setExpansionState(true)
                this.criticalRegions.add(childRegion)
            }
        })
        childSet.clear()
    }

    /**
     * Decides the appropriate collapsed or expanded state for a region
     * based on their size in the viewport and visibility
     * 
     * @param region The region in question
     * @param viewport The currenr viewport
     * @param threshold The expand/collapse threshold
     * @returns The appropriate expansion state.
     */
    getExpansionState(region: Region, viewport: Viewport, threshold: number): boolean {
        // Collapse all invisible states and regions.
        if (!this.isVisible(region, viewport)) {
            return COLLAPSED
            // The root has no boundingRectangle.
        } else if (!region.boundingRectangle) {
            return EXPANDED
        } else {
            let viewportSize = this.sizeInViewport(region.boundingRectangle, viewport)
            // Expand when reached relative size threshold or native resolution.
            if (viewportSize >= threshold || viewport.zoom >= 1) {
                return EXPANDED
                // Collapse when reached relative size threshold.
            } else {
                return COLLAPSED
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
    isVisible(region: Region, viewport: Viewport): boolean {
        if (region.absoluteBounds) {
            const canvasBounds = this.rootElement.canvasBounds
            return region.absoluteBounds.x + region.absoluteBounds.width >= viewport.scroll.x - this.absoluteVisibilityBuffer
                && region.absoluteBounds.x <= viewport.scroll.x + (canvasBounds.width / viewport.zoom) + this.absoluteVisibilityBuffer
                && region.absoluteBounds.y + region.absoluteBounds.height >= viewport.scroll.y - this.absoluteVisibilityBuffer
                && region.absoluteBounds.y <= viewport.scroll.y + (canvasBounds.height / viewport.zoom) + this.absoluteVisibilityBuffer
        } else {
            // Better to assume it is visible, if information are not sufficient
            return true
        }
    }

    /** 
     * Compares the size of a node to the viewport and returns the biggest fraction of either height or width.
     * 
     * @param node The KNode in question
     * @param viewport The curent viewport
     * @returns  
     */
    sizeInViewport(node: KNode, viewport: Viewport): number {
        const horizontal = node.bounds.width / (node.root.canvasBounds.width / viewport.zoom)
        const vertical = node.bounds.height / (node.root.canvasBounds.height / viewport.zoom)
        return horizontal > vertical ? horizontal : vertical
    }
}

/**
 * Combines KNodes into regions. These correspond to child areas. A region can correspond to 
 * a region or a super state in the model. Also manages the boundaries, title candidates, 
 * tree structure of the model and application of expansion state of its KNodes.
 */
export class Region {
    /** All KNodes specifically in the region. */
    elements: KNode[]
    /** The rectangle of the child area in which the region lies. */
    boundingRectangle: KNode
    /** Gained using browser position and rescaling and are therefore not perfect. */
    absoluteBounds: Bounds
    /** Determines if the region is expanded (true) or collapsed (false). */
    expansionState: boolean
    /** The immediate parent region of this region. */
    parent: Region
    /** All immediate child regions of this region */
    children: Set<Region>
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
    constructor() {
        this.elements = []
    }

    /** 
     * Applies the expansion state to all elements of a region.
     * @param state True for expanded and false for collapsed. 
     */
    setExpansionState(state: boolean): void {
        this.expansionState = state
        for (let elem of this.elements) {
            elem.expansionState = state
        }
    }
}
