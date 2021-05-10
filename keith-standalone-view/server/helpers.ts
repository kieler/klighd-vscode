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
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

/** Parses a string or undefined as an integer. */
export function parseIntOrUndefined(number?: string): number | undefined {
  if (typeof number !== "string") return undefined;
  return parseInt(number, 10);
}

/** Parses a value for a given name from the process arguments. */
export function getArgValue(argName: string): string | undefined {
  const prefix = `--${argName}=`;
  const argument: string | undefined = process.argv.filter((arg) =>
    arg.startsWith(prefix)
  )[0];

  return argument ? argument.substring(prefix.length) : undefined;
}
