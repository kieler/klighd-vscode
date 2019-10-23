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

import { LabelProviderContribution } from '@theia/core/lib/browser/label-provider';
import URI from '@theia/core/lib/common/uri';
import { MaybePromise } from '@theia/core/lib/common';
import { injectable } from 'inversify';

/**
 * This class is currently not in use, since some options need to be configured to not overlap with decorators (warnings, errors, etc).
 */
@injectable()
export class SCChartsIconProvider implements LabelProviderContribution {

    canHandle(uri: object): number {

        if (uri instanceof URI && uri.scheme === "file" && uri.path.ext === ".sctx") {
            return 30;
        } else {
            return -1;
        }
    }

    /**
     * returns an icon class for the given element.
     */
    getIcon(uri: URI): MaybePromise<string> {
        return 'fa sctx-icon';
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