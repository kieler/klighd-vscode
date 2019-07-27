import {
    MoveMouseListener, SModelElement, Action, findParentByFeature, isMoveable, SRoutingHandle,
    isCreatingOnDrag, SelectAllAction, edgeInProgressID, SelectAction, SwitchEditModeAction,
    edgeInProgressTargetHandleID, SRoutableElement, translatePoint, findChildrenAtPosition,
    isConnectable, ReconnectAction, SChildElement, DeleteElementAction, CommitModelAction, SNode
} from "sprotty";

import { inject } from 'inversify';
import { LSTheiaDiagramServer, DiagramLanguageClient, DiagramWidget } from "sprotty-theia/lib/"
import { EditorManager } from "@theia/editor/lib/browser";
import { NotificationType } from "@theia/languages/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { KNode } from "@kieler/keith-constraints/lib/ConstraintClasses";
import { LayerConstraint } from '@kieler/keith-constraints/lib/LayerConstraint';
import { PositionConstraint } from '@kieler/keith-constraints/lib/PositionConstraint';
// import { DeleteConstraint } from '@kieler/keith-constraints/lib/DeleteConstraint';
import { StaticConstraint } from '@kieler/keith-constraints/lib/StaticConstraint';
import { filterKNodes, getLayerOfNode, getNodesOfLayer, getPosInLayer } from "./ConstraintUtils";

export const goodbyeType = new NotificationType<string, void>('keith/constraintsLC/sayGoodbye')

export class InteractiveMouseListener extends MoveMouseListener {
    editorManager: EditorManager
    diagramClient: DiagramLanguageClient
    uri: URI
    widget: DiagramWidget

    constructor(@inject(LSTheiaDiagramServer) dserver: LSTheiaDiagramServer
    ) {
        super();
        this.diagramClient = dserver.connector.diagramLanguageClient
        this.editorManager = dserver.connector.editorManager
        this.widget = dserver.connector.diagramManager.all[0]
        this.uri = this.widget.uri
        this.waitOnLCContribution()
    }

    onMessageReceived(str: string) {
        console.log("Message was received: " + str)
    }

    async waitOnLCContribution() {
        const lClient = await this.diagramClient.languageClient
        while (!this.diagramClient.languageClientContribution.running) {
            await this.delay(120)
        }
        lClient.onNotification(goodbyeType, this.onMessageReceived.bind(this))
    }

    delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.button === 0) {
            const moveable = findParentByFeature(target, isMoveable);
            const isRoutingHandle = target instanceof SRoutingHandle;
            if (moveable !== undefined || isRoutingHandle || isCreatingOnDrag(target)) {
                this.lastDragPosition = { x: event.pageX, y: event.pageY };
            } else {
                this.lastDragPosition = undefined;
            }
            this.hasDragged = false;
            if (isCreatingOnDrag(target)) {
                result.push(new SelectAllAction(false));
                result.push(target.createAction(edgeInProgressID));
                result.push(new SelectAction([edgeInProgressID], []));
                result.push(new SwitchEditModeAction([edgeInProgressID], []));
                result.push(new SelectAction([edgeInProgressTargetHandleID], []));
                result.push(new SwitchEditModeAction([edgeInProgressTargetHandleID], []));
            } else if (isRoutingHandle) {
                result.push(new SwitchEditModeAction([target.id], []));
            }
        }

        if (target instanceof SNode) {
            // save the coordinates as shadow coordinates
            let targetNode = target as KNode
            targetNode.shadowX = targetNode.position.x
            targetNode.shadowY = targetNode.position.y
            targetNode.shadow = true
        }

        return result;
    }

    mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        let hasReconnected = false;
        if (this.lastDragPosition) {
            target.root.index.all()
                .forEach(element => {
                    if (element instanceof SRoutingHandle) {
                        const parent = element.parent;
                        if (parent instanceof SRoutableElement && element.danglingAnchor) {
                            const handlePos = this.getHandlePosition(element);
                            if (handlePos) {
                                const handlePosAbs = translatePoint(handlePos, element.parent, element.root);
                                const newEnd = findChildrenAtPosition(target.root, handlePosAbs)
                                    .find(e => isConnectable(e) && e.canConnect(parent, element.kind as ('source' | 'target')));
                                if (newEnd && this.hasDragged) {
                                    result.push(new ReconnectAction(element.parent.id,
                                        element.kind === 'source' ? newEnd.id : parent.sourceId,
                                        element.kind === 'target' ? newEnd.id : parent.targetId));
                                    hasReconnected = true;
                                }
                            }
                        }
                        if (element.editMode)
                            result.push(new SwitchEditModeAction([], [element.id]));
                    }
                });
        }
        if (!hasReconnected) {
            const edgeInProgress = target.root.index.getById(edgeInProgressID);
            if (edgeInProgress instanceof SChildElement) {
                const deleteIds: string[] = [];
                deleteIds.push(edgeInProgressID);
                edgeInProgress.children.forEach(c => {
                    if (c instanceof SRoutingHandle && c.danglingAnchor)
                        deleteIds.push(c.danglingAnchor.id);
                });
                result.push(new DeleteElementAction(deleteIds));
            }
        }
        if (this.hasDragged) {
            result.push(new CommitModelAction());

            // if a node is moved set Constraints for this node
            if (target instanceof SNode) {
                this.setConstraint(target);
            }
        }
        this.hasDragged = false;
        this.lastDragPosition = undefined;
        return result;
    }

    /**
     * Sets Constraints of the target accordingly to the position the target is moved to.
     * @param target SModelElement that is moved.
     */
    private setConstraint(target: SModelElement): void {
        let targetNode: KNode = target as KNode
        let nodes = filterKNodes(targetNode.parent.children)
        // calculate layer and position the target has in the graph at the new position
        let layerOfTarget = getLayerOfNode(targetNode, nodes)
        let nodesOfLayer = getNodesOfLayer(layerOfTarget, nodes)
        let positionOfTarget = getPosInLayer(nodesOfLayer, targetNode)

        this.uri = this.widget.uri
        let uriStr = this.uri.toString(true)

        let constraintSet = false

        // layer Constraint should only be set if the layer index changed
        if (targetNode.layerId !== layerOfTarget) {
            constraintSet = true

            if (targetNode.posId !== positionOfTarget) {
                // If layer and positional Constraint should be set - send them both in one StaticConstraint
                let sc: StaticConstraint = new StaticConstraint(uriStr, targetNode.id, layerOfTarget, positionOfTarget)
                this.diagramClient.languageClient.then(lClient => {
                    lClient.sendNotification("keith/constraints/setStaticConstraint", sc)
                })
            } else {
                // set a simple layer Constraint
                let lc: LayerConstraint = new LayerConstraint(uriStr, targetNode.id, layerOfTarget)
                this.diagramClient.languageClient.then(lClient => {
                    lClient.sendNotification("keith/constraints/setLayerConstraint", lc)
                })
            }
        } else {
            // position Constraint should only be set if the position of the node changed
            if (targetNode.posId !== positionOfTarget) {
                constraintSet = true
                // set the position Constraint
                let pc: PositionConstraint = new PositionConstraint(uriStr, targetNode.id, positionOfTarget)
                this.diagramClient.languageClient.then(lClient => {
                    lClient.sendNotification("keith/constraints/setPositionConstraint", pc)
                })
            }
        }
        // If the node was moved without setting a Constraint - let it snap back
        if (!constraintSet) {
            /*let dc: DeleteConstraint = new DeleteConstraint(uriStr, targetNode.id)
            this.diagramClient.languageClient.then(lClient => { lClient.sendNotification("keith/constraints/deleteStaticConstraint", dc) })*/
            this.diagramClient.languageClient.then(lClient => { lClient.sendNotification("keith/constraints/refreshLayout", uriStr) })
        }
    }

}