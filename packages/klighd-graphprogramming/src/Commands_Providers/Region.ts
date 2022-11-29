import { injectable, inject } from "inversify";
import { Point } from "sprotty-protocol/lib/utils/geometry";
import { isSelected, SModelRoot, IContextMenuItemProvider, MenuItem, CommandExecutionContext, CommandReturn, TYPES } from "sprotty";
import { Action } from "sprotty-protocol";
import { Command } from "sprotty";

export interface GetRegionAction extends Action{
    kind: typeof GetRegionAction.KIND
    elementID: string
}

export namespace GetRegionAction {
    export const KIND = 'getRegion';

    export function create(elementID: string): GetRegionAction {
        return {
            kind: KIND,
            elementID
        };
    }
}

@injectable()
export class GetRegionCommand extends Command {
    static readonly KIND = GetRegionAction.KIND;

    constructor(@inject(TYPES.Action) protected readonly action: GetRegionAction) {
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
export class GetRegionContextMenuItemProvider implements IContextMenuItemProvider {
    getItems(root: Readonly<SModelRoot>, lastMousePosition?: Point): Promise<MenuItem[]> {
        const selectedElements = Array.from(root.index.all().filter(isSelected)).filter(this.isRegion);
        //if(selectedElements.length!=1)return Promise.resolve([]);
        return Promise.resolve([
            {
                id: "getRegion",
                label: "GetRegion",
                sortString: "R",
                group: "edit",
                actions: selectedElements.map((val) => GetRegionAction.create(val.id)),
                isEnabled: () => selectedElements.length > 0
            }
        ]);
    }
    isRegion(isRegion: any): boolean {
        console.log(isRegion.data[0].type);
        return isRegion.data[0].type == "KRectangleImpl";
    }
}