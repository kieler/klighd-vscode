import { Action } from "sprotty-protocol";


/**
 * Send from client to server to delete a set of node/region/edge
 */
export interface GraphDeleteAction extends Action {
    kind: typeof GraphDeleteAction.KIND
    toDelete: [string];
}

export namespace GraphDeleteAction {
    export const KIND = 'SCChart_graph_DeleteNode'
    export function create(toDelete: [string]): GraphDeleteAction{
        return {
            kind: KIND,
            toDelete
        }
    }
}

/**
 * Send from client to server to add a successor node
 */
 export interface GraphAddSuccessorAction extends Action {
    kind: typeof GraphAddSuccessorAction.KIND
    node: string;
    inputs: string;
    outputs: string;
    next_name: string;
}

export namespace GraphAddSuccessorAction {
    export const KIND = 'graph_AddSNode'
    export function create(node: string, inputs: string, outputs: string, next_name: string): GraphAddSuccessorAction{
        return {
            kind: KIND,
            node, inputs, outputs, next_name
        }
    }
}

/**
 * Send from client to server to add a Hirachical Node inside given Node
 */
 export interface GraphAddHirachicalNodeAction extends Action {
    kind: typeof GraphAddHirachicalNodeAction.KIND
    node: string;
    region_name: string;
    initial_state: string;
}

export namespace GraphAddHirachicalNodeAction {
    export const KIND = 'graph_AddHNode'
    export function create(node: string, region_name: string, initial_state: string): GraphAddHirachicalNodeAction{
        return {
            kind: KIND,
            node, region_name, initial_state
        }
    }
}

/**
 * Send from client to server to change the name of a Edge region or state
 */
 export interface GraphRenameAction extends Action {
    kind: typeof GraphRenameAction.KIND
    node: string;
    new_name: string;
}

export namespace GraphRenameAction {
    export const KIND = 'graph_Rename'
    export function create(node: string, new_name: string): GraphRenameAction{
        return {
            kind: KIND,
            node, new_name
        }
    }
}

/**
 * Send from client to server to change the root of an edge to the given str of the node
 */
export interface GraphChangeRootAction extends Action {
    kind: typeof GraphChangeRootAction.KIND
    node: string;
    new_root: string;
}

export namespace GraphChangeRootAction {
    export const KIND = 'graph_ChangeRoot'
    export function create(node: string, new_root: string): GraphChangeRootAction{
        return {
            kind: KIND,
            node, new_root
        }
    }
}

/**
 * Send from client to server to change the destination of an edge to the given node
 */
 export interface GraphChangeDestinationAction extends Action {
    kind: typeof GraphChangeDestinationAction.KIND
    node: string;
    new_destination: string;
}

export namespace GraphChangeDestinationAction {
    export const KIND = 'graph_ChangeDestination'
    export function create(node: string, new_destination: string): GraphChangeDestinationAction{
        return {
            kind: KIND,
            node, new_destination
        }
    }
}

/**
 * Send from client to server to add a Region Besides a existing region
 */
 export interface GraphAddRegionAction extends Action {
    kind: typeof GraphAddRegionAction.KIND
    node: string;
    new_name: string;
    new_region_name: string;
}

export namespace GraphAddRegionAction {
    export const KIND = 'graph_AddRegion'
    export function create(node: string, new_name: string, new_region_name: string): GraphAddRegionAction{
        return {
            kind: KIND,
            node, new_name, new_region_name
        }
    }
}