import { injectable, inject } from "inversify";
import { Point } from "sprotty-protocol/lib/utils/geometry";
import { isSelected, SModelRoot, IContextMenuItemProvider, MenuItem, CommandExecutionContext, CommandReturn, TYPES } from "sprotty";
import { Action } from "sprotty-protocol";
import { Command } from "sprotty";

export interface GetNodesAction extends Action{
    kind: typeof GetNodesAction.KIND
    elementID: string
}

export namespace GetNodesAction {
    export const KIND = 'getNodes';

    export function create(elementID: string): GetNodesAction {
        return {
            kind: KIND,
            elementID
        };
    }
}

@injectable()
export class GetNodesCommand extends Command {
    static readonly KIND = GetNodesAction.KIND;

    constructor(@inject(TYPES.Action) protected readonly action: GetNodesAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        throw new Error("Method not implemented.");
    }
    undo(context: CommandExecutionContext): CommandReturn {
        throw new Error("Method not implemented.");
    }
    redo(context: CommandExecutionContext): CommandReturn {
        throw new Error("Method not implemented.");
    }
}

// same as in sprotty but ignores .isdeletable() so all selected items will generate a menu item.
@injectable()
export class GetNodesContextMenuItemProvider implements IContextMenuItemProvider {
    getItems(root: Readonly<SModelRoot>, lastMousePosition?: Point): Promise<MenuItem[]> {
        const selectedElements = Array.from(root.index.all().filter(isSelected)).filter(this.isNode);
        return Promise.resolve([
            {
                id: "getNodes",
                label: "GetNodes",
                sortString: "N",
                group: "edit",
                actions: selectedElements.map((val) => GetNodesAction.create(val.id)),
                isEnabled: () => selectedElements.length > 0
            }
        ]);
    }
    isNode(selectedElement: any): boolean {
        // this should be nicer but regions have also type node so its not good enugh to distinguish those! Might be smart to change type of region ?
        // return selectedElement.type == "node";
        return selectedElement.data[0].type == "KRoundedRectangleImpl";
    }
}