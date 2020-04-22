/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019, 2020 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { RefreshLayoutAction } from '@kieler/keith-sprotty/lib/actions/actions';
import { TabBarToolbarContribution, TabBarToolbarItem, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { Command, CommandContribution, CommandRegistry, MessageService, Mutable } from '@theia/core/lib/common';
import { inject, injectable } from 'inversify';
import { CenterAction, FitToScreenAction, RequestModelAction } from 'sprotty';
import { diagramType } from './di.config';
import { KeithDiagramWidget } from './keith-diagram-widget';

export const centerCommand: Command = {
    id: 'keith:diagram:center',
    label: 'Center',
    iconClass: 'fa fa-arrows-alt',
    category: 'Diagram'
}

export const fitCommand: Command = {
    id: 'keith:diagram:fit',
    label: 'Fit to screen',
    iconClass: 'fa fa-expand',
    category: 'Diagram'
}

export const refreshDiagramCommand: Command = {
    id: 'keith:diagram:refresh-diagram',
    label: 'Refresh diagram',
    iconClass: 'fa fa-refresh',
    category: 'Diagram'
}

export const refreshLayoutCommand: Command = {
    id: 'keith:diagram:refresh-layout',
    label: 'Refresh layout',
    iconClass: 'fa fa-window-restore',
    category: 'Diagram'
}

export const syncWithEditor: Command = {
    id: 'keith:diagram:sync-with-editor',
    label: 'Sync with editor',
    iconClass: 'fa fa-link',
    category: 'Diagram'
}

export const resizeToFit: Command = {
    id: 'keith:diagram:resize-to-fit',
    label: 'Resize to fit',
    category: 'Diagram'
}

export const diagramConfigurationGroup = '1_diagram-configuration'


@injectable()
export class KeithDiagramCommandContribution implements CommandContribution, TabBarToolbarContribution {

    @inject(MessageService) protected readonly messageService: MessageService
    @inject(CommandRegistry) protected readonly commandRegistry: CommandRegistry
    @inject(TabBarToolbarRegistry) protected readonly tabbarToolbarRegistry: TabBarToolbarRegistry

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(centerCommand, {
            isEnabled: () => true,
            execute: (widget: KeithDiagramWidget) => {
                if (widget) {
                    widget.actionDispatcher.dispatch(new CenterAction([]))
                }
            },
            isVisible: widget => {
                return widget !== undefined && widget instanceof KeithDiagramWidget
            }
        })
        registry.registerCommand(fitCommand, {
            isEnabled: () => true,
            execute: (widget: KeithDiagramWidget) => {
                if (widget) {
                    widget.actionDispatcher.dispatch(new FitToScreenAction(['$root']))
                }
            },
            isVisible: widget => {
                return widget !== undefined && widget instanceof KeithDiagramWidget
            }
        });
        registry.registerCommand(refreshDiagramCommand, {
            isEnabled: () => true,
            execute: (widget: KeithDiagramWidget) => {
                if (widget && widget.syncWithEditor) {
                    widget.actionDispatcher.dispatch(new RequestModelAction({
                        sourceUri: widget.uri.toString(),
                        diagramType: diagramType}))
                }
            },
            isVisible: widget => {
                return widget !== undefined && widget instanceof KeithDiagramWidget
            }
        });
        // Currently not used
        registry.registerCommand(refreshLayoutCommand, {
            isEnabled: () => true,
            execute: (widget: KeithDiagramWidget) => {
                if (widget) {
                    widget.actionDispatcher.dispatch(new RefreshLayoutAction())
                }
            },
            isVisible: widget => {
                return widget !== undefined && widget instanceof KeithDiagramWidget
            }
        });
        registry.registerCommand(syncWithEditor, {
            isEnabled: () => true,
            execute: (widget: KeithDiagramWidget) => {
                if (widget) {
                    widget.syncWithEditor = !widget.syncWithEditor
                    if (widget.syncWithEditor) {
                        registry.executeCommand(refreshDiagramCommand.id, widget)
                    }
                }
            },
            isVisible: widget => {
                return widget !== undefined && widget instanceof KeithDiagramWidget
            },
            isToggled: widget => {
                return widget.syncWithEditor
            }
        });
        registry.registerCommand(resizeToFit, {
            isEnabled: () => true,
            execute: (widget: KeithDiagramWidget) => {
                if (widget) {
                    widget.resizeToFit = !widget.resizeToFit
                    if (widget.resizeToFit) {
                        registry.executeCommand(fitCommand.id, widget)
                    }
                }
            },
            isVisible: widget => {
                return widget !== undefined && widget instanceof KeithDiagramWidget
            },
            isToggled: widget => {
                return widget.resizeToFit
            }
        });
    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
        registry.registerItem({
            id: centerCommand.id,
            command: centerCommand.id,
            tooltip: centerCommand.label
        });
        registry.registerItem({
            id: fitCommand.id,
            command: fitCommand.id,
            tooltip: fitCommand.label
        });
        registry.registerItem({
            id: refreshDiagramCommand.id,
            command: refreshDiagramCommand.id,
            tooltip: refreshDiagramCommand.label
        });
        this.registerMoreToolbarItem({
            id: syncWithEditor.id,
            command: syncWithEditor.id,
            tooltip: syncWithEditor.label,
            group: diagramConfigurationGroup
        });
        this.registerMoreToolbarItem({
            id: resizeToFit.id,
            command: resizeToFit.id,
            tooltip: resizeToFit.label,
            group: diagramConfigurationGroup
        });
    }

    /**
     * Register commands to the `More Actions...` widget toolbar item.
     * @see FileNavigatorContribution
     */
    public registerMoreToolbarItem = (item: Mutable<TabBarToolbarItem>) => {
        const commandId = item.command;
        const id = 'widget.tabbar.toolbar.' + commandId;
        const command = this.commandRegistry.getCommand(commandId);
        this.commandRegistry.registerCommand({ id, iconClass: command && command.iconClass }, {
            execute: (w, ...args) => w instanceof KeithDiagramWidget
                && this.commandRegistry.executeCommand(commandId, w, ...args),
            isEnabled: (w, ...args) => w instanceof KeithDiagramWidget
                && this.commandRegistry.isEnabled(commandId, w, ...args),
            isVisible: (w, ...args) => w instanceof KeithDiagramWidget
                && this.commandRegistry.isVisible(commandId, w, ...args),
            isToggled: (w, ...args) => w instanceof KeithDiagramWidget
                && this.commandRegistry.isToggled(commandId, w, ...args),
        });
        item.command = id;
        this.tabbarToolbarRegistry.registerItem(item);
    };
}