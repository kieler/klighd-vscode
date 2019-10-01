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
import { inject, injectable } from 'inversify';
import { Action, CommandExecutionContext, ElementAndBounds, HiddenCommand, SModelRoot,
    SModelRootSchema, TYPES } from 'sprotty/lib';
import { SetSynthesesActionData } from '../syntheses/synthesis-message-data';

/**
 * Sent from the server to the client to send a list of all available syntheses for the current model.
 */
export class SetSynthesesAction implements Action {
    static readonly KIND: string = 'setSyntheses'
    readonly kind = SetSynthesesAction.KIND

    constructor(public readonly syntheses: SetSynthesesActionData[]) {
    }
}

/**
 * Sent from the client to the server to request a new diagram with the given synthesis.
 */
export class SetSynthesisAction implements Action {
    static readonly KIND: string = 'setSynthesis'
    readonly kind = SetSynthesisAction.KIND

    constructor(public readonly id: string) {
    }
}

/**
 * Sent from the client to the model source (e.g. a DiagramServer) to transmit the result of text bounds
 * computation as a response to a RequestTextBoundsAction.
 */
export class ComputedTextBoundsAction implements Action {
    static readonly KIND = 'computedTextBounds'

    readonly kind = ComputedTextBoundsAction.KIND

    constructor(public readonly bounds: ElementAndBounds[]) {
    }
}

/**
 * The command triggered to perform a hidden rendering of the text diagram defined in the constructor's RequestTextBoundsAction.
 */
@injectable()
export class RequestTextBoundsCommand extends HiddenCommand {
    static readonly KIND: string = 'requestTextBounds'

    constructor(@inject(TYPES.Action) protected action: RequestTextBoundsAction) {
        super()
    }

    execute(context: CommandExecutionContext): SModelRoot {
        return context.modelFactory.createRoot(this.action.textDiagram)
    }

    get blockUntilActionKind() {
        return ComputedTextBoundsAction.KIND;
    }
}

/**
 * Sent from the model source to the client to request bounds for the given texts. The texts are
 * rendered invisibly so the bounds can derived from the DOM. The response is a ComputedTextBoundsAction.
 */
export class RequestTextBoundsAction implements Action {
    readonly kind = RequestTextBoundsCommand.KIND

    constructor(public readonly textDiagram: SModelRootSchema) {
    }

    /** Factory function to dispatch a request with the `IActionDispatcher` */
    static create(newRoot: SModelRootSchema): Action {
        return new RequestTextBoundsAction(newRoot);
    }
}

/**
 * Sent from the client to the diagram server to perform a klighd action on the model.
 * Causes the server to update the diagram accordingly to the action.
 */
export class PerformActionAction implements Action {
    static readonly KIND = 'performAction'
    kind = PerformActionAction.KIND

    constructor(public readonly actionId: string, protected kGraphElementId: string, protected kRenderingId: string) {
    }
}