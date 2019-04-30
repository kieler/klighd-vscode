/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018-2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { SetSynthesisAction } from '@kieler/keith-sprotty/lib/actions/actions';
import { SetSynthesesActionData } from '@kieler/keith-sprotty/lib/syntheses/synthesis-message-data';
import { SynthesisRegistry } from '@kieler/keith-sprotty/lib/syntheses/synthesis-registry';
import { Command, CommandContribution, CommandHandler, CommandRegistry, MenuContribution, MenuModelRegistry, MenuPath } from '@theia/core';
import { QuickPickItem } from '@theia/core/lib/browser';
import { QuickPickService } from '@theia/core/lib/common/quick-pick-service';
import { inject, injectable } from 'inversify';
import { DiagramMenus } from 'sprotty-theia';
import { KeithDiagramServer } from './keith-diagram-server';

/**
 * Contains constants for the synthesis menu items.
 */
export namespace SynthesisMenu {
    export const SYNTHESIS: MenuPath = DiagramMenus.DIAGRAM.concat('synthesis')
}

/**
 * The command- and menu contribution and other related methods for the commands for the synthesis picker.
 */
@injectable()
export class SynthesisCommandContribution implements CommandContribution, MenuContribution, CommandHandler, Command {

    id = 'change_synthesis'
    category = 'Diagram'
    label = 'Change Synthesis'

    @inject(SynthesisRegistry)
    protected readonly synthesisRegistry: SynthesisRegistry

    @inject(QuickPickService)
    protected readonly quickPick: QuickPickService

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(this, this);
    }

    registerMenus(menus: MenuModelRegistry) {
        menus.registerMenuAction(SynthesisMenu.SYNTHESIS, {
            commandId: this.id,
            label: this.label
        });
    }

    async execute() {
        const syntheses: QuickPickItem<string>[] = this.synthesisRegistry.getAvailableSyntheses().map(synthesis => {
            return this.toQuickPickSynthesis(synthesis)
        })

        const selectedId = await this.quickPick.show(syntheses, {
            placeholder: 'Select Synthesis'
        });
        if (selectedId) {
            const server = this.synthesisRegistry.getProvidingDiagramServer()
            if (server instanceof KeithDiagramServer) {
                (server as KeithDiagramServer).actionDispatcher.dispatch(new SetSynthesisAction(selectedId))
            }
        }
    }

    toQuickPickSynthesis(synthesis: SetSynthesesActionData): QuickPickItem<string> {
        return {
            value: synthesis.id,
            label: synthesis.displayName,
            description: `(${synthesis.id})`
        }
    }
}