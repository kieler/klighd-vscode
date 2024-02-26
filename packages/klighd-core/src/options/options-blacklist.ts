/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
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

// Blacklist all options not working yet in KLighD or not working at all yet. They are the following:
// SCCharts:
// - causal dataflow de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CHECK14433073
// - initially collapse regions updates the view and collapses/expands all regions de.cau.cs.kieler.sccharts.ui.synthesis.hooks.ExpandCollapseHook.CHECK-1902441701
// - Adaptive Zoom de.cau.cs.kieler.sccharts.ui.synthesis.AdaptiveZoom.CHECK-1237943491
// - Editor Context Collapse (getContextViewer in SprottyViewer not yet implemented)
// - SCG Dependencies (?)
// - Turning off KlayLayered (Pops up a new window in KIELER to specify the algorithm path) de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CHECK-857562601
// - Label Management does nothing de.cau.cs.kieler.sccharts.ui.synthesis.hooks.LabelShorteningHook.CHOICE2065322287
// KGraph text:
// - Suppress Edge Adjustments de.cau.cs.kieler.graphs.klighd.syntheses.KGraphDiagramSynthesis.CHECK-1675366116
// - Label shortening Strategy (Probably label manager) de.cau.cs.kieler.graphs.klighd.syntheses.AbstractStyledDiagramSynthesis.CHOICE577556810
// - Shortening width de.cau.cs.kieler.sccharts.ui.synthesis.hooks.LabelShorteningHook.RANGE-230395005
// SCG:
// - Show only dependencies of selected elements (because selection is not yet implemented to be transferred to klighd)
// de.cau.cs.kieler.scg.klighd.SCGraphSynthesisOptions.CHECK-496527882
// - Adaptive Zoom (klighd does not know the zoom level / sprotty does not know the zoom constraints, no property for that in the KText elements,
// de.cau.cs.kieler.klighd.visibilityScaleLowerBound as a property of the parent KGraphElement needs to be transferred to the client and considered there.)
// de.cau.cs.kieler.scg.klighd.SCGraphSynthesisOptions.CHECK-1237943491
// - All options under 'Priority' (?):
// NodePriorityActions.SHOW_NODE_PRIORITY,
// ThreadPriorityActions.SHOW_THREAD_PRIO, de.cau.cs.kieler.scg.klighd.actions.ThreadPriorityActions.CHECK1258957970
// PrioStatementsActions.SHOW_PRIO_STATEMENTS, de.cau.cs.kieler.scg.klighd.actions.PrioStatementsActions.CHECK381278432
// OptNodePrioActions.SHOW_OPT_PRIO_ID, de.cau.cs.kieler.scg.klighd.actions.OptNodePrioActions.CHECK248433877
// SCCActions.SHOW_SCC, de.cau.cs.kieler.scg.klighd.actions.SCCActions.CHECK-1808403223
//
// EObjectFallback:
// - Expand all Details (?) de.cau.cs.kieler.klighd.ide.syntheses.EObjectFallbackSynthesis.CHECK2018483773

/** List of option-ids that are currently not supported and therefore should not be displayed. */
export const optionsBlacklist = [
    'de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CHECK14433073',
    'de.cau.cs.kieler.sccharts.ui.synthesis.hooks.ExpandCollapseHook.CHECK-1902441701',
    'de.cau.cs.kieler.sccharts.ui.synthesis.AdaptiveZoom.CHECK-1237943491',
    'de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CHECK-857562601',
    'de.cau.cs.kieler.graphs.klighd.syntheses.KGraphDiagramSynthesis.CHECK-1675366116',
    'de.cau.cs.kieler.graphs.klighd.syntheses.AbstractStyledDiagramSynthesis.CHOICE577556810',
    'de.cau.cs.kieler.scg.klighd.SCGraphSynthesisOptions.CHECK-496527882',
    'de.cau.cs.kieler.scg.klighd.SCGraphSynthesisOptions.CHECK-1237943491',
    'de.cau.cs.kieler.scg.klighd.actions.ThreadPriorityActions.CHECK1258957970',
    'de.cau.cs.kieler.scg.klighd.actions.PrioStatementsActions.CHECK381278432',
    'de.cau.cs.kieler.scg.klighd.actions.OptNodePrioActions.CHECK248433877',
    'de.cau.cs.kieler.scg.klighd.actions.SCCActions.CHECK-1808403223',
    'de.cau.cs.kieler.klighd.ide.syntheses.EObjectFallbackSynthesis.CHECK2018483773',
]
