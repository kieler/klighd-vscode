import { injectable } from "inversify";
import { Action, ICommand } from "sprotty";
import { Registry } from "./base/registry";

/** User preferences that change how the diagram view behaves. */
export interface Preferences {
    /**
     * Behavior of the diagram when the diagram window resizes. Only the values
     * `"fit"` and `"nothing"` are considered by `keith-sprotty`.
     */
    resizeBehavior: string;
}

/** Registry that stores user preferences which change the behavior of the diagram view. */
@injectable()
export class PreferencesRegistry extends Registry {
    private _preferences: Preferences;

    get preferences() {
        return this._preferences;
    }

    constructor() {
        super();
        // Initialize default settings
        this._preferences = {
            resizeBehavior: "fit",
        };
    }

    handle(action: Action): void | Action | ICommand {
        if (SetPreferencesAction.isThisAction(action)) {
            this._preferences = {
                ...this._preferences,
                resizeBehavior: validateWithFallback(
                    action.preferences.resizeBehavior,
                    ["fit", "nothing"],
                    this._preferences.resizeBehavior
                ),
            };
            this.notifyListeners();
        }
    }
}

/** Change the user preferences stored in the keith-sprotty container. */
export class SetPreferencesAction implements Action {
    static readonly KIND = "setPreferences";
    readonly kind = SetPreferencesAction.KIND;

    constructor(readonly preferences: Partial<Preferences>) {}

    /** Type predicate to narrow an action to this action. */
    static isThisAction(action: Action): action is SetPreferencesAction {
        return action.kind === SetPreferencesAction.KIND;
    }
}

function validateWithFallback<T extends string>(
    value: string | undefined,
    allowedValues: T[],
    fallback: T
): T {
    const newValue = allowedValues.find((allowedValue) => allowedValue === value);
    return newValue ?? fallback;
}
