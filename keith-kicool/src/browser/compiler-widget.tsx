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

/**
 * Widget to compile and navigate compilation results. Should be linked to editor.
 */
@injectable()
export class CompilerWidget extends ReactWidget implements StatefulWidget {

    public static widgetId = compilerWidgetId


    protected readonly onRequestSystemDescriptionsEmitter = new Emitter<CompilerWidget | undefined>()
    /**
     * Emit when compilation systems are requested.
     */
    readonly requestSystemDescriptions: Event<CompilerWidget | undefined> = this.onRequestSystemDescriptionsEmitter.event
    readonly onDidChangeOpenStateEmitter = new Emitter<boolean>()

    systems: CompilationSystems[]

    readonly styles: string[] = [" default", " black-white", " reverse-toolbar", " black-white reverse-toolbar"]
    selectedStyle: string = " default"
    selectedIndex: number = 0


    autoCompile: boolean
    compileInplace: boolean
    showPrivateSystems: boolean
    public sourceModelPath: string

    constructor(
        @inject(new LazyServiceIdentifer(() => KiCoolContribution)) protected readonly commands: KiCoolContribution
    ) {
        super();
        this.id = compilerWidgetId
        this.title.label = 'KIELER Compiler'
        this.title.iconClass = 'fa fa-play-circle';
        this.addClass(compilerWidgetId) // class for index.css
        this.systems = [{id: "NONE", label: "NONE", isPublic: true}]
        this.autoCompile = false
        this.showPrivateSystems = false
        this.compileInplace = false
    }

    render(): React.ReactNode {
        if (!this.systems || this.systems.length === 1) {
            if (this.commands && this.commands.editor) {
                this.requestSystemDescription()
            }
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
            const stylesToSelect: React.ReactNode[] = [];
            this.styles.forEach((style, index) => {
                stylesToSelect.push(<option value={style} key={style}>{style}</option>)
            });
            return <React.Fragment>
                <select id="style-list" className={'selection-list style-list' + (this.selectedStyle)}
                        onChange={() => this.handleSelectionOfStyle()} defaultValue={this.styles[this.selectedIndex]}>
                    {stylesToSelect}
                </select>
                <div className={"compilation-panel" + (this.selectedStyle)}>
                    {this.renderPrivateButton()}
                    {this.renderInplaceButton()}
                    {this.renderAutoCompileButton()}
                    <select id='compilation-list' className={'selection-list' + (this.selectedStyle)}>
                        {compilationElements}
                    </select>
                    {this.renderCompileButton()}
                </div>
                {this.renderShowButtons()}
            </React.Fragment>
        }
    }

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
        snapshots.files.forEach((snapshot: Snapshots, index: number) => {

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

    storeState(): CompilerWidget.Data {
        return {
            autoCompile : this.autoCompile,
            compileInplace : this.compileInplace,
            showPrivateSystems : this.showPrivateSystems,
            selectedStyle : this.selectedStyle,
            selectedIndex : this.selectedIndex
        }
    }

    restoreState(oldState: CompilerWidget.Data): void {
        this.autoCompile = oldState.autoCompile
        this.compileInplace = oldState.compileInplace
        this.showPrivateSystems = oldState.showPrivateSystems
        this.selectedStyle = oldState.selectedStyle
        this.selectedIndex = oldState.selectedIndex
    }
}

export namespace CompilerWidget {
    export interface Data {
        autoCompile: boolean,
        compileInplace: boolean,
        showPrivateSystems: boolean,
        selectedStyle: string,
        selectedIndex: number
    }
}