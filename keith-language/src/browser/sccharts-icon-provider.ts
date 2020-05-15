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

import URI from '@theia/core/lib/common/uri';
import { FileStat } from '@theia/filesystem/lib/common';
import { WorkspaceUriLabelProviderContribution } from '@theia/workspace/lib/browser/workspace-uri-contribution';
import { injectable } from 'inversify';

/**
 * This class is currently not in use, since some options need to be configured to not overlap with decorators (warnings, errors, etc).
 */
@injectable()
export class SCChartsIconProvider extends WorkspaceUriLabelProviderContribution {

    canHandle(element: object): number {
        if ((element instanceof URI && element.scheme === 'file' && element.path.ext === '.sctx') || (FileStat.is(element) && element.uri.endsWith(".sctx"))) {
            return Number.MAX_SAFE_INTEGER; // Or a higher number than the default one.
        }
        return super.canHandle(element);
    }

    /**
     * returns an icon class for the given element.
     */
    async getIcon(element: URI | FileStat): Promise<string> {
        if ((element instanceof URI && element.path.ext === ".sctx") || (FileStat.is(element) && element.uri.endsWith(".sctx"))) {
            return 'fa sctx-icon'
        }
        return super.getIcon(element);
    }

    /**
     * returns a short name for the given element.
     */
    getName(uri: URI): string {
        return uri.displayName;
    }

    /**
     * returns a long name for the given element.
     */
    getLongName(uri: URI): string {
        return uri.path.toString();
    }
}