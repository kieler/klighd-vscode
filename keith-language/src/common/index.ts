/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018-2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { LanguageDescription } from "../browser/registration-contribution"

/**
 * Used in the KeithLanguageClientContribution and KeithLanguageServerContribution to identify the LS
 */
export const LS_ID = "keith"
/**
 * Used in the KeithLanguageClientContribution and KeithLanguageServerContribution to name the LS
 */
export const LS_NAME = "Keith"

/**
 * Language register, holds all languages that are supported by KEITH
 */
export const languageDescriptions: LanguageDescription[] = [
    {id: "sctx", name: "SCCharts"},
    {id: "scl", name: "SCL"},
    {id: "kgt", name: "KGraph"},
    {id: "strl", name: "Estrel"},
    {id: "lus", name: "Lustre"},
    {id: "kext", name: "KExt"},
    {id: "anno", name: "Annotations"},
    {id: "sctx", name: "SCCharts"},
    {id: "elkt", name: "Elk Graph"},
    {id: "kviz", name: "Kieler Visualization"},
]