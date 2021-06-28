import { ContainerModule } from "inversify";
import { configureActionHandler, configureCommand } from "sprotty";
import { DISymbol } from "../di.symbols";
import { CreateBookmarkAction, CreateBookmarkCommand, GoToBookmarkAction, GoToBookmarkCommand } from "./bookmark"
import { BookmarkPanel } from "./bookmark-panel";
import { BookmarkRegistry } from "./bookmark-registry";

/**
 * Module for updateing the depthmap whenever needed. 
 */
const bookmarkModule = new ContainerModule((bind, unbind, isBound, rebind) => {

    const context = { bind, unbind, isBound, rebind }

    bind(BookmarkPanel).toSelf().inSingletonScope();
    bind(DISymbol.SidebarPanel).toService(BookmarkPanel);

    bind(DISymbol.BookmarkRegistry).to(BookmarkRegistry).inSingletonScope();


    configureCommand({ bind, isBound }, CreateBookmarkCommand);
    configureCommand({ bind, isBound }, GoToBookmarkCommand);

    configureActionHandler(context, CreateBookmarkAction.KIND, DISymbol.BookmarkRegistry);
    configureActionHandler(context, GoToBookmarkAction.KIND, DISymbol.BookmarkRegistry);


    
});

 
export default bookmarkModule;