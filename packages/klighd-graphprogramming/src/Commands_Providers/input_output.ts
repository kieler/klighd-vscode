import { injectable, inject } from "inversify";
import { Point } from "sprotty-protocol/lib/utils/geometry";
import { isSelected, SModelRoot, IContextMenuItemProvider, MenuItem, CommandExecutionContext, CommandReturn, TYPES } from "sprotty";
import { Action } from "sprotty-protocol";
import { Command } from "sprotty";

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

@injectable()
export class GetIOCommand extends Command {
    static readonly KIND = GetIOAction

.KIND;

    constructor(@inject(TYPES.Action) protected readonly action: GetIOAction){
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
export class GetIOContextMenuItemProvider implements IContextMenuItemProvider {
    getItems(root: Readonly<SModelRoot>, lastMousePosition?: Point): Promise<MenuItem[]> {
        const selectedElements = Array.from(root.index.all().filter(isSelected)).filter(this.isIO);
        //if(selectedElements.length!=1)return Promise.resolve([]);
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