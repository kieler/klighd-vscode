/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2024 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { inject, injectable } from 'inversify'
import { Anchor, isSelected, TYPES, DiagramServerProxy, IContextMenuService, MenuItem } from 'sprotty'
import { Action, Point } from 'sprotty-protocol'

/**
 * Main class to display the contextmenu
 */
@injectable()
export class ContextMenueProvider implements IContextMenuService {
    /**
     * Ideally we would use the ActionHandler to send messages
     * However since we can not know what actions / messages the server provides prior to receiving them,
     * here we have no registered action handler for the messages received.
     * For this reason we directly use the proxy to send actions to the server.
     */
    @inject(TYPES.ModelSource) protected serverProxy: DiagramServerProxy

    /**
     * ID used to find the contextmenu
     */
    protected contextmenuID = 'contextMenu'

    /**
     * If the contextmenu should be hidden and there was a hide method provided.
     */
    protected onHide: any

    // Static variables to communicate with the MouseListener responsible to draw the edge when selecting things.

    /**
     * Enables the drawing
     */
    static enableMouseTargeting: boolean

    /**
     * Defines the start position from which the line should show

     */
    static startPos: Point | undefined

    /**
     * Determines if a source or target should be selected to reverse the edge
     */
    static selectSource: boolean

    /**
     * When the mouse listener is done it will fill this field with the id of the selected element
     */
    static destination: string | undefined

    static selected_field_name: string

    show(items: MenuItem[], anchor: Anchor, onHide?: () => void): void // root: SModelRoot, anchor: Anchor, onHide?: (() => void) | undefined): void {
        // Since somthing is selected it has a root and the root holds the information if structured programming is supported
        //If its not supported or disabled we do nothing
        const selected = Array.from(root.index.all().filter(isSelected))
        if (
            !(selected[0].root.children[0] as any).properties['klighd.showContextmenu'] ||
            (selected[0].root.children[0] as any).properties['klighd.showContextmenu'] == undefined
        ) {
            return
        }

        //If no menu exists we want to create one
        let menu = document.getElementById(this.contextmenuID)
        // creates the contextmenu and makes it style fit vscodes style
        menu = document.createElement('ul')
        if (menu) {
            menu.id = this.contextmenuID
            this.setupMenuEntrys(menu)
            menu.style.marginTop = '-1px'
            menu.style.marginLeft = '-1px'
            menu.style.backgroundColor = '#f4f5f6'
            menu.style.border = '2px solid #bfc2c3'

            //If the context menu is leaved and there is no button ie no subbmit option we want to hide the contextmenu
            //the subbmit button is only shown if we already selected a contextmenu option and are requested to input some info
            //at that point the menu should only hide if we click outside the box or zoom in
            menu.addEventListener('mouseleave', () => {
                if (menu != undefined && document.getElementById('button') == null) {
                    ContextMenueProvider.enableMouseTargeting = false
                    menu.style.display = 'none'
                }
                if (this.onHide != undefined) this.onHide()
            })
            //if we zoom in we hide the menu
            menu.addEventListener('wheel', () => {
                ContextMenueProvider.enableMouseTargeting = false
                if (menu != undefined) menu.style.display = 'none'
                if (this.onHide != undefined) this.onHide()
            })
            //if we clickoutside while there is supposed to be some input from the user we close the contextmenu
            document.addEventListener('click', (ev) => {
                const ctx = document.querySelector('#' + this.contextmenuID)
                if (ctx !== null && !ev.composedPath().includes(ctx) && !ContextMenueProvider.enableMouseTargeting) {
                    menu!.innerHTML = ''
                }
                if (this.onHide != undefined) this.onHide()
            })

            //dom manipulation to add the contextmenu box. This only happens in vscode since the id is another in the browser ("sprotty")
            let sprotty
            if ((sprotty = document.getElementById('keith-diagram_sprotty')) != null) sprotty.appendChild(menu)
            else return
        }
        //if a contextmenu was opened before there may be items in it therefor we reset it here
        menu.innerHTML = ''
        menu.style.backgroundColor = '#f4f5f6'

        //Those are the options provided by the server
        const options: StructuralEditingOptions = (selected[0].root.children[0] as any).properties[
            'klighd.StructuralEditingOptions'
        ]

