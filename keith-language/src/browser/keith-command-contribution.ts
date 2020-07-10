/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2020 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { Command, CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, SelectionService } from '@theia/core';
import { QuickOpenItem, QuickOpenMode, QuickOpenModel, QuickOpenOptions, QuickOpenService } from '@theia/core/lib/browser';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileSystem } from '@theia/filesystem/lib/common';
import { NavigatorContextMenu } from '@theia/navigator/lib/browser/navigator-contribution';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { inject, injectable } from 'inversify';

export const NEW_SCCHART: Command = {
    id: 'file.newscchart',
    category: 'File',
    label: 'New SCChart...',
    iconClass: 'fa sctx-icon'
};

@injectable()
export class KeithCommandContribution implements CommandContribution, MenuContribution {

    @inject(SelectionService) protected readonly selectionService: SelectionService;
    @inject(FileSystem) protected readonly fileSystem: FileSystem;
    @inject(FileDialogService) protected readonly fileDialogService: FileDialogService;
    @inject(WorkspaceService) protected readonly workSpaceService: WorkspaceService;
    @inject(QuickOpenService) protected readonly openService: QuickOpenService

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(NEW_SCCHART, {
            execute: () => {
                let newValue = 'NewSCChart'
                const item: QuickOpenItem = new QuickOpenItem({
                    label: 'Create new SCChart ' + newValue,
                    description: 'Create a new SCChart',
                    run: (mode: QuickOpenMode) => {
                        return true;
                    }
                });
                const quickOpenModel: QuickOpenModel = {
                    onType: (lookFor: string, acceptor: (items: QuickOpenItem[]) => void): void => {
                        let dynamicItems = [item]
                        if (lookFor && !lookFor.endsWith('.sctx')) {
                            lookFor.concat('.sctx')
                        }
                        if (lookFor) {
                            dynamicItems.push(new QuickOpenItem({
                                label: `Create new SCCharts file ${lookFor}`,
                                run: () => {
                                    return true
                                }
                            }))
                            newValue = lookFor
                        }
                        acceptor(dynamicItems);
                    }
                };
                const quickOpenOption: QuickOpenOptions = {
                    placeholder: 'NewSCChart',
                    fuzzyMatchLabel: true,
                    onClose: (cancelled: boolean) => {
                        if (!cancelled) {
                            console.log(newValue)
                        }
                    }
                }
                this.openService.open(quickOpenModel, quickOpenOption)
            }
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(NavigatorContextMenu.NEW, {
            commandId: NEW_SCCHART.id,
            label: NEW_SCCHART.label,
            order: 'a10'
        });
    }
}