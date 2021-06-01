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

import { SetSynthesesActionData } from '@kieler/keith-sprotty/lib/syntheses/action';
import { SynthesesRegistry } from '@kieler/keith-sprotty/lib/syntheses/syntheses-registry';
import { Command, CommandContribution, CommandHandler, CommandRegistry, MenuContribution, MenuModelRegistry, MenuPath } from '@theia/core';
import { QuickPickItem, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { QuickPickService } from '@theia/core/lib/common/quick-pick-service';
import { inject, injectable } from 'inversify';
import { DiagramMenus } from 'sprotty-theia';

/**
 * Contains constants for the synthesis menu items.
 */
export namespace SynthesisMenu {
    export const SYNTHESIS: MenuPath = DiagramMenus.DIAGRAM.concat('synthesis')
}

export const synthesisStatus: string = 'synthesis-status'

/**
 * The command- and menu contribution and other related methods for the commands for the synthesis picker.
 */
@injectable()
export class SynthesisCommandContribution implements CommandContribution, MenuContribution, CommandHandler, Command {

    id = 'change_synthesis'
    category = 'Diagram'
    label = 'Change Synthesis'


    @inject(QuickPickService)
    protected readonly quickPick: QuickPickService

    @inject(StatusBar)
    protected readonly statusBar: StatusBar

    @inject(SynthesesRegistry)
    protected readonly synthesisRegistry: SynthesesRegistry

    onNewSyntheses(syntheses: SetSynthesesActionData[]) {
        if (syntheses && syntheses.length > 0) {
            this.statusBar.setElement(synthesisStatus, {
                text: syntheses[0].displayName,
                alignment: StatusBarAlignment.RIGHT,
                priority: 4,
                command: this.id
            })
        } else {
            this.statusBar.removeElement(synthesisStatus)
        }
    }

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
        // THIS NO LONGER WORKS WITH THE NEW SYNTHESES REGISTRY WHICH IS CONTROLLED WITH ACTIONS!!!
        // const syntheses: QuickPickItem<string>[] = this.synthesisRegistry.syntheses.map(synthesis => {
        //     return this.toQuickPickSynthesis(synthesis)
        // })

        // const selectedId = await this.quickPick.show(syntheses, {
        //     placeholder: 'Select Synthesis'
        // });
        // if (selectedId) {
        //     const server = this.synthesisRegistry.getProvidingDiagramServer()
        //     if (server instanceof KeithDiagramServer) {
        //         (server as KeithDiagramServer).actionDispatcher.dispatch(new SetSynthesisAction(selectedId))
        //         this.statusBar.setElement(synthesisStatus, {
        //             text: this.synthesisRegistry.syntheses.filter(synthesis => synthesis.id === selectedId)[0].displayName,
        //             alignment: StatusBarAlignment.RIGHT,
        //             priority: 4,
        //             command: this.id
        //         })
        //     }
        // }
    }

    toQuickPickSynthesis(synthesis: SetSynthesesActionData): QuickPickItem<string> {
        return {
            value: synthesis.id,
            label: synthesis.displayName,
            description: `(${synthesis.id})`
        }
    }
}