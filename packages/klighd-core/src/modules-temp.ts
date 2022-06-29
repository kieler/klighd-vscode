// import { ContainerModule } from "inversify";

/**
 * Stores custom modules of projects importing KLighD-vscode to be loaded.
 * Register modules via {@link registerModules}.
 */
const importModules: unknown[] = [];

/**
 * Registers custom modules of projects importing KLighD-vscode to be loaded.
 * @param modules The modules that should be loaded.
 */
export function registerModules(...modules: unknown[]): void {
    importModules.push(...modules);
}

export function getImportModules(): unknown[] {
    return importModules;
}