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

import { RefreshDiagramAction } from "@kieler/klighd-interactive/lib/actions";
import {
    DeleteLayerConstraintAction,
    DeletePositionConstraintAction,
    DeleteStaticConstraintAction,
    SetLayerConstraintAction,
    SetPositionConstraintAction,
    SetStaticConstraintAction,
} from "@kieler/klighd-interactive/lib/layered/actions";
import {
    RectPackDeletePositionConstraintAction,
    RectPackSetPositionConstraintAction,
    SetAspectRatioAction,
} from "@kieler/klighd-interactive/lib/rect-packing/actions";
import { inject, injectable } from "inversify";
import {
    Action,
    ActionHandlerRegistry,
    ActionMessage,
    BringToFrontAction,
    DiagramServer,
    findElement,
    generateRequestId,
    GetViewportAction,
    ICommand,
    RequestPopupModelAction,
    SelectAction,
    SetModelCommand,
    SetPopupModelAction,
    SwitchEditModeAction,
    TYPES,
    ViewportResult,
} from "sprotty";
import {
    CheckedImagesAction,
    CheckImagesAction,
    KlighdFitToScreenAction,
    KlighdUpdateModelAction,
    Pair,
    PerformActionAction,
    RefreshLayoutAction,
    RequestDiagramPieceAction,
    SetDiagramPieceAction,
    StoreImagesAction,
} from "./actions/actions";
import { GoToBookmarkAction } from "./bookmarks/bookmark";
import { BookmarkRegistry } from "./bookmarks/bookmark-registry";
import { DISymbol } from "./di.symbols";
import { GridDiagramPieceRequestManager, IDiagramPieceRequestManager } from './diagram-piece-request-manager';
import { RequestKlighdPopupModelAction } from "./hover/hover";
import { PopupModelProvider } from "./hover/popup-provider";
import { PreferencesRegistry } from "./preferences-registry";
import { Connection, SessionStorage } from "./services";
import { SetSynthesisAction } from "./syntheses/actions";
import { UpdateDepthMapModelAction } from "./update/update-depthmap-model";

/**
 * This class extends {@link DiagramServer} to handle different `klighd-core` specific
 * actions and forward them to the server is required.
 */
@injectable()
export class KlighdDiagramServer extends DiagramServer {
    /** Generic connection to the server used to send and receive actions. */
    private _connection: Connection;

    childrenToRequestQueue: IDiagramPieceRequestManager = new GridDiagramPieceRequestManager
    // childrenToRequestQueue: IDiagramPieceRequestManager = new QueueDiagramPieceRequestManager

    @inject(SessionStorage) private sessionStorage: SessionStorage;
    @inject(TYPES.IPopupModelProvider) private popupModelProvider: PopupModelProvider;
    @inject(DISymbol.PreferencesRegistry) private preferencesRegistry: PreferencesRegistry;
    @inject(DISymbol.BookmarkRegistry) private bookmarkRegistry: BookmarkRegistry;


    constructor(@inject(Connection) connection: Connection) {
        super();
        this._connection = connection;
        connection.onMessageReceived(this.messageReceived.bind(this));
    }

    protected sendMessage(message: ActionMessage): void {
        this._connection.sendMessage(message);
    }

    messageReceived(message: ActionMessage): void {
        super.messageReceived(message);

        const wasDiagramModelUpdated =
            message.action.kind === SetModelCommand.KIND ||
            message.action.kind === KlighdUpdateModelAction.KIND;
        if (wasDiagramModelUpdated) {
            this.actionDispatcher.dispatch(new UpdateDepthMapModelAction());

            // After model is received request first piece.

            // TODO: Here some state aware process should handle requesting pieces
            //       This needs to be initialized here, probably also do this stuff
            //       with commands
            // get root diagram piece
            this.childrenToRequestQueue.reset()
            this.actionDispatcher.dispatch(new RequestDiagramPieceAction(generateRequestId(), '$root'))

            if (this.bookmarkRegistry.initialBookmark) {
                this.actionDispatcher.dispatch(new GoToBookmarkAction(this.bookmarkRegistry.initialBookmark))
            } else if (this.preferencesRegistry.preferences.resizeToFit) {
                this.actionDispatcher.dispatch(new KlighdFitToScreenAction(true));
            }
        } else if (message.action.kind === SetDiagramPieceAction.KIND) {
            // add any children of the requested piece as stubs into queue
            if ((message.action as SetDiagramPieceAction).diagramPiece.children !== undefined) {
                const children = (message.action as SetDiagramPieceAction).diagramPiece.children!
                children.forEach(element => {
                    // FIXME: not all types of children should be added here, edges for example are already
                    //        complete as they can't have any own children
                    this.childrenToRequestQueue.enqueue((message.action as SetDiagramPieceAction).diagramPiece.id, element)
                });
            }
            if (this.childrenToRequestQueue.front() !== undefined) {

                // get viewport
                this.actionDispatcher.dispatch(GetViewportAction.create())
            }
        }
    }

    handleLocally(action: Action): boolean {
        // In contract to the name, this should return true, if the actions should be
        // sent to the server. Don't know what the Sprotty folks where thinking when they named it...
        switch (action.kind) {
            case PerformActionAction.KIND:
                return true;
            case RefreshDiagramAction.KIND:
                return true;
            case RefreshLayoutAction.KIND:
                return true;
            case RequestDiagramPieceAction.KIND:
                return true;
            case SetSynthesisAction.KIND:
                return true;
        }
        return super.handleLocally(action);
    }

