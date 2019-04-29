/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { ComputedTextBoundsAction, PerformActionAction, RequestTextBoundsCommand, SetSynthesesAction, SetSynthesisAction } from '@kieler/keith-sprotty/lib/actions/actions';
import { injectable } from 'inversify';
import { LSTheiaDiagramServer } from 'sprotty-theia/lib';
import { Action, ActionHandlerRegistry, ActionMessage, ComputedBoundsAction, FitToScreenAction, ICommand, SetModelCommand } from 'sprotty/lib';
import { KeithDiagramWidget } from './keith-diagram-widget';
import { KeithTheiaSprottyConnector } from './keith-theia-sprotty-connector';

export const KeithDiagramServerProvider = Symbol('KeithDiagramServerProvider');

export type KeithDiagramServerProvider = () => Promise<KeithDiagramServer>;

/**
 * This class extends the Theia diagram Server to also handle the Request- and ComputedTextBoundsAction
 */
@injectable()
export class KeithDiagramServer extends LSTheiaDiagramServer {
    messageReceived(message: ActionMessage) {
        super.messageReceived(message)
        // Special handling for the SetModel action.
        if (message.action.kind === SetModelCommand.KIND) {
            // Fire the widget's event that a new model was received.
            const widgetPromise = this.connector.widgetManager.getWidget('keith-diagram-diagram-manager') // TODO: use the ID from where it is defined
            widgetPromise.then(widget => {
                if (widget instanceof KeithDiagramWidget) {
                    widget.modelUpdated()
                }
            })
            // Fit the received model to the widget size.
            this.actionDispatcher.dispatch(new FitToScreenAction([], undefined, undefined, false))
        }
    }

    handleLocally(action: Action): boolean {
        switch (action.kind) {
            case ComputedTextBoundsAction.KIND:
                return true
            case RequestTextBoundsCommand.KIND:
                return false
            case ComputedBoundsAction.KIND: // TODO: remove sending of a computedBoundsAction as well (not possible until https://github.com/inversify/InversifyJS/issues/1035).
                return false
            case PerformActionAction.KIND:
                return true
            case SetSynthesisAction.KIND:
                return true
        }
        return super.handleLocally(action)
    }

    handle(action: Action): void | ICommand | Action {
        if (action.kind === SetSynthesesAction.KIND) {
            this.connector.synthesisRegistry.setAvailableSyntheses((action as SetSynthesesAction).syntheses)
            this.connector.synthesisRegistry.setProvidingDiagramServer(this)
        } else {
            super.handle(action)
        }
    }

    disconnect() {
        super.disconnect()
        // Unregister all commands for this server on disconnect.
        this.connector.synthesisRegistry.clearAvailableSyntheses()
    }

    initialize(registry: ActionHandlerRegistry): void {
        super.initialize(registry)

        // Register the KEITH specific new actions.
        registry.register(RequestTextBoundsCommand.KIND, this)
        registry.register(ComputedTextBoundsAction.KIND, this)
        registry.register(PerformActionAction.KIND, this)
        registry.register(SetSynthesesAction.KIND, this)
        registry.register(SetSynthesisAction.KIND, this)
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
}