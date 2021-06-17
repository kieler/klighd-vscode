import { ServerStatusAction } from "sprotty";
import { VscodeDiagramWidget } from "sprotty-vscode-webview";
import { requestModel } from "klighd-core";

/**
 * Overwrite the VSCodeDiagramWidget to dispatch the RequestModelAction instead
 * of requesting it.
 * 
 * This is inline with the behavior of KEITH, where the LS expects an
 * requestModel notification instead of an request and produces a warning otherwise.
 */
export class KlighDDiagramWidget extends VscodeDiagramWidget {
    async requestModel(): Promise<void> {
        try {
            await requestModel(this.actionDispatcher, {
                sourceUri: this.diagramIdentifier.uri,
                diagramType: this.diagramIdentifier.diagramType,
            });
        } catch (err) {
            const status = new ServerStatusAction();
            status.message = err instanceof Error ? err.message : err.toString();
            status.severity = "FATAL";
            this.setStatus(status);
        }
    }
}