    initialize(registry: ActionHandlerRegistry): void {
        super.initialize(registry);

        // Register the KLighD specific new actions.
        registry.register(BringToFrontAction.KIND, this);
        registry.register(CheckImagesAction.KIND, this);
        registry.register(CheckedImagesAction.KIND, this);
        registry.register(DeleteLayerConstraintAction.KIND, this);
        registry.register(DeletePositionConstraintAction.KIND, this);
        registry.register(DeleteStaticConstraintAction.KIND, this);
        registry.register(PerformActionAction.KIND, this);
        registry.register(RectPackSetPositionConstraintAction.KIND, this);
        registry.register(RectPackDeletePositionConstraintAction.KIND, this);
        registry.register(RefreshDiagramAction.KIND, this);
        registry.register(RefreshLayoutAction.KIND, this);
        registry.register(RequestKlighdPopupModelAction.KIND, this);
        registry.register(RequestDiagramPieceAction.KIND, this);
        registry.register(SetAspectRatioAction.KIND, this);
        registry.register(SetLayerConstraintAction.KIND, this);
        registry.register(SetPositionConstraintAction.KIND, this);
        registry.register(SetStaticConstraintAction.KIND, this);
        registry.register(SetSynthesisAction.KIND, this);
        registry.register(StoreImagesAction.KIND, this);
        registry.register(SwitchEditModeAction.KIND, this);
        registry.register(SelectAction.KIND, this);
        registry.register(SetDiagramPieceAction.KIND, this);
        registry.register(ViewportResult.KIND, this);
    }

    handle(action: Action): void | ICommand | Action {

        if (action.kind === BringToFrontAction.KIND || action.kind === SwitchEditModeAction.KIND) {
            // Actions that should be ignored and not further handled by this diagram server
            return;
        }

        if (action.kind === CheckImagesAction.KIND) {
            this.handleCheckImages(action as CheckImagesAction);
        } else if (action.kind === StoreImagesAction.KIND) {
            this.handleStoreImages(action as StoreImagesAction);
        } else if (action.kind === RequestPopupModelAction.KIND) {
            // Handle RequestPopupModelAction if they are modified RequestKlighdPopupModelAction.
            // Other PopupModel requests are simply ignored.
            if (action instanceof RequestKlighdPopupModelAction)
                this.handleRequestKlighdPopupModel(action as RequestKlighdPopupModelAction);
        } else if (action.kind === RequestDiagramPieceAction.KIND) {
            this.handleRequestDiagramPiece(action as RequestDiagramPieceAction)
        } else if (action.kind === ViewportResult.KIND) {
            this.handleViewportResult(action as ViewportResult)
        } else {
            super.handle(action);
        }
    }

    handleCheckImages(action: CheckImagesAction): void {
        // check in local storage, if these images are already stored. If not, send back a request for those images.
        const notCached: Pair<string, string>[] = [];
        for (const image of (action as CheckImagesAction).images) {
            const id = KlighdDiagramServer.imageToSessionStorageString(
                image.bundleName,
                image.imagePath
            );
            if (!this.sessionStorage.getItem(id)) {
                notCached.push({ k: image.bundleName, v: image.imagePath });
            }
        }
        this.actionDispatcher.dispatch(new CheckedImagesAction(notCached));
    }

    handleStoreImages(action: StoreImagesAction): void {
        // Put the new images in session storage.
        for (const imagePair of (action as StoreImagesAction).images) {
            const imageIdentifier = imagePair.k;
            const id = KlighdDiagramServer.imageToSessionStorageString(
                imageIdentifier.k,
                imageIdentifier.v
            );
            const imageString = imagePair.v;
            this.sessionStorage.setItem(id, imageString);
        }
    }

    /**
     * Converts the representation of the image data into a single string for identification in sessionStorage.
     *
     * @param bundleName The bundle name of the image.
     * @param imagePath The image path of the image.
     */
    private static imageToSessionStorageString(bundleName: string, imagePath: string) {
        return bundleName + ":" + imagePath;
    }

    /**
     * Handles Popup Requests because the action requires the currentRoot,
     * which is stored as a protected property in the super class.
     */
    handleRequestKlighdPopupModel(action: RequestKlighdPopupModelAction): boolean {
        const element = findElement(this.currentRoot, action.elementId);
        if (element) {
            const model = this.popupModelProvider.getPopupModel(action, element);

            if (model) {
                this.actionDispatcher.dispatch(new SetPopupModelAction(model));
            }
        }
        return false;
    }

    handleRequestDiagramPiece(action: RequestDiagramPieceAction): void {
        this.forwardToServer(action)
    }

    handleViewportResult(action: ViewportResult): void {
        this.childrenToRequestQueue.setViewport(action)
        const child = this.childrenToRequestQueue.dequeue()!
        this.actionDispatcher.dispatch(new RequestDiagramPieceAction(generateRequestId(), child.id))
    }

    handleComputedBounds(): boolean {
        // ComputedBounds actions should not be generated and forwarded anymore,
        // since only the computedTextBounds action is used by kgraph diagrams
        if (this.viewerOptions.needsServerLayout) {
            return true;
        } else {
            return false;
        }
    }
}
