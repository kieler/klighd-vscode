/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 * 
 * Copyright 2021 by
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

import { ContainerModule } from "inversify";
import { configureActionHandler, configureCommand } from "sprotty";
import { DISymbol } from "../di.symbols";
import { CreateBookmarkAction, CreateBookmarkCommand, GoToBookmarkAction, SetInitialBookmark } from "./bookmark"
import { BookmarkPanel } from "./bookmark-panel";
import { BookmarkRegistry } from "./bookmark-registry";

/**
 * Module for creating and going to bookmarks 
 */
const bookmarkModule = new ContainerModule((bind, unbind, isBound, rebind) => {

    const context = { bind, unbind, isBound, rebind }

    bind(BookmarkPanel).toSelf().inSingletonScope();
    bind(DISymbol.SidebarPanel).toService(BookmarkPanel);

    bind(DISymbol.BookmarkRegistry).to(BookmarkRegistry).inSingletonScope();


    configureCommand({ bind, isBound }, CreateBookmarkCommand);

    configureActionHandler(context, CreateBookmarkAction.KIND, DISymbol.BookmarkRegistry);
    configureActionHandler(context, GoToBookmarkAction.KIND, DISymbol.BookmarkRegistry);
    configureActionHandler(context, SetInitialBookmark.KIND, DISymbol.BookmarkRegistry);

});

export default bookmarkModule;
