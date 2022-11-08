/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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

import { SModelElement } from 'sprotty';
import { Action } from 'sprotty-protocol';
import { RefreshLayoutAction } from '../actions';
import { Direction, KEdge, KNode } from '../constraint-classes';
import { TreeSetPositionConstraintAction } from './actions';

/**
 * Calculates dot product of two vectors of size 2.
 * This is used for directional vectors.
 * 
 * @param vec1 First vector.
 * @param vec2 Second vector.
 * @returns The dot product.
 */
export function dotProduct(vector1: [number, number], vector2: [number, number]): number {
    return vector1[0] * vector2[0] + vector1[1] * vector2[1]
}

/**
 * Get directional vector for a node.
 * UP is [0, -1], DOWN is [0, 1], RIGHT is [1, 0] and LEFT is [-1, 0].
 * 
 * @param node  The node.
 * @returns The directional vector.
 */
export function getDirectionVector(node: KNode): [number, number] {
    const direction = node.direction
    if (!direction || direction === Direction.DOWN)
        return [0, 1]
    else if (direction === Direction.LEFT)
        return [-1, 0]
    else if (direction === Direction.RIGHT)
        return [1, 0]
    else if (direction === Direction.UP)
        return [0, -1]
    else
        return [0, 1]
}

/**
 * Get the sources of the graph.
 * I.e. the node that is a source.
 * 
 * @param nodes The nodes of the graph.
 * @returns The list of all sources of the graph.
 */
export function getRoot(nodes: KNode[]): KNode[] {
    const sources: KNode[] = [];
    nodes.forEach(n => {
        if ((n.incomingEdges as any as KEdge[]).length === 0 || n.position.y === 40) {
            sources.push(n);
        }
    })
    return sources;
}

/**
 * Returns the distance to the root node.
 * 
 * @param node The node.
 * @param root The root node.
 * @returns The distance (i.e. the number of edges) from the node to the root.
 */
export function rootDistance(node: KNode, root: KNode): number {
    if (root.id === node.id) return 0;
    const edges: KEdge[] = node.incomingEdges as any as KEdge[];
    if (edges.length === 0) return 0;
    const ancestor: KNode = edges[0].source as KNode;
    return rootDistance(ancestor, root) + 1;
}

/**
 * Returns the outgoing nodes of a node.
 * 
 * @param node The node.
 * @returns The list of children (i.e. the outgoing nodes).
 */
export function getChildren(node: KNode): KNode[] {
    const children: KNode[] = [];
    (node.outgoingEdges as any as KEdge[]).forEach(edge => {
        children.push(edge.target as KNode);
    });
    return children;
}

/**
 * Returns the levels of a tree.
 * 
 * @param nodes The nodes of the tree.
 * @returns A two dimensional array of node which assigns each node a level.
 */
export function getLevels(nodes: KNode[]): KNode[][] {
    // Initialize first level with root nodes.
    const levels: KNode[][] = [getRoot(nodes)];
    // Add an internal property treeLevel to remember the level of the tree.
    nodes.forEach(node => node.properties.treeLevel = -1);

    // Set tree level of first level.
    let currentLevel: KNode[] = [];
    levels[0].forEach(node => {
        currentLevel.push(node);
        node.properties.treeLevel = 0;
    });
    levels[0].forEach(node => node.properties.treeLevel = 0)

    let newNode = true;
    for (let i = 1; newNode; i++) {
        newNode = false;
        // Get all children of the last level as new current level.
        currentLevel = currentLevel.map(node => getChildren(node)).reduce((node, otherNode) => node.concat(otherNode), []);
        levels[i] = [];
        currentLevel.forEach(node => {
            // Assign nodes of new level to new array in levels and update the tree level.
            if (node.properties.treeLevel === -1) {
                newNode = true;
            }
            if (node.properties.treeLevel !== 0) {
                node.properties.treeLevel = i;
            }
            levels[i].push(node);
        });
    }

    return levels;
}

