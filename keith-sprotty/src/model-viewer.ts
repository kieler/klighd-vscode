import { injectable, inject, postConstruct } from "inversify";
import { VNode } from "snabbdom/vnode";
import { InitializeCanvasBoundsAction, ModelViewer } from "sprotty";
import { KeithFitToScreenAction } from "./actions/actions";
import { DISymbol } from "./di.symbols";
import { PreferencesRegistry } from "./preferences-registry";

/**
 * Extend the {@link ModelViewer} to also dispatch a FitToScreenAction when the
 * window resizes.
 * Futhermore, the extension resolves UIExtensions from the IoC that should be
 * displayed immediately.
 */
@injectable()
export class KeithModelViewer extends ModelViewer {
    // Resolve UIExtensions that should be shown together with the model.
    // Such UIExtensions should implement a @postConstruct to show them self.
    // @ts-ignore value is never read. The IoC only has to resolve the dependency.
    @inject(DISymbol.Sidebar) private sidebar: unknown;

    @inject(DISymbol.PreferencesRegistry) private preferencesRegistry: PreferencesRegistry;

    @postConstruct()
    init() {
        // Most diagrams are not rendered with different themes in mind. In case
        // a diagram is hard to read, the user can force a light background.
        // This toggles such background if the user selects it.
        this.preferencesRegistry.onChange(() => {
            const baseDiv = document.querySelector(`#${this.options.baseDiv}`);

            if (this.preferencesRegistry.preferences.forceLightBackground) {
                baseDiv?.classList.add("light-bg");
            } else {
                baseDiv?.classList.remove("light-bg");
            }
        });
    }

    protected onWindowResize = (vdom: VNode): void => {
        // This should do a super.onWindowResize call to not repeat the logic from the
        // base class. However, the method is defined as an arrow function, which
        // technically is a function assigned to property and not a method.
        // Therefore, the call throws a TS2340 error.
        const baseDiv = document.getElementById(this.options.baseDiv);
        if (baseDiv !== null) {
            const newBounds = this.getBoundsInPage(baseDiv as Element);
            this.actiondispatcher.dispatch(new InitializeCanvasBoundsAction(newBounds));

            if (this.preferencesRegistry.preferences.resizeToFit)
                this.actiondispatcher.dispatch(new KeithFitToScreenAction(false));
        }
    };
}
