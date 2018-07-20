import { injectable } from "inversify";
import { Message } from "@phosphor/messaging";
import { BaseWidget } from "@theia/core/lib/browser";
import PerfectScrollbar from "perfect-scrollbar";
import { MaybePromise } from "@theia/core";
import { Disposable } from "@theia/languages/lib/common";

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
        this.setHidden(false)
        this.node.focus()
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
                container.style.overflow = null;
            }));
        })();
        this.node.focus()
    }

    protected getScrollContainer(): MaybePromise<HTMLElement> {
        return this.node;
    }
}