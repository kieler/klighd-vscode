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
import { almostEquals, Bounds, BoundsAware, ElementAndBounds, IActionDispatcher, isSizeable, IVNodeDecorator, SModelElement, SModelRoot, TYPES, Action } from 'sprotty/lib';
import { ComputedTextBoundsAction } from '../actions/actions';

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
export class HiddenTextBoundsUpdater implements IVNodeDecorator {
    // This class differs from the HiddenBoundsUpdater that it only calculates and returns the bounds and not the position of the elements
    // and that it dispatches a ComputedTextBoundsAction instead of a ComputedBoundsAction.

    constructor(@inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher) {
    }

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
        this.getBoundsFromDOM()
        const resizes: ElementAndBounds[] = []
        this.element2boundsData.forEach(
            (boundsData, element) => {
                if (boundsData.boundsChanged && boundsData.bounds !== undefined)
                    resizes.push({
                        elementId: element.id,
                        newBounds: boundsData.bounds
                    })
            })
        this.actionDispatcher.dispatch(new ComputedTextBoundsAction(resizes))
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
        const bounds = elm.getBBox();
        return {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height
        };
    }
}