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
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { injectable } from "inversify";
import { VNode } from "snabbdom/vnode";

/**
 * A sidebar panel provides content that is shown by the sidebar.
 * An implementation has to be registered as a "SidebarPanel" DISymbol.
 */
export interface ISidebarPanel {
    /** Unique ID that identifies this panel in the DI container. */
    readonly id: string;
    /** Title that should be used if this panel is shown. */
    readonly title: string;
    /**
     * SVG icon string that is used as the icon for the corresponding panel toggle.
     * For an icon source we recommend feather-icons (https://feathericons.com).
     *
     * _It has to be an SVG string because JSX SVGs did not work properly if they
     * are part of a file that uses snabbdom-jsx `html` as the JSX pragma, which
     * might be the case for files containing SidebarPanels._
     */
    readonly icon: string;

    /**
     * A sidebar panel can provide a position for its trigger in the trigger stack.
     * The trigger at the top has the smallest postion. If two panels specify the
     * same position, the panel that is resolved first by the DI container is placed on top.
     */
    readonly position: number;

    /** Registers a callback that is called when this panel should be re-rendered. */
    onUpdate(callback: () => void): void;

    /**
     * Renders this panel content and returns the content as a snabbdom VNode.
     * Learn more about snabbdom and how to use it here:
     * - https://www.npmjs.com/package/snabbdom
     * - https://www.npmjs.com/package/snabbdom-jsx
     */
    render(): VNode;
}

/**
 * Abstract SidebarPanel that should be used as the base for custom a {@link ISidebarPanel}.y
 *
 * This class simplifies the implementation around handling render updates.
 */
@injectable()
export abstract class SidebarPanel implements ISidebarPanel {
    private _updateCallbacks: (() => void)[] = [];
    
    abstract get id(): string;
    abstract get title(): string;
    abstract get icon(): string;

    readonly position: number = 0;

    onUpdate(callback: () => void): void {
        this._updateCallbacks.push(callback);
    }

    /** Call this method if you want to trigger an re-render and update the UI. */
    update(): void {
        for (const callback of this._updateCallbacks) {
            callback();
        }
    }

    abstract render(): VNode;
}
