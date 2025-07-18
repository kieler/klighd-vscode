/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2025 by
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

import { ContainerModule } from 'inversify'
import { configureActionHandler, TYPES } from 'sprotty'
import { DISymbol } from '../di.symbols'
import { SearchBar } from './searchbar'
import { SearchBarPanel } from './searchbar-panel'
import { HandleSearchAction, ToggleSearchBarAction, ToggleSearchBarHandler } from './searchbar-actions'

/** DI module that adds support for a search bar. */
export const searchBarModule = new ContainerModule((bind, _, isBound) => {
    bind(DISymbol.SearchBar).to(SearchBar).inSingletonScope()
    bind(TYPES.IUIExtension).toService(DISymbol.SearchBar)

    bind(SearchBarPanel).toSelf().inSingletonScope()

    bind(ToggleSearchBarHandler).toSelf().inSingletonScope()

    const ctx = { bind, isBound }
    configureActionHandler(ctx, ToggleSearchBarAction.KIND, ToggleSearchBarHandler)

    bind(HandleSearchAction).toSelf().inSingletonScope()
    bind(TYPES.IActionHandlerInitializer).toService(HandleSearchAction)
})
