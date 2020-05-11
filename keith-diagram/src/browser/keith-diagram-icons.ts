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

import { ThemeService } from '@theia/core/lib/browser/theming';

const dark = require('../../src/browser/style/variables-dark.useable.css');
const light = require('../../src/browser/style/variables-light.useable.css');

function updateTheme(): void {
    const theme = ThemeService.get().getCurrentTheme().id;
    if (theme === 'dark') {
        light.unuse();
        dark.use();
    } else if (theme === 'light') {
        dark.unuse();
        light.use();
    }
}

updateTheme();

ThemeService.get().onThemeChange(() => updateTheme());