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
import { open, OpenerService, QuickOpenItem, QuickOpenMode, QuickOpenModel, QuickOpenOptions, QuickOpenService, WidgetManager, CommonMenus } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { EditorManager } from '@theia/editor/lib/browser';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileStat, FileSystem, FileSystemUtils } from '@theia/filesystem/lib/common';
import { FileNavigatorContribution, NavigatorContextMenu } from '@theia/navigator/lib/browser/navigator-contribution';
import { WorkspaceRootUriAwareCommandHandler, WorkspaceService } from '@theia/workspace/lib/browser';
import { inject, injectable } from 'inversify';

export const NEW_SCCHART: Command = {
    id: 'file.newscchart',
    category: 'File',
    label: 'New SCChart...',
    iconClass: 'fa sctx-icon'
};

/**
 * Command contribution for general KEITH commands.
 */
@injectable()
export class KeithCommandContribution implements CommandContribution, MenuContribution {

    @inject(SelectionService) protected readonly selectionService: SelectionService;
    @inject(FileSystem) protected readonly fileSystem: FileSystem;
    @inject(FileDialogService) protected readonly fileDialogService: FileDialogService;
    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;
    @inject(QuickOpenService) protected readonly openService: QuickOpenService;
    @inject(EditorManager) protected readonly editorManager: EditorManager;
    @inject(OpenerService) protected readonly openerService: OpenerService;
    @inject(WidgetManager) protected readonly widgetManager: WidgetManager;
    @inject(FileNavigatorContribution) protected readonly fileNavigatorContribution: FileNavigatorContribution;


    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(NEW_SCCHART,
            new WorkspaceRootUriAwareCommandHandler(this.workspaceService, this.selectionService, {
                execute: (uri: URI) => {
                    this.getDirectory(uri).then(parentUri => {
                        if (parentUri) {
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
                            onClose: async (cancelled: boolean) => {
                                if (!cancelled) {
                                    // Remove possible resource extension
                                    if (newValue.endsWith('.sctx')) {
                                        newValue = newValue.substring(0, newValue.length - 5)
                                    }
                                    // Generate unique resource uri
                                    const newResourceUri = FileSystemUtils.generateUniqueResourceURI(new URI(parentUri.uri), parentUri, newValue, '.sctx');

                                    // Create file
                                    await this.fileSystem.createFile(newResourceUri.toString(), { content: this.newSCChartText(new URI(newValue).path.base)})

                                    // Open the created file and activate it to trigger diagram generation
                                    await open(this.openerService, newResourceUri, {
                                        mode: 'activate',
                                        widgetOptions: {
                                            ref: this.editorManager.currentEditor
                                        }
                                    })
                                }
                            }
                        }
                        this.openService.open(quickOpenModel, quickOpenOption)
                    }
                })
            }
        }));
    }

    registerMenus(menus: MenuModelRegistry): void {
        // This should sort the new SCChart menu entry under the new File and new Folder Entry in the context menu in navigation widget.
        menus.registerMenuAction(NavigatorContextMenu.NAVIGATION, {
            commandId: NEW_SCCHART.id
        });
        // register new SCChart in the common menu, the menu on the top left.
        menus.registerMenuAction(CommonMenus.FILE_NEW, {
            commandId: NEW_SCCHART.id
        });
    }

    /**
     * Creates text to be inserted in a new created SCChart.
     * The name can be configured.
     *
     * @param name The name of the SCChart
     */
    private newSCChartText(name: string) {
        return  `scchart ` + name + ` {

    region {
        initial state A
    }
}`
    }

    /**
     * Returns the directory a file stat belongs to.
     * This returns the file stat itself if the file stat is a directory.
     * Otherwise the parent directory is returned.
     *
     * @param candidate the candidate uri of a file stat
     */
    protected async getDirectory(candidate: URI): Promise<FileStat | undefined> {
        const stat = await this.fileSystem.getFileStat(candidate.toString());
        if (stat && stat.isDirectory) {
            return stat;
        }
        return this.getParent(candidate);
    }

    protected getParent(candidate: URI): Promise<FileStat | undefined> {
        return this.fileSystem.getFileStat(candidate.parent.toString());
    }
}