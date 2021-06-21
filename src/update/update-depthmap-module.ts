import { ContainerModule } from "inversify";
import { configureCommand } from "sprotty";
import { UpdateDepthmapModelCommand } from './update-depthmap-model';

/**
 * Module for updateing the depthmap whenever needed. 
 */
const updateDepthmapModule = new ContainerModule((bind, _unbind, isBound) => {
    configureCommand({ bind, isBound }, UpdateDepthmapModelCommand);
});
 
export default updateDepthmapModule;