import { injectable } from "inversify";
import { Point } from "sprotty-protocol/lib/utils/geometry";
import { isSelected, SModelRoot, IContextMenuItemProvider, MenuItem } from "sprotty";
import { Action } from "sprotty-protocol";


export interface GetIOAction extends Action{
    kind: typeof GetIOAction

.KIND
    elementID: string
}

export namespace GetIOAction {
    export const KIND = 'getIO';

    export function create(elementID: string): GetIOAction{
        return {
            kind: KIND,
            elementID
        };
    }
}

// same as in sprotty but ignores .isdeletable() so all selected items will generate a menu item.
@injectable()
export class GetIOContextMenuItemProvider implements IContextMenuItemProvider {
    getItems(root: Readonly<SModelRoot>, lastMousePosition?: Point): Promise<MenuItem[]> {
        const selectedElements = Array.from(root.index.all().filter(isSelected)).filter(this.isIO);
        
        return Promise.resolve([
            {
                id: "getIO",
                label: "GetIO",
                sortString: "IO",
                group: "edit",
                actions: selectedElements.map((val) => GetIOAction.create(val.id)),
                isEnabled: () => selectedElements.length > 0
            }
        ]);
    }
    isIO(isIO: any) {
        return false;
    }
}