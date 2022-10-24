import { injectable } from "inversify";
import { Point } from "sprotty-protocol/lib/utils/geometry";
import { isSelected, SModelRoot, IContextMenuItemProvider, MenuItem } from "sprotty";
import { Action } from "sprotty-protocol";

/**
 * Delete a set of elements identified by their IDs.
 */
 export interface DeleteAction extends Action {
    kind: typeof DeleteAction.KIND
    elementIds: string[]
}
export namespace DeleteAction {
    export const KIND = 'deleteElement';

    export function create(elementIds: string[]): DeleteAction {
        return {
            kind: KIND,
            elementIds
        };
    }
}

@injectable()
export class DeleteContextMenuItemProvider implements IContextMenuItemProvider {
    getItems(root: Readonly<SModelRoot>, lastMousePosition?: Point): Promise<MenuItem[]> {
        const selectedElements = Array.from(root.index.all().filter(isSelected));
        return Promise.resolve([
            {
                id: "delete",
                label: "Delete",
                sortString: "d",
                group: "edit",
                actions: [DeleteAction.create(selectedElements.map(e => e.id))],
                isEnabled: () => selectedElements.length > 0
            }
        ]);
    }
}
