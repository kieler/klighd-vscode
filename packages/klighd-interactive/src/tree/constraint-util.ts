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

export function dotProduct(vec1: [number, number], vec2: [number, number]): number {
    return vec1[0] * vec2[0] + vec1[1] * vec2[1]
}

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

export function getRoot(nodes: KNode[]): KNode[] {
    const re: KNode[] = [];
    nodes.forEach(x => {
        if ((x.incomingEdges as any as KEdge[]).length === 0 || x.position.y === 40)
            re.push(x);
    })
    return re;
}

export function rootDistance(n: KNode, root: KNode): number {
    if (root.id === n.id) return 0;
    const edges: KEdge[] = n.incomingEdges as any as KEdge[];
    if (edges.length === 0) return 0;
    const p: KNode = edges[0].source as KNode;
    return rootDistance(p, root) + 1;
}

export function getChildren(n: KNode): KNode[] {
    const re: KNode[] = [];
    (n.outgoingEdges as any as KEdge[]).forEach(x => {
        re.push(x.target as KNode);
    });
    return re;
}

export function getLevels(nodes: KNode[]): KNode[][] {
    const re: KNode[][] = [getRoot(nodes)];
    nodes.forEach(x => x.properties.treeLevel = -1);

    let newNode = true;
    let curLevel: KNode[] = [];
    re[0].forEach(x => {
        curLevel.push(x);
        x.properties.treeLevel = 0;
    });
    re[0].forEach(x => x.properties.treeLevel = 0)
    for (let i = 1; newNode; i++) {
        newNode = false;
        curLevel = curLevel.map(x => getChildren(x)).reduce((x, y) => x.concat(y), []);
        re[i] = [];
        curLevel.forEach(x => {
            if (x.properties.treeLevel === -1) {
                newNode = true;
            }
            if (x.properties.treeLevel !== 0) {
                x.properties.treeLevel = i;
            }
            re[i].push(x);
        });
    }

    return re;
}

export function getSiblings(nodes: KNode[], targetNode: KNode): KNode[] {
    const lowestParent = getLowestParent(nodes, targetNode);
    if (!lowestParent)
        return [];
    const siblings = nodes.filter(x => lowestParent === getLowestParent(nodes, x))
    return siblings
}

function getLowestParent(nodes: KNode[], targetNode: KNode): KNode | undefined {
    const dirVec = getDirectionVector(nodes[0])
    const incomers = targetNode.incomingEdges as KEdge[];
    if (incomers.length === 0)
        return undefined;
    const parents = incomers.map(x => x.source)
    const lowestParentPos = Math.max(...parents.
        map(x => x === undefined ? 0 : dotProduct([x.position.x + x.size.width / 2, x.position.y + x.size.height / 2], dirVec)))
    const lowestParent = parents.find(x => (x === undefined ?
        0 : dotProduct([x.position.x + x.size.width / 2, x.position.y + x.size.height / 2], dirVec)) === lowestParentPos)

    return lowestParent as KNode;
}

export function getOriginalNodePositionX(node: KNode): number {
    return (node.shadow ? node.shadowX : node.position.x);
}
export function getOriginalNodePositionY(node: KNode): number {
    return (node.shadow ? node.shadowY : node.position.y);
}

export function setTreeProperties(nodes: KNode[], data: Map<string, any>, event: MouseEvent, target: SModelElement): Action {
    const targetNode: KNode = target as KNode;
    const direction = nodes[0].direction
    const siblings: KNode[] = getSiblings(nodes, targetNode);
    if (direction === Direction.LEFT || direction === Direction.RIGHT)
        siblings.sort((x, y) => x.position.y + x.size.height / 2 - y.position.y - y.size.height / 2);
    else
        siblings.sort((x, y) => x.position.x + x.size.width / 2 - y.position.x - y.size.width / 2);

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