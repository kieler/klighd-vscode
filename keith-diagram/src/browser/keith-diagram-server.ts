/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018-2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { RefreshDiagramAction } from '@kieler/keith-interactive/lib/actions';
import {
    DeleteLayerConstraintAction, DeletePositionConstraintAction, DeleteStaticConstraintAction,
    SetPositionConstraintAction, SetLayerConstraintAction, SetStaticConstraintAction
} from '@kieler/keith-interactive/lib/layered/actions';
import { RectPackDeletePositionConstraintAction, RectPackSetPositionConstraintAction, SetAspectRatioAction } from '@kieler/keith-interactive/lib/rect-packing/actions';
import {
    CheckedImagesAction, CheckImagesAction, ComputedTextBoundsAction, PerformActionAction, RefreshLayoutAction, RequestTextBoundsCommand,
    SetSynthesesAction, SetSynthesisAction, StoreImagesAction, KeithUpdateModelAction
} from '@kieler/keith-sprotty/lib/actions/actions';
import { RequestKeithPopupModelAction } from '@kieler/keith-sprotty/lib/hover/hover';
import { injectable } from 'inversify';
import { LSTheiaDiagramServer } from 'sprotty-theia/lib';
import {
    Action, ActionHandlerRegistry, ActionMessage, BringToFrontAction, ComputedBoundsAction, findElement, FitToScreenAction,
    ICommand, RequestPopupModelAction, SetModelCommand,
    SetPopupModelAction, SwitchEditModeAction, /* UpdateModelAction */
} from 'sprotty/lib';
import { isNullOrUndefined } from 'util';
import { diagramPadding } from '../common/constants';
import { KeithDiagramWidget } from './keith-diagram-widget';
import { KeithTheiaSprottyConnector } from './keith-theia-sprotty-connector';
import { Emitter, Event } from '@theia/core/lib/common';

export const KeithDiagramServerProvider = Symbol('KeithDiagramServerProvider');

export type KeithDiagramServerProvider = () => Promise<KeithDiagramServer>;


export const onDisplayInputModelEmitter = new Emitter<Action | undefined>()
export const displayInputModel: Event<Action | undefined> = onDisplayInputModelEmitter.event


/**
 * This class extends the Theia diagram Server to also handle the Request- and ComputedTextBoundsAction
 */
@injectable()
export class KeithDiagramServer extends LSTheiaDiagramServer {
    messageReceived(message: ActionMessage) {
        const wasUpdateModelAction = message.action.kind === KeithUpdateModelAction.KIND;
        super.messageReceived(message)
        // Special handling for the SetModel action.
        if (message.action.kind === SetModelCommand.KIND || wasUpdateModelAction) {
            // Fire the widget's event that a new model was received.
            const diagramWidget = this.getWidget()
            if (diagramWidget instanceof KeithDiagramWidget) {
                if (wasUpdateModelAction && (message.action as KeithUpdateModelAction).cause
                    && (message.action as KeithUpdateModelAction).cause.kind) {
                    return
                }
                if (message.action.kind === SetModelCommand.KIND) {
                    diagramWidget.modelUpdated()
                }
                if (diagramWidget.resizeToFit) {
                    // Fit the received model to the widget size.
                    this.actionDispatcher.dispatch(new FitToScreenAction(['$root'], diagramPadding, undefined, true))
                }
            }
        }
    }

    handleLocally(action: Action): boolean {
        switch (action.kind) {
            case ComputedBoundsAction.KIND: // TODO: remove sending of a computedBoundsAction as well (not possible until https://github.com/inversify/InversifyJS/issues/1035).
                return false
            case ComputedTextBoundsAction.KIND:
                return true
            case PerformActionAction.KIND:
                return true
            case RequestTextBoundsCommand.KIND:
                return false
            case SetSynthesisAction.KIND:
                return true
        }
        return super.handleLocally(action)
    }

