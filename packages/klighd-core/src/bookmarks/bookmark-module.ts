import { ContainerModule } from "inversify";
import { configureCommand } from "sprotty";
import { CreateBookmarkCommand, GetBookmarkCommand } from "./bookmark"

/**
 * Module for updateing the depthmap whenever needed. 
 */
const bookmarkModule = new ContainerModule((bind, _unbind, isBound) => {
    configureCommand({ bind, isBound }, CreateBookmarkCommand);
    configureCommand({ bind, isBound }, GetBookmarkCommand);
});
 
export default bookmarkModule;