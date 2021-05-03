import * as rpc from "vscode-ws-jsonrpc";
import * as lsp from "vscode-languageserver-protocol";

/**
 * Connection to the language server.
 *
 * Inspired by
 * [this implementation](https://github.com/wylieconlon/lsp-editor-adapter/blob/master/src/ws-connection.ts).
 */
export class LSPConnection {
  private webSocketUrl: string;
  private socket?: WebSocket;
  private connection?: rpc.MessageConnection;

  constructor(webSocketUrl: string) {
    this.webSocketUrl = webSocketUrl;
    console.log("Constructed");
  }

  connect(): this {
    // The WebSocket has created in place! Passing it as a parameter might lead
    // to a race-condition where the socket is opened, before vscode-ws-jsonrpc
    // starts to listen. This causes the connection to not work.
    const socket = new WebSocket(this.webSocketUrl);
    this.socket = socket;
    console.log("Connecting...");

    rpc.listen({
      webSocket: socket,
      logger: new rpc.ConsoleLogger(),
      onConnection: (conn) => {
        conn.listen();
        console.log("Connected");
        this.connection = conn;
        
        this.connection.onError((e) => {
          console.error(e);
        });
        
        this.connection.onClose(() => {
          this.connection = undefined;
          this.socket = undefined;
        });
        
        this.sendInitialize();
      },
    });

    return this;
  }

  close() {
    this.connection?.dispose();
    this.connection = undefined;

    this.socket?.close();
  }

  async sendInitialize() {
    if (!this.connection) return;

    const method = lsp.InitializeRequest.type.method;
    const initParams: lsp.InitializeParams = {
      processId: null,
      workspaceFolders: null,
      rootUri: null,
      capabilities: {},
    };

    console.log("Sending initialization.");
    await this.connection.sendRequest(method, initParams);
    this.connection.sendNotification(lsp.InitializedNotification.type.method);
  }

  async requestModelAction(sourceUri: string) {
    const method = "diagram/accept";
    const params = {
      clientId: "keith-diagram_sprotty",
      action: {
        options: {
          needsClientLayout: false,
          needsServerLayout: true,
          sourceUri,
          diagramType: "keith-diagram",
        },
        requestId: "",
        kind: "requestModel",
      },
    };

    this.connection?.sendRequest(method, params);
  }

  sendDocumentDidOpen(sourceUri: string) {
    const method = lsp.DidOpenTextDocumentNotification.type.method;
    const params = {
      textDocument: {
        languageId: "sccharts",
        uri: sourceUri,
        // text: "",
        version: 0,
      },
    };

    this.connection?.sendNotification(method, params);
  }
}
