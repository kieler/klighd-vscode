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

/** Returns a promise that resolves after a specific amount of milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Read the sourceURI for that diagram that should be displayed from search params.
 */
export function getDiagramSourceUri(): string | null {
  const params = new URLSearchParams(location.search);
  return params.get("source");
}

export function getLanguageId(documentUri: string): string {
  const matches = documentUri.match(/\w+$/);

  if (!matches || matches.length !== 1) {
    throw new Error(
      "Unable to extract a file type from given documentUri: " + documentUri
    );
  }

  return matches[0];
}
