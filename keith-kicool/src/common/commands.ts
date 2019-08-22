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

import { Command } from "@theia/core";

export const SAVE: Command = {
    id: 'core.save',
    label: 'Save'
};

export const SHOW_NEXT: Command = {
    id: 'show_next',
    label: 'Show next',
    category: "Kicool"
}
export const SHOW_PREVIOUS: Command = {
    id: 'show_previous',
    label: 'Show previous',
    category: "Kicool"
}
export const COMPILER: Command = {
    id: 'compiler:toggle',
    label: 'Compiler',
    category: "Kicool"
}
export const SELECT_COMPILATION_CHAIN: Command = {
    id: 'select-compiler',
    label: 'Select compilation chain',
    category: 'Kicool',
    iconClass: 'fa fa-cogs'
}
export const REQUEST_CS: Command = {
    id: 'request-compilation-systems',
    label: 'Request compilation systems',
    category: "Kicool"
}
export const TOGGLE_INPLACE: Command = {
    id: 'toggle-inplace',
    label: 'Toggle inplace compilation',
    category: "Kicool"
}
export const TOGGLE_PRIVATE_SYSTEMS: Command = {
    id: 'toggle-private-systems',
    label: 'Toggle show private systems',
    category: "Kicool"
}
export const TOGGLE_AUTO_COMPILE: Command = {
    id: 'toggle-auto-compile',
    label: 'Toggle auto compile',
    category: "Kicool"
}

export const TOGGLE_BUTTON_MODE: Command = {
    id: 'toggle-button-mode',
    label: 'Toggle button mode',
    category: 'Kicool'
}