/**
 * Returns the siblings of a node in a tree.
 * Even though the graph should be a tree, we can handle non tree graphs partly
 * and will work with the parent node with the lowest coordinate in layout direction as The Parent
 * to calculate the siblings.
 * 
 * @param nodes All nodes of the tree.
 * @param targetNode The node to find siblings for.
 * @returns The siblings of a given node.
 */
export function getSiblings(nodes: KNode[], targetNode: KNode): KNode[] {
    const lowestParent = getLowestParent(nodes, targetNode);
    if (!lowestParent)
        return [];
    const siblings = nodes.filter(node => lowestParent === getLowestParent(nodes, node))
    return siblings
}

/**
 * Returns the parent with the lowest coordinate in layout direction.
 * Even though the graph should be a tree, it might not and we have to handle this.
 * 
 * @param nodes All nodes of the tree.
 * @param targetNode The node to find the lowest parent for.
 * @returns The lowest parent or undefined if it could not be found, which is only the case if the node is a root node.
 */
function getLowestParent(nodes: KNode[], targetNode: KNode): KNode | undefined {
    const directionVector = getDirectionVector(nodes[0])
    const incomingEdges = targetNode.incomingEdges as KEdge[];
    if (incomingEdges.length === 0) {
        return undefined;
    }
    const parents = incomingEdges.map(edge => edge.source)
    const lowestParentPosition = Math.max(...parents.
        map(node => node === undefined ? 0 : dotProduct([node.position.x + node.size.width / 2, node.position.y + node.size.height / 2], directionVector)))
    const lowestParent = parents.find(parent => (parent === undefined ?
        0 : dotProduct([parent.position.x + parent.size.width / 2, parent.position.y + parent.size.height / 2], directionVector)) === lowestParentPosition)

    return lowestParent as KNode;
}

/**
 * Returns the original node x coordinate.
 * If a node is picked up, the coordinate of its shadow that remained in the
 * original position is returned.
 * 
 * @param node The node.
 * @returns The original x coordinate.
 */
export function getOriginalNodePositionX(node: KNode): number {
    return (node.shadow ? node.shadowX : node.position.x);
}

/**
 * Returns the original node y coordinate.
 * If a node is picked up, the coordinate of its shadow that remained in the
 * original position is returned.
 * 
 * @param node The node.
 * @returns The original y coordinate.
 */
export function getOriginalNodePositionY(node: KNode): number {
    return (node.shadow ? node.shadowY : node.position.y);
}

/**
 * Calculates the action that should be executed based on the position the node is moved to.
 * Will return an refresh layout action if the node was not moved to a valid position.
 * 
 * @param nodes All nodes of the tree.
 * @param event The mouse event. Currently unused.
 * @param target The moved element.
 * @returns The action to be executed after a node was moved.
 */
export function setTreeProperties(nodes: KNode[], event: MouseEvent, target: SModelElement): Action {
    const targetNode: KNode = target as KNode;
    const direction = nodes[0].direction
    const siblings: KNode[] = getSiblings(nodes, targetNode);
    // Sort nodes by their coordinates.
    // The target node will be sorted based on the position it was moved to.
    if (direction === Direction.LEFT || direction === Direction.RIGHT) {
        siblings.sort((x, y) => x.position.y + x.size.height / 2 - y.position.y - y.size.height / 2);
    } else {
        siblings.sort((x, y) => x.position.x + x.size.width / 2 - y.position.x - y.size.width / 2);
    }
    // There is no valid position if a node has no siblings.
    if (siblings.length === 0)
        return RefreshLayoutAction.create();

    const positionOfTarget = siblings.indexOf(targetNode);
    if (targetNode.properties.positionId !== positionOfTarget) {
        // Set the position constraint.
        return new TreeSetPositionConstraintAction({
            id: targetNode.id,
            position: positionOfTarget,
            positionConstraint: positionOfTarget
        })
    }

    return RefreshLayoutAction.create()
}