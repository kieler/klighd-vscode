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

import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';
import * as React from 'react'
import { OPEN_EXAMPLE_SCCHART } from './keith-getting-started-contribution';

 export class KeithGettingStartedWidget extends GettingStartedWidget {

    protected applicationName = 'KEITH';

    protected keithDocumentationUrl = 'https://rtsys.informatik.uni-kiel.de/confluence/display/KIELER/KEITH';

    protected runningKeithUrl = 'https://rtsys.informatik.uni-kiel.de/confluence/display/KIELER/Running+KEITH'

    protected developingForKeithUrl = 'https://rtsys.informatik.uni-kiel.de/confluence/display/KIELER/Developing+for+KEITH+or+LS'

    protected scchartsSyntaxPageUrl = 'https://rtsys.informatik.uni-kiel.de/confluence/display/KIELER/Syntax'

    render() {
        return <div className='gs-container'>
            {this.renderHeader()}
            <hr className='gs-hr' />
            <div className='flex-grid'>
                <div className='col'>
                    {this.renderOpen()}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {this.renderRecentWorkspaces()}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {this.renderSettings()}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {this.renderHelp()}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {this.renderTutorial()}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {this.renderVersion()}
                </div>
            </div>
        </div>;
    }

    renderTutorial(): React.ReactNode {
        return <div className='gs-section'>
        <h3 className='gs-section-header'><i className='fa fa-info-circle'></i>Tutorial</h3>
        <div className='gs-action-container'><a href='#' onClick={this.doOpenExampleSCChart}>Open example SCChart</a></div>
    </div>;
    }

    protected renderHeader(): React.ReactNode {
        return <div className='gs-header'>
            <h1>{this.applicationName}<span className='gs-sub-header'> Getting Started</span></h1>
        </div>;
    }



    protected renderHelp(): React.ReactNode {
        return <div className='gs-section'>
            <h3 className='gs-section-header'>
                <i className='fa fa-question-circle'></i>
                Help
            </h3>
            <div className='gs-action-container'>
                <a href={this.scchartsSyntaxPageUrl} target='_blank'>SCCharts Documentation</a>
            </div>
            <div className='gs-action-container'>
                <a href={this.keithDocumentationUrl} target='_blank'>KEITH Documentation</a>
            </div>
            <div className='gs-action-container'>
                <a href={this.runningKeithUrl} target='_blank'>Running KEITH (as a Developer)</a>
            </div>
            <div className='gs-action-container'>
                <a href={this.developingForKeithUrl} target='_blank'>Developing for KEITH or KIELER LS</a>
            </div>
        </div>;
    }

    protected doOpenExampleSCChart = () => this.commandRegistry.executeCommand(OPEN_EXAMPLE_SCCHART.id);

 }