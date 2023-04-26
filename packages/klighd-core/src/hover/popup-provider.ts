/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
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

import { SKGraphElement } from '@kieler/klighd-interactive/lib/constraint-classes';
import { injectable } from "inversify";
import {
    IPopupModelProvider,
} from "sprotty";
import {
    HtmlRoot as HtmlRootSchema,
    PreRenderedElement as PreRenderedElementSchema,
    RequestPopupModelAction,
    SModelElement as SModelElementSchema,
    SModelRoot as SModelRootSchema,
} from "sprotty-protocol";
import { isSKGraphElement } from "../skgraph-models";
import { findRendering } from "../skgraph-utils";
import { RequestKlighdPopupModelAction } from "./hover";

/** Provide PopupModels created from SKGraphElements. */
@injectable()
export class PopupModelProvider implements IPopupModelProvider {
    getPopupModel(
        request: RequestPopupModelAction,
        elementSchema?: SModelElementSchema
    ): SModelRootSchema | undefined {
        if (
            elementSchema &&
            RequestKlighdPopupModelAction.isThisAction(request) &&
            isSKGraphElement(request.parent) &&
            request.element !== undefined
        ) {
            const tooltip = this.findTooltip(request.parent, request.element);
            if (tooltip) {
                const escapedTooltip = this.escapeHtml(tooltip);
                return <HtmlRootSchema>{
                    type: "html",
                    id: "popup",
                    children: [
                        <PreRenderedElementSchema>{
                            type: "pre-rendered",
                            id: "popup-body",
                            code: `<div class="klighd-popup">${escapedTooltip}</div>`,
                        },
                    ],
                    canvasBounds: request.bounds,
                };
            }
        }
    }

    /**
     * Finds the tooltip defined in the SKGraphElement in its rendering with the given ID.
     * @param element The SKGraphElement to look in.
     * @param svgElement The SVG element representing the KRendering.
     */
    protected findTooltip(element: SKGraphElement, svgElement: SVGElement): string | undefined {
        if (element.properties['klighd.tooltip'] as string) {
            return element.properties['klighd.tooltip'] as string;
        }
        const rendering = findRendering(element, svgElement);
        if (rendering) {
            return rendering.properties['klighd.tooltip'] as string;
        }
    }

    /**
     * Escapes the given string to prevent XSS attacks and to let it appear correctly in HTML.
     * @param unsafe The string to escape.
     * @returns The escaped string.
     */
    private escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\n/g, "<br/>");
    }
}
