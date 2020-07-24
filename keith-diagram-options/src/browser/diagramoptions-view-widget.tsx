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

import { RenderOption } from '@kieler/keith-sprotty/lib/options';
import { TransformationOptionType } from '@kieler/keith-sprotty/lib/options';
import { Emitter } from '@theia/core';
import { Message, ReactWidget } from '@theia/core/lib/browser';
import { Event } from '@theia/core/lib/common';
import { injectable } from 'inversify';
import * as React from 'react';
import { isNullOrUndefined } from 'util';
import '../../src/browser/style/index.css';
import { diagramOptionsWidgetId } from '../common';
import { DisplayedActionData, LayoutOptionUIData, LayoutOptionValue, RangeOption, SynthesisOption, Type } from '../common/option-models';

/**
 * The widget displaying the diagram options.
 */
@injectable()
export class DiagramOptionsViewWidget extends ReactWidget {

    readonly onDidChangeOpenStateEmitter = new Emitter<boolean>()
    private synthesisOptions: SynthesisOption[]
    private layoutOptions: LayoutOptionUIData[]
    private renderingOptions: RenderOption[] = []
    private actions: DisplayedActionData[]
    private categoryMap: Map<string, SynthesisOption[]> = new Map
    public diagramWidgetId: string = ''

    constructor() {
        super()

        this.id = diagramOptionsWidgetId
        this.title.label = 'Diagram Options'
        this.title.iconClass = 'diagram-options-icon'
        this.addClass('theia-diagramoptions-view')
    }

    /**
     * Sets the synthesis options.
     * @param synthesisOptions The synthesis options to set.
     */
    public setSynthesisOptions(synthesisOptions: SynthesisOption[]): void {
        this.synthesisOptions = synthesisOptions
    }

    /**
     * Sets the layout options.
     * @param layoutOptions The layout options to set.
     */
    public setLayoutOptions(layoutOptions: LayoutOptionUIData[]): void {
        this.layoutOptions = layoutOptions
    }

    /**
     * Sets the actions.
     * @param actions The actions to set.
     */
    public setActions(actions: DisplayedActionData[]): void {
        this.actions = actions
    }

    /**
     * Sets the client side render options.
     * @param renderOptions A list client side options.
     */
    public setRenderOptions(renderOptions: RenderOption[]) {
        this.renderingOptions = renderOptions
    }

    protected render(): JSX.Element {
        if (isNullOrUndefined(this.synthesisOptions)) {
            // Default view if no diagram has been opened yet.
            return <div className='diagram-option-widget'>
                <div className='diagram-option'>
                    {'No open diagram found.'}
                </div>
                <div
                    className='theia-button'
                    title='Update'
                    onClick={event => {
                        this.getOptions()
                    }}>
                    Update View
                </div>
            </div>
        } else {
            return <div className='diagram-option-widget'>
                {this.renderActions(this.actions)}
                {this.renderSynthesisOptions(this.synthesisOptions)}
                {this.renderRenderOptions(this.renderingOptions)}
                {this.renderLayoutOptions(this.layoutOptions)}
            </div>
        }
    }

    /**
     * Renders the actions.
     * @param actions The action data.
     */
    private renderActions(actions: DisplayedActionData[]): JSX.Element | undefined {
        let children: JSX.Element[] = []
        actions.forEach(action => {
            children.push(this.renderAction(action))
        })
        if (children.length === 0) {
            return undefined
        } else {
            return <div key='actions' className='diagram-option-actions'>
                <p className='diagram-option separator'>{'Actions'}</p>
                {...children}
            </div>
        }
    }

    /**
     * Renders a single action.
     * @param action The action data.
     */
    private renderAction(action: DisplayedActionData): JSX.Element {
        return <div
            key={action.actionId}
            className='theia-button'
            title={action.tooltipText}
            onClick={event => {
                this.sendNewAction(action.actionId)
            }}>
            {action.displayedName}
        </div>
    }

