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

import { injectable } from 'inversify';
import { KNode, Layer } from './constraint-classes';
import {
    filterKNodes, getLayerOfNode, getNodesOfLayer, getPositionInLayer, getActualLayer, getActualTargetIndex, getLayers, shouldOnlyLCBeSet
} from './constraint-utils';
import { SetLayerConstraintAction, SetStaticConstraintAction, SetPositionConstraintAction, RefreshLayoutAction, DeleteStaticConstraintAction } from './actions';

@injectable()
export class KeithInteractiveMouseListener extends MoveMouseListener {

    private layers: Layer[] = []
    private nodes: KNode[] = []

    /**
     * Does not use super implementation, since it calls mouseUp
     * @param target target node
     * @param event target event
     */
    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        if (!event.altKey) {
            if (target instanceof SLabel && target.parent instanceof SNode) {
                // nodes should be movable when the user clicks on the label
                target = target.parent
            }
            let result = []
            if (this.startDragPosition) {
                if (this.elementId2startPos.size === 0) {
                    this.collectStartPositions(target.root);
                }
                this.hasDragged = true;
                const moveAction = this.getElementMoves(target, event, false);
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
        if (target instanceof SLabel && target.parent instanceof SNode) {
            // nodes should be movable when the user clicks on the label
            target = target.parent
        }

        if (target instanceof SNode) {

            // Set layer bounds
            this.nodes = filterKNodes(target.parent.children)
            this.layers = getLayers(this.nodes, (target as KNode).direction)

            target.selected = true
            let targetNode = target as KNode
            if (targetNode.interactiveLayout) {
                // save the coordinates as shadow coordinates
                targetNode.shadowX = targetNode.position.x
                targetNode.shadowY = targetNode.position.y
                targetNode.shadow = true
            }
            if (event.altKey) {
                return [new DeleteStaticConstraintAction({
                    id: targetNode.id
                })]
            }
        }
        return super.mouseDown(target, event);
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
        if (target instanceof SLabel && target.parent instanceof SNode) {
            // nodes should be movable when the user clicks on the label
            target = target.parent
        }

        if (this.hasDragged && target instanceof SNode) {
            // if a node is moved set properties
            (target as KNode).shadow = false
            return [this.setProperty(target)].concat(super.mouseUp(target, event));
        }

        if (target instanceof SNode) {
            target.selected = false
        }

        return super.mouseUp(target, event);
    }

    /**
     * Sets properties of the target accordingly to the position the target is moved to
     * @param target SModelElement that is moved
     */
    setProperty(target: SModelElement): Action {
        let targetNode: KNode = target as KNode
        const direction = targetNode.direction
        // calculate layer and position the target has in the graph at the new position
        let layerOfTarget = getLayerOfNode(targetNode, this.nodes, this.layers, direction)
        let nodesOfLayer = getNodesOfLayer(layerOfTarget, this.nodes)
        let positionOfTarget = getPositionInLayer(nodesOfLayer, targetNode)
        let newPositionCons = getActualTargetIndex(positionOfTarget, nodesOfLayer.indexOf(targetNode) !== -1, nodesOfLayer)

        let newLayerCons = getActualLayer(targetNode, this.nodes, layerOfTarget)

        // layer constraint should only be set if the layer index changed
        if (targetNode.layerId !== layerOfTarget) {
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