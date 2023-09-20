
import { DISymbol } from "../di.symbols";
import { GraphPropertiesViewPanel } from "./graph-properties-view-panel";
import { ContainerModule } from "inversify";
import { GraphPropertiesViewRegistry } from "./graph-properties-view-registry";
import { TYPES } from "sprotty";

const graphPropertiesViewModule = new ContainerModule((bind) => {
    
    //const context = { bind, unbind, isBound, rebind }

    bind(GraphPropertiesViewPanel).toSelf().inSingletonScope();
    bind(DISymbol.SidebarPanel).toService(GraphPropertiesViewPanel);

    bind(GraphPropertiesViewRegistry).toSelf().inSingletonScope();
    bind(TYPES.IActionHandlerInitializer).toService(GraphPropertiesViewRegistry);
})

export default graphPropertiesViewModule