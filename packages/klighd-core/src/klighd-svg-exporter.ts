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
import { SGraph, SModelRoot, SvgExporter } from "sprotty";
import { RequestAction } from "sprotty-protocol";
import { KlighdExportSvgAction } from "./actions/actions";



@injectable()
export class KlighdSvgExporter extends SvgExporter {

    export(root: SModelRoot, request?: RequestAction<KlighdExportSvgAction>): void {
        if (typeof document !== 'undefined') {
            const whole = false;

            if (whole) {
                const div = document.getElementById(this.options.hiddenDiv);
                if (div !== null && div.firstElementChild && div.firstElementChild.tagName === 'svg') {
                    const svgElement = div.firstElementChild as SVGSVGElement;
                    const svg = this.createSvg(svgElement, root);
                    this.actionDispatcher.dispatch(KlighdExportSvgAction.create(svg, request ? request.requestId : '', root.id));
                }
            } else {
                // FIXME: restore this, only for exporting with proxy-view
                const div = document.getElementById("keith-diagram_sprotty") //(this.options.hiddenDiv);
                // Create new svg with proxy-view and diagram as children
                const temp = document.createElement("svg") as Element;
                temp.id = "TEMP_ID";
                temp.className = "sprotty-graph";

                // <g>s on same level
                temp.appendChild(document.getElementById(this.options.hiddenDiv)!.firstElementChild!.firstChild!.cloneNode());
                Array.of(
                    // Sprotty graph
                    ...Array.from(div!.lastElementChild!.children),
                    // Proxy-view
                    ...Array.from(div!.firstElementChild!.firstElementChild!.children)
                ).forEach(c => temp.firstChild!.appendChild(c.cloneNode(true)));

                console.log(temp)

                // Just the sidebar
                // temp.appendChild(document.getElementById("keith-diagram_sprotty_sidebar")!);

                // Nested SVGs
                // temp.appendChild(div!.firstElementChild!.firstElementChild!.cloneNode(true));
                // temp.appendChild(div!.lastElementChild!.cloneNode(true));

                // Put everything in sprotty-graph svg
                // const temp = div!.lastElementChild!.cloneNode(true);
                // Array.from(div!.firstElementChild!.firstElementChild!.children).forEach(e => temp.firstChild!.appendChild(e.cloneNode(true)));

                const svgElement = temp as SVGSVGElement;
                const svg = this.createSvg(svgElement, root, whole);
                this.actionDispatcher.dispatch(KlighdExportSvgAction.create(svg, request ? request.requestId : '', root.id));
            }
        }
    }

    protected createSvg(svgElementOrig: SVGSVGElement, root: SModelRoot, whole = true): string {
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
        const bounds = whole ? this.getBounds(root) : { ...(root as SGraph).canvasBounds, ...(root as SGraph).scroll };
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