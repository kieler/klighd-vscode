/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2026 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 * + and Scheidt & Bachmann System Technik GmbH, 24109 Melsdorf
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import fastifyStatic from '@fastify/static'
import fastifyWebsocket from '@fastify/websocket'
import { fastify, FastifyPluginAsync, FastifyInstance, LogController } from 'fastify'
import { join } from 'path'
import pinoPretty from 'pino-pretty'
import { connectToLanguageServer } from './ls-connection'

/** Options required by the {@link webSocketHandler} plugin. */
interface WebSocketOptions {
    lsPort?: number
    lsPath?: string
}

/** Fastify plugin that forwards incoming websocket connections to a language server. */
const webSocketHandler: FastifyPluginAsync<WebSocketOptions> = async (fastifyInstance, opts) => {
    await fastifyInstance.register(fastifyWebsocket)

    // Setup WebSocket handler
    fastifyInstance.get('/socket', { websocket: true }, (socket) => {
        // Connection established. Spawn a LS for the connection and stream messages
        connectToLanguageServer(socket, fastifyInstance.log, opts.lsPort, opts.lsPath)
    })
}

/// /////////////////////////////////////////////////////////////////////////////

/** Options required to create a server instance. */
interface SetupOptions extends WebSocketOptions {
    /**
     * Change the level for logged messages. Depending on the level certain messages
     * will not be logged. For example, choosing "warn" will not log info or debug messages.
     * If you want to disable logging, choose the level "silent".
     * @see https://github.com/pinojs/pino/blob/master/docs/api.md#loggerlevel-string-gettersetter
     */
    logging: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent'
}

/**
 * Creates and configures a [fastify](https://fastify.io/) server that is
 * able to serve the standalone view and forward websocket connections
 * to a language server.
 */
export function createServer(opts: SetupOptions): FastifyInstance {
    const server = fastify({
        logger: { level: opts.logging, stream: pinoPretty({ sync: true }) },
        logController: new LogController({ disableRequestLogging: true }),
    })

    // Serving static file for the website
    server.register(fastifyStatic, {
        // Web sources are bundled into the dist folder at the package root
        root: join(__dirname, '../dist'),
    })

    // Handling for incoming websocket requests
    server.register(webSocketHandler, opts)

    return server
}
