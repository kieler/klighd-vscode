import { ContainerModule } from 'inversify'
import { configureActionHandler, TYPES} from 'sprotty'
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
 