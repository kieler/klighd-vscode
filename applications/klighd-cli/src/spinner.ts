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

import './styles/spinner.css'
/* global document, HTMLParagraphElement */

/**
 * Show a fullscreen spinner with an optional message for the user.
 * @param message Optional message for the user which should be on point and only contain a few words.
 */
export function showSpinner(message?: string): void {
    const ele = document.querySelector('.spinner')
    const infoTextEle = ele?.querySelector<HTMLParagraphElement>('.spinner__info')

    if (infoTextEle) infoTextEle.innerText = message ?? ''

    if (!ele) return
    ele.classList.remove('spinner--hidden')
}

/** Hide the fullscreen spinner. */
export function hideSpinner(): void {
    const ele = document.querySelector('.spinner')

    if (!ele) return
    ele.classList.add('spinner--hidden')
}
