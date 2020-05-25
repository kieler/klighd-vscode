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

 /**
  * The message type of the language server protocol to get new options.
  */
export const GET_OPTIONS = 'keith/diagramOptions/getOptions'

/**
 * The message type of the language server protocol extension to set new synthesis options.
 */
export const SET_SYNTHESIS_OPTIONS = 'keith/diagramOptions/setSynthesisOptions'

/**
 * The message type of the language server protocol extension to set new layout options.
 */
export const SET_LAYOUT_OPTIONS = 'keith/diagramOptions/setLayoutOptions'

/**
 * The message type of the language server protocol extension to perform an action.
 */
export const PERFORM_ACTION = 'keith/diagramOptions/performAction'

/**
 * The ID of the diagram options view widget
 */
export const diagramOptionsWidgetId = 'diagramoptions-view'

/**
 * Sprotty action message id.
 */
export const SPROTTY_ACTION = 'diagram/accept'