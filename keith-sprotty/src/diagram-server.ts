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

import { RefreshDiagramAction } from "@kieler/keith-interactive/lib/actions";
import {
    DeleteLayerConstraintAction,
    DeletePositionConstraintAction,
    DeleteStaticConstraintAction,
    SetLayerConstraintAction,
    SetPositionConstraintAction,
    SetStaticConstraintAction,
} from "@kieler/keith-interactive/lib/layered/actions";
import {
    RectPackDeletePositionConstraintAction,
    RectPackSetPositionConstraintAction,
    SetAspectRatioAction,
} from "@kieler/keith-interactive/lib/rect-packing/actions";
import { inject, injectable } from "inversify";
import {
    Action,
    ActionHandlerRegistry,
    ActionMessage,
    BringToFrontAction,
    ComputedBoundsAction,
    DiagramServer,
    IActionDispatcher,
    ICommand,
    RequestModelAction,
    RequestPopupModelAction,
    SetModelCommand,
    SwitchEditModeAction,
} from "sprotty";
import {
    CheckedImagesAction,
    CheckImagesAction,
    ComputedTextBoundsAction,
    KeithFitToScreenAction,
    KeithUpdateModelAction,
    Pair,
    PerformActionAction,
    RefreshLayoutAction,
    RequestTextBoundsCommand,
    SetSynthesesAction,
    SetSynthesisAction,
    StoreImagesAction,
} from "./actions/actions";
import { RequestKeithPopupModelAction } from "./hover/hover";
import { SynthesisRegistry } from "./syntheses/synthesis-registry";

export const updateOptionsKind = "updateOptions";

/** An abstract connection to a server. */
export interface IConnection {
    sendMessage(message: ActionMessage): void;
    onMessageReceived(handler: (message: ActionMessage) => void): void;
}
/** DI Symbol that should be used to inject services that implement {@link IConnection}. */
export const Connection = Symbol("connection");

/**
 * This class extends {@link DiagramServer} to also handle the
 * Request- and ComputedTextBoundsAction.
 */
@injectable()
export class KeithDiagramServer extends DiagramServer {
    private _connection: IConnection;

    @inject(SynthesisRegistry) protected synthesisRegistry: SynthesisRegistry;

    constructor(@inject(Connection) connection: IConnection) {
        super();
        this._connection = connection;
        connection.onMessageReceived(this.messageReceived.bind(this));
    }

    protected sendMessage(message: ActionMessage): void {
        this._connection.sendMessage(message);
    }

    messageReceived(message: ActionMessage) {
        super.messageReceived(message);

        const wasDiagramModelUpdated =
            message.action.kind === SetModelCommand.KIND ||
            message.action.kind === KeithUpdateModelAction.KIND;

        if (wasDiagramModelUpdated) {
            this.actionDispatcher.dispatch(new KeithFitToScreenAction(true));
        }
    }

    handleLocally(action: Action): boolean {
        switch (action.kind) {
            case ComputedBoundsAction.KIND:
                // TODO: remove sending of a computedBoundsAction as well
                // (not possible until https://github.com/inversify/InversifyJS/issues/1035).
                return false;
            case ComputedTextBoundsAction.KIND:
                return true;
            case PerformActionAction.KIND:
                return true;
            case RequestTextBoundsCommand.KIND:
                return false;
            case SetSynthesisAction.KIND:
                return true;
        }
        return super.handleLocally(action);
    }

    initialize(registry: ActionHandlerRegistry): void {
        super.initialize(registry);

        // Register the KEITH specific new actions.
        registry.register(BringToFrontAction.KIND, this);
        registry.register(CheckImagesAction.KIND, this);
        registry.register(CheckedImagesAction.KIND, this);
        registry.register(ComputedTextBoundsAction.KIND, this);
        registry.register(DeleteLayerConstraintAction.KIND, this);
        registry.register(DeletePositionConstraintAction.KIND, this);
        registry.register(DeleteStaticConstraintAction.KIND, this);
        // registry.register(KeithUpdateModelAction.KIND, this)
        registry.register(PerformActionAction.KIND, this);
        registry.register(RectPackSetPositionConstraintAction.KIND, this);
        registry.register(RectPackDeletePositionConstraintAction.KIND, this);
        registry.register(RefreshDiagramAction.KIND, this);
        registry.register(RefreshLayoutAction.KIND, this);
        registry.register(RequestKeithPopupModelAction.KIND, this);
        registry.register(RequestTextBoundsCommand.KIND, this);
        registry.register(SetAspectRatioAction.KIND, this);
        registry.register(SetLayerConstraintAction.KIND, this);
        registry.register(SetPositionConstraintAction.KIND, this);
        registry.register(SetStaticConstraintAction.KIND, this);
        registry.register(SetSynthesesAction.KIND, this);
        registry.register(SetSynthesisAction.KIND, this);
        registry.register(StoreImagesAction.KIND, this);
        registry.register(SwitchEditModeAction.KIND, this);
        registry.register(updateOptionsKind, this);
    }

