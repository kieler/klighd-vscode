import { injectable } from "inversify";
import { html } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Registry } from "../base/registry";
import { IActionHandler, ICommand } from "../../../../node_modules/sprotty/src/base/actions/action-handler.ts";
import { Action, UpdateModelAction } from "sprotty-protocol";
import { ActionHandlerRegistry, SModelRoot } from "sprotty"
import { SendModelContextAction } from "../actions/actions";
import { SKGraphElement } from "@kieler/klighd-interactive/lib/constraint-classes";
import { injectable } from "inversify";
import { ActionHandlerRegistry, IActionHandler, ICommand, isSelectable, ModelIndexImpl, SModelRoot } from "sprotty";
import { Action, SetModelAction, UpdateModelAction } from "sprotty-protocol";
import { SendModelContextAction } from "../actions/actions";
import { isSKGraphElement, SKEdge, SKLabel, SKNode, SKPort } from "../skgraph-models";
//TODO sort imports

@injectable()
export class GraphPropertiesViewRegistry extends Registry implements IActionHandler {
 
    
    // handle(action: Action): ICommand | Action | void {
    //     if (action.kind === SelectAction.KIND) {
    //         this.handleUpdateSelectAction(action);
    //     }
    // }

    // handleUpdateSelectAction(action: SelectAction): ICommand | Action | void {
    //     ids = action.selectedElementsIDs
    // }
    //diagramm holen, objekte finden anhand ids

    // getSelectedElemets(a: any) {
    //     return a
    // }

    handle(action: Action): void | Action | ICommand {
        if (action.kind === SetModelAction.KIND || action.kind === UpdateModelAction.KIND) {
            // Reset
            SelectedElementsUtil.resetModel();
        } else if (action.kind === SendModelContextAction.KIND) {
            SelectedElementsUtil.recalculateSelection();
            if (SelectedElementsUtil.isReset()) {
                // Set new root
                const sMCAction = action as SendModelContextAction;
                SelectedElementsUtil.setRoot(sMCAction.model.root);
            }
        }
    }

    initialize(registry: ActionHandlerRegistry): void {
        // New model
        registry.register(SetModelAction.KIND, this);
        registry.register(UpdateModelAction.KIND, this);
        registry.register(SendModelContextAction.KIND, this);
    }
}

/** Util class for easily accessing the currently selected elements. */
export class SelectedElementsUtil {
    /** The model index for looking up elements. */
    private static index?: ModelIndexImpl;
    /** The currently selected elements. */
    private static selectedElements: SKGraphElement[];
    /** Cache of {@link selectedElements} containing only selected nodes. */
    private static nodeCache?: SKNode[];
    /** Cache of {@link selectedElements} containing only selected edges. */
    private static edgeCache?: SKEdge[];
    /** Cache of {@link selectedElements} containing only selected labels. */
    private static labelCache?: SKLabel[];
    /** Cache of {@link selectedElements} containing only selected ports. */
    private static portCache?: SKPort[];

    public getSelectedElements(): SKGraphElement[] {
        return this.selectedElements
    }
    /**
     * Clears all caches for stored element types.
     */
    private static clearCaches(): void {
        this.nodeCache = undefined;
        this.edgeCache = undefined;
        this.labelCache = undefined;
        this.portCache = undefined;

    }

    /**
     * Recalculates the selected elements.
     */
    static recalculateSelection(): void {
        this.clearCaches()
        this.selectedElements = [];
        this.index?.all().forEach(element => {
            if (isSelectable(element) && element.selected && isSKGraphElement(element)) {
                this.selectedElements.push(element)
            }
        })
    }

    /** Checks if the current index is reset. */
    static isReset(): boolean {
        return this.index === undefined;
    }

    /** Resets the current index elements. */
    static resetModel(): void {
        this.index = undefined;
        this.selectedElements = [];
    }

    /** Sets the current root. */
    static setRoot(root: SModelRoot): void {
        // this.currRoot = root;
        this.index = new ModelIndexImpl()
        this.index.add(root)

        // calculate the selected elements.
        this.recalculateSelection()
    }

    //// Util methods ////

    /** Returns the currently selected elements. */
    static getSelectedElements(): SKGraphElement[] {
        return this.selectedElements;
    }

    /** Returns whether there are any currently selected elements. */
    static areElementsSelected(): boolean {
        return this.getSelectedElements().length > 0;
    }

    /** Returns the currently selected nodes. */
    static getSelectedNodes(): SKNode[] {
        this.nodeCache = this.nodeCache ?? this.selectedElements.filter(node => node instanceof SKNode) as SKNode[];
        return this.nodeCache;
    }

    /** Returns whether there are any currently selected nodes. */
    static areNodesSelected(): boolean {
        return this.getSelectedNodes().length > 0;
    }

    /** Returns the currently selected edges. */
    static getSelectedEdges(): SKEdge[] {
        this.edgeCache = this.edgeCache ?? this.selectedElements.filter(node => node instanceof SKEdge) as SKEdge[];
        return this.edgeCache;
    }

    /** Returns whether there are any currently selected edges. */
    static areEdgesSelected(): boolean {
        return this.getSelectedEdges().length > 0;
    }

    /** Returns the currently selected labels. */
    static getSelectedLabels(): SKLabel[] {
        this.labelCache = this.labelCache ?? this.selectedElements.filter(node => node instanceof SKLabel) as SKLabel[];
        return this.labelCache;
    }

    /** Returns whether there are any currently selected labels. */
    static areLabelsSelected(): boolean {
        return this.getSelectedLabels().length > 0;
    }

    /** Returns the currently selected ports. */
    static getSelectedPorts(): SKPort[] {
        this.portCache = this.portCache ?? this.selectedElements.filter(node => node instanceof SKPort) as SKPort[];
        return this.portCache;
    }

    /** Returns whether there are any currently selected ports. */
    static arePortsSelected(): boolean {
        return this.getSelectedPorts().length > 0;
    }
}


//git cherrypick