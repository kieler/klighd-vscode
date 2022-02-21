import { FullDetailRelativeThreshold, FullDetailScaleThreshold } from "../options/render-options-registry";
import { ScalingUtil } from "../scaling-util";
import { SKGraphModelRenderer } from "../skgraph-model-renderer";
import { SKNode } from "../skgraph-models";
import { DetailLevel } from "./depth-map";

/**
 * Combines KNodes into regions. These correspond to child areas. A region can correspond to
 * a region or a super state in the model. Also manages the boundaries, title candidates,
 * tree structure of the model and application of detail level of its KNodes.
 */
export class Region {
    /** The rectangle of the child area in which the region lies. */
    boundingRectangle: SKNode;
    /** the regions current detail level that is used by all children */
    detail: DetailLevel;
    /** The immediate parent region of this region. */
    parent?: Region;
    /** All immediate child regions of this region */
    children: Region[];
    /** Contains the height of the title of the region, if there is one. */
    regionTitleHeight?: number;
    /** Indentation of region title. */
    regionTitleIndentation?: number;
    /** Constructor initializes element array for region. */
    constructor(boundingRectangle: SKNode) {
        this.boundingRectangle = boundingRectangle;
        this.children = [];
        this.detail = DetailLevel.FullDetails;
    }

    /**
     * Checks visibility of a region with position from browser coordinates in current viewport.
     *
     * @param ctx The current rendering context
     * @returns Boolean value indicating the visibility of the region in the current viewport.
     */
    isInBounds(ctx: SKGraphModelRenderer): boolean {
        const bounds = ScalingUtil.getAbsoluteRenderedBounds(this.boundingRectangle, ctx);

        const canvasBounds = this.boundingRectangle.root.canvasBounds;

        return bounds.x + bounds.width - ctx.viewport.scroll.x >= 0
            && bounds.x - ctx.viewport.scroll.x <= (canvasBounds.width / ctx.viewport.zoom)
            && bounds.y + bounds.height - ctx.viewport.scroll.y >= 0
            && bounds.y - ctx.viewport.scroll.y <= (canvasBounds.height / ctx.viewport.zoom);

    }

    /**
     * Compares the size of a region to the viewport and returns the smallest fraction of either height or width.
     *
     * @param ctx The current rendering context
     * @returns the relative size of the region's shortest dimension
     */
    sizeInViewport(ctx: SKGraphModelRenderer): number {
        const bounds = ScalingUtil.getAbsoluteRenderedBounds(this.boundingRectangle, ctx);

        const canvasBounds = this.boundingRectangle.root.canvasBounds;

        const horizontal = bounds.width / (canvasBounds.width / ctx.viewport.zoom);
        const vertical = bounds.height / (canvasBounds.height / ctx.viewport.zoom);
        return horizontal < vertical ? horizontal : vertical;
    }

    /**
     * Decides the appropriate detail level for a region
     * based on their size in the viewport and visibility
     *
     * @param ctx The current rendering context
     * @returns The appropriate detail level
     */
    computeDetailLevel(ctx: SKGraphModelRenderer): DetailLevel {

        const relativeThreshold = ctx.renderOptionsRegistry.getValueOrDefault(FullDetailRelativeThreshold);
        const scaleThreshold = ctx.renderOptionsRegistry.getValueOrDefault(FullDetailScaleThreshold);

        if (!this.isInBounds(ctx)) {
            return DetailLevel.OutOfBounds;
        } else if (!this.parent) {
            // Regions without parents should always be full detail if they are visible
            return DetailLevel.FullDetails;
        } else {
            const viewportSize = this.sizeInViewport(ctx);

            const scale = (this.boundingRectangle.parent as SKNode).forceNodeScaleBounds(ctx, true).effective_child_zoom;
            // change to full detail when relative size threshold is reached or the scaling within the region is big enough to be readable.
            if (viewportSize >= relativeThreshold || scale > scaleThreshold) {
                return DetailLevel.FullDetails;
            } else {
                return DetailLevel.MinimalDetails;
            }
        }
    }

    /**
     * Applies the detail level to all elements of a region.
     * @param level the detail level to apply
     */
    setDetailLevel(level: DetailLevel): void {
        this.detail = level;
    }
}
