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
import { injectable } from "inversify";
import { Command } from "@theia/core";

@injectable()
export class SelectSimulationTypeCommand implements Command {

    id = 'select-simulation-type'
    label = 'Select simulation type'
    category = 'Simulation'
    public resetTo: string = "Periodic"
}