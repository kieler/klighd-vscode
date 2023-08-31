
import { DISymbol } from "../di.symbols";
import { GraphPropertiesViewPanel } from "./graph-properties-view-panel";
import { ContainerModule } from "inversify";

const graphPropertiesViewModule = new ContainerModule((bind) => {
    
    //const context = { bind, unbind, isBound, rebind }

    bind(GraphPropertiesViewPanel).toSelf().inSingletonScope();
    bind(DISymbol.SidebarPanel).toService(GraphPropertiesViewPanel);
})

export default graphPropertiesViewModule