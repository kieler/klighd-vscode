/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2024 by
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

import { injectable } from 'inversify'
import { SModelRootImpl, SvgExporter } from 'sprotty'
import { KlighdExportSvgAction, KlighdRequestExportSvgAction } from './actions/actions'
/* global document, Document, Element */

@injectable()
export class KlighdSvgExporter extends SvgExporter {
    export(root: SModelRootImpl, request?: KlighdRequestExportSvgAction): void {
        // Same as Sprotty's SvgExporter.export, but with KlighdExportSvgAction instead of
        // ExportSvgAction to have a better default export name based on the root ID (its model URI).
        if (typeof document !== 'undefined') {
            const hiddenDiv = document.getElementById(this.options.hiddenDiv)
            if (hiddenDiv === null) {
                this.log.warn(this, `Element with id ${this.options.hiddenDiv} not found. Nothing to export.`)
                return
            }

            const svgElement = hiddenDiv.querySelector('svg')
            if (svgElement === null) {
                this.log.warn(this, `No svg element found in ${this.options.hiddenDiv} div. Nothing to export.`)
                return
            }
            const svg = this.createSvg(svgElement, root, request?.options ?? {}, request)
            this.actionDispatcher.dispatch(
                KlighdExportSvgAction.create(svg, request ? request.requestId : '', root.id, request?.options)
            )
        }
    }

    protected copyStyles(_source: Element, _target: Element, _skippedProperties: string[]): void {
        // Just don't copy the styles. This would overwrite any styles set by the SVG renderer and we do not need any other styles that may get copied here.
        // So overwrite Sprotty's copyStyles method with an empty method.
    }
}
