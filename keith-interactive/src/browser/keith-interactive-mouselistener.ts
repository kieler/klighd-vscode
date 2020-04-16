/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019, 2020 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { inject, injectable } from 'inversify';
import { Action, MoveMouseListener, SEdge, SLabel, SModelElement, SNode } from 'sprotty';
import { LSTheiaDiagramServer } from 'sprotty-theia/lib/sprotty/languageserver/ls-theia-diagram-server';
import { isUndefined } from 'util';
import { RefreshDiagramAction } from './actions';
import { KNode } from './constraint-classes';
import { filterKNodes } from './helper-methods';
import { DeleteStaticConstraintAction } from './layered/actions';
import { getLayers, setProperty } from './layered/constraint-utils';
import { RectPackDeletePositionConstraintAction } from './rect-packing/actions';
import { setGenerateRectPackAction } from './rect-packing/constraint-util';

@injectable()
export class KeithInteractiveMouseListener extends MoveMouseListener {

    /**
     * Map to holds algorithm specific data generated on mouse down.
     */
    private data: Map<string, any> = new Map

    /**
     * The nodes.
     */
    private nodes: KNode[] = []

    /**
     * The currently moved node.
     */
    private target: KNode | undefined

    /**
     * The diagram server.
     */
    @inject(LSTheiaDiagramServer) protected readonly dserver: LSTheiaDiagramServer

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
        let targetNode = target
        if (target instanceof SLabel && target.parent instanceof SNode) {
            // nodes should be movable when the user clicks on the label
            targetNode = target.parent
        }
        if (targetNode && targetNode instanceof SNode) {
            if (((targetNode as KNode).parent as KNode).properties.interactiveLayout) {
                this.target = targetNode as KNode
                // Set layer bounds
                this.nodes = filterKNodes(this.target.parent.children)

                const algorithm = ((targetNode as KNode).parent as KNode).properties.algorithm
                // Set algorithm specific data
                if (isUndefined(algorithm) || algorithm.endsWith('layered')) {
                    this.data.set('layered', getLayers(this.nodes, this.target.direction))
                } else if (algorithm.endsWith('rectpacking')) {
                    // Do nothing
                }

                this.target.selected = true
                // save the coordinates as shadow coordinates
                this.target.shadowX = this.target.position.x
                this.target.shadowY = this.target.position.y
                this.target.shadow = true
                if (event.altKey) {
                    if (isUndefined(algorithm) || algorithm.endsWith('layered')) {
                        return [new DeleteStaticConstraintAction({
                            id: this.target.id
                        })]
                    } else if (algorithm.endsWith('rectpacking')) {
                        return [new RectPackDeletePositionConstraintAction({
                            id: this.target.id
                        })]
                    }
                }
                return super.mouseDown(this.target as SModelElement, event)
            }
        }
        return super.mouseDown(target as SModelElement, event)
    }

    /**
     * Override size mouseEnter to not call mouseUp.
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
            let result = super.mouseUp(this.target, event)
            const algorithm = (this.target.parent as KNode).properties.algorithm
            if (isUndefined(algorithm) || algorithm.endsWith('layered')) {
                result = [setProperty(this.nodes, this.data.get('layered'), this.target)].concat(super.mouseUp(this.target, event));
            } else if (algorithm.endsWith('rectpacking')) {
                const parent = this.nodes[0] ? this.nodes[0].parent as KNode : undefined
                result = [setGenerateRectPackAction(this.nodes, this.target, parent, event)].concat(super.mouseUp(this.target, event));
            } else {
                // Algorithm not supported
            }
            this.target = undefined
            return result
        } else if (this.target) {
            this.target.selected = false
            const result = super.mouseUp(this.target, event).concat([new RefreshDiagramAction()]);
            this.target = undefined
            return result
        }
        return super.mouseUp(target, event)
    }
}