        //we want different behavior if have selected multible elements
        if (selected.length == 1) {
            let structuredEditMesages: StructuredEditMsg[] = []
            //we need to filter the options from the server to match the tag the selected node has
            for (const prop of (selected[0] as any).properties['de.cau.cs.kieler.klighd.semanticFilter.tags']) {
                if (options.options[(prop as Property).tag] !== undefined)
                    structuredEditMesages = structuredEditMesages.concat(options.options[(prop as Property).tag])
            }
            //for every structured change we can do we want to display it to the user
            for (const msg of structuredEditMesages) {
                //Create an item to add to the menu via dom manipulation
                const new_item = document.createElement('li')
                this.setupItemEntrys(new_item)
                new_item.innerText = msg.label //label is shown to the user
                new_item.id = msg.kind

                // simple mouselisteners so the color changes to indicate what is selected
                new_item.addEventListener('mouseenter', (ev) => {
                    new_item.style.backgroundColor = '#bae5dd'
                    new_item.style.border = '1px solid #40c2a8'
                    new_item.style.borderRadius = '5px'
                })
                new_item.addEventListener('mouseleave', (ev) => {
                    new_item.style.backgroundColor = '#f4f5f6'
                    new_item.style.border = ''
                    new_item.style.borderRadius = ''
                })

                // main mouseaction if pressed the contextmenu item is selected and we want to do somthing based on the
                // required inputs for the action we selected
                new_item.addEventListener('mousedown', (ev) => {
                    //creates an action to later send to the server
                    const action: NewServerActionMsg = NewServerActionMsg.create(msg.kind)
                    //the selected elements id should always be send to the server
                    action.id = selected[0].id

                    //if no inputs are required we simply send the message to the server using the server proxy
                    if (msg.inputs.length == 0) {
                        menu!.style.display = 'none'
                        this.serverProxy.handle(action)
                        return
                    }

                    //the old contents of the contextmenu can be forgotten since a item was selected
                    menu!.innerHTML = ''

                    menu!.style.backgroundColor = '#f4f5f6'

                    menu!.style.border = '1px solid #c4c7c8'

                    //make a input field for the user to enter information
                    //form can be filled later using dom manipulation
                    const fieldset = document.createElement('form')
                    fieldset.id = 'form'
                    this.setupHeaderEntrys(fieldset)
                    let hasSelect = false // since selecting target / source is done prior to displaying the form we need to wait for those actions

                    //for every input required by the msg we want to do things depending on the input type
                    for (const field of msg.inputs) {
                        switch (field.type_of_Input) {
                            case 'String': {
                                //Simplest type since we just need the label which explaines the field and a input field where new info can be added

                                const label = document.createElement('label')
                                label.innerText = field.label

                                const input_field = document.createElement('input')
                                input_field.id = field.field
                                //adds the label and input to the dom with newlines between them
                                fieldset.appendChild(label)
                                fieldset.appendChild(document.createElement('br'))
                                fieldset.appendChild(input_field)
                                fieldset.appendChild(document.createElement('br'))

                                //if we hit enter while in an input field we want to sibmit the changes and thus send them to the server
                                input_field.addEventListener('keydown', (event) => {
                                    if (event.key === 'Enter') {
                                        document.getElementById('button')!.click()
                                        event.preventDefault()
                                    }
                                })

                                break
                            }
                            case 'SelectTarget': {
                                //select target and select source behave similar
                                //we enable the targeting mouselistener store the information for later fields in a static variable
                                //and set a flag for later that we want to select somthing
                                ContextMenueProvider.selected_field_name = field.field
                                hasSelect = true
                                ContextMenueProvider.destination = undefined
                                ContextMenueProvider.enableMouseTargeting = true
                                ContextMenueProvider.startPos = anchor
                                ContextMenueProvider.selectSource = false
                                break
                            }
                            case 'SelectSource': {
                                ContextMenueProvider.selected_field_name = field.field
                                hasSelect = true
                                ContextMenueProvider.destination = undefined
                                ContextMenueProvider.enableMouseTargeting = true
                                ContextMenueProvider.startPos = anchor
                                ContextMenueProvider.selectSource = true
                                break
                            }
                        }
                    }
                    ev.preventDefault()
                    //if we have a select action first we want wait till somthing was selected afterwards
                    // we want to display the field with the remaining inputs to the user
                    if (hasSelect) {
                        ;(async () => {
                            while (
                                ContextMenueProvider.destination === undefined ||
                                ContextMenueProvider.enableMouseTargeting == true
                            )
                                // define the condition as you like
                                await new Promise((resolve) => setTimeout(resolve, 1000))
                            //fill the action with the selected id for the corresponding fieldname
                            action[ContextMenueProvider.selected_field_name] = ContextMenueProvider.destination
                            this.menuDisplayButtonAndSelectedMenu(menu!, fieldset, action)
                        })()
                    } else {
                        //if we had no select action we simply want to display the fieldset to the user
                        this.menuDisplayButtonAndSelectedMenu(menu!, fieldset, action)
                    }
                })
                //actually appends the items to the context menu
                menu.appendChild(new_item)
            }
        }
        //Displays the contextmenu
        menu.style.display = 'block'
        this.onHide = onHide

