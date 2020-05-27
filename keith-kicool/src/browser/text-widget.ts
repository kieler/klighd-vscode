/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018, 2020 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { MaybePromise } from "@theia/core";
import { BaseWidget, Message } from "@theia/core/lib/browser";
import { Disposable } from "@theia/languages/lib/browser";
import { injectable } from "inversify";
import PerfectScrollbar from "perfect-scrollbar";

export const textWidgetId = 'text-widget';

/**
 * Mock widget to display text. Currently not in use.
 */
@injectable()
export class TextWidget extends BaseWidget {

    constructor(
        protected readonly titleLabel: string,
        protected readonly text: string,
        protected readonly widgetId: string
    ) {
        super();
        this.title.label = titleLabel
        this.title.closable = true
        this.id = widgetId
        this.addClass('text_widget') // class for index.css
        this.node.innerHTML = "<div>" + text + "</div>"
        this.node.draggable = false
    }

    onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        (async () => {
            const container = await this.getScrollContainer();
            container.style.overflow = 'hidden';
            this.scrollBar = new PerfectScrollbar(container);

            this.toDispose.push(Disposable.create(async () => {
                if (this.scrollBar) {
                    this.scrollBar.destroy();
                    this.scrollBar = undefined;
                }
                // tslint:disable-next-line:no-null-keyword
                container.style.overflow = '';
            }));
        })();
    }

    public updateContent(titleLabel: string, text: string) {
        this.title.label = titleLabel
        this.node.innerHTML = "<div>" + text + "</div>"
    }

    protected getScrollContainer(): MaybePromise<HTMLElement> {
        return this.node;
    }
}