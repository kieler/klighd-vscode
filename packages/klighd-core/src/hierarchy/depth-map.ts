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

import { KGraphElement } from "@kieler/klighd-interactive/lib/constraint-classes";
import { SChildElement, SModelRoot } from "sprotty";
import { Viewport } from "sprotty-protocol";
import { FullDetailRelativeThreshold } from "../options/render-options-registry";
import { SKGraphModelRenderer } from "../skgraph-model-renderer";
import { isContainerRendering, isRendering, KRendering, SKNode } from "../skgraph-models";
import { Region } from "./region";

/**
 * The possible detail level of a KNode as determined by the DepthMap
 */
export enum DetailLevel {
    FullDetails = 2,
    MinimalDetails = 1,
    OutOfBounds = 0
}

/**
 * All DetailLevel where the children are visible
 */
type DetailWithChildren = DetailLevel.FullDetails

type KChildElement = SChildElement & KGraphElement;

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

type RegionIndexEntry = { containingRegion: Region, providingRegion: undefined }
    | { containingRegion: undefined, providingRegion: Region }
    | { containingRegion: Region, providingRegion: Region }

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
    private rootRegions: Region[];

    /**
     * The model for which the DepthMap is generated
     */
    private rootElement: SModelRoot;

    /**
     * Maps a given node id to the containing/providing Region
     * Root Child Nodes will have a providing region and no containing Region, while all
     * other nodes will have at least a containing region
     */
    private regionIndexMap: Map<string, RegionIndexEntry>;

    /**
     * The last viewport for which we updated the state of KNodes
     */
    private viewport?: Viewport;

    /**
     * The threshold for which we updated the state of KNodes
     */
    private lastThreshold?: number;

    /**
     * Set for handling regions, that need to be checked for detail level changes.
     * Consists of the region that contain at least one child with a lower detail level.
     */
    private criticalRegions: Set<Region>;

    /** Singleton pattern */
    private static instance?: DepthMap;

    /**
     * @param rootElement The root element of the model.
     */
    private constructor(rootElement: SModelRoot) {
        this.rootElement = rootElement
        this.rootRegions = []
        this.criticalRegions = new Set()
        this.regionIndexMap = new Map()
    }

    protected reset(modelRoot: SModelRoot): void {
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
    public static init(rootElement: SModelRoot): void {
        if (!DepthMap.instance) {
            // Create new DepthMap, when there is none
            DepthMap.instance = new DepthMap(rootElement)
        } else if (DepthMap.instance.rootElement !== rootElement) {
            // Reset and reinitialize if the model changed
            DepthMap.instance.reset(rootElement)
        }
    }

    /**
     * It is generally advised to initialize the elements from root to leaf
     *
     * @param element The KChildElement to initialize for DepthMap usage
     * @param ctx The rendering context
     */
    public initKGraphElement(element: KChildElement, ctx: SKGraphModelRenderer): RegionIndexEntry {

        let entry = this.regionIndexMap.get(element.id)
        if (entry) {
            // KNode already initialized
            return entry
        }

        if (element.parent === element.root && element instanceof SKNode) {
            const providedRegion = new Region(element)

            entry = { providingRegion: providedRegion, containingRegion: undefined }

            element.calculateScaledBounds(ctx)
            providedRegion.detail = providedRegion.computeDetailLevel(ctx)

            this.rootRegions.push(providedRegion)

        } else {

            const parentEntry = this.initKGraphElement(element.parent as KChildElement, ctx);

            entry = { containingRegion: parentEntry.providingRegion ?? parentEntry.containingRegion, providingRegion: undefined }

            const kRendering = this.findRendering(element)
            if (element instanceof SKNode && kRendering && isContainerRendering(kRendering) && kRendering.children.length !== 0) {


                entry = { containingRegion: entry.containingRegion, providingRegion: new Region(element) }

                entry.providingRegion.parent = entry.containingRegion
                entry.containingRegion.children.push(entry.providingRegion);

                element.calculateScaledBounds(ctx)
                entry.providingRegion.detail = entry.providingRegion.computeDetailLevel(ctx)
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
    findRendering(element: KGraphElement): KRendering | undefined {
        for (const data of element.data) {
            if (data === null)
                continue
            if (isRendering(data)) {
                return data
            }
        }
        return undefined
    }

    public getContainingRegion(element: KChildElement, ctx: SKGraphModelRenderer): Region | undefined {
        // initKGraphELement already checks if it is already initialized and if it is returns the existing value
        return this.initKGraphElement(element, ctx).containingRegion
    }

    public getProvidingRegion(node: SKNode, ctx: SKGraphModelRenderer): Region | undefined {
        // initKGraphElement already checks if it is already initialized and if it is returns the existing value
        return this.initKGraphElement(node, ctx).providingRegion
    }

    /**
     * Decides the appropriate detail level for regions based on their size in the viewport and applies that state.
     *
     * @param ctx The current rendering context
     */
    updateDetailLevels(ctx: SKGraphModelRenderer): void {

        const relativeThreshold = ctx.renderOptionsRegistry.getValueOrDefault(FullDetailRelativeThreshold)

        if (this.viewport?.scroll === ctx.viewport.scroll
            && this.viewport?.zoom === ctx.viewport.zoom
            && this.lastThreshold === relativeThreshold) {
            // the viewport did not change, no need to update
            return
        }

        this.viewport = { zoom: ctx.viewport.zoom, scroll: ctx.viewport.scroll }
        this.lastThreshold = relativeThreshold;

        // Initialize detail level on first run.
        if (this.criticalRegions.size == 0) {
            for (const region of this.rootRegions) {
                const vis = region.computeDetailLevel(ctx)
                if (vis === DetailLevel.FullDetails) {
                    this.updateRegionDetailLevel(region, vis, ctx)
                }
            }
        } else {
            this.checkCriticalRegions(ctx)
        }
    }

    /**
     * Set detail level for the given region and recursively determine and update the children's detail level
     *
     * @param region The root region
     * @param vis the detail level to apply
     * @param ctx The current rendering context
     */
    updateRegionDetailLevel(region: Region, vis: DetailWithChildren, ctx: SKGraphModelRenderer): void {
        region.setDetailLevel(vis)
        let isCritical = false;

        region.children.forEach(childRegion => {
            const childVis = childRegion.computeDetailLevel(ctx);
            if (childVis < vis) {
                isCritical = true
            }
            if (isDetailWithChildren(childVis)) {
                this.updateRegionDetailLevel(childRegion, childVis, ctx)
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
     * @param ctx The current rendering context
     */
    checkCriticalRegions(ctx: SKGraphModelRenderer): void {

        // All regions that are at a detail level boundary (child has lower detail level and parent is at a DetailWithChildren level).
        let toBeProcessed: Set<Region> = new Set(this.criticalRegions)

        // The regions that have become critical and therefore need to be checked as well
        let nextToBeProcessed: Set<Region> = new Set()

        while (toBeProcessed.size !== 0) {
            toBeProcessed.forEach(region => {
                const vis = region.computeDetailLevel(ctx);
                region.setDetailLevel(vis)

                if (region.parent && vis !== region.parent.detail) {

                    nextToBeProcessed.add(region.parent)
                    this.criticalRegions.add(region.parent)

                }

                if (isDetailWithChildren(vis)) {
                    this.updateRegionDetailLevel(region, vis, ctx)
                } else {
                    this.recursiveSetOOB(region, vis)
                }

            })

            toBeProcessed = nextToBeProcessed;
            nextToBeProcessed = new Set();
        }

    }

}
