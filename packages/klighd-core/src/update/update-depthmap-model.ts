/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 * 
 * Copyright 2021 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { inject, injectable } from 'inversify';
import { Command, TYPES } from 'sprotty'
import { Action } from 'sprotty';
import { CommandExecutionContext, CommandReturn } from 'sprotty';
import { DepthMap } from '../depth-map';

/**
 * Simple UpdateDepthMapAction Fires the UpdateDepthMapModelCommand
 * is created whenever a updateModelAction or a setModelAction is present
 */
export class UpdateDepthMapModelAction implements Action {
    static readonly KIND = 'updateDepthMapModel';
    readonly kind = UpdateDepthMapModelAction.KIND;
}

/**
 * UpdateModelCommand gets fired whenever a setModel or updateModel was executed
 */
@injectable()
export class UpdateDepthMapModelCommand extends Command {
    static readonly KIND = UpdateDepthMapModelAction.KIND;

    constructor(@inject(TYPES.Action) protected readonly action: UpdateDepthMapModelAction) { super() }


    execute(context: CommandExecutionContext): CommandReturn {
        DepthMap.init(context.root)
        return context.root
    }

    /**
     * For undo and redo we don't want any changes to the model
     */
    undo(context: CommandExecutionContext): CommandReturn {
        return context.root
    }
    redo(context: CommandExecutionContext): CommandReturn {
        return context.root
    }
}