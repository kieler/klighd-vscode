import { inject, injectable } from 'inversify';
import { Command, TYPES } from 'sprotty'
import { SModelRootSchema } from 'sprotty';
import { Match } from 'sprotty';
import { Action } from 'sprotty';
import { CommandExecutionContext, CommandReturn } from 'sprotty';
import { DepthMap } from '../depth-map';

/**
 * Sent from the model source to the client in order to update the model. If no model is present yet,
 * this behaves the same as a SetModelAction. The transition from the old model to the new one can be animated.
 */
 export class UpdateDepthmapModelAction implements Action {
    static readonly KIND = 'updateDepthmapModel';
    readonly kind = UpdateDepthmapModelAction.KIND;

    public readonly newRoot?: SModelRootSchema;
    public readonly matches?: Match[];

    constructor(input: SModelRootSchema,
                public readonly animate: boolean = true,
                public readonly cause?: Action) {
        if ((input as SModelRootSchema).id !== undefined)
            this.newRoot = input as SModelRootSchema;
    }
}

/**
 * Simple overwrite of the UpdateModelCommand such that the depthmap gets updated when it is invoked.
 * Works by injecting this comand into the module (updateModule see update-depthmap-module) wich is then inserted 
 * in the main container handeling main modules from sprotty aswell as the keith specific once
 */
@injectable()
export class UpdateDepthmapModelCommand extends Command{
    static readonly KIND = UpdateDepthmapModelAction.KIND;

    constructor(@inject(TYPES.Action) protected readonly action: UpdateDepthmapModelAction) {super()}


    execute(context: CommandExecutionContext): CommandReturn {
        
        console.log("access DM in Command")
        DepthMap.getInstance(context.root)

        return context.root
    }
    undo(context: CommandExecutionContext): CommandReturn {
        return context.root
    }
    redo(context: CommandExecutionContext): CommandReturn {
        return context.root
    }
}