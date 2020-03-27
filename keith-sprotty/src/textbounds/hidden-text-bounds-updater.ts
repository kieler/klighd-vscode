/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
import { inject, injectable } from 'inversify';
import { VNode } from 'snabbdom/vnode';
import {
    Action, almostEquals, Bounds, BoundsAware, ElementAndBounds, EMPTY_BOUNDS, IActionDispatcher, ILogger, isLayoutContainer, isSizeable, IVNodePostprocessor, SChildElement,
    SModelElement, SModelRoot, TYPES
} from 'sprotty/lib';
import { ComputedTextBoundsAction, RequestTextBoundsAction } from '../actions/actions';

export class TextBoundsData {
    vnode?: VNode
    bounds?: Bounds
    boundsChanged: boolean
}

/**
 * Grabs the bounds from hidden SVG DOM elements and fires a ComputedTextBoundsActions.
 *
 * The actual bounds of text elements can usually not be determined from the SModel
 * as they depend on the view implementation, CSS stylings and the browser, how texts are rendered.
 * So the best way is to grab them from a live (but hidden) SVG using getBBox().
 * Inspired by sprotty's HiddenBoundsUpdater.
 * @see HiddenBoundsUpdater
 */
@injectable()
export class HiddenTextBoundsUpdater implements IVNodePostprocessor {
    // This class differs from the HiddenBoundsUpdater that it only calculates and returns the bounds and not the position of the elements
    // and that it dispatches a ComputedTextBoundsAction instead of a ComputedBoundsAction.

    @inject(TYPES.ILogger) protected logger: ILogger;
    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher

    private readonly element2boundsData: Map<SModelElement, TextBoundsData> = new Map

    root: SModelRoot | undefined

    decorate(vnode: VNode, element: SModelElement): VNode {
        if (isSizeable(element)) {
            this.element2boundsData.set(element, {
                vnode: vnode,
                bounds: element.bounds,
                boundsChanged: false,
            })
        }
        if (element instanceof SModelRoot)
            this.root = element
        return vnode
    }

    postUpdate(cause?: Action) {
        if (cause === undefined || cause.kind !== RequestTextBoundsAction.KIND) {
            return;
        }
        const request = cause as RequestTextBoundsAction
        this.getBoundsFromDOM()
        const resizes: ElementAndBounds[] = []
        this.element2boundsData.forEach(
            (boundsData, element) => {
                if (boundsData.boundsChanged && boundsData.bounds !== undefined) {
                    const resize: ElementAndBounds = {
                        elementId: element.id,
                        newSize: {
                            width: boundsData.bounds.width,
                            height: boundsData.bounds.height
                        }
                    }
                    if (element instanceof SChildElement && isLayoutContainer(element.parent)) {
                        resize.newPosition = {
                            x: boundsData.bounds.x,
                            y: boundsData.bounds.y
                        }
                    }
                    resizes.push(resize)
                }
            })
        this.actionDispatcher.dispatch(new ComputedTextBoundsAction(resizes, request.requestId))
        this.element2boundsData.clear()
    }

    protected getBoundsFromDOM() {
        this.element2boundsData.forEach(
            (boundsData, element) => {
                if (boundsData.bounds && isSizeable(element)) {
                    const vnode = boundsData.vnode
                    if (vnode && vnode.elm) {
                        const boundingBox = this.getBounds(vnode.elm, element)
                        const newBounds = {
                            x: element.bounds.x,
                            y: element.bounds.y,
                            width: boundingBox.width,
                            height: boundingBox.height
                        };
                        if (!(almostEquals(newBounds.x, element.bounds.x)
                            && almostEquals(newBounds.y, element.bounds.y)
                            && almostEquals(newBounds.width, element.bounds.width)
                            && almostEquals(newBounds.height, element.bounds.height))) {
                            boundsData.bounds = newBounds;
                            boundsData.boundsChanged = true;
                        }
                    }
                }
            }
        );
    }

    protected getBounds(elm: any, element: BoundsAware): Bounds {
        if (typeof elm.getBBox !== 'function') {
            this.logger.error(this, 'Not an SVG element:', elm);
            return EMPTY_BOUNDS;
        }
        // Try to get the computed text length attribute, as it may be more accurate than the bounding box.
        let textWidth: number | undefined
        if (elm.children && elm.children[0] && elm.children[0].children[0] && typeof elm.children[0].children[0].getComputedTextLength === 'function') {
            textWidth = elm.children[0].children[0].getComputedTextLength()
        }
        const bounds = elm.getBBox();
        return {
            x: bounds.x,
            y: bounds.y,
            width: textWidth ? textWidth : bounds.width,
            height: bounds.height
        };
    }
}