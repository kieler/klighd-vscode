/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

// import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { injectable, inject } from "inversify";
import { Message,
    StatefulWidget,
    ReactWidget} from "@theia/core/lib/browser";
import { Event, CommandRegistry } from '@theia/core/lib/common'
import * as React from "react";
import { CompilationSystem, Snapshot, CodeContainer } from "../common/kicool-models";
import { compilerWidgetId } from "../common";
import { Emitter } from "@theia/core";
import '../../src/browser/style/index.css'
import '../../src/browser/style/black-white.css'
import '../../src/browser/style/reverse-toolbar.css'
import '../../src/browser/style/tree.css'
import '../../src/browser/style/inline-block.css'
import { SELECT_COMPILATION_CHAIN, TOGGLE_PRIVATE_SYSTEMS, TOGGLE_INPLACE, TOGGLE_AUTO_COMPILE } from "../common/commands";

export class ShowSnapshotEvent {
    uri: string
    index: number
}

/**
 * Widget to compile and navigate compilation results. Should be linked to editor.
 */
@injectable()
export class CompilerWidget extends ReactWidget implements StatefulWidget {

    @inject(CommandRegistry) protected readonly commandRegistry: CommandRegistry

    /**
     * Id of widget. Can be used to get an instance of this widget via the WidgetManager.
     */
    public static widgetId = compilerWidgetId


    protected readonly onRequestSystemDescriptionsEmitter = new Emitter<CompilerWidget | undefined>()
    readonly requestSystemDescriptions: Event<CompilerWidget | undefined> = this.onRequestSystemDescriptionsEmitter.event

    protected readonly onCancelCompilationEmitter = new Emitter<void | undefined>()
    readonly cancelCompilation: Event<void | undefined> = this.onCancelCompilationEmitter.event

    protected readonly onCancelGetSystemsEmitter = new Emitter<void | undefined>()
    readonly cancelGetSystems: Event<void | undefined> = this.onCancelGetSystemsEmitter.event

    protected readonly onShowSnapshotEmitter = new Emitter<ShowSnapshotEvent | undefined>()
    readonly showSnapshot: Event<ShowSnapshotEvent | undefined> = this.onShowSnapshotEmitter.event

    readonly onDidChangeOpenStateEmitter = new Emitter<boolean>()

    /**
     * Holds all compilation system that where requested from the LS for a specific model.
     * These are filtered on the client side to display the private or public systems.
     * The compilation systems are updated on selection of a current editor.
     */
    public systems: CompilationSystem[]
    public snapshotSystems: CompilationSystem[]

    /**
     * Is saved as part of the state of the widget.
     */
    protected snapshotFilter: string = ""

    /**
     * If enabled, the style selection menu.
     * Is saved as part of the state of the widget.
     */
    protected showAdvancedToolbar: boolean = false

    /**
     * Selectable css styles. Their names have to correspond to the names used in the dedicated css style file.
     */
    readonly styles: string[] = ["default", "black-white", "reverse-toolbar",
        "black-white reverse-toolbar", "tree", "black-white tree", "inline-block"]

    /**
     * Currently selected css style. See styles for a list of available css styles.
     * This should correspond to the selectedIndex property.
     * Is saved as part of the state of the widget.
     */
    selectedStyle: string = "default"

    /**
     * Index of selected css style file. Should always correspond to the selectedStyle property.
     * Is saved as part of the state of the widget.
     */
    selectedIndex: number = 0

    /**
     * Option whether auto compile is enabled.
     * Is saved as part of the state of the widget.
     */
    autoCompile: boolean = false

    /**
     * Enables inplace compilation.
     * Is saved as part of the state of the widget.
     */
    compileInplace: boolean = false

    /**
     * Boolean property to enable filtering of compilation systems saved in field systems.
     * Is saved as part of the state of the widget.
     */
    showPrivateSystems: boolean = true

    /**
     * Holds the uri of the model in the current editor.
     * This is updated on change of the current editor.
     */
    public sourceModelPath: string

    /**
     * Holds the id of the last invoked compilation system.
     * This is used by the simulation to decide whether a simulation can be restarted.
     */
    public lastInvokedCompilation: string = ""

    /**
     * Holds the uri of the last compiled model, if any.
     * This is used by the simulation to decide whether a simulation can be restarted.
     */
    public lastCompiledUri: string = ""
    /*
     * Indicates whether a compilation is currently running.
     * Enables to stop compilation button.
     */
    public compiling: boolean = false

