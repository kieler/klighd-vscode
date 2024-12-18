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

import './styles/popup.css'
/* global document, HTMLElement */

interface PopupOptions {
    /** The created popup will not be hidden automatically. */
    persist: boolean
}

type PopupType = 'info' | 'warn' | 'error'

/**
 * Creates a popup message to notify the user about an important event.
 * The popup is automatically removed after 10 seconds.
 */
export function showPopup(type: PopupType, title: string, message: string, options?: Partial<PopupOptions>): void {
    const container = document.querySelector('#popup-container')
    if (!container) throw new Error('No Popup Container found in current DOM!')

    const popupEle = createPopupElement(title, message)
    popupEle.classList.add(`popup--${type}`)
    container.appendChild(popupEle)

    if (!options?.persist) {
        // Hide the Popup after 10 seconds
        setTimeout(() => container.removeChild(popupEle), 10000)
    }
}

function createPopupElement(title: string, message: string): HTMLElement {
    const containerEle = document.createElement('div')
    containerEle.classList.add('popup')

    const titleEle = document.createElement('h4')
    titleEle.classList.add('popup__title')
    titleEle.innerText = title
    containerEle.appendChild(titleEle)

    const msgEle = document.createElement('p')
    msgEle.classList.add('popup__message')
    msgEle.innerHTML = message
    containerEle.appendChild(msgEle)

    return containerEle
}
