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

/** Parses a string or undefined as an integer. */
export function parseIntOrUndefined(number?: string): number | undefined {
    if (typeof number !== "string") return undefined;
    return parseInt(number, 10);
}

/** Parses a value for a given name from the process arguments. */
export function getArgValue(argName: string): string | undefined {
    const prefix = `--${argName}=`;
    const argument: string | undefined = process.argv.filter((arg) => arg.startsWith(prefix))[0];

    return argument ? argument.substring(prefix.length) : undefined;
}
