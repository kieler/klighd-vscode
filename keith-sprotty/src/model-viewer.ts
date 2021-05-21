import { InitializeCanvasBoundsAction, ModelViewer } from "sprotty";
import { VNode } from "snabbdom/vnode";
import { KeithFitToScreenAction } from "./actions/actions";

/**
 * Extend the {@link ModelViewer} to also dispatch a FitToScreenAction when the
 * window resizes.
 */
export class KeithModelViewer extends ModelViewer {
    protected onWindowResize = (vdom: VNode): void => {
        // This should do a super.onWindowResize call to not repeat the logic from the
        // base class. However, the method is defined as an arrow function, which
        // technically is a function assigned to property and not a method.
        // Therefore, the call throws a TS2340 error.
        const baseDiv = document.getElementById(this.options.baseDiv);
        if (baseDiv !== null) {
            const newBounds = this.getBoundsInPage(baseDiv as Element);
            this.actiondispatcher.dispatch(new InitializeCanvasBoundsAction(newBounds));
            // TODO: Provide an option to toggle this on and off like it is done in KEITH Theia.
            this.actiondispatcher.dispatch(new KeithFitToScreenAction(false));
        }
    };
}
