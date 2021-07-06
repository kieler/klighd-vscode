/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2020 by
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

 /**
  * An aspect ratio constraint data class.
  */
export class AspectRatio {
    id: string
    aspectRatio: number
}

/**
 * A deletion constraint data class.
 */
export class RectPackDeletePositionConstraint {
    id: string
}

/**
 * A set position constraint data class.
 */
export class RectPackSetPositionConstraint {
    id: string
    order: number
}
