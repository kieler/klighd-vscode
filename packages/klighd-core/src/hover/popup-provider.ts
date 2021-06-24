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

import { injectable } from "inversify";
import {
    HtmlRootSchema,
    IPopupModelProvider,
    PreRenderedElementSchema,
    RequestPopupModelAction,
    SModelElementSchema,
    SModelRootSchema,
} from "sprotty";
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
            request instanceof RequestKlighdPopupModelAction &&
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
        if (element.tooltip) {
            return element.tooltip;
        }
        const rendering = findRendering(element, id);
        if (rendering) {
            return rendering.tooltip;
        }
    }
}
