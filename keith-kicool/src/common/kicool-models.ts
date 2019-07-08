/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

/**
 * Description of a compilation system for selectbox in compiler widget
 */
export class CompilationSystems {
    label: string
    id: string
    isPublic: boolean
    simulation: boolean
}

/**
 * Equivalent to CodeContainer send by LS
 */
export interface CodeContainer {
    files: Snapshot[][]
}

/**
 * (name, snapshotId) should be unique. GroupId for bundling in phases
 */
export class Snapshot {
    name: string;
    snapshotIndex: number;
    errors: string[];
    warnings: string[];
    infos: string[];
    constructor(groupId: string, name: string, snapshotIndex: number) {
        this.name = name
        this.snapshotIndex = snapshotIndex
    }
}