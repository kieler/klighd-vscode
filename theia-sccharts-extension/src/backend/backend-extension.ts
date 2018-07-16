/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License") you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, ContainerModule } from "inversify";
import { BaseLanguageServerContribution, LanguageServerContribution, IConnection } from "@theia/languages/lib/node";
import { createSocketConnection } from 'vscode-ws-jsonrpc/lib/server'
import * as path from 'path';
import * as net from 'net'
import { Constants } from "../common/constants";


export default new ContainerModule(bind => {
    bind<LanguageServerContribution>(LanguageServerContribution).to(SCChartsContribution)
    bind<LanguageServerContribution>(LanguageServerContribution).to(Lang2Contribution)
    bind<LanguageServerContribution>(LanguageServerContribution).to(KExtContribution)
});

export const productLsPath:  string = './../../../../kieler/kieler';
export const debugLsPath: string = "./../../../../../../../../Documents/theia-sprotty-test/language-server-archive/semantics2_9_keybindings/kieler/kieler";

function getPort(): number | undefined {
    let arg = process.argv.filter(arg => arg.startsWith('--LSP_PORT='))[0]
    if (!arg) {
        return undefined
    } else {
        return Number.parseInt(arg.substring('--LSP_PORT='.length))
    }
}

@injectable()
class SCChartsContribution extends BaseLanguageServerContribution {

    readonly id = Constants.sctxId;
    readonly name = Constants.sctxName;

    start(clientConnection: IConnection): void {
        let socketPort = getPort();
        if (socketPort) {
            const socket = new net.Socket()
            const serverConnection = createSocketConnection(socket, socket, () => {
                socket.destroy()
            });
            this.forward(clientConnection, serverConnection)
            socket.connect(socketPort)
        } else {
            var lsPath
            let arg = process.argv.filter(arg => arg.startsWith('--root-dir='))[0]
            if (!arg) {
                lsPath = productLsPath
            } else {
                lsPath = debugLsPath
            }
            var command = path.resolve(__dirname, lsPath);
            console.log("starting ls " + command)
            console.log("Arguments: \n" + global.process.argv + "\n\n")
            console.log(path.resolve("~/Documents/theia-sprotty-test/language-server-archive/semantics2_9_keybindings/kieler/kieler"))
            console.log("\n\n\nCurrent directory is " + __dirname + " \n\n\n")
            const serverConnection = this.createProcessStreamConnection(command, []);
            this.forward(clientConnection, serverConnection);
            serverConnection.onClose(() => console.log("Connection closed"))
        }
    }

    protected onDidFailSpawnProcess(error: Error): void {
        super.onDidFailSpawnProcess(error);
        console.error("Error starting DSL language server.", error)
    }
}

@injectable()
class Lang2Contribution extends BaseLanguageServerContribution {

    readonly id = Constants.lang2Id;
    readonly name = Constants.lang2Name;

    start(clientConnection: IConnection): void {

        let socketPort = getPort();
        if (socketPort) {
            const socket = new net.Socket()
            const serverConnection = createSocketConnection(socket, socket, () => {
                socket.destroy()
            });
            this.forward(clientConnection, serverConnection)
            socket.connect(socketPort)
        } else {
            var lsPath
            let arg = process.argv.filter(arg => arg.startsWith('--root-dir='))[0]
            if (!arg) {
                lsPath = productLsPath
            } else {
                lsPath = debugLsPath
            }
            var command = path.resolve(__dirname, lsPath);
            console.log("\n\n\nCurrent directory is " + __dirname + " \n\n\n")
            const serverConnection = this.createProcessStreamConnection(command);
            this.forward(clientConnection, serverConnection);
        }
    }

    protected onDidFailSpawnProcess(error: Error): void {
        super.onDidFailSpawnProcess(error);
        console.error("Error starting DSL language server.", error)
    }
}


@injectable()
class KExtContribution extends BaseLanguageServerContribution {

    readonly id = Constants.lang3Id;
    readonly name = Constants.lang3Name;

    start(clientConnection: IConnection): void {

        let socketPort = getPort();
        if (socketPort) {
            const socket = new net.Socket()
            const serverConnection = createSocketConnection(socket, socket, () => {
                socket.destroy()
            });
            this.forward(clientConnection, serverConnection)
            socket.connect(socketPort)
        } else {
            var lsPath
            let arg = process.argv.filter(arg => arg.startsWith('--root-dir='))[0]
            if (!arg) {
                lsPath = productLsPath
            } else {
                lsPath = debugLsPath
            }
            var command = path.resolve(__dirname, lsPath);
            console.log("\n\n\nCurrent directory is " + __dirname + " \n\n\n")
            const serverConnection = this.createProcessStreamConnection(command);
            this.forward(clientConnection, serverConnection);
        }
    }

    protected onDidFailSpawnProcess(error: Error): void {
        super.onDidFailSpawnProcess(error);
        console.error("Error starting DSL language server.", error)
    }
}