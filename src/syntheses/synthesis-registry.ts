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
import { injectable } from 'inversify';
import { DiagramServer } from 'sprotty';
import { SetSynthesesActionData } from './synthesis-message-data';

/**
 * A simple injectable registry that holds the action data of the last SetSynthesesAction and the diagram server that data was for
 * and provides methods to modify and access that data.
 */
@injectable()
export class SynthesisRegistry {

    /**
     * The data of all currently available syntheses.
     */
    syntheses: SetSynthesesActionData[] = []
    /**
     * The diagram server that received the syntheses' data.
     */
    providingDiagramServer: DiagramServer

    /**
     * Resets the available syntheses to the ones given here.
     * @param syntheses The new syntheses.
     */
    setAvailableSyntheses(syntheses: SetSynthesesActionData[]): void {
        this.syntheses = syntheses
    }

    /**
     * Add a single synthesis to the list of available syntheses.
     * @param synthesis The new synthesis to add.
     */
    addAvailableSynthesis(synthesis: SetSynthesesActionData): void {
        this.syntheses.push(synthesis)
    }

    /**
     * Clears all available syntheses from the list.
     */
    clearAvailableSyntheses(): void {
        this.syntheses = []
    }

    /**
     * Returns the list of available syntheses data of the last SetSynthesesAction.
     */
    getAvailableSyntheses(): SetSynthesesActionData[] {
        return this.syntheses
    }

    /**
     * Default setter to set the diagram server that provided the syntheses' data.
     * @param diagramServer The diagram server to set.
     */
    setProvidingDiagramServer(diagramServer: DiagramServer): void {
        this.providingDiagramServer = diagramServer
    }

    /**
     * Default getter to get the diagram server that provided the syntheses' data.
     */
    getProvidingDiagramServer(): DiagramServer {
        return this.providingDiagramServer
    }
}