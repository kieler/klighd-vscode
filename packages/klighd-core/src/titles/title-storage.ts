/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
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

import { VNode } from 'snabbdom';
import { Transformation } from '../views-common';

/**
 * Storage of data related to title renderings with the 'klighd.isNodeTitle' property.
 * Requires the user to call {@link decendToChild()} when starting the rendering of a child graph element and {@link ascendToParent()}
 * after finishing that and returning to the parent handling.
 */
export class TitleStorage {

    /**
     * The offset transformations required to reach the usual title position within a graph element. Outer array is
     * used as a stack for each graph element the rendering is going through, inner array are the current
     * transformations required to get to the position of the current rendering from the origin of the parent graph
     * element.
     */
    private transformations: Transformation[][] = []
    /**
     * The rendering of any graph element that is to be placed on top of this graph element's rendering. Array is
     * used as a stack for each graph element the rendering is going through.
     */
    private titles: (VNode | undefined)[] = []

    /**
     * Clears the title storage for a new rendering run.
     */
    clear(): void {
        this.transformations = []
        this.titles = []
    }

    /**
     * Returns the stored rendering of the current title. If there is no title for the current hierarchy, returns undefined.
     */
    getTitle(): VNode | undefined {
        // The top-most stacked title is currently active to be drawn next.
        return this.titles[this.titles.length - 1]
    }

    /**
     * Store this as the current title, to be rendered later on top.
     * @param title The new title.
     */
    setTitle(title: VNode): void {
        this.titles[this.titles.length - 1] = title
    }

    /**
     * Returns the stored transformation data for the current rendering relative to its parent graph element.
     */
    getTransformations(): Transformation[] {
        return this.transformations[this.transformations.length - 1]
    }
    
    /**
     * Adds the transformations for the current rendering, remembering the offset of any possible title rendering within.
     * @param transformations The new transformation(s) of the current rendering.
     */
    addTransformations(transformations: Transformation[]): void {
        this.transformations[this.transformations.length - 1].push(...transformations)
    }

    /**
     * Removes the last transformations from the current rendering, reverting back to the offset of the parent rendering.
     * @param amount The amount of transformations added for the current rendering that now need to be removed again.
     */
    removeTransformations(amount: number): void {
        this.transformations[this.transformations.length - 1].splice(this.transformations[this.transformations.length - 1].length - amount, amount)
    }

    /**
     * Decend to the next child graph element, adjusting the title storage accordingly.
     */
    decendToChild(): void {
        this.transformations.push([])
        this.titles.push(undefined)
    }

    /**
     * Ascend to the previous parent graph element, adjusting the title storage accordingly.
     */
    ascendToParent(): void {
        this.transformations.pop()
        this.titles.pop()
    }

}