        //Positioning of the context menu
        menu.style.left = anchor.x.toString() + 'px'
        menu.style.top = anchor.y.toString() + 'px'

        const window_height = menu.parentElement!.offsetHeight
        const window_width = menu.parentElement!.offsetWidth
        //if the contextmenu would be partially outside the view we need to relocate it so it fits inside
        if (menu.offsetHeight + menu.offsetTop > window_height)
            menu.style.top = (window_height - menu.offsetHeight).toString() + 'px'

        if (menu.offsetWidth + menu.offsetLeft > window_width)
            menu.style.left = (window_width - menu.offsetWidth).toString() + 'px'
    }

    //called when a item was selected and the field for inputs should be displayed to the user the action has the id and kind already and is supposed to be
    //send once the submit button is hit.
    menuDisplayButtonAndSelectedMenu(menu: HTMLElement, fieldset: HTMLElement, action: NewServerActionMsg) {
        menu?.appendChild(fieldset)
        const field = document.getElementById('form')!
        //there is nothing to be done here so simply send the action
        if (field.childNodes.length === 0) {
            this.serverProxy.handle(action)
            menu!.style.display = 'none'

            ContextMenueProvider.enableMouseTargeting = false
            return
        }

        //creates the button for submitting changes
        const button = document.createElement('button')
        button.id = 'button'
        button.innerText = 'Submit'
        button.style.left = '50%'
        button.style.transform = 'translateX(-50%)'
        button.style.position = 'relative'

        //in case the button was clicked we want to extract the input values from the html box and add it to the action
        button.addEventListener(
            'click',
            (ev) => {
                for (const f of Array.prototype.slice.call(field.childNodes)) {
                    if (f instanceof HTMLInputElement) {
                        action[f.id] = f.value
                    }
                }
                //sends the action to the server
                this.serverProxy.handle(action)
                menu!.style.display = 'none'

                ContextMenueProvider.enableMouseTargeting = false
            },
            false
        )

        menu?.appendChild(button)

        //sets the focus to the first input field in the created box
        const id = menu?.children.item(0)!.id
        document.getElementById(document.getElementById(id!)!.children.item(2)!.id)?.focus()
    }

    //simple helperfunktions to setup the css for specific elements
    setupHeaderEntrys(item: HTMLElement): void {
        item.style.display = 'block'
        item.style.backgroundColor = '#f4f5f6'
        item.style.position = 'relative'
        item.style.border = '2px solid #bfc2c3'
    }

    setupItemEntrys(item: HTMLElement): void {
        item.style.display = 'block'
        item.style.backgroundColor = '#f4f5f6'
        item.style.position = 'relative'
        item.style.padding = '5px'
    }

    setupMenuEntrys(menu: HTMLElement): void {
        menu.style.float = 'right'
        menu.style.position = 'absolute'
        menu.style.listStyle = 'none'
        menu.style.padding = '0'
        menu.style.display = 'none'
        menu.style.color = '#3e4144'
    }
}

//structure given by the server
//basically a map where each key is a tag and the values are the supported messages for that tag
interface StructuralEditingOptions {
    options: Record<string, StructuredEditMsg[]>
}

//messages recived from server correspond to contextmenu entrys
interface StructuredEditMsg {
    label: string // displayed in the contextmenu
    kind: string //kind of action to send to the server if this item was selected in the contextmenu
    mergable: boolean //if the action can be used with multiple selected elements
    inputs: InputType[] //the required inputs if the item was selected
}
//structure for any input action required by the server
class InputType {
    field: string //fields name on the server ie the action should have a field with this name

    type_of_Input: string //may be string, selecttarget, selectsource

    label: string //label that is shown to the user in case of string inputs to explain what input is required
}

class Property {
    tag: string
}

/**
 * Message interface to be send to the server.
 * Can hold any number of keys but is not registered at any action handler since the kind is not known prior to creation
 */
export interface NewServerActionMsg extends Action {
    kind: typeof NewServerActionMsg.KIND
    [key: string]: any //allows for any key to be added to the action (action[xyz] = "")
}

export namespace NewServerActionMsg {
    export let KIND: string

    export function create(kind: string): NewServerActionMsg {
        return {
            kind: (KIND = kind),
        }
    }
}
