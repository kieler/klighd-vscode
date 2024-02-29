/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019, 2021 by
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
import { injectable } from 'inversify'
import { ICommand } from 'sprotty'
import { Action } from 'sprotty-protocol'
import { Registry } from '../base/registry'
import { SetSynthesesAction, SetSynthesesActionData, SetSynthesisAction } from './actions'

/**
 * A simple {@link Registry} that holds a list of all available syntheses
 * as well as the currently selected synthesis.
 *
 * Handles SetSyntheses and SetSynthesis actions to keep the state in sync which
 * new events.
 */
@injectable()
export class SynthesesRegistry extends Registry {
    private _currentSynthesisID = ''

    private _syntheses: SetSynthesesActionData[] = []

    handle(action: Action): void | Action | ICommand {
        if (SetSynthesesAction.isThisAction(action)) {
            this._syntheses = action.syntheses
            this._currentSynthesisID = action.syntheses[0]?.id ?? ''

            this.notifyListeners()
        } else if (SetSynthesisAction.isThisAction(action)) {
            this._currentSynthesisID = action.id
            this.notifyListeners()
        }
    }

    get syntheses(): SetSynthesesActionData[] {
        return this._syntheses
    }

    get currentSynthesisID(): string {
        return this._currentSynthesisID
    }
}
