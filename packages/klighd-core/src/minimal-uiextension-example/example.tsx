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

/** @jsx html */
import { inject, injectable, postConstruct } from "inversify";
import { AbstractUIExtension, html, IActionDispatcher, TYPES } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { ShowExampleAction } from "./example-actions";

/** This class puts a "Hello, world!" in bright red on the canvas.
 *  For this the class needs to be injectable and has to extend AbstractUIExtension. */
@injectable()
export class Example extends AbstractUIExtension {
    /** Pick a unique ID. */
    static readonly ID = "ExampleUI";
    /** This actionDispatcher is needed for init(), so the class may be rendered as visible. */
    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;

    id(): string {
        return Example.ID;
    }

    containerClass(): string {
        return Example.ID;
    }

    /** Create the object, e.g. make it visible. */
    @postConstruct()
    init(): void {
        this.actionDispatcher.dispatch(ShowExampleAction.create());
    }

    protected initializeContents(containerElement: HTMLElement): void {
        // containerElement is the canvas to add the html via appendChild() to
        const content = document.createElement("h1");
        content.style.color = "red";
        content.innerText = "Hello, world!";
        containerElement.appendChild(content);
        // The same html using JSX/TSX:
        <h1 style={{color: "red"}}>Hello, world!</h1>;
    }
}
