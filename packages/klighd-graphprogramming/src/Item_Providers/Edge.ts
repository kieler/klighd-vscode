import { injectable } from "inversify";
import { Point } from "sprotty-protocol/lib/utils/geometry";
import { isSelected, SModelRoot, IContextMenuItemProvider, MenuItem } from "sprotty";
import { Action } from "sprotty-protocol";

export interface GetEdgesAction extends Action{
    kind: typeof GetEdgesAction.KIND
    elementID: string
}

export namespace GetEdgesAction {
    export const KIND = 'getEdges';

    export function create(elementID: string): GetEdgesAction {
        return {
            kind: KIND,
            elementID
        };
    }
}

// same as in sprotty but ignores .isdeletable() so all selected items will generate a menu item.
@injectable()
export class GetEdgesContextMenuItemProvider implements IContextMenuItemProvider {
    getItems(root: Readonly<SModelRoot>, _?: Point): Promise<MenuItem[]> {
        // need a check if the model type is suported ie. if its scchart and have different implementations for each model type
        const selectedElements = Array.from(root.index.all().filter(isSelected)).filter(this.isEdge);

        // bei edges .children[0].text is the string that displays "<prio>: input_enable / output1;output2" => only works for sccharts

        return Promise.resolve([
            {
                id: "getEdges",
                label: "GetEdgesAction",
                sortString: "E",
                group: "edit",
                actions: selectedElements.map((val) => GetEdgesAction.create(val.id)),
                isEnabled: () => selectedElements.length > 0
            }
        ]);
    }
    private isEdge(selectedElement: any): boolean {
        
        return selectedElement.type == "edge";

    }
}