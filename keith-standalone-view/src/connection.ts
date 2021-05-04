import * as rpc from "vscode-ws-jsonrpc";
import * as lsp from "vscode-languageserver-protocol";
import { IConnection } from "@kieler/keith-sprotty/lib";
import { ActionMessage } from "sprotty";

const acceptMessageType = new rpc.NotificationType<ActionMessage, void>(
  "diagram/accept"
);

/**
 * Connection to the language server.
 *
 * Inspired by
 * [this implementation](https://github.com/wylieconlon/lsp-editor-adapter/blob/master/src/ws-connection.ts).
 */
export class LSPConnection implements IConnection {
  private socket?: WebSocket;
  private connection?: rpc.MessageConnection;
  private messageHandlers: ((message: ActionMessage) => void)[] = [];

  sendMessage(message: ActionMessage): void {
    this.connection?.sendNotification(acceptMessageType, message);
  }

  onMessageReceived(handler: (message: ActionMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  private notifyHandlers(message: ActionMessage) {
    for (const handler of this.messageHandlers) {
      handler(message);
    }
  }

  connect(websocketUrl: string): Promise<this> {
    // The WebSocket has created in place! Passing it as a parameter might lead
    // to a race-condition where the socket is opened, before vscode-ws-jsonrpc
    // starts to listen. This causes the connection to not work.
    return new Promise((resolve) => {
      const socket = new WebSocket(websocketUrl);
      this.socket = socket;
      console.log("Connecting to language server.");

      rpc.listen({
        webSocket: socket,
        logger: new rpc.ConsoleLogger(),
        onConnection: (conn) => {
          conn.listen();
          conn.inspect();
          console.log("Connected to language server.");
          this.connection = conn;

          this.connection.onError((e) => {
            console.error(e);
          });

          this.connection.onClose(() => {
            this.connection = undefined;
            this.socket = undefined;
          });

          this.connection.onNotification(
            acceptMessageType,
            this.notifyHandlers.bind(this)
          );

          resolve(this);
        },
      });
    });
  }

  close() {
    this.connection?.dispose();
    this.connection = undefined;

    this.socket?.close();
  }

  /**
   * Initializes the connection according to the LSP specification.
   * @see
   */
  async sendInitialize() {
    if (!this.connection) return;

    const method = lsp.InitializeRequest.type.method;
    const initParams: lsp.InitializeParams = {
      processId: null,
      workspaceFolders: null,
      rootUri: null,
      clientInfo: { name: "webview" },
      capabilities: {},
      initializationOptions: {
        clientDiagramOptions: {
          render: { "show-constraints": false },
          synthesis: {
            "de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CATEGORY-438835660": true,
            "de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CATEGORY-1214423815": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CATEGORY-2025855158": true,
            "de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CATEGORY-504784764": true,
            "de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CHECK1520377476": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CHECK-857562601": true,
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.LabelShorteningHook.CHOICE2065322287":
              "Original Labels",
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.LayoutHook.CHOICE1041377119":
              "HV",
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.BlackWhiteModeHook.CHECK605821231": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.HideAnnotationHook.CHECK-2114928004": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CATEGORY928052554": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.PolicySynthesis.CHECK611538288": true,
            "de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CATEGORY1854238712": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.DataflowRegionSynthesis.CHECK-727505055": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.StateActionsHook.CHECK-873394278": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.LabelShorteningHook.RANGE-230395005":
              "270",
            "de.cau.cs.kieler.sccharts.ui.synthesis.AdaptiveZoom.CHECK-1237943491": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.LabelPlacementSideHook.CHOICE284809027":
              "Consistent side",
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.StateActionsHook.CHECK-2046341074": true,
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.LocalDeclarationsHook.CHECK471261454": true,
            "de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CHECK-2145070736": true,
            "de.cau.cs.kieler.sccharts.ui.synthesis.EquationSynthesis.CHECK321613575": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.EquationSynthesis.CHECK473531924": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.EquationSynthesis.CHECK-2122637839": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.EquationSynthesis.CHECK-812816818": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.EquationSynthesis.CHECK1969682858": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.ActionsAsDataflowHook.CHECK-1951201949": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.ShowStateDependencyHook.CHECK418094715": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.ShowAnnotationsHook.CHECK-1848878463": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CHECK14433073": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.InducedDataflowHook.CHECK1192599980": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.ExpandCollapseHook.CHECK-1902441701": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.ExpandCollapseHook.CHECK-3391608": false,
            "de.cau.cs.kieler.sccharts.ui.synthesis.hooks.actions.MemorizingExpandCollapseAction.CHECK1798750659": true,
            "de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CHECK-1446408673": false,
            "de.cau.cs.kieler.graphs.klighd.syntheses.AbstractStyledDiagramSynthesis.CHOICE80227729":
              "Boring",
            "de.cau.cs.kieler.graphs.klighd.syntheses.AbstractStyledDiagramSynthesis.CHOICE577556810":
              "Truncate",
            "de.cau.cs.kieler.graphs.klighd.syntheses.ElkGraphDiagramSynthesis.CHECK1714799860": true,
            "de.cau.cs.kieler.graphs.klighd.syntheses.ElkGraphDiagramSynthesis.CHECK1410680797": true,
            "de.cau.cs.kieler.graphs.klighd.syntheses.ElkGraphDiagramSynthesis.CHECK378967091": false,
            "de.cau.cs.kieler.graphs.klighd.syntheses.ElkGraphDiagramSynthesis.CATEGORY1437626306": true,
            "de.cau.cs.kieler.graphs.klighd.syntheses.ElkGraphDiagramSynthesis.CHOICE203465303":
              "Simple",
            "de.cau.cs.kieler.graphs.klighd.syntheses.ElkGraphDiagramSynthesis.CHOICE-1071157120":
              "Solid backgrounds",
            "de.cau.cs.kieler.graphs.klighd.syntheses.ElkGraphDiagramSynthesis.CHECK696767334": false,
            "de.cau.cs.kieler.graphs.klighd.syntheses.ElkGraphDiagramSynthesis.CHECK-674497877": false,
            "de.cau.cs.kieler.graphs.klighd.syntheses.ElkGraphDiagramSynthesis.CHECK-1345429378": false,
            "de.cau.cs.kieler.graphs.klighd.syntheses.ElkGraphDiagramSynthesis.CHECK-1822597353": true,
            "de.cau.cs.kieler.sccharts.ui.synthesis.GeneralSynthesisOptions.CHECK305112564": true,
          },
        },
      },
    };

    console.log("initialize LSP.");
    await this.connection.sendRequest(method, initParams);
    this.connection.sendNotification(lsp.InitializedNotification.type.method);
    console.log("initialized LSP.");
  }

  /**
   * Notifies the connected language server about an opened document.
   * @param sourceUri Valid our for the document. See the LSP for more information.
   * @param languageId Id of the language inside the document.
   */
  sendDocumentDidOpen(sourceUri: string, languageId: string) {
    const method = lsp.DidOpenTextDocumentNotification.type.method;
    const params = {
      textDocument: {
        languageId: languageId,
        uri: sourceUri,
        version: 0,
      },
    };

    this.connection?.sendNotification(method, params);
  }
}
