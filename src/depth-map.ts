
import { KNode } from "@kieler/keith-interactive/lib/constraint-classes";
import { Bounds, SModelRoot, Viewport } from "sprotty";
import { RenderingOptions, ExpandCollapseThreshold } from "./options";
import { KText, K_RECTANGLE } from "./skgraph-models";

export class DepthMap {
    // Stores all regions sorted by nesting deth.
    depthArray: Region[][];
    // Also used to monitor the switching of models.
    rootElement: SModelRoot;
    // A quick lookup map with the id of the bounding child area of a region as key.
    regionMap: Map<String, Region>;
    // Rendering options for adjusting functions.
    renderingOptions: RenderingOptions
    // Will be changed to true, when all micro layouting, etc. is done.
    isCompleteRendering: boolean = false
    // Lookup map for quickly checking macro state titles.
    titleMap: Map<KText, KText>
    // Threshold and Compensation in viewport for error in absolute bounds positions.
    absoluteVisibilityBuffer: number = 500
    // Singleton pattern
    private static instance: DepthMap;

    private constructor(rootElement: SModelRoot) {
        this.rootElement = rootElement
    }
    
    /**
     * Returns the current DepthMap instance or returns a new one.
     * @param rootElement The model root element.
    */
    static getInstance(rootElement: SModelRoot): DepthMap {
        // Create new DepthMap, when there is none or the model is switched.
        if (!DepthMap.instance || DepthMap.instance.rootElement !== rootElement) {
            DepthMap.instance = new DepthMap(rootElement);
            DepthMap.instance.init()
        }
        return DepthMap.instance
    }

    /**
     * Returns a DepthMap instance, if there is one.
     */
    static getCurrentInstance(): DepthMap | undefined {
        if (DepthMap.instance) {
            return DepthMap.instance
        } else {
            return undefined
        }
    }

    // Create a new DepthMap.
    protected init() {
        this.regionMap = new Map()
        this.titleMap = new Map()
        for (let child of this.rootElement.children) {
            this.depthArray = []
            this.initHelper((child as KNode), 0)
        }
        this.findParentsAndChildren()
    }
    
    // Recusively finds all regions in model and initializes them.
    protected initHelper(node: KNode, depth: number, region?: Region) {
        // Get or create current depthArray and region.
        this.depthArray[depth] = this.depthArray[depth] ? this.depthArray[depth] : []
        let curRegion: Region
        if (region) {
            curRegion = region
        } else {
            curRegion = this.createRegion(node.parent as KNode)
        }
        // Go through child nodes until there are no child nodes left.
        if (node.children.length !== 0) {
            for (let child of node.children) {
                // Handle immediate children of the root element seperately.
                if (!(child.parent.id === "$root")) {
                    // Add the current node as element of region.
                    curRegion.elements.push(child as KNode)
                    // When the bounding rectangle of a new child area is reached, a new region is created.
                    if ((child as KNode).data.length > 0 && (child as KNode).data[0].type === K_RECTANGLE) {
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

    createRegion(boundingRectangle?: KNode): Region {
        let region = new Region()
        if (boundingRectangle) {
            region.boundingRectangle = boundingRectangle
        }
        region.children = new Set()
        region.hasTitle = false
        return region
    }

    addRegionToMap(depth: number, region: Region) {
        if (region.boundingRectangle && this.depthArray[depth]) {
            this.depthArray[depth].push(region)
            this.regionMap.set(region.boundingRectangle.id, region)
        }
    }
    
    // Goes through each region from the bottom up to determine parent children structure.
    protected findParentsAndChildren() {
        for (let i = this.depthArray.length - 1; i >= 0; i--) {
            for (let curArray of this.depthArray) {
                for (let region of curArray) {
                    if (region.boundingRectangle) {
                        this.findParentsAndChildrenHelper(region, region.boundingRectangle.parent as KNode)
                    }
                }
            }
        }
    }
    
    // Goes through parents of a node until a new region is reached and add corresponding parent and child entries.
    protected findParentsAndChildrenHelper(region: Region, node: KNode) {
        const parentRegion = this.regionMap.get(node.id)
        if (parentRegion) {
            region.parent = parentRegion
            parentRegion.children.add(region)
        } else if (node.parent) {
            this.findParentsAndChildrenHelper(region, node.parent as KNode)
        }
    }
    
    // 
    /**
     * Returns all regions with a specified nesting depth.
     * @param depth The requested nesting depth.
     */
    getRegionsWithDepth(depth: number): Region[] {
        return this.depthArray[depth]
    }

    /**
     * Goes through all elements of each region to find the region with the specified KNode.
     * @param node The KNode to search for.
     */
    findRegionWithElement(node: KNode): Region | undefined {
        for (let curArray of this.depthArray) {
            for (let region of curArray) {
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
     * @param viewport The current viewport.
     */
    expandCollapse(viewport: Viewport): void {
        if (!this.renderingOptions) {
            this.renderingOptions = RenderingOptions.getInstance()
        }
        const thresholdOption = this.renderingOptions.getOption(ExpandCollapseThreshold.ID)
        const defaultThreshold = 0.2
        const expandCollapseThreshold = thresholdOption ? thresholdOption.currentValue : defaultThreshold
        for (let curArray of this.depthArray) {
            for (let region of curArray) {
                // Collapse all invisible states and regions.
                if (!this.isVisible(region, viewport)) {
                    region.setExpansionState(false)
                // The root has no boundingRectangle.
                } else if (!region.boundingRectangle) {
                    region.setExpansionState(true)
                // Expand when reached relative size threshold or native resolution.
                } else if (this.sizeInViewport(region.boundingRectangle, viewport) >= expandCollapseThreshold
                           || viewport.zoom >= 1) {
                    region.setExpansionState(true)
                // Collapse when reached relative size threshold.
                } else if (this.sizeInViewport(region.boundingRectangle, viewport) <= expandCollapseThreshold) {
                    region.setExpansionState(false)
                }
            }
        }
    }

    /**
     * Checks visibility of a region with position from browser coordinates in current viewport.
     * @param region The region in question for visiblity.
     * @param viewport The current viewport.
     * @returns 
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

export class Region {
    // All KNodes in the region.
    elements: KNode[]
    // This is the rectangle of the child area in which the region lies.
    boundingRectangle: KNode
    // Gained using browser position and rescaling and are therefore not perfect.
    absoluteBounds: Bounds
    // Determines if the state is expanded (true) or collapsed (false).
    expansionState: boolean
    // The immediate parent region of this region.
    parent: Region
    // All immediate child regions of this region
    children: Set<Region>
    // Determines if the region has a title by default.
    hasTitle: boolean
    // Contains a macro state title, if there is at least one in the region.
    macroStateTitle?: KText
    // Contains a super state title, if there is just one child region.
    superStateTitle?: KText
    // Determines if there is at least one macro state in the region.
    hasMacroState: boolean
    // Determines if there are more than one macro state in the region.
    hasMultipleMacroStates: boolean

    constructor(){
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
