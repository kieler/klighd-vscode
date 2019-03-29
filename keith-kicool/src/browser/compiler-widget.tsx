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
import { injectable, LazyServiceIdentifer, inject } from "inversify";
import { Message,
    StatefulWidget,
    ReactWidget} from "@theia/core/lib/browser";
import { Event } from '@theia/core/lib/common'
import * as React from "react";
import { CompilationSystems, Snapshots } from "../common/kicool-models";
import { compilerWidgetId } from "../common";
import { KiCoolContribution } from "./kicool-contribution";
import { Emitter } from "@theia/core";
import '../../src/browser/style/index.css'
import '../../src/browser/style/black-white.css'
import '../../src/browser/style/reverse-toolbar.css'
import URI from "@theia/core/lib/common/uri";

/**
 * Widget to compile and navigate compilation results. Should be linked to editor.
 */
@injectable()
export class CompilerWidget extends ReactWidget implements StatefulWidget {

    /**
     * Id of widget. Can be used to get an instance of this widget via the WidgetManager.
     */
    public static widgetId = compilerWidgetId


    protected readonly onRequestSystemDescriptionsEmitter = new Emitter<CompilerWidget | undefined>()

    /**
     * Emit when compilation systems are requested.
     */
    readonly requestSystemDescriptions: Event<CompilerWidget | undefined> = this.onRequestSystemDescriptionsEmitter.event
    readonly onDidChangeOpenStateEmitter = new Emitter<boolean>()

    /**
     * Holds all compilation system that where requested from the LS for a specific model.
     * These are filtered on the client side to display the private or public systems.
     * The compilation systems are updated on selection of a current editor.
     */
    systems: CompilationSystems[]

    protected compilationSystemFilter: string = ""

    /**
     * If enebaled, the style selection menu.
     * Is saved as part of the state of the widget.
     */
    protected showAdvancedToolbar: boolean = false

    /**
     * Selectable css styles. Their names have to correspond to the names used in the dedicated css style file.
     */
    readonly styles: string[] = [" default", " black-white", " reverse-toolbar", " black-white reverse-toolbar"]

    /**
     * Currently selected css style. See styles for a list of available css styles.
     * This should correspond to the selectedIndex property.
     * Is saved as part of the state of the widget.
     */
    selectedStyle: string = " default"

    /**
     * Index of selected css style file. Should always correspond to the selectedStyle property.
     * Is saved as part of the state of the widget.
     */
    selectedIndex: number = 0

    /**
     * Option whether auto compile is enabled.
     * Is saved as part of the state of the widget.
     */
    autoCompile: boolean

    /**
     * Enables inplace compilation.
     * Is saved as part of the state of the widget.
     */
    compileInplace: boolean

    /**
     * Boolean property to enbale filtering of compilation systems saved in field systems.
     * Is saved as part of the state of the widget.
     */
    showPrivateSystems: boolean

    /**
     * Holds the uri of the model in the current editor.
     * This is updated on change of the current editor.
     */
    public sourceModelPath: string

    constructor(
        @inject(new LazyServiceIdentifer(() => KiCoolContribution)) protected readonly commands: KiCoolContribution
    ) {
        super();
        this.id = compilerWidgetId
        this.title.label = 'KIELER Compiler'
        this.title.iconClass = 'fa fa-play-circle';
        this.addClass(compilerWidgetId) // class for index.css
        this.systems = []
        this.autoCompile = false
        this.showPrivateSystems = false
        this.compileInplace = false
    }

    render(): React.ReactNode {
        if (!this.systems || this.systems.length === 0) {
            // Case no connection to the LS was astablished or no compilation systems are present.
            if (this.commands && this.commands.editor) {
                // Try to request compilation systems.
                this.requestSystemDescription()
            }
            // If no compilation systems could be requested, show spinner instead.
            return <div className='spinnerContainer'>
                <div className='fa fa-spinner fa-pulse fa-3x fa-fw'></div>
            </div>;
        } else {
            const compilationElements: React.ReactNode[] = [];
            this.systems.forEach(system => {
                if (this.showPrivateSystems || system.isPublic) {
                    compilationElements.push(<option value={system.id} key={system.id}>{system.label}</option>)
                }
            });
            // Add css styles to selectbox
            const stylesToSelect: React.ReactNode[] = [];
            this.styles.forEach((style, index) => {
                stylesToSelect.push(<option value={style} key={style}>{style}</option>)
            });
        
            let styleSelectbox = <React.Fragment></React.Fragment>
            let searchbox = <input id="compilation-system-filter" className="kicool-input" type='search' defaultValue='' name={this.compilationSystemFilter}
                onInput={() => this.handleSearchChange()} placeholder='Filter snapshots'/>

            // Add advanced features to toolbars
            if (this.showAdvancedToolbar) {
                styleSelectbox = <select id="style-list" className={'selection-list style-list' + (this.selectedStyle)}
                        onChange={() => this.handleSelectionOfStyle()} defaultValue={this.styles[this.selectedIndex]}>
                    {stylesToSelect}
                </select>
            }
            
            return <React.Fragment>
                <div className={"compilation-panel" + (this.selectedStyle)}>
                {this.renderShowAdvancedToolbar()}
                {styleSelectbox}
                </div>
                <div className={"compilation-panel" + (this.selectedStyle)}>
                    {this.renderPrivateButton()}
                    {this.renderInplaceButton()}
                    {this.renderAutoCompileButton()}
                    <select id='compilation-list' className={'selection-list' + (this.selectedStyle)}>
                        {compilationElements}
                    </select>
                    {this.renderCompileButton()}
                    {searchbox}
                </div>
                {this.renderShowButtons()}
            </React.Fragment>
        }
    }

