/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2026 by
 * + Scheidt & Bachmann System Technik GmbH, 24109 Melsdorf
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
// Replaces the @VERSION@ placeholder in the compiled lib/version.js with the package version.
const fs = require('fs')
const path = require('path')

const { version } = require('../package.json')

const versionFile = path.join(__dirname, '../lib/version.js')
const content = fs.readFileSync(versionFile, 'utf8')
fs.writeFileSync(versionFile, content.replace(/@VERSION@/g, version))
console.log(`Injected version ${version} into ${path.relative(process.cwd(), versionFile)}`)
