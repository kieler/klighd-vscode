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

import { GettingStartedContribution } from '@theia/getting-started/lib/browser/getting-started-contribution';
import { injectable, inject } from 'inversify';
import { Command, CommandRegistry, MessageService } from '@theia/core';
import { Workspace } from '@theia/languages/lib/browser';
import { FileSystem, FileSystemUtils, FileStat } from '@theia/filesystem/lib/common';
import URI from '@theia/core/lib/common/uri';
import { OpenerService, FrontendApplication } from '@theia/core/lib/browser';
import { open } from '@theia/core/lib/browser/opener-service';

export const OPEN_EXAMPLE_SCCHART: Command = {
    id: 'open-example-scchart',
    label: 'Open example SCChart',
    category: 'Keith'
}

@injectable()
export class KeithGettingStartedContribution extends GettingStartedContribution {

    @inject(Workspace) protected readonly workspace: Workspace
    @inject(FileSystem) protected readonly fileSystem: FileSystem
    @inject(OpenerService) protected readonly openerService: OpenerService
    @inject(MessageService) protected readonly messageService: MessageService

    async onStart(app: FrontendApplication): Promise<void> {
        if (!this.workspaceService.opened) {
            this.stateService.reachedState('ready').then(
                () => this.openView({ reveal: true })
            );
        }
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(OPEN_EXAMPLE_SCCHART, {
            execute: async () => {
                const rootUri = this.workspace.rootUri
                if (rootUri) {
                    const parent: FileStat | undefined = await this.fileSystem.getFileStat(rootUri)
                    if (parent !== undefined) {
                        // Generate a unique file with preferred name Abro.sctx, if this name is taken it will be Abro_2.sctx, ...
                        const fileUri = FileSystemUtils.generateUniqueResourceURI(new URI(parent.uri), parent, 'Abro', '.sctx');
                        await this.fileSystem.createFile(fileUri.toString(), { content: this.abroText})
                        // Open the created file
                        await open(this.openerService, fileUri)
                        // Magic string ahead!!
                        // This opens the diagram widget.
                        registry.executeCommand('diagram.open')
                    } else {
                        this.messageService.error("There seems to be a problem with the created workspace.")
                    }
                } else {
                    this.messageService.error("No workspace was opened. Aborting")
                }
            },
            isVisible: () => false
        })
    }

    // TODO complete the documentation.
    abroText = `scchart ABRO {
	input bool A, B, R
	output bool O
	region {
		initial state ABO {
			entry do O = false

			initial state WaitAB {
				region handleA {
					initial state wA
					if A go to dA

					final state dA
				}

				region handleB {
					initial state wB
					if B go to dB

					final state dB
				}
			}
			do O = true join to done

		state done
		}
		if R abort to ABO
	}
}`

}