    handle(action: Action): void | ICommand | Action {
        if (
            action.kind === BringToFrontAction.KIND ||
            action.kind === SwitchEditModeAction.KIND ||
            action.kind === RequestPopupModelAction.KIND
        ) {
            // Actions that should be ignored and not further handled by this diagram server
            return;
        }

        if (action.kind === SetSynthesesAction.KIND) {
            this.handleSetSyntheses(action as SetSynthesesAction);
        } else {
            super.handle(action);
        }

        // TODO: (cfr) Have a look at what cases can be supported directly by the core.
        // else if (
        //   action.kind === PerformActionAction.KIND &&
        //   (action as PerformActionAction).actionId ===
        //     "de.cau.cs.kieler.kicool.ui.klighd.internal.model.action.OpenCodeInEditorAction"
        // ) {
        //   onDisplayInputModelEmitter.fire(action);
        // } else if (
        //   action.kind === PerformActionAction.KIND &&
        //   (action as PerformActionAction).actionId ===
        //     "de.cau.cs.kieler.simulation.ui.synthesis.action.StartSimulationAction"
        // ) {
        //   startSimulationEmitter.fire(action);
        // } else if (
        //   action.kind === PerformActionAction.KIND &&
        //   (action as PerformActionAction).actionId ===
        //     "de.cau.cs.kieler.simulation.ui.synthesis.action.AddCoSimulationAction"
        // ) {
        //   addCoSimulationEmitter.fire(action);
        // } else if (action.kind === CheckImagesAction.KIND) {
        //   this.handleCheckImages(action as CheckImagesAction);
        // } else if (action.kind === StoreImagesAction.KIND) {
        //   this.handleStoreImages(action as StoreImagesAction);
        // } else if (action.kind === updateOptionsKind) {
        //   onUpdateOptionsEmitter.fire(action);
        // } else if (
        //   action.kind === RequestKeithPopupModelAction.KIND &&
        //   action instanceof RequestKeithPopupModelAction
        // ) {
        //   this.handleRequestKeithPopupModel(action as RequestKeithPopupModelAction);
        // } else if (
        //   action.kind === RequestPopupModelAction.KIND ||
        //   action.kind === SwitchEditModeAction.KIND ||
        //   action.kind === BringToFrontAction.KIND
        // ) {
        //   // Ignore these ones
        // } else {
        //   super.handle(action);
        // }
    }

    handleSetSyntheses(action: SetSynthesesAction) {
        this.synthesisRegistry.setAvailableSyntheses(action.syntheses);
        this.synthesisRegistry.setProvidingDiagramServer(this);
        // this.connector.synthesisCommandContribution.onNewSyntheses(
        //   action.syntheses
        // );
    }

    handleCheckImages(action: CheckImagesAction) {
        // check in local storage, if these images are already stored. If not, send back a request for those images.
        const notCached: Pair<string, string>[] = [];
        for (let image of (action as CheckImagesAction).images) {
            const id = KeithDiagramServer.imageToSessionStorageString(
                image.bundleName,
                image.imagePath
            );
            if (!sessionStorage.getItem(id)) {
                notCached.push({ k: image.bundleName, v: image.imagePath });
            }
        }
        this.actionDispatcher.dispatch(new CheckedImagesAction(notCached));
    }

    handleStoreImages(action: StoreImagesAction) {
        // Put the new images in session storage.
        for (let imagePair of (action as StoreImagesAction).images) {
            const imageIdentifier = imagePair.k;
            const id = KeithDiagramServer.imageToSessionStorageString(
                imageIdentifier.k,
                imageIdentifier.v
            );
            const imageString = imagePair.v;
            sessionStorage.setItem(id, imageString);
        }
    }

    /**
     * Converts the representation of the image data into a single string for identification in sessionStorage.
     *
     * @param bundleName The bundle name of the image.
     * @param imagePath The image path of the image.
     */
    static imageToSessionStorageString(bundleName: string, imagePath: string) {
        return bundleName + ":" + imagePath;
    }

    handleComputedBounds(_action: ComputedBoundsAction): boolean {
        // ComputedBounds actions should not be generated and forwarded anymore, since only the computedTextBounds action is used by kgraph diagrams
        if (this.viewerOptions.needsServerLayout) {
            return true;
        } else {
            return false;
        }
    }
}

export async function requestModel(
    actionDispatcher: IActionDispatcher,
    options: { sourceUri: string; diagramType: string }
) {
    await actionDispatcher.dispatch(
        new RequestModelAction(options)
    );
}
