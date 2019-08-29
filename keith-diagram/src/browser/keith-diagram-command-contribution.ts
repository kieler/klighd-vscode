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
import { DiagramCommandContribution, DiagramCommands } from "sprotty-theia";
import { CommandRegistry, CommandContribution } from "@theia/core";
import { CenterAction, FitToScreenAction, RequestExportSvgAction, LayoutAction } from "sprotty";
import { SynthesisRegistry } from "@kieler/keith-sprotty/lib/syntheses/synthesis-registry";
import { KeithDiagramServer } from "./keith-diagram-server";

@injectable()
export class KeithDiagramCommandContribution extends DiagramCommandContribution implements CommandContribution {

    @inject(SynthesisRegistry) protected readonly synthesisRegistry: SynthesisRegistry

    constructor() {
        super()
    }

    registerCommands(registry: CommandRegistry): void {
        registry.unregisterCommand(DiagramCommands.CENTER)
        registry.unregisterCommand(DiagramCommands.FIT)
        registry.unregisterCommand(DiagramCommands.EXPORT)
        registry.unregisterCommand(DiagramCommands.LAYOUT)
        registry.registerCommand({
            id: DiagramCommands.CENTER,
            label: 'Center',
            iconClass: 'fa fa-arrows-alt'
        }, {
            execute: () => {
                const widget = (this.synthesisRegistry.getProvidingDiagramServer() as KeithDiagramServer).getWidget()
                if (widget) {
                    widget.actionDispatcher.dispatch(new CenterAction([]))
                }
            }
        });
        registry.registerCommand({
            id: DiagramCommands.FIT,
            label: 'Fit to screen',
            iconClass: 'fa fa-expand'
        }, {
            execute: () => {
                const widget = (this.synthesisRegistry.getProvidingDiagramServer() as KeithDiagramServer).getWidget()
                if (widget) {
                    widget.actionDispatcher.dispatch(new FitToScreenAction([]))
                }
            }
        });
        registry.registerCommand({
            id: DiagramCommands.EXPORT,
            label: 'Export'
        }, {
            execute: () => {
                const widget = (this.synthesisRegistry.getProvidingDiagramServer() as KeithDiagramServer).getWidget()
                if (widget) {
                    widget.actionDispatcher.dispatch(new RequestExportSvgAction())
                }
            }
        });
        registry.registerCommand({
            id: DiagramCommands.LAYOUT,
            label: 'Layout'
        }, {
            execute: () => {
                const widget = (this.synthesisRegistry.getProvidingDiagramServer() as KeithDiagramServer).getWidget()
                if (widget) {
                    widget.actionDispatcher.dispatch(new LayoutAction())
                }
            }
        });
    }
}