    handle(action: Action): void | ICommand | Action {
        if (action.kind === SetSynthesesAction.KIND) {
            this.handleSetSyntheses(action as SetSynthesesAction)
        } else if (action.kind === PerformActionAction.KIND &&
            (action as PerformActionAction).actionId === 'de.cau.cs.kieler.kicool.ui.klighd.internal.model.action.OpenCodeInEditorAction') {
            // Currently not implemented
            // Send to server in KiCoolLSExtension or notify kicool
            onDisplayInputModelEmitter.fire(action)
        } else if (action.kind === CheckImagesAction.KIND) {
            this.handleCheckImages(action as CheckImagesAction)
        } else if (action.kind === StoreImagesAction.KIND) {
            this.handleStoreImages(action as StoreImagesAction)
        } else if (action.kind === RequestKeithPopupModelAction.KIND && action instanceof RequestKeithPopupModelAction) {
            this.handleRequestKeithPopupModel(action as RequestKeithPopupModelAction)
        } else if (action.kind === RequestPopupModelAction.KIND
            || action.kind === SwitchEditModeAction.KIND
            || action.kind === BringToFrontAction.KIND) {
            // Ignore these ones
        } else {
            super.handle(action)
        }
    }

    handleSetSyntheses(action: SetSynthesesAction) {
        this.connector.synthesisRegistry.setAvailableSyntheses(action.syntheses)
        this.connector.synthesisCommandContribution.onNewSyntheses(action.syntheses)
        this.connector.synthesisRegistry.setProvidingDiagramServer(this)
    }

    handleCheckImages(action: CheckImagesAction) {
        // check in local storage, if these images are already stored. If not, send back a request for those images.
        const notCached: string[] = []
        for (let image of (action as CheckImagesAction).images) {
            const id = image.bundleName + ':' + image.imagePath
            if (isNullOrUndefined(sessionStorage.getItem(id))) {
                notCached.push(id)
            }
        }
        this.actionDispatcher.dispatch(new CheckedImagesAction(notCached))
    }

    handleStoreImages(action: StoreImagesAction) {
        // Put the new images in session storage.
        for (let imagePair of (action as StoreImagesAction).images) {
            const key = imagePair.k
            const image = imagePair.v
            sessionStorage.setItem(key, image)
        }
    }

    handleRequestKeithPopupModel(action: RequestKeithPopupModelAction) {
        const element = findElement(this.currentRoot, action.elementId)
        if (element) {
            this.rootPopupModelProvider.getPopupModel(action, element).then(model => {
                if (model) {
                    this.actionDispatcher.dispatch(new SetPopupModelAction(model))
                }
            })
        }
        return false
    }

    disconnect() {
        super.disconnect()
        // Unregister all commands for this server on disconnect.
        this.connector.synthesisRegistry.clearAvailableSyntheses()
        this.connector.synthesisCommandContribution.onNewSyntheses([])
    }

    initialize(registry: ActionHandlerRegistry): void {
        super.initialize(registry)

        // Register the KEITH specific new actions.
        registry.register(BringToFrontAction.KIND, this)
        registry.register(CheckImagesAction.KIND, this)
        registry.register(CheckedImagesAction.KIND, this)
        registry.register(ComputedTextBoundsAction.KIND, this)
        registry.register(DeleteLayerConstraintAction.KIND, this)
        registry.register(DeletePositionConstraintAction.KIND, this)
        registry.register(DeleteStaticConstraintAction.KIND, this)
        // registry.register(KeithUpdateModelAction.KIND, this)
        registry.register(PerformActionAction.KIND, this)
        registry.register(RectPackSetPositionConstraintAction.KIND, this)
        registry.register(RectPackDeletePositionConstraintAction.KIND, this)
        registry.register(RefreshDiagramAction.KIND, this)
        registry.register(RefreshLayoutAction.KIND, this)
        registry.register(RequestKeithPopupModelAction.KIND, this)
        registry.register(RequestTextBoundsCommand.KIND, this)
        registry.register(SetAspectRatioAction.KIND, this)
        registry.register(SetLayerConstraintAction.KIND, this)
        registry.register(SetPositionConstraintAction.KIND, this)
        registry.register(SetStaticConstraintAction.KIND, this)
        registry.register(SetSynthesesAction.KIND, this)
        registry.register(SetSynthesisAction.KIND, this)
        registry.register(StoreImagesAction.KIND, this)
        registry.register(SwitchEditModeAction.KIND, this)
    }

    handleComputedBounds(_action: ComputedBoundsAction): boolean {
        // ComputedBounds actions should not be generated and forwarded anymore, since only the computedTextBounds action is used by kgraph diagrams
        if (this.viewerOptions.needsServerLayout) {
            return true;
        } else {
            return false
        }
    }

    get connector(): KeithTheiaSprottyConnector {
        return this._connector as KeithTheiaSprottyConnector;
    }

    getWidget(): KeithDiagramWidget {
        return this.connector.widgetManager.getWidgets(this.connector.diagramManager.id).pop() as KeithDiagramWidget
    }
}