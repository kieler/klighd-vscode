/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
import { Command, CommandContribution, CommandHandler, CommandRegistry, MenuContribution, MenuModelRegistry } from '@theia/core';
import { CommonMenus } from '@theia/core/lib/browser';
import { inject, injectable } from 'inversify';
import { KeithLanguageClientContribution } from './keith-language-client-contribution';
import { KeithInitializationOptions } from '../common/initialization-protocol';

export const KeithInitializationServiceSymbol = Symbol('KeithInitializationService')

export const REINITIALIZE_OPTIONS = 'keith/initializeOptions/reinitializeOptions'

/**
 * Service to provide values for and store options that should be included in the LSP's 'initialize' method.
 */
export class KeithInitializationService {
    private static shouldSelectDiagramStorage = 'shouldSelectDiagram'
    private shouldSelectDiagram: boolean
    private defaultShouldSelectDiagram = true

    private static shouldSelectTextStorage = 'shouldSelectText'
    private shouldSelectText: boolean
    private defaultShouldSelectText = true

    static get(): KeithInitializationService {
        const global = window as any // tslint:disable-line
        return global[KeithInitializationServiceSymbol] || new KeithInitializationService()
    }

    protected constructor() {
        const global = window as any // tslint:disable-line
        global[KeithInitializationServiceSymbol] = this
    }

    /**
     * Sets the 'shouldSelectDiagram' option and remembers the state in the local storage.
     */
    setShouldSelectDiagram(newShouldSelectDiagram: boolean): void {
        if (newShouldSelectDiagram === this.shouldSelectDiagram) {
            return
        }
        this.shouldSelectDiagram = newShouldSelectDiagram
        window.localStorage.setItem(KeithInitializationService.shouldSelectDiagramStorage, newShouldSelectDiagram.toString())
    }

    /**
     * Get the 'shouldSelectDiagram' option from the local storage, or return its default value.
     */
    getShouldSelectDiagram(): boolean {
        const storageValue = window.localStorage.getItem(KeithInitializationService.shouldSelectDiagramStorage)
        if (storageValue === 'true') return true
        if (storageValue === 'false') return false
        return this.defaultShouldSelectDiagram
    }

    /**
     * Sets the 'shouldSelectText' option and remembers the state in the local storage.
     */
    setShouldSelectText(newShouldSelectText: boolean): void {
        if (newShouldSelectText === this.shouldSelectText) {
            return
        }
        this.shouldSelectText = newShouldSelectText
        window.localStorage.setItem(KeithInitializationService.shouldSelectTextStorage, newShouldSelectText.toString())
    }

    /**
     * Get the 'shouldSelectText' option from the local storage, or return its default value.
     */
    getShouldSelectText(): boolean {
        const storageValue = window.localStorage.getItem(KeithInitializationService.shouldSelectTextStorage)
        if (storageValue === 'true') return true
        if (storageValue === 'false') return false
        return this.defaultShouldSelectText
    }


    /**
     * Resets the state to the default values. Also resets any persisted state in the local storage.
     */
    reset(): void {
        this.setShouldSelectDiagram(this.defaultShouldSelectDiagram)
        this.setShouldSelectText(this.defaultShouldSelectText)
    }
}

/**
 * Command contribution for the shouldSelectDiagram option for Keith.
 */
@injectable()
export class ShouldSelectDiagramCommandContribution implements CommandHandler, Command {
    @inject(KeithLanguageClientContribution) client: KeithLanguageClientContribution
    id = 'shouldSelectDiagram'
    category = 'Settings'
    label = 'Toggles if a text segments selection should select diagram element'


    @inject(KeithInitializationService)
    protected readonly keithInitializationService: KeithInitializationService

    async execute() {
        const newValue = !this.keithInitializationService.getShouldSelectDiagram()
        this.keithInitializationService.setShouldSelectDiagram(newValue)
        const lClient = await this.client.languageClient
        await lClient.sendNotification(REINITIALIZE_OPTIONS, {
            shouldSelectDiagram: newValue,
            shouldSelectText: this.keithInitializationService.getShouldSelectText()
        } as KeithInitializationOptions)
    }
}

/**
 * Command contribution for the shouldSelectText option for Keith.
 */
@injectable()
export class ShouldSelectTextCommandContribution implements CommandHandler, Command {
    @inject(KeithLanguageClientContribution) client: KeithLanguageClientContribution
    id = 'shouldSelectText'
    category = 'Settings'
    label = 'Toggles if a diagram element selection should select text segments'


    @inject(KeithInitializationService)
    protected readonly keithInitializationService: KeithInitializationService

    async execute() {
        const newValue = !this.keithInitializationService.getShouldSelectText()
        this.keithInitializationService.setShouldSelectText(newValue)
        const lClient = await this.client.languageClient
        await lClient.sendNotification(REINITIALIZE_OPTIONS, {
            shouldSelectDiagram: this.keithInitializationService.getShouldSelectDiagram(),
            shouldSelectText: newValue
        } as KeithInitializationOptions)
    }
}

/**
 * Command- and Menu contribution to add Keith-specific options as commands and to the settings menu.
 */
@injectable()
export class KeithOptionsCommandContribution implements CommandContribution, MenuContribution {

    @inject(KeithInitializationService)
    protected readonly keithInitializationService: KeithInitializationService

    @inject(ShouldSelectDiagramCommandContribution)
    protected readonly shouldSelectDiagramCommandContribution: ShouldSelectDiagramCommandContribution

    @inject(ShouldSelectTextCommandContribution)
    protected readonly shouldSelectTextCommandContribution: ShouldSelectTextCommandContribution

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(this.shouldSelectDiagramCommandContribution, this.shouldSelectDiagramCommandContribution)
        commands.registerCommand(this.shouldSelectTextCommandContribution, this.shouldSelectTextCommandContribution)
    }

    registerMenus(menus: MenuModelRegistry) {
        menus.registerMenuAction(CommonMenus.FILE_SETTINGS_SUBMENU, {
            commandId: this.shouldSelectDiagramCommandContribution.id,
            label: this.shouldSelectDiagramCommandContribution.label
        })

        menus.registerMenuAction(CommonMenus.FILE_SETTINGS_SUBMENU, {
            commandId: this.shouldSelectTextCommandContribution.id,
            label: this.shouldSelectTextCommandContribution.label
        });
    }
}