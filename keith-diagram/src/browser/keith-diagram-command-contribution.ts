/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { injectable, inject } from "inversify";
import { CommandRegistry, CommandContribution, Command } from "@theia/core/lib/common";
import { CenterAction, FitToScreenAction } from "sprotty";
import { SynthesisRegistry } from "@kieler/keith-sprotty/lib/syntheses/synthesis-registry";
import { KeithDiagramServer } from "./keith-diagram-server";
import { TabBarToolbarContribution, TabBarToolbarRegistry } from "@theia/core/lib/browser/shell/tab-bar-toolbar";
import { KeithDiagramWidget } from "./keith-diagram-widget";
import { RefreshDiagramAction } from "@kieler/keith-interactive/lib/actions";

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
    id: 'keith:diagram:refresh',
    label: 'Refresh diagram',
    iconClass: 'fa fa-refresh',
    category: 'Diagram'
}

@injectable()
export class KeithDiagramCommandContribution implements CommandContribution, TabBarToolbarContribution {

    @inject(SynthesisRegistry) protected readonly synthesisRegistry: SynthesisRegistry

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(centerCommand, {
            isEnabled: () => true,
            execute: () => {
                const widget = (this.synthesisRegistry.getProvidingDiagramServer() as KeithDiagramServer).getWidget()
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
            execute: () => {
                const widget = (this.synthesisRegistry.getProvidingDiagramServer() as KeithDiagramServer).getWidget()
                if (widget) {
                    widget.actionDispatcher.dispatch(new FitToScreenAction([]))
                }
            },
            isVisible: widget => {
                return widget !== undefined && widget instanceof KeithDiagramWidget
            }
        });
        registry.registerCommand(refreshDiagramCommand, {
            isEnabled: () => true,
            execute: () => {
                const widget = (this.synthesisRegistry.getProvidingDiagramServer() as KeithDiagramServer).getWidget()
                if (widget) {
                    widget.actionDispatcher.dispatch(new RefreshDiagramAction())
                }
            },
            isVisible: widget => {
                return widget !== undefined && widget instanceof KeithDiagramWidget
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
    }
}