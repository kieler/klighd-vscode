import { injectable } from "inversify";
import { Point } from "sprotty-protocol/lib/utils/geometry";
import { isSelected, SModelRoot, IContextMenuItemProvider, MenuItem } from "sprotty";
import { Action } from "sprotty-protocol";

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
        // currently only way of distinguishing nodes from regions
        const msgs: StructuredEditMsg[] = (isRegion as any).properties['klighd.StructuralEditingActions']
        
        for( const x of msgs){
            console.log(x)
            for( const k in x.inputs){
                console.log(x.inputs[k])
            }
        }
        return isRegion.data[0].type == "KRectangleImpl";
    }
}

interface StructuredEditMsg{
    label: string;
    kind: string;
    inputs: string[];
}