    handleSearchChange() {
        this.compilationSystemFilter = (document.getElementById("compilation-system-filter") as HTMLInputElement).value
        this.update()
    }

    /**
     * Handles the selection of a new css style for the widget.
     * It saves the index and name of teh current selected style and updates the widget.
     */
    handleSelectionOfStyle() {
        const index = (document.getElementById("style-list") as HTMLSelectElement).selectedIndex
        if (index !== null) {
            this.selectedStyle = this.styles[index];
            this.selectedIndex = index
            this.update()
        } else {
            console.log("This is wrong")
        }
    }

    onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.update()
    }

    onUpdateRequest(msg: Message): void {
        super.onUpdateRequest(msg);
        this.render()
    }

    /**
     * Fires event to request compilation systems. This event is bound and caught in the KiCoolContribution.
     */
    public requestSystemDescription(): void {
        this.onRequestSystemDescriptionsEmitter.fire(this)
    }

    renderShowButtons(): React.ReactNode {

        const showButtons: React.ReactNode[] = [];
        const uri = this.sourceModelPath
        if (!uri) {
            return
        }
        const snapshots = this.commands.resultMap.get(uri)
        if (!snapshots) {
            return
        }
        // Add show original mpdel button
        showButtons.push(
            <div key={"original"} id={"showButtonOriginal"} className={'show-button' + (this.selectedStyle)}
                    title={"Original"}
                    onClick={event => {
                        // Draw diagram of original model
                        this.commands.diagramManager.drawDiagram(new URI(uri))
                    }
                }>
                Original
            </div >
        )
        // Add show buttons for all snapshots
        snapshots.files.forEach((snapshot: Snapshots, index: number) => {
            if (snapshot.name.search(this.compilationSystemFilter) > -1) {
                showButtons.push(
                    <div key={index} id={"showButton" + (index < 10 ? "0" + index : index)} className={'show-button'.concat((snapshot.errors.length > 0) ? ' error' :
                        (snapshot.warnings.length > 0) ? ' warn' : (snapshot.infos.length > 0 ) ? ' info' : '') + (this.selectedStyle)}
                        title={snapshot.name}
                        onClick={event => {
                            if (!uri) {
                                return
                            }
                            this.commands.show(uri.toString(), index)
                        }}>
                        {snapshot.snapshotIndex === 0 ? snapshot.name : ""}
                    </div >
                )
            }
        });
        return <div id="showButtonContainer0" className='buttonContainer'>
            {showButtons}
        </div>
    }

    renderCompileButton(): React.ReactNode {
        return <div className={'compile-button' + (this.selectedStyle)} title="Compile"
            onClick={event => {
                this.compileSelectedCompilationSystem()
            }}>
            <div className='icon fa fa-play-circle'> </div>
        </div>
    }

    renderPrivateButton(): React.ReactNode {
        return <div title="Show private Systems" key="private-button" className={'preference-button' + (this.showPrivateSystems ? '' : ' off') + (this.selectedStyle)}
            onClick={event => {
                this.showPrivateSystems = !this.showPrivateSystems
                this.update()
            }}>
            <div className='icon fa fa-unlock-alt'/>
        </div>
    }

    renderInplaceButton(): React.ReactNode {
        return <div title="Inplace" key="inplace-button" className={'preference-button' + (this.compileInplace ? '' : ' off') + (this.selectedStyle)}
            onClick={event => {
                this.compileInplace = !this.compileInplace
                this.update()
            }}>
            <div className='icon fa fa-share'/>
        </div>
    }

    renderAutoCompileButton(): React.ReactNode {
        return <div title="Auto compile" key="auto-compile-button" className={'preference-button' + (this.autoCompile ? '' : ' off') + (this.selectedStyle)}
            onClick={event => {
                this.autoCompile = !this.autoCompile
                this.update()
            }}>
            <div className='icon fa fa-cog'/>
        </div>
    }

    renderShowAdvancedToolbar(): React.ReactNode {
        return <div title={this.showAdvancedToolbar ? "Hide advanced toolbar" : "Show advanced toolbar"}
                    key="show-advanted-toolbar"
                    className={'preference-button' + (this.showAdvancedToolbar ? '' : ' off') + (this.selectedStyle)}
            onClick={event => {
                this.showAdvancedToolbar = !this.showAdvancedToolbar
                this.update()
            }}>
            <div className={'icon fa ' + (this.showAdvancedToolbar ? 'fa-minus' : 'fa-plus')}/>
        </div>
    }

    /**
     * Compiles the active model via the currently selected compilation system.
     * Called by compile button or invoked by the KiCoolContribution if auto compile is enabled.
     */
    public compileSelectedCompilationSystem(): void {
        const selection = document.getElementById("compilation-list") as HTMLSelectElement;
        const systems = this.systems.filter(system => {
            return this.showPrivateSystems || system.isPublic
        })
        if (systems.length > 0) {
            this.commands.compile(systems[selection.selectedIndex].id)
        } else {
            this.commands.message("No compilation systems found", "error")
            return
        }
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
            showAdvancedToolbar : this.showAdvancedToolbar
        }
    }

    /**
     * Restore the state of the widget on reload.
     */
    restoreState(oldState: CompilerWidget.Data): void {
        this.autoCompile = oldState.autoCompile
        this.compileInplace = oldState.compileInplace
        this.showPrivateSystems = oldState.showPrivateSystems
        if (oldState.selectedIndex === null || oldState.selectedStyle === null) {
            this.selectedIndex = 0
            this.selectedStyle = this.styles[0]
        } else {
            this.selectedStyle = oldState.selectedStyle
            this.selectedIndex = oldState.selectedIndex
        }
        this.showAdvancedToolbar = oldState.showAdvancedToolbar
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
    }
}