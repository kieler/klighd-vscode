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

import { Viewport } from "sprotty";
import { getBookmarkViewport as getViewport } from "@kieler/klighd-core";

/** Returns a promise that resolves after a specific amount of milliseconds. */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/** Returns the value for a given url search param key. Returns null if the key is not defined. */
export function readSearchParam(param: string): string | null {
    const params = new URLSearchParams(location.search);
    return params.get(param);
}

/**
 * Read the sourceURI for that diagram that should be displayed from search params.
 */
export function getDiagramSourceUri(): string | null {
    return readSearchParam("source");
}

/** Returns the file ending for a given uri string. */
export function getLanguageId(documentUri: string): string {
    const matches = documentUri.match(/\w+$/);

    if (!matches || matches.length !== 1) {
        throw new Error("Unable to extract a file type from given documentUri: " + documentUri);
    }

    return matches[0];
}

export function getBookmarkViewport(): Viewport | null {
    const xParam = readSearchParam("bookmarkX");
    const yParam = readSearchParam("bookmarkY");
    const zoomParam = readSearchParam("bookmarkZoom");

    if (xParam !== null && yParam !== null && zoomParam !== null) {
        const x = parseFloat(xParam);
        const y = parseFloat(yParam);
        const zoom = parseFloat(zoomParam);

        return getViewport(x, y, zoom)
    }

    return null

}
