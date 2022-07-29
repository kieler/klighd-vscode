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

import { injectable } from "inversify";
import { SModelRoot, SvgExporter } from "sprotty";
import { RequestAction } from "sprotty-protocol";
import { KlighdExportSvgAction } from "./actions/actions";



@injectable()
export class KlighdSvgExporter extends SvgExporter {

    export(root: SModelRoot, request?: RequestAction<KlighdExportSvgAction>): void {
        if (typeof document !== 'undefined') {
            const div = document.getElementById(this.options.hiddenDiv);
            if (div !== null && div.firstElementChild && div.firstElementChild.tagName === 'svg') {
                const svgElement = div.firstElementChild as SVGSVGElement;
                const svg = this.createSvg(svgElement, root);
                this.actionDispatcher.dispatch(KlighdExportSvgAction.create(svg, request ? request.requestId : '', root.id));
            }
        }
    }

    protected createSvg(svgElementOrig: SVGSVGElement, root: SModelRoot): string {
        const serializer = new XMLSerializer();
        const svgCopy = serializer.serializeToString(svgElementOrig);
        const iframe: HTMLIFrameElement = document.createElement('iframe');
        document.body.appendChild(iframe);
        if (!iframe.contentWindow)
            throw new Error('IFrame has no contentWindow');
        const docCopy = iframe.contentWindow.document;
        docCopy.open();
        docCopy.write(svgCopy);
        docCopy.close();
        const svgElementNew = docCopy.getElementById(svgElementOrig.id)!;
        this.copyStyles(svgElementOrig, svgElementNew, []);
        svgElementNew.setAttribute('version', '1.1');
        // Somehow this is always 1.
        svgElementNew.setAttribute('opacity', '1');
        const bounds = this.getBounds(root);
        svgElementNew.setAttribute('viewBox', `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);
        const svgCode = serializer.serializeToString(svgElementNew);
        document.body.removeChild(iframe);
        return svgCode;
    }

    protected copyStyles(source: Element, target: Element, skipedProperties: string[]): void {
        source.getAttributeNames().forEach(key => {
            if (!skipedProperties.includes(key)) {
                const value = source.getAttribute(key)
                if (value)
                target.setAttribute(key, value)
            }
        })
        // IE doesn't retrun anything on source.children
        for (let i = 0; i < source.childNodes.length; ++i) {
            const sourceChild = source.childNodes[i];
            const targetChild = target.childNodes[i];
            if (sourceChild instanceof Element)
                this.copyStyles(sourceChild, targetChild as Element, []);
        }
    }
}