    /**
     * Renders the render options.
     * @param renderOptions The render options for the diagram.
     */
    private renderRenderOptions(renderOptions: RenderOption[]): JSX.Element | undefined {
        let children: JSX.Element[] = []
        // Render all top level options.
        renderOptions.forEach(option => {
            switch (option.type) {
                case TransformationOptionType.CHECK: {
                    children.push(this.renderCheckROption(option))
                    break
                }
                case TransformationOptionType.CHOICE: {
                    console.error('The rendering for ' + option.type + ' is not implemented yet.')
                    break
                }
                case TransformationOptionType.RANGE: {
                    console.error('The rendering for ' + option.type + ' is not implemented yet.')
                    break
                }
                case TransformationOptionType.SEPARATOR: {
                    console.error('The rendering for ' + option.type + ' is not implemented yet.')
                    break
                }
                default: {
                    console.error('The rendering for ' + option.type + ' is not implemented yet.')
                    break
                }
            }
        })
        if (children.length === 0) {
            return undefined
        } else {
            return <div key='renderOptions'>
                <p className='render-option separator'>{'Render Options'}</p>
                {...children}
            </div>
        }
    }

    /**
     * Renders a check SynthesisOption as an HTML checkbox.
     * @param option The check option to render.
     */
    private renderCheckOption(option: SynthesisOption, onClick: any): JSX.Element {
        const currentValue = option.currentValue
        let inputAttrs = {
            type: 'checkbox',
            id: option.name,
            name: option.name,
            defaultChecked: currentValue,
            onClick: (e: React.MouseEvent<HTMLInputElement>) => onClick(e, option)
        }

        return <div key={option.id} className='diagram-option'>
            <label htmlFor={option.name}>
                <input className='diagram-inputbox' {...inputAttrs} />
                {option.name}
            </label>
        </div>
    }

    /**
     * Renders a check RenderOption as an HTML checkbox.
     * @param option The check option to render.
     */
    private renderCheckROption(option: RenderOption): JSX.Element {
        return this.renderCheckOption(option as SynthesisOption, this.onCheckROption)
    }

    /**
     * Called whenever a checkbox has been clicked. Updates the option that belongs to this checkbox.
     * @param event The mouseEvent that clicked the checkbox.
     * @param option The render option connected to the clicked checkbox.
     */
    private onCheckROption = (event: React.MouseEvent<HTMLInputElement>, option: RenderOption): void => {
        option.currentValue = event.currentTarget.checked
        window.localStorage.setItem(option.id, JSON.stringify(option))
        this.sendNewRenderOption(option)
    }

    /**
     * Renders the synthesis options, it is assumed that the options are ordered in a way
     * that the category for each option comes before its corresponding options.
     * @param synthesisOptions The synthesis options for the diagram synthesis.
     */
    private renderSynthesisOptions(synthesisOptions: SynthesisOption[]): JSX.Element | undefined {
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
        children.push(...this.renderOptions(optionsToRender, 0))
        if (children.length === 0) {
            return undefined
        } else {
            return <div key='synthesisOptions'>
                <p className='diagram-option separator'>{'Diagram Options'}</p>
                {...children}
            </div>
        }
    }

    /**
     * Renders the given options, assuming that the categoryMap is already set up.
     *
     * @param optionsToRender The options that should be rendered now.
     */
    private renderOptions(optionsToRender: SynthesisOption[], index: number): JSX.Element[] {
        const children: JSX.Element[] = []
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
                case TransformationOptionType.TEXT: {
                    children.push(this.renderText(option))
                    break
                }
                case TransformationOptionType.SEPARATOR: {
                    children.push(this.renderSeparator(option))
                    break
                }
                case TransformationOptionType.CATEGORY: {
                    const list = this.categoryMap.get(option.name)
                    if (list) {
                        children.push(this.renderCategory(option, list, index))
                    }
                    break
                }
            }
        })
        return children
    }

    /**
     * Renders a check SynthesisOption as an HTML checkbox.
     * @param option The check option to render.
     */
    private renderCheck(option: SynthesisOption): JSX.Element {
        return this.renderCheckOption(option, this.onCheck)
    }

    /**
     * Called whenever a checkbox has been clicked. Updates the option that belongs to this checkbox.
     * @param event The mouseEvent that clicked the checkbox.
     * @param option The synthesis option connected to the clicked checkbox.
     */
    private onCheck = (event: React.MouseEvent<HTMLInputElement>, option: SynthesisOption): void => {
        option.currentValue = event.currentTarget.checked
        window.localStorage.setItem(option.id, JSON.stringify(option))
        this.sendNewSynthesisOption(option)
    }

    /**
     * Renders a choice SynthesisOption as an HTML fieldset with multiple radio buttons.
     *
     * @param option The choice option to render.
     */
    private renderChoice(option: SynthesisOption): JSX.Element {
        return <div key={option.id} className='diagram-option-choice'>
            <legend className='diagram-option'>{option.name}</legend>
            {option.values.map((value) => this.renderChoiceValue(value, option))}
        </div>
    }

    /**
     * Renders a radio button input for a choice option.
     *
     * @param value The value of the choice option.
     * @param option The option this radio button belongs to.
     */
    private renderChoiceValue(value: any, option: SynthesisOption): JSX.Element {
        return <div key={'' + option.id + value} className='diagram-option'>
            <label className='diagram-option-choice-label' htmlFor={value}>
                <input
                    type='radio'
                    id={value}
                    name={option.name}
                    defaultChecked={option.currentValue === undefined ? value === option.currentValue : value === option.initialValue}
                    onClick={e => this.onChoice(value, option)}
                />
                {value}
            </label>
        </div>
    }

    /**
     * Called whenever a choice radio button has been clicked. Updates the option that belongs to this button.
     * @param value The value that is clicked.
     * @param option The synthesis option connected to the clicked radio button.
     */
    private onChoice(value: any, option: SynthesisOption) {
        option.currentValue = value
        window.localStorage.setItem(option.id, JSON.stringify(option))
        this.sendNewSynthesisOption(option)
    }

    /**
     * Renders a range SynthesisOption as an HTML input with a range.
     *
     * @param option The range option to render.
     */
    private renderRange(option: RangeOption): JSX.Element {
        return <div key={option.id} className='diagram-option-range'>
            <label htmlFor={option.name}>{option.name}: {option.currentValue}</label>
            <input
                type='range'
                id={option.name}
                name={option.name}
                min={option.range.first}
                max={option.range.second}
                value={option.currentValue}
                step={option.stepSize}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => this.onRange(event, option)}
            />
        </div>
    }

    /**
     * Called whenever a range slider has been modified. Updates the option that belongs to this range slider.
     * @param event The mouseEvent that updated the range slider.
     * @param option The synthesis option connected to the range slider.
     */
    private onRange(event: React.ChangeEvent<HTMLInputElement>, option: SynthesisOption) {
        option.currentValue = event.currentTarget.value
        window.localStorage.setItem(option.id, JSON.stringify(option))
        this.update()
        this.sendNewSynthesisOption(option)
    }

    /**
     * Renders a text SynthesisOption as an HTML input with a text.
     *
     * @param option The text option to render.
     */
    private renderText(option: SynthesisOption): JSX.Element {
        return <div key={option.id} className='diagram-option-text'>
            <label htmlFor={option.name}>{option.name}:</label>
            <input
                type='text'
                id={option.name}
                name={option.name}
                value={option.currentValue}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => this.onText(event, option)}
            />
        </div>
    }

    /**
     * Called whenever a text option input field has been modified. Updates the option that belongs to this text field.
     * @param event The input event that updated the text field.
     * @param option The synthesis option connected to the text field.
     */
    private onText(event: React.ChangeEvent<HTMLInputElement>, option: SynthesisOption) {
        option.currentValue = event.currentTarget.value
        this.update()
        this.sendNewSynthesisOption(option)
    }

    /**
     * Renders a separator SynthesisOption as an HTML label.
     *
     * @param option The separator option to render.
     */
    private renderSeparator(option: SynthesisOption) {
        return <div key={option.id} className='diagram-option separator'>
            <label htmlFor={option.name}>{option.name}</label>
        </div>
    }

    /**
     * Renders a category SynthesisOption as an HTML details tag.
     * Also recursively renders all synthesis options that belong in this category.
     *
     * @param option The category option to render.
     */
    private renderCategory(option: SynthesisOption, synthesisOptions: SynthesisOption[], index: number): JSX.Element {
        return <div key={option.id} className={'diagram-option category' + index}>
            <details open={option.currentValue}>
                <summary
                    onClick={(e: React.MouseEvent) => this.onCategory(e, option)}
                >{option.name}</summary>
                {this.renderCategoryOptions(synthesisOptions, (index + 1) % 2)}
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
        window.localStorage.setItem(option.id, JSON.stringify(option))
    }

    /**
     * Renders the options in this category.
     * @param options The options in this category.
     */
    private renderCategoryOptions(options: SynthesisOption[], index: number): JSX.Element {
        let children: JSX.Element[] = []
        children.push(...this.renderOptions(options, index))
        return <div className='category-options'>{...children}</div>
    }

    /**
     * Renders the layout options. Returns undefined if there are no options to render.
     * @param layoutOptions The layout options to display.
     */
    private renderLayoutOptions(layoutOptions: LayoutOptionUIData[]): JSX.Element | undefined {
        let children: JSX.Element[] = []
        layoutOptions.forEach(option => {
            children.push(this.renderLayoutOption(option))
        })
        if (children.length === 0) {
            return undefined
        } else {
            return <div key='layoutOptions'>
                <p className='diagram-option separator'>{'Layout Options'}</p>
                {...children}
            </div>
        }
    }

    /**
     * Renders a single layout option.
     * @param layoutOption The layout option to render.
     */
    private renderLayoutOption(layoutOptionUIData: LayoutOptionUIData): JSX.Element {
        switch (layoutOptionUIData.type) { // TODO: implement the other cases, if neccessary.
            case Type.INT:
            case Type.DOUBLE: {
                return this.renderNumber(layoutOptionUIData)
            }
            case Type.BOOLEAN: {
                return this.renderBoolean(layoutOptionUIData)
            }
            case Type.ENUM: {
                return this.renderEnum(layoutOptionUIData)
            }
            default: {
                return <p>{'This option type is not supported: ' + layoutOptionUIData.type}</p>
            }
        }
    }

    /**
     * Renders a layout option for INT or DOUBLE type as an HTML input of type range slider.
     * @param option The layout option to render.
     */
    private renderNumber(option: LayoutOptionUIData): JSX.Element {
        if (option.currentValue === undefined) {
            option.currentValue = option.defaultValue.k
        }
        return <div key={option.optionId} title={option.description} className='diagram-option'>
            <label htmlFor={option.name}>{option.name}: {option.currentValue}</label>
            <input
                type='range'
                id={option.optionId}
                name={option.name}
                min={option.minValue}
                max={option.maxValue}
                value={option.currentValue}
                step={option.type === Type.INT ? 1 : 0.01}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    option.currentValue = event.currentTarget.value
                    this.onLayoutOption(option.optionId, option.currentValue)
                    this.update()
                }}
            />
        </div>
    }

    /**
     * Renders a layout option for BOOLEAN type as an HTML checkbox.
     * @param option The layout option to render.
     */
    private renderBoolean(option: LayoutOptionUIData): JSX.Element {
        if (option.currentValue === undefined) {
            option.currentValue = option.defaultValue.k
        }
        return <div key={option.optionId} title={option.description} className='diagram-option'>
            <label htmlFor={option.name}>
                <input
                    className='diagram-inputbox'
                    type='checkbox'
                    id={option.optionId}
                    name={option.name}
                    defaultChecked={option.currentValue}
                    onClick={(event: React.MouseEvent<HTMLInputElement>) => {
                        option.currentValue = event.currentTarget.checked
                        this.onLayoutOption(option.optionId, option.currentValue)
                    }}
                />
                {option.name}
            </label>
        </div>
    }

    /**
     * Renders an enum layout option as an HTML fieldset with multiple radio buttons.
     * @param option The enum layout option to render.
     */
    private renderEnum(option: LayoutOptionUIData): JSX.Element {
        const values: number[] = option.availableValues.k
        const readableValues = option.availableValues.v
        const initialValue = option.defaultValue.v
        const children: JSX.Element[] = []
        values.forEach((value, index) => {
            const readableValue = readableValues[index]
            children.push(this.renderEnumValue(value, readableValue, initialValue === readableValue, option))
        });
        return <div key={option.optionId} title={option.description} className='diagram-option-choice'>
            <legend className='diagram-option'>{option.name}</legend>
            {...children}
        </div>
    }

    /**
     * Renders a radio button input for an enum layout option.
     * @param value The value of the enum.
     * @param readableValue The human readable representation of the enum.
     * @param initialValue If this is the initial value.
     * @param option The option this radio button belongs to.
     */
    private renderEnumValue(value: number, readableValue: string, initialValue: boolean, option: LayoutOptionUIData): JSX.Element {
        return <div key={option.optionId + value} className='diagram-option'>
            <label htmlFor={readableValue}>
                <input
                    type='radio'
                    id={readableValue}
                    name={option.name}
                    defaultChecked={initialValue}
                    onClick={e => this.onLayoutOption(option.optionId, value)}
                />
                {readableValue}
            </label>
        </div>
    }

    /**
     * Called whenever a layout option has been clicked with a new value. Updates the option that belongs to this event.
     * @param optionId The identifier of the layout option connected to this event.
     * @param value The value that is clicked.
     */
    private onLayoutOption(optionId: string, value: any) {
        this.sendNewLayoutOption(optionId, value)
    }

    onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg)
        // Always update the view on activate.
        this.onUpdateRequest(msg)
    }

    protected readonly onSendNewSynthesisOptionEmitter = new Emitter<SynthesisOption>()

    /**
     * Emit when a synthesis option has been changed.
     */
    readonly onSendNewSynthesisOption: Event<SynthesisOption> = this.onSendNewSynthesisOptionEmitter.event

    /**
     * Call this when a synthesis option changed and that should be communicated to other listening methods.
     * @param option The synthesis option that has changed.
     */
    public sendNewSynthesisOption(option: SynthesisOption): void {
        this.onSendNewSynthesisOptionEmitter.fire(option)
    }

    protected readonly onSendNewRenderOptionEmitter = new Emitter<RenderOption>()

    /**
     * Emit when a render option has been changed.
     */
    readonly onSendNewRenderOption: Event<RenderOption> = this.onSendNewRenderOptionEmitter.event

    /**
     * Call this when a render option changed and that should be communicated to other listening methods.
     * @param option The render option that has changed.
     */
    public sendNewRenderOption(option: RenderOption): void {
        this.onSendNewRenderOptionEmitter.fire(option)
    }

    protected readonly onSendNewLayoutOptionEmitter = new Emitter<LayoutOptionValue>()

    /**
     * Emit when a layout option has been changed.
     */
    readonly onSendNewLayoutOption: Event<LayoutOptionValue> = this.onSendNewLayoutOptionEmitter.event

    /**
     * Call this when a layout option changed and that should be communicated to other listening methods.
     * @param optionId The id of the option that has changed.
     * @param value The new value of the option.
     */
    public sendNewLayoutOption(optionId: string, value: any): void {
        this.onSendNewLayoutOptionEmitter.fire({optionId, value})
    }


    protected readonly onSendNewActionEmitter = new Emitter<string>()

    /**
     * Emit when an action has been issued.
     */
    readonly onSendNewAction: Event<string> = this.onSendNewActionEmitter.event

    /**
     * Call this when an action is issued and that should be communicated to other listening methods.
     * @param optionId The id of the option that has changed.
     */
    public sendNewAction(optionId: string): void {
        this.onSendNewActionEmitter.fire(optionId)
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