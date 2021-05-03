import { LSPConnection } from "./connection";
const btn = document.getElementById("reqModel");
if(!btn) console.log("Button not found")

const socketUrl = `ws://${location.host}/socket`;
const connection = new LSPConnection(socketUrl).connect();

btn?.addEventListener("click", () => {
  connection.sendDocumentDidOpen("file:///home/cf/Documents/bachelor/example-workspace/ABRO.sctx")
  connection.requestModelAction("file:///home/cf/Documents/bachelor/example-workspace/ABRO.sctx");
});