    public requestedSystems: boolean

    public lastRequestedUriExtension: string

    /**
     * Indicates that a compilation is currently being cancelled
     */
    public cancellingCompilation: boolean

    public showButtons: boolean = false

    public snapshots: CodeContainer

    constructor() {
        super();
        this.id = compilerWidgetId
        this.title.label = 'KIELER Compiler'
        this.title.iconClass = 'fa fa-cogs';
        this.addClass(compilerWidgetId) // class for index.css
    }

    render(): React.ReactNode {
        if (this.requestedSystems) {
            return <div>
                <div key="panel" className={"compilation-panel " + (this.selectedStyle)}>
                    {this.requestedSystems ? this.renderCancelButton(() => this.onCancelGetSystems(), "Cancel get compilation systems") : ""}
                </div>
            </div>;
        } else if (!this.systems) {
            // Try to request compilation systems.
            this.requestSystemDescription()
            return
        } else {
            const compilationElements: React.ReactNode[] = [];
            this.systems.forEach(system => {
                if ((this.showPrivateSystems || system.isPublic)) {
                    compilationElements.push(<option value={system.id} key={system.id}>{system.label}</option>)
                }
            });
            // Add css styles to selectbox
            const stylesToSelect: React.ReactNode[] = [];
            this.styles.forEach((style, index) => {
                stylesToSelect.push(<option value={style} key={style}>{style}</option>)
            });
            let styleSelectbox = <React.Fragment></React.Fragment>
            let searchbox
            // Add advanced features to toolbars
            if (this.showAdvancedToolbar) {
                styleSelectbox = <select id="style-list" className={'selection-list style-list ' + (this.selectedStyle)}
                        onChange={() => this.handleSelectionOfStyle()} defaultValue={this.styles[this.selectedIndex]}>
                    {stylesToSelect}
                </select>
                searchbox = this.renderSearchbox("snapshot-filter",
                "Filter snapshots",
                this.snapshotFilter,
                () => this.handleSearchChange())
            }
            return <React.Fragment>
                {this.showButtons ? <div className={`compilation-panel ${this.selectedStyle}`}>
                    {this.renderShowAdvancedToolbar()}
                    {styleSelectbox}
                    {searchbox}
                </div> : ''}
                <div className={`compilation-panel ${this.selectedStyle}`}>
                    {this.showButtons ? this.renderPrivateButton() : ""}
                    {this.showButtons ? this.renderInplaceButton() : ""}
                    {this.showButtons ? this.renderAutoCompileButton() : ""}
                    {this.showButtons ? this.compiling ? "" : this.renderCompileButton() : ""}
                    {this.compiling && this.cancellingCompilation ?
                        this.renderSpinnerButton("Stop compilation...") :
                        this.compiling ? this.renderCancelButton(() => this.requestCancelCompilation(), "Cancel compilation") : ""}
                </div>
                {this.renderShowButtons()}
            </React.Fragment>
        }
    }

    async onCancelGetSystems() {
        this.onCancelGetSystemsEmitter.fire()
    }

    async requestCancelCompilation() {
        this.onCancelCompilationEmitter.fire()
    }

    /**
     * If something in the search box is changed, the filter for filtering snapshots is updated.
     * The widget is updated, which leads to a redraw.
     */
    handleSearchChange() {
        this.snapshotFilter = (document.getElementById("snapshot-filter") as HTMLInputElement).value
        this.update()
    }

    /**
     * Handles the selection of a new css style for the widget.
     * It saves the index and name of the current selected style and updates the widget.
     */
    handleSelectionOfStyle() {
        const index = (document.getElementById("style-list") as HTMLSelectElement).selectedIndex
        if (index !== null) {
            this.selectedStyle = this.styles[index];
            this.selectedIndex = index
            this.update()
        }
    }

    onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.update()
    }

    onUpdateRequest(msg: Message): void {
        super.onUpdateRequest(msg);
    }

    /**
     * Fires event to request compilation systems. This event is bound and caught in the KiCoolContribution.
     */
    public requestSystemDescription(): void {
        this.onRequestSystemDescriptionsEmitter.fire(this)
    }

    renderSpinnerButton(tooltip: string): React.ReactNode {
        return <div className={`preference-button ${this.selectedStyle}`} title="Cancel">
            <div className='spinnerContainer'>
                <div className='fa fa-spinner fa-pulse fa-fw' title={tooltip}></div>
            </div>
        </div>
    }

    /**
     * Renders a searchBox. The onInput function must be added as parameter in big arrow notations ,
     * since the scope should not change. This allows to access this in the function.
     * @param id id of generated input element
     * @param placeholder placeholder of searchbox
     * @param value defaultValue and name of searchbox
     * @param onInput function that is bound to onInput, must be written with big arrow notation: () => function()
     */
    renderSearchbox(id: string, placeholder: string, value: string, onInput: () => void) {
        return <input id={id}
        title=". is the wildcard; * and + are supported"
        className={`kicool-input ${this.selectedStyle}`}
        type='search'
        defaultValue={value}
        name={value}
        onInput={() => onInput()} placeholder={placeholder}/>
    }

    /**
     * Renders all show buttons. These are the buttons displayed for each snapshot.
     */
    renderShowButtons(): React.ReactNode {

        const showButtons: React.ReactNode[] = [];
        const uri = this.sourceModelPath
        if (!uri) {
            return
        }
        if (!this.snapshots) {
            return
        }
        // Add show original model button
        showButtons.push(
            <ul key="original" className={`snapshot-list ${this.selectedStyle}`}>
                <li key={"original"} id={"showButtonOriginal"} className={`show-button ${this.selectedStyle}`}
                        title={"Original"}
                        onClick={event => {
                            // Draw diagram of original model
                            this.onShowSnapshot(uri.toString(), -1)
                        }
                    }>
                    Original
                </li >
            </ul>
        )
        let snapshotsListOfLists: Snapshot[][] = this.snapshots.files
        let resultingMaxIndex = 0
        snapshotsListOfLists.forEach((snapshots: Snapshot[], index: number) => {
            let filter
            try {
                filter = snapshots[0].name.toLowerCase().search(this.snapshotFilter.toLowerCase()) > -1
            } catch (error) {
                filter = true // do not filter if search causes an error
            }
            if (filter) {
                let list: React.ReactNodeArray = []
                snapshots.forEach((snapshot: Snapshot, innerIndex: number) => {
                    const currentIndex = resultingMaxIndex
                    // default case
                    list.push(
                        <li key={resultingMaxIndex}
                            id={"showButton" + (resultingMaxIndex < 10 ? "0" + resultingMaxIndex : resultingMaxIndex)}
                            className={'show-button '.concat((snapshot.errors.length > 0) ? 'error ' :
                            (snapshot.warnings.length > 0) ? 'warn ' : (snapshot.infos.length > 0 ) ? 'info ' : '') + (this.selectedStyle)}
                            title={snapshot.name}
                            onClick={event => {
                                if (!uri) {
                                    return
                                }
                                this.onShowSnapshot(uri.toString(), currentIndex)
                            }}>
                            {(snapshot.snapshotIndex === 0 && // draw the name of the snapshot if it is the first snapshot with a style that needs this
                                (this.selectedStyle && !this.selectedStyle.includes("tree") ||
                                snapshots.length === 1)) ? snapshot.name : ""}
                        </li>
                    )
                    resultingMaxIndex++
                })
                // construct default ReactNode
                const node = <ul key={snapshots[0].name} className={`snapshot-list ${this.selectedStyle}`}>{list}</ul>
                // if a tree style is selected draw snapshots for processors with more than one output as detail element
                if (this.selectedStyle && this.selectedStyle.includes("tree") && snapshots.length > 1) {
                    // case a tree style is selected
                    showButtons.push(
                        <details key={index} className={`showButtonDetail ${this.selectedStyle}`}>
                            <summary className={'show-button '.concat((snapshots[0].errors.length > 0) ? 'error ' :
                        (snapshots[0].warnings.length > 0) ? 'warn ' : (snapshots[0].infos.length > 0 ) ? 'info ' : '') + (this.selectedStyle)}>{snapshots[0].name}</summary>
                            {node}
                        </details>
                    )
                } else {
                    // default cause, no detail element is needed
                    showButtons.push(node)
                }
            }
        })
        return <div id="showButtonContainer0" className={`buttonContainer ${this.selectedStyle}`}>
            {showButtons}
        </div>
    }

    onShowSnapshot(uri: string, index: number) {
        this.onShowSnapshotEmitter.fire({uri: uri, index: index})
    }

    renderCompileButton(): React.ReactNode {
        return <div className={`compile-button ${this.selectedStyle}`} title="Compile"
            onClick={event => {
                this.commandRegistry.executeCommand(SELECT_COMPILATION_CHAIN.id)
            }}>
            <div className='icon fa fa-play-circle'> </div>
        </div>
    }

    renderCancelButton(method: () => Promise<void>, tooltip: string): React.ReactNode {
        return <div className={`preference-button ${this.selectedStyle}`} title={tooltip}
            onClick={() => method()}>
            <div className='icon fa fa-square'> </div>
        </div>
    }

    renderPrivateButton(): React.ReactNode {
        return <div title="Show private Systems" key="private-button" className={`preference-button ${this.showPrivateSystems ? '' : 'off'} ${this.selectedStyle}`}
            onClick={event => {
                this.commandRegistry.executeCommand(TOGGLE_PRIVATE_SYSTEMS.id)
                this.update()
            }}>
            <div className='icon fa fa-unlock-alt'/>
        </div>
    }

    renderInplaceButton(): React.ReactNode {
        return <div title="Inplace" key="inplace-button" className={`preference-button ${this.compileInplace ? '' : 'off'} ${this.selectedStyle}`}
            onClick={event => {
                this.commandRegistry.executeCommand(TOGGLE_INPLACE.id)
                this.update()
            }}>
            <div className='icon fa fa-share'/>
        </div>
    }

    renderAutoCompileButton(): React.ReactNode {
        return <div title="Auto compile" key="auto-compile-button" className={`preference-button ${this.autoCompile ? '' : 'off'} ${this.selectedStyle}`}
            onClick={event => {
                this.commandRegistry.executeCommand(TOGGLE_AUTO_COMPILE.id)
                this.update()
            }}>
            <div className='icon fa fa-cog'/>
        </div>
    }

    renderShowAdvancedToolbar(): React.ReactNode {
        return <div title={this.showAdvancedToolbar ? "Hide advanced toolbar" : "Show advanced toolbar"}
                    key="show-advanced-toolbar"
                    className={`preference-button ${this.showAdvancedToolbar ? '' : 'off'} ${this.selectedStyle}`}
            onClick={event => {
                this.showAdvancedToolbar = !this.showAdvancedToolbar
                this.update()
            }}>
            <div className={'icon fa ' + (this.showAdvancedToolbar ? 'fa-minus' : 'fa-plus')}/>
        </div>
    }

    /**
     * Store the state of the widget.
     */
    storeState(): CompilerWidget.Data {
        return {
            autoCompile : this.autoCompile,
            compileInplace : this.compileInplace,
            showPrivateSystems : this.showPrivateSystems,
            selectedStyle : this.selectedStyle,
            selectedIndex : this.selectedIndex,
            showAdvancedToolbar : this.showAdvancedToolbar,
            snapshotFilter : this.snapshotFilter,
            showButtons : this.showButtons
        }
    }

    /**
     * Restore the state of the widget on reload.
     */
    restoreState(oldState: CompilerWidget.Data): void {
        this.autoCompile = !!oldState.autoCompile
        this.compileInplace = !!oldState.compileInplace
        this.showPrivateSystems = !!oldState.showPrivateSystems
        this.showButtons = !!oldState.showButtons
        if (oldState.selectedIndex === undefined || oldState.selectedStyle === undefined) {
            this.selectedIndex = 0
            this.selectedStyle = this.styles[0]
        } else {
            this.selectedStyle = oldState.selectedStyle
            this.selectedIndex = oldState.selectedIndex
        }
        this.showAdvancedToolbar = oldState.showAdvancedToolbar
        if (oldState.snapshotFilter) {
            this.snapshotFilter = oldState.snapshotFilter
        } else {
            this.snapshotFilter = ""
        }
    }
}

/**
 * Definition of the state of the corresponding {@link CompilerWidget}.
 */
export namespace CompilerWidget {
    export interface Data {
        autoCompile: boolean,
        compileInplace: boolean,
        showPrivateSystems: boolean,
        selectedStyle: string,
        selectedIndex: number,
        showAdvancedToolbar: boolean
        snapshotFilter: string
        showButtons: boolean
    }
}