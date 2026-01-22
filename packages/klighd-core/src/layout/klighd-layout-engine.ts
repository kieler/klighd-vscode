/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2026 by
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

import { injectable } from 'inversify'
import {
    ElkFactory,
    ElkLayoutEngine,
    IElementFilter,
    ILayoutConfigurator,
    ILayoutPostprocessor,
    ILayoutPreprocessor,
} from 'sprotty-elk'
import { SGraph, SModelIndex } from 'sprotty-protocol'

export class KlighdLayoutEnginePlain extends ElkLayoutEngine {
    constructor(
        elkFactory: ElkFactory,
        protected readonly filter: IElementFilter,
        protected readonly configurator: ILayoutConfigurator,
        protected readonly preprocessor?: ILayoutPreprocessor,
        protected readonly postprocessor?: ILayoutPostprocessor
    ) {
        super(elkFactory, filter, configurator, preprocessor, postprocessor)
    }

    layout(sgraph: SGraph, index?: SModelIndex): SGraph | Promise<SGraph> {
        if (this.getBasicType(sgraph) !== 'graph') {
            return sgraph
        }
        if (!index) {
            index = new SModelIndex()
            index.add(sgraph)
        }

        // STEP 1: Transform the Sprotty graph into an ELK graph with optional pre-processing
        const elkGraph = this.transformGraph(sgraph, index)
        if (this.preprocessor) {
            this.preprocessor.preprocess(elkGraph, sgraph, index)
        }

        // STEP 2: Invoke the ELK layout engine
        return this.elk.layout(elkGraph).then((result) => {
            // STEP 3: Apply the results with optional post-processing to the original graph
            this.applyLayout(result, index!)
            if (this.postprocessor) {
                this.postprocessor.postprocess(result, sgraph, index!)
            }
            return sgraph
        })
    }
}

export const KlighdLayoutEngine: typeof KlighdLayoutEnginePlain = injectable()(KlighdLayoutEnginePlain)
