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
import { KNode } from './constraint-classes';
import {
    filterKNodes, getLayerOfNode, getNodesOfLayer, getPosInLayer, getActualLayer, getActualTargetIndex, getLayers, shouldOnlyLCBeSet
} from './constraint-utils';
import { SetLayerConstraintAction, SetStaticConstraintAction, SetPositionConstraintAction, RefreshLayoutAction } from './actions';

@injectable()
export class KeithInteractiveMouseListener extends MoveMouseListener {

    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        if (target instanceof SLabel && target.parent instanceof SNode) {
            // nodes should be movable when the user clicks on the label
            target = target.parent
        }

        const result = super.mouseMove(target, event);
        // workaround - when a node is moved and after that an edge, hasDragged is set to true although edges are not movable
        if (target instanceof SEdge) {
            this.hasDragged = false
        }
        return result
    }

    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        if (target instanceof SLabel && target.parent instanceof SNode) {
            // nodes should be movable when the user clicks on the label
            target = target.parent
        }

        if (target instanceof SNode) {
            target.selected = true
            let targetNode = target as KNode
            if (targetNode.interactiveLayout) {
                // save the coordinates as shadow coordinates
                targetNode.shadowX = targetNode.position.x
                targetNode.shadowY = targetNode.position.y
                targetNode.shadow = true
                console.log("Position", targetNode.position)
            }
        }

        return super.mouseDown(target, event);
    }

    mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        if (target instanceof SLabel && target.parent instanceof SNode) {
            // nodes should be movable when the user clicks on the label
            target = target.parent
        }

        if (this.hasDragged && target instanceof SNode) {
            // if a node is moved set properties
            (target as KNode).shadow = false
            return [this.setProperty(target)];

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
        let nodes = filterKNodes(targetNode.parent.children)
        // calculate layer and position the target has in the graph at the new position
        let layers = getLayers(nodes, direction)
        let layerOfTarget = getLayerOfNode(targetNode, nodes, layers, direction)
        let nodesOfLayer = getNodesOfLayer(layerOfTarget, nodes)
        let positionOfTarget = getPosInLayer(nodesOfLayer, targetNode)
        let newPositionCons = getActualTargetIndex(positionOfTarget, nodesOfLayer.indexOf(targetNode) !== -1, nodesOfLayer)

        let newLayerCons = getActualLayer(targetNode, nodes, layerOfTarget)

        // layer constraint should only be set if the layer index changed
        if (targetNode.layerId !== layerOfTarget) {

            if (shouldOnlyLCBeSet(targetNode, layers, direction)) {
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