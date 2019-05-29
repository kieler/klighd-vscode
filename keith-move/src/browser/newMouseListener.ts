import { MoveMouseListener, SModelElement, Action, findParentByFeature, isMoveable, SRoutingHandle,
    isCreatingOnDrag, SelectAllAction, edgeInProgressID, SelectAction, SwitchEditModeAction,
    edgeInProgressTargetHandleID, SRoutableElement, translatePoint, findChildrenAtPosition,
    isConnectable, ReconnectAction, SChildElement, DeleteElementAction, CommitModelAction, SNode } from "sprotty";

// import { WorkspaceEditAction } from "sprotty-theia/lib/sprotty/languageserver/workspace-edit-command";
// import { WorkspaceEdit, TextEdit, Position } from "monaco-languageclient";
import { inject} from 'inversify';
import { LSTheiaDiagramServer, DiagramLanguageClient } from "sprotty-theia/lib/"
import { EditorManager } from "@theia/editor/lib/browser";
import { NotificationType } from "@theia/languages/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { LayerConstraint } from "./LayerConstraint";



export const goodbyeType = new NotificationType<string, void>('keith/constraintsLC/sayGoodbye')

export class NewMouseListener extends MoveMouseListener {
    editorManager: EditorManager
    diagramClient: DiagramLanguageClient
    uri: URI

    constructor(@inject(LSTheiaDiagramServer) dserver: LSTheiaDiagramServer
        ) {
        super();
        this.diagramClient = dserver.connector.diagramLanguageClient
        this.editorManager = dserver.connector.editorManager
        this.uri = dserver.connector.diagramManager.all[0].uri
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
        return new Promise( resolve => setTimeout(resolve, ms))
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
        console.log("hallo");
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
                // create a workspaceEditAction to write text in the editor
                /* const pos: Position = {line: 0, character: 0};
                const workedit: WorkspaceEdit = {changes: {[this.uri.toString(true)]: [TextEdit.insert(pos, "Hallo: " + target.id + "\n")]}};
                let workeditaction: WorkspaceEditAction = new WorkspaceEditAction(workedit);
                result.push(workeditaction);
                console.log("Target: " + target.id + " \n" + this.uri);
                */

            // if a node is moved set properties
            if (target instanceof SNode) {
                this.setProperty(target);
            }
        }
        this.hasDragged = false;
        this.lastDragPosition = undefined;
        return result;
    }

    /**
     * sets properties of the target accordingly to the position the target is moved to
     * @param target SModelElement that is moved
     */
    private setProperty(target: SModelElement): void {
        let targetNode: SNode = target as SNode
        let nodes = this.filterSNodes(targetNode.parent.children)
        // calculate layer and position the target has in the graph at the new position
        let layerInfos = this.getLayerInformations(targetNode, nodes)
        let layerOfTarget = layerInfos[0]
        let nodesOfLayer = layerInfos[1]
        let positionOfTarget = this.getPosForConstraint(nodesOfLayer, targetNode)

        // test (works)
        console.log("layer of the node: " + layerOfTarget)
        console.log("Position: " + positionOfTarget)

        // TODO: communication with server to set the properties

        // testing setLayerConstraint-method
        let uriStr = this.uri.toString(true)
        let lc: LayerConstraint = new LayerConstraint(uriStr, targetNode.id, layerOfTarget)
        this.diagramClient.languageClient.then (lClient => {
            lClient.sendNotification("keith/constraints/setLayerConstraint", lc)
        })

    }

    /**
     * caculates the layer the target is in and collect all nodes that are in the same layer
     * @param target SNode which layer should be calculated
     * @param nodes all SNodes the graph contains
     */
    private getLayerInformations(target: SNode, nodes: SNode[]): [number, SNode[]] {
        nodes.sort((a, b) => a.position.x - b.position.x)
        let rightmostX = Number.NEGATIVE_INFINITY
        let currentLayer = -1
        let nodesOfLayer: SNode[] = []
        let counter = 0
        let targetFound = false

        for (let node of nodes) {
            let posX = node.position.x
            // if the x position of the current node is greater than the rightmostX
            // of all previous nodes the current node is in a new layer
            if (posX > rightmostX) {
                // if the target was in the previous layer the method can stop
                if (targetFound) {
                    break
                }
                currentLayer++
                // reset
                nodesOfLayer = []
                counter = 0
            }
            if (node.id === target.id) {
                targetFound = true
            }
            nodesOfLayer[counter] = node
            counter++
            // update the rightmost occurence of the nodes
            rightmostX = posX + node.size.width > rightmostX ? posX + node.size.width : rightmostX
        }

        return [currentLayer, nodesOfLayer]
    }

    /**
     * filters the SNodes out of graphElements
     * @param graphElements all elements the graph contains
     */
    private filterSNodes(graphElements: any) {
        let nodes: SNode[] = []
        let counter = 0
        for (let elem of graphElements) {
            if (elem instanceof SNode) {
                nodes[counter] = elem as SNode
                counter++
            }
        }
        return nodes
    }

    /**
     * Expects the expected layer as an array. Returns the abstract position
     * to which the node is meant to be placed by a constraint.
     * @param layerNs
     * @param dragPosY
     */
    private getPosForConstraint (layerNs: SNode[], target: SNode): number {
        // Sort the layer array by y.
        layerNs.sort((a, b) => a.position.y - b.position.y)
        // Find the position of the target
        let succIndex: number = layerNs.indexOf(target)
        return succIndex
    }

}