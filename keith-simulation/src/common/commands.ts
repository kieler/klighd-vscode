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

import {Command } from "@theia/core";

/**
 * Command to open the simulation widget
 */
export const SIMULATION: Command = {
    id: 'simulation:toggle',
    label: 'Simulation View',
    category: 'Simulation'
}

/**
 * Command to restart a simulation.
 */
export const SIMULATE: Command = {
    id: 'simulate',
    label: 'Restart simulation',
    category: 'Simulation'
}

export const COMPILE_AND_SIMULATE: Command = {
    id: 'compile-and-simulate',
    label: 'Simulate',
    category: 'Simulation'
}

export const OPEN_INTERNAL_KVIZ_VIEW: Command = {
    id: 'open-kviz-internal',
    label: 'Open KViz view in internal browser preview',
    iconClass: 'fa fa-file-image-o',
    category: 'Simulation'
}

export const OPEN_EXTERNAL_KVIZ_VIEW: Command = {
    id: 'open-kviz-external',
    label: 'Open KViz view in external browser',
    iconClass: 'fa fa-external-link',
    category: 'Simulation'
}

export const SELECT_SIMULATION_CHAIN: Command = {
    id: 'select-simulation-chain',
    label: 'Select simulation chain',
    category: 'Simulation',
    iconClass: 'fa fa-play-circle'
}

export const SELECT_SNAPSHOT_SIMULATION_CHAIN: Command = {
    id: 'select-snapshot-simulation-chain',
    label: 'Select snapshot simulation chain',
    category: 'Simulation',
    iconClass: 'fa fa-play-circle'
}

export const SET_SIMULATION_SPEED: Command = {
    id: 'set-simulation-speed',
    label: 'Set simulation speed',
    category: 'Simulation'
}

export const REVEAL_SIMULATION_WIDGET: Command = {
    id: 'reveal-simulation-widget',
    label: 'Reveal simulation widget',
    category: 'Simulation'
}

export const OPEN_SIMULATION_WIDGET_AND_REQUEST_CS: Command = {
    id: 'open-sim-request-cs',
    label: 'Open and ready simulation widget',
    category: 'Simulation'
}