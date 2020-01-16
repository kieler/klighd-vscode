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

import { SModelElement, Action, SNode, SLabel, SEdge, MoveMouseListener } from 'sprotty';

import { injectable, inject } from 'inversify';
import { KNode, Layer } from './constraint-classes';
import {
    filterKNodes, getLayerOfNode, getNodesOfLayer, getPositionInLayer, getActualLayer, getActualTargetIndex, getLayers, shouldOnlyLCBeSet, isLayerForbidden
} from './constraint-utils';
import { SetLayerConstraintAction, SetStaticConstraintAction, SetPositionConstraintAction, RefreshLayoutAction, DeleteStaticConstraintAction } from './actions';
import { LSTheiaDiagramServer } from 'sprotty-theia/lib';

@injectable()
export class KeithInteractiveMouseListener extends MoveMouseListener {

    private layers: Layer[] = []
    private nodes: KNode[] = []
    private target: KNode | undefined
    @inject(LSTheiaDiagramServer) dserver: LSTheiaDiagramServer

    /**
     * Does not use super implementation, since it calls mouseUp
     * @param target target node
     * @param event target event
     */
    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        if (!event.altKey && this.target) {
            if (target instanceof SLabel && target.parent instanceof SNode) {
                // nodes should be movable when the user clicks on the label
                target = target.parent
            }
            let result = []
            if (this.startDragPosition) {
                if (this.elementId2startPos.size === 0) {
                    this.collectStartPositions(this.target.root);
                }
                this.hasDragged = true;
                const moveAction = this.getElementMoves(this.target, event, false)
                if (moveAction)
                    result.push(moveAction);
            }
            // workaround - when a node is moved and after that an edge, hasDragged is set to true although edges are not movable
            if (target instanceof SEdge) {
                this.hasDragged = false
            }
            return result
        }
        return []
    }

    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        if (this.dserver.connector.editorManager.currentEditor && this.dserver.connector.editorManager.currentEditor.saveable.dirty) {
            this.dserver.connector.editorManager.currentEditor.saveable.save();
        }
        if (target instanceof SLabel && target.parent instanceof SNode) {
            // nodes should be movable when the user clicks on the label
            target = target.parent
        }

        if (target instanceof SNode) {
            this.target = target as KNode
            // Set layer bounds
            this.nodes = filterKNodes(this.target.parent.children)
            this.layers = getLayers(this.nodes, this.target.direction)

            this.target.selected = true
            if (this.target.interactiveLayout) {
                // save the coordinates as shadow coordinates
                this.target.shadowX = this.target.position.x
                this.target.shadowY = this.target.position.y
                this.target.shadow = true
            }
            if (event.altKey) {
                return [new DeleteStaticConstraintAction({
                    id: this.target.id
                })]
            }
        }
        return super.mouseDown(target as SModelElement, event)
    }

    /**
     * Override size mouseEnter should not call mouseUp.
     * @param target target
     * @param event event
     */
    mouseEnter(target: SModelElement, event: MouseEvent): Action[] {
        return [];
    }

    mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        if (this.hasDragged && this.target) {
            // if a node is moved set properties
            this.target.shadow = false
            return [this.setProperty(this.target)].concat(super.mouseUp(this.target, event));
        } else if (this.target) {
            this.target.selected = false
            return super.mouseUp(this.target, event).concat([new RefreshLayoutAction()]);
        }
        return super.mouseUp(target, event)
    }

    /**
     * Sets properties of the target accordingly to the position the target is moved to
     * @param target SModelElement that is moved
     */
    setProperty(target: SModelElement): Action {
        const targetNode: KNode = target as KNode
        const direction = targetNode.direction
        // calculate layer and position the target has in the graph at the new position
        const layerOfTarget = getLayerOfNode(targetNode, this.nodes, this.layers, direction)
        const nodesOfLayer = getNodesOfLayer(layerOfTarget, this.nodes)
        const positionOfTarget = getPositionInLayer(nodesOfLayer, targetNode)
        const newPositionCons = getActualTargetIndex(positionOfTarget, nodesOfLayer.indexOf(targetNode) !== -1, nodesOfLayer)
        const newLayerCons = getActualLayer(targetNode, this.nodes, layerOfTarget)
        const forbidden = isLayerForbidden(targetNode, newLayerCons)

        if (forbidden) {
            // If layer is forbidden just refresh
            return new RefreshLayoutAction()
        } else if (targetNode.layerId !== layerOfTarget) {
            // layer constraint should only be set if the layer index changed
            if (shouldOnlyLCBeSet(targetNode, this.layers, direction)) {
                // only the layer constraint should be set
                return new SetLayerConstraintAction({
                    id: targetNode.id,
                    layer: layerOfTarget,
                    layerCons: newLayerCons
                })
            } else {
                // If layer and position constraint should be set - send them both in one StaticConstraint
                return new SetStaticConstraintAction({
                    id: targetNode.id,
                    layer: layerOfTarget,
                    layerCons: newLayerCons,
                    position: positionOfTarget,
                    posCons: newPositionCons
                })
            }
        } else {

            // position constraint should only be set if the position of the node changed
            if (targetNode.posId !== positionOfTarget) {
                // set the position Constraint
                return new SetPositionConstraintAction({
                    id: targetNode.id,
                    position: positionOfTarget,
                    posCons: newPositionCons
                })
            }
        }
        // If the node was moved without setting a constraint - let it snap back
        return new RefreshLayoutAction()
    }

}