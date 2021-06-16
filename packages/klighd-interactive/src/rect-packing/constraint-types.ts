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
 * This code is provided under the terms of the Eclipse Public License (EPL).
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
