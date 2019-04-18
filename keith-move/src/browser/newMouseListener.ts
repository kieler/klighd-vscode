import { MoveMouseListener, SModelElement, Action, findParentByFeature, isMoveable, SRoutingHandle,
    isCreatingOnDrag, SelectAllAction, edgeInProgressID, SelectAction, SwitchEditModeAction,
    edgeInProgressTargetHandleID, SRoutableElement, translatePoint, findChildrenAtPosition,
    isConnectable, ReconnectAction, SChildElement, DeleteElementAction, CommitModelAction } from "sprotty";

export class NewMouseListener extends MoveMouseListener {
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
            console.log("Target: " + target.id);
        }
        this.hasDragged = false;
        this.lastDragPosition = undefined;
        return result;
    }
}