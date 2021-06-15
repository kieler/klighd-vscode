import { injectable } from 'inversify';
import { EdgeMemento, UpdateModelCommand } from 'sprotty'
import { SModelRootSchema } from 'sprotty';
import { ResolvedElementFade } from 'sprotty';
import { ResolvedElementMove } from 'sprotty';
import { Match } from 'sprotty';
import { Action } from 'sprotty';
import { SModelRoot } from "sprotty";
import { CommandExecutionContext, CommandReturn } from 'sprotty';
import { ResolvedElementResize } from 'sprotty/lib/features/bounds/resize';
import { DepthMap } from '../depth-map';

/**
 * Sent from the model source to the client in order to update the model. If no model is present yet,
 * this behaves the same as a SetModelAction. The transition from the old model to the new one can be animated.
 */
 export class UpdateModelAction implements Action {
    static readonly KIND = 'updateModel';
    readonly kind = UpdateModelAction.KIND;

    public readonly newRoot?: SModelRootSchema;
    public readonly matches?: Match[];

    constructor(input: SModelRootSchema | Match[],
                public readonly animate: boolean = true,
                public readonly cause?: Action) {
        if ((input as SModelRootSchema).id !== undefined)
            this.newRoot = input as SModelRootSchema;
        else
            this.matches = input as Match[];
    }
}

export interface UpdateAnimationData {
    fades: ResolvedElementFade[]
    moves?: ResolvedElementMove[]
    resizes?: ResolvedElementResize[]
    edgeMementi?: EdgeMemento[]
}


/**
 * Simple overwrite of the UpdateModelCommand such that the depthmap gets updated when it is invoked.
 * Works by injecting this comand into the module (updateModule see update-depthmap-module) wich is then inserted 
 * in the main container handeling main modules from sprotty aswell as the keith specific once
 */
@injectable()
export class UpdateDepthmapModelCommand extends UpdateModelCommand{

    protected performUpdate(oldRoot: SModelRoot, newRoot: SModelRoot, context: CommandExecutionContext): CommandReturn {
        DepthMap.getInstance(newRoot);
        return super.performUpdate(oldRoot, newRoot, context);
    }
}

// Need also the setModel Command which is definded in the default module -> problematic !