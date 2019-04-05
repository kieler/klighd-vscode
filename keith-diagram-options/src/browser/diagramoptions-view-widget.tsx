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

import { injectable } from 'inversify'
import { Message, ReactWidget } from '@theia/core/lib/browser'
import { Emitter } from '@theia/core'
import { Event } from '@theia/core/lib/common'
import { SynthesisOption, TransformationOptionType, RangeOption } from '../common/option-models'
import { isNullOrUndefined } from 'util'
import * as React from 'react'
import '../../src/browser/style/index.css'

/**
 * The widget displaying the diagram options.
 */
@injectable()
export class DiagramOptionsViewWidget extends ReactWidget {
    public static widgetId = 'diagramoptions-view'

    readonly onDidChangeOpenStateEmitter = new Emitter<boolean>()
    private synthesisOptions: SynthesisOption[]
    private categoryMap: Map<string, SynthesisOption[]> = new Map

    constructor() {
        super()

        this.id = DiagramOptionsViewWidget.widgetId
        this.title.label = 'Diagram Options'
        this.addClass('theia-diagramoptions-view')
    }

    /**
     * Sets the synthesis options.
     * @param options The options to set.
     */
    public setSynthesisOptions(options: SynthesisOption[]): void {
        this.synthesisOptions = options
        this.update()
    }

    /**
     * Gets the synthesis options.
     */
    public getSynthesisOptions(): SynthesisOption[] {
        return this.synthesisOptions
    }

    protected render(): JSX.Element {
        if (isNullOrUndefined(this.synthesisOptions)) {
            // Default view if no diagram has been opened yet.
            return <div>
                <div className='diagram-option'>
                    {'No open diagram found.'}
                </div>
                <div
                    className='update-button'
                    title='Update'
                    onClick={event => {
                        this.getOptions()
                    }}>
                    {'Update View'}
                </div>
            </div>
        } else {
            return this.renderOptions(this.synthesisOptions)
        }
    }

    /**
     * Renders the options, it is assumed that the options are ordered in a way
     * that the category for each option comes before its corresponding options.
     * @param synthesisOptions The Options for the diagram synthesis.
     */
    private renderOptions(synthesisOptions: SynthesisOption[]): JSX.Element {
        this.categoryMap.clear()
        let children: JSX.Element[] = []
        let optionsToRender: SynthesisOption[] = []
        // Add all options to their categories.
        synthesisOptions.forEach(option => {
            if (option.type === TransformationOptionType.CATEGORY) {
                this.categoryMap.set(option.name, [])
                if (option.category) {
                    let list = this.categoryMap.get(option.category.name)
                    if (list) {
                        list.push(option)
                    }
                } else {
                    optionsToRender.push(option)
                }
            } else {
                if (option.category) {
                    let list = this.categoryMap.get(option.category.name)
                    if (list) {
                        list.push(option)
                    }
                } else {
                    optionsToRender.push(option)
                }
            }
        })
        // Render all top level options.
        optionsToRender.forEach(option => {
            switch (option.type) {
                case TransformationOptionType.CHECK: {
                    children.push(this.renderCheck(option))
                    break
                }
                case TransformationOptionType.CHOICE: {
                    children.push(this.renderChoice(option))
                    break
                }
                case TransformationOptionType.RANGE: {
                    children.push(this.renderRange(option as RangeOption))
                    break
                }
                case TransformationOptionType.SEPARATOR: {
                    children.push(this.renderSeperator(option))
                    break
                }
                case TransformationOptionType.CATEGORY: {
                    const list = this.categoryMap.get(option.name)
                    if (list) {
                        children.push(this.renderCategory(option, list))
                    }
                    break
                }
            }
        })
        return <div>{...children}</div>
    }

    /**
     * Renders a check SynthesisOption as an HTML checkbox.
     * @param option The ckeck option to render.
     */
    private renderCheck(option: SynthesisOption): JSX.Element { // TODO: remove inputAttrs in renderChoiceValue
        const currentValue = option.currentValue
        let inputAttrs = {
            type: 'checkbox',
            id: option.name,
            name: option.name,
            defaultChecked: currentValue,
            onClick: (e: React.MouseEvent<HTMLInputElement>) => this.onCheck(e, option)
        }

        return <div key={option.sourceHash} className='diagram-option'>
            <label htmlFor={option.name}>
                <input className='diagram-inputbox' {...inputAttrs} />
                {option.name}
            </label>
        </div>
    }

    /**
     * Called whenever a checkbox has been clicked. Updates the option that belongs to this checkbox.
     * @param event The mouseEvent that clicked the checkbox.
     * @param option The synthesis option connected to the clicked checkbox.
     */
    private onCheck(event: React.MouseEvent<HTMLInputElement>, option: SynthesisOption) {
        option.currentValue = event.currentTarget.checked
        this.sendNewOption(option)
    }

    /**
     * Renders a choice SynthesisOption as an HTML fieldset with multiple radio buttons.
     *
     * @param option The choice option to render.
     */
    private renderChoice(option: SynthesisOption): JSX.Element {
        return <fieldset key={option.sourceHash} className='diagram-option'>
            <legend>{option.name}</legend>
            {option.values.map(value => this.renderChoiceValue(value, option))}
        </fieldset>
    }

    /**
     * Renders a radio button input for a choice option.
     *
     * @param value The value of the choice option.
     * @param option The option this radio button belongs to.
     */
    private renderChoiceValue(value: any, option: SynthesisOption): JSX.Element {
        return <div key={'' + option.sourceHash + value}>
            <label htmlFor={value}>
                <input
                    type='radio'
                    id={value}
                    name={option.name}
                    defaultChecked={value === option.currentValue}
                    onClick={e => this.onChoice(option, value)}
                />
                {value}
            </label>
        </div>
    }

    /**
     * Called whenever a choice radio button has been clicked. Updates the option that belongs to this button.
     * @param event The mouseEvent that clicked the radio button.
     * @param option The synthesis option connected to the clicked radio button.
     */
    private onChoice(option: SynthesisOption, value: any) {
        option.currentValue = value
        this.sendNewOption(option)
    }

    /**
     * Renders a range SynthesisOption as an HTML input with a range.
     *
     * @param option The range option to render.
     */
    private renderRange(option: RangeOption): JSX.Element {
        const currentValue = option.currentValue
        let inputAttrs = {
            type: 'range',
            id: option.name,
            name: option.name,
            min: option.range.first,
            max: option.range.second,
            value: currentValue,
            step: option.stepSize,
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => this.onRange(event, option)
        }
        return <div key={option.sourceHash} className='diagram-option'>
            <label htmlFor={option.name}>{option.name}: {option.currentValue}</label>
            <input {...inputAttrs} />
        </div>
    }

    /**
     * Called whenever a range slider has been modified. Updates the option that belongs to this range slider.
     * @param event The mouseEvent that updated the range slider.
     * @param option The synthesis option connected to the range slider.
     */
    private onRange(event: React.ChangeEvent<HTMLInputElement>, option: SynthesisOption) {
        option.currentValue = event.currentTarget.value
        this.update()
        this.sendNewOption(option)
    }

    /**
     * Renders a separator SynthesisOption as an HTML label.
     *
     * @param option The separator option to render.
     */
    private renderSeperator(option: SynthesisOption) {
        return <div key={option.sourceHash} className='diagram-option seperator'>
            <label htmlFor={option.name}>{option.name}</label>
        </div>
    }

    /**
     * Renders a category SynthesisOption as an HTML details tag.
     * Also recursively renders all synthesis options that belong in this category.
     *
     * @param option The category option to render.
     */
    private renderCategory(option: SynthesisOption, synthesisOptions: SynthesisOption[]): JSX.Element {
        return <div key={option.sourceHash} className='diagram-option category'>
            <details open={option.currentValue}>
                <summary
                    onClick={(e: React.MouseEvent) => this.onCategory(e, option)}
                >{option.name}</summary>
                {this.renderCategoryOptions(synthesisOptions)}
            </details>
        </div>
    }

    /**
     * Called whenever a category details tag is opened or closed. Updates the option that belongs to this category.
     * @param event The mouseEvent that updated the category.
     * @param option The synthesis option connected to the category.
     */
    private onCategory(event: React.MouseEvent, option: SynthesisOption) {
        const clickedDetailsElement = event.currentTarget.parentElement
        // By the above definition, the parent of this element has to be the details element surrounding it.
        if (clickedDetailsElement === null || !(clickedDetailsElement instanceof HTMLDetailsElement)) {
            return
        }
        // This is called before the target opened or closed, so the inverted current open value is the correct value to use here.
        option.currentValue = !clickedDetailsElement.open
        this.sendNewOption(option)
    }

    /**
     * Renders the options in this category.
     * @param options The options in this category.
     */
    private renderCategoryOptions(options: SynthesisOption[]): JSX.Element {
        let children: JSX.Element[] = []
        options.forEach(option => {
            switch (option.type) {
                case TransformationOptionType.CHECK: {
                    children.push(this.renderCheck(option))
                    break
                }
                case TransformationOptionType.CHOICE: {
                    children.push(this.renderChoice(option))
                    break
                }
                case TransformationOptionType.RANGE: {
                    children.push(this.renderRange(option as RangeOption))
                    break
                }
                case TransformationOptionType.SEPARATOR: {
                    children.push(this.renderSeperator(option))
                    break
                }
                case TransformationOptionType.CATEGORY: {
                    const list = this.categoryMap.get(option.name)
                    if (list) {
                        children.push(this.renderCategory(option, list))
                    }
                    break
                }
            }
        })
        return <div className='category-options'>{...children}</div>
    }

    onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg)
        // Always update the view on activate.
        this.onUpdateRequest(msg)
    }

    protected readonly onSendNewOptionEmitter = new Emitter<SynthesisOption>()

    /**
     * Emit when an option has been changed.
     */
    readonly onSendNewOption: Event<SynthesisOption> = this.onSendNewOptionEmitter.event

    /**
     * Call this when an option changed and that should be communicated to other listening methods.
     * @param option The option that has changed.
     */
    public sendNewOption(option: SynthesisOption): void {
        this.onSendNewOptionEmitter.fire(option)
    }

    protected readonly onGetOptionsEmitter = new Emitter<DiagramOptionsViewWidget | undefined>()

    /**
     * Emit when options are requested manually.
     */
    readonly onGetOptions: Event<DiagramOptionsViewWidget | undefined> = this.onGetOptionsEmitter.event

    /**
     * Call this when this view should pull new options.
     */
    public getOptions(): void {
        this.onGetOptionsEmitter.fire(this)
    }
}