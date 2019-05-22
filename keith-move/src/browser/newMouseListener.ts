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
import { sort } from "semver";
import { SSL_OP_NO_TLSv1_1 } from "constants";

export const goodbyeType = new NotificationType<string, void>('keith/constraintsLC/sayGoodbye')

export class NewMouseListener extends MoveMouseListener {
    editorManager: EditorManager
    diagramClient: DiagramLanguageClient

    constructor(@inject(LSTheiaDiagramServer) dserver: LSTheiaDiagramServer
        ) {
        super();
        this.diagramClient = dserver.connector.diagramLanguageClient
        this.editorManager = dserver.connector.editorManager
        this.waitOnLCContribution()
    }

    onMessageReceived(str: string) {
        console.log("Message was received: " + str)
    }

    async waitOnLCContribution() {
    async wasteTime() {
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
            /*let edi = this.editorManager.currentEditor
            if (edi !== undefined) {
                let uri = edi.editor.document.uri;
                const pos: Position = {line: 0, character: 0};
                const workedit: WorkspaceEdit = {changes: {[uri]: [TextEdit.insert(pos, "Hallo: " + target.id + "\n")]}};
                let workeditaction: WorkspaceEditAction = new WorkspaceEditAction(workedit);
                result.push(workeditaction);
                console.log("Target: " + target.id + " \n" + uri);
            }*/
            this.setProperty(target, event);

        }
        this.hasDragged = false;
        this.lastDragPosition = undefined;
        return result;
    }

    private setProperty(target: SModelElement, event: MouseEvent): void {
        let targetNode: SNode = target as SNode
        let graphNodes = targetNode.parent.children
        let targetID = target.id

        // calculate property that should be set

        let gNodes = this.copyNodes(graphNodes)
        gNodes.sort((a, b) => a.position.x - b.position.x)
        let curX = -1
        let layer = -1
        let curLayer: SNode[] = []
        let c = 0
        let found = false
        for (let node of gNodes) {
            let posX = node.position.x
            if (posX > curX) {
                if (found) {
                    break
                }
                layer = layer + 1
                curLayer = []
                c = 0
            }
            if (node.id === targetID) {
                found = true
            }
            curLayer[c] = node
            curX = posX + node.size.width > curX ? posX + node.size.width : curX
            console.log("node x pos: " + node.position.x)
            console.log("node width: " + node.size.width)
        }
        console.log("layer of the node: " + layer)

        /*this.diagramClient.languageClient.then (lClient => {
            lClient.sendNotification("keith/constraints/sayhello", "Client")
        }) */
    }

    copyNodes(graphNodes: any) {
        let nodes: SNode[] = []
        let counter = 0
        for (let i = 0; i < graphNodes.length; i++) {
            let gNode = graphNodes[i]
            if (!gNode.id.includes('$$E')) {
                nodes[counter] = gNode as SNode
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
private getPosForConstraint (layerNs: SNode[], dragPosY: number): number {
    // Sort the layer array by y.
    layerNs.sort((a, b) => a.position.y - b.position.y)
    // Find the first node that is below the drag position.
    let succIndex: number = layerNs.findIndex(n => n.position.y < dragPosY)

    return succIndex
}




}