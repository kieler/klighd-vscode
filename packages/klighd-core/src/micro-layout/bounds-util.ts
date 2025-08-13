/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2025 by
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

import { Bounds } from 'sprotty-protocol'

export function boundsMax(b1: Bounds, b2: Bounds): Bounds {
    return {
        x: b1.x,
        y: b1.y,
        width: Math.max(b1.width, b2.width),
        height: Math.max(b1.height, b2.height),
    }
}

export function boundsMin(b1: Bounds, b2: Bounds): Bounds {
    return {
        x: b1.x,
        y: b1.y,
        width: Math.min(b1.width, b2.width),
        height: Math.min(b1.height, b2.height),
    }
}

export function emptyBounds(): Bounds {
    return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    }
}
