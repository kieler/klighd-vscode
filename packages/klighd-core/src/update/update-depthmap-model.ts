/*
* This program and the accompanying materials are made available under the
* terms of the Eclipse Public License 2.0 which is available at
* http://www.eclipse.org/legal/epl-2.0.
*
* SPDX-License-Identifier: EPL-2.0
*/

import { inject, injectable } from 'inversify';
import { Command, TYPES } from 'sprotty'
import { SModelRootSchema } from 'sprotty';
import { Match } from 'sprotty';
import { Action } from 'sprotty';
import { CommandExecutionContext, CommandReturn } from 'sprotty';
import { DepthMap } from '../depth-map';

/**
 * Simple UpdateDepthmapAction Fires the UpdateDepthmapModelCommand
 * is created whenever a updateModelAction or a setModelAction is present
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
 * UpdateModelCommand gets fired whenever a setModel or updateModel was executed
 */
@injectable()
export class UpdateDepthmapModelCommand extends Command {
    static readonly KIND = UpdateDepthmapModelAction.KIND;

    constructor(@inject(TYPES.Action) protected readonly action: UpdateDepthmapModelAction) { super() }


    execute(context: CommandExecutionContext): CommandReturn {
        DepthMap.init(context.root)
        return context.root
    }

    /**
     * For undo and redo we dont want any changes to the model
     */
    undo(context: CommandExecutionContext): CommandReturn {
        return context.root
    }
    redo(context: CommandExecutionContext): CommandReturn {
        return context.root
    }
}