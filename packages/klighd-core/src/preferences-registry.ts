import { inject, injectable, postConstruct } from "inversify";
import { Action, ICommand } from "sprotty";
import { Registry } from "./base/registry";
import { Connection, NotificationType } from "./services";

/** User preferences that change how the diagram view behaves. */
export interface Preferences {
    /**
     * Resize the diagram to fit the viewport if it is redrawn after a model update
     * or a viewport resize.
     */
    resizeToFit: boolean;
    /** Uses a light background instead of an applied theme. */
    forceLightBackground: boolean;

    /** Indicates whether or not a text selection should select the corresponding diagram part. */
    shouldSelectDiagram: boolean;

    /** Indicates whether or nat a selection in the diagram should also highlight the corresponding text. */
    shouldSelectText: boolean;
}

/** {@link Registry} that stores user preferences which change the behavior of the diagram view. */
@injectable()
export class PreferencesRegistry extends Registry {
    private _preferences: Preferences;

    @inject(Connection) private connection: Connection;

    get preferences(): Preferences {
        return this._preferences;
    }

    constructor() {
        super();
        // Initialize default settings
        this._preferences = {
            resizeToFit: true,
            forceLightBackground: false,
            shouldSelectDiagram: true,
            shouldSelectText: false,
        };
    }

    @postConstruct()
    init(): void {
        // Notify the server about initial preferences.
        this.notifyServer();
    }

    handle(action: Action): void | Action | ICommand {
        if (SetPreferencesAction.isThisAction(action)) {
            this._preferences = {
                ...this._preferences,
                resizeToFit: action.preferences.resizeToFit ?? this._preferences.resizeToFit,
                forceLightBackground:
                    action.preferences.forceLightBackground ??
                    this.preferences.forceLightBackground,
                shouldSelectDiagram:
                    action.preferences.shouldSelectDiagram ?? this._preferences.shouldSelectDiagram,
                shouldSelectText:
                    action.preferences.shouldSelectText ?? this._preferences.shouldSelectText,
            };
            this.notifyListeners();
            this.notifyServer();
        }
    }

    /** Notifies the server about changed preferences that are supported by the server. */
    private notifyServer() {
        this.connection.onReady().then(() => {
            this.connection.sendNotification(NotificationType.SetPreferences, {
                "diagram.shouldSelectDiagram": this._preferences.shouldSelectDiagram,
                "diagram.shouldSelectText": this.preferences.shouldSelectText,
            });
        });
    }
}

/** Change the user preferences stored in the `klighd-core` container. */
export class SetPreferencesAction implements Action {
    static readonly KIND = "setPreferences";
    readonly kind = SetPreferencesAction.KIND;

    constructor(readonly preferences: Partial<Preferences>) {}

    /** Type predicate to narrow an action to this action. */
    static isThisAction(action: Action): action is SetPreferencesAction {
        return action.kind === SetPreferencesAction.KIND;
    }
}
