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
import { isSKGraphElement, SKGraphElement } from "../skgraph-models";
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
            const tooltip = this.findTooltip(request.parent, request.element.id);
            if (tooltip) {
                return <HtmlRootSchema>{
                    type: "html",
                    id: "popup",
                    children: [
                        <PreRenderedElementSchema>{
                            type: "pre-rendered",
                            id: "popup-body",
                            code: `<div>${tooltip}</div>`,
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
     * @param id The ID of the KRendering within that SKGraphElement.
     */
    protected findTooltip(element: SKGraphElement, id: string): string | undefined {
        if (element.properties['klighd.tooltip'] as string) {
            return element.properties['klighd.tooltip'] as string;
        }
        const rendering = findRendering(element, id);
        if (rendering) {
            return rendering.properties['klighd.tooltip'] as string;
        }
    }
}
