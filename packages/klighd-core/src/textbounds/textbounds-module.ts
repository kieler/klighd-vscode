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
import { ContainerModule } from 'inversify';
import { configureCommand, TYPES } from 'sprotty/lib';
import { RequestTextBoundsCommand } from '../actions/actions';
import { HiddenTextBoundsUpdater } from './hidden-text-bounds-updater';

/**
 * Dependency injection module that adds functionality to handle the hidden text bounds estimation for the RequestTextBoudndsAction.
 */
const textBoundsModule = new ContainerModule((bind, _unbind, isBound) => {
    // TODO:
    // This should really first unbind the RequestBoundsCommand from the TYPES.ICommand registry
    // and the HiddenBoundsUpdater from the TYPES.HiddenVNodePostprocessor registry, but inversify
    // does not support such a feature.
    // See the ticket https://github.com/inversify/InversifyJS/issues/1035
    // I would like some syntax such as:
    // unbind(Types.HiddenVNodePostprocessor).from(HiddenBoundsUpdater)
    // to remove only that specific binding, not all of the bindings registered for the Types.HiddenVNodePostprocessor.
    // With that, the HiddenBoundsUpdater should not be called anymore and not issue any CalculatedBoundsAction,
    // which is currently only ignored by the overwritten handle method for that action in the KeithDiagramServer.
    configureCommand({ bind, isBound }, RequestTextBoundsCommand);
    bind(TYPES.HiddenVNodePostprocessor).to(HiddenTextBoundsUpdater).inSingletonScope()
});

export default textBoundsModule