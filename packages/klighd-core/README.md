# klighd-core

> A diagram view for KGraph models implemented in [Sprotty](https://github.com/theia-ide/sprotty).
> Works with the KLighD language server.

## Getting started

The `kligh-core` package is nearly self-contained and is almost able to display generated KGraph
models. An application that uses this packages has to provide a few platform dependent services that
can not be implemented by the core package before-hand.

### Implementing the services

#### Connection

The connection service is responsible for sending diagram actions to and from the diagram server.
The transport of the actions is platform dependent and has to be chosen according to each platform's
capabilities.

Each service has to implement the `Connection` interface exported by the core container. Refer to
the exported interface for more information about the required methods.

#### SessionStorage

The session storage service is used to cache data in a key-value store. The duration of persistence
should be short-lived and no longer than a user session.

Each service has to implement the `SessionStorage` interface exported by the core container, which
is compatible with the web [Storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage)
interface. Refer to the exported interface for more information about the required methods.

A good candidate for an implementation might be the `sessionStorage` web API if it is available on
the implementing platform.

### Using `klighd-core`

Using the `klighd-core` package requires the initialization of a diagram container, implementation
of the required services, and the initialization of a model request to kick of the visualization.

The following code serves as a boilerplate for getting started, assuming that an implementation for
each service exists:

```typescript
// Load CSS styles from the container. Have to be bundled accordingly with the bundler of choice.
import "klighd-core/styles/main.css";

import {
    createKlighdDiagramContainer,
    requestModel,
    getActionDispatcher,
    SetPreferencesAction,
    bindServices,
} from "@kieler/klighd-core";
// Your implementation of the `Connection` interface.
import { ConnectionImpl } from "./services/connection";

async function init() {
    const connection = new ConnectionImpl();

    // container-id should be the id of the html element that is used as the root for diagrams.
    const diagramContainer = createKlighdDiagramContainer("container-id");
    // Provides required services to the container. Uses the native sessionStorage in this case.
    bindServices(diagramContainer, { connection, sessionStorage });

    // The action dispatcher can be used to send actions to the container.
    const actionDispatcher = getActionDispatcher(diagramContainer);

    // Kick of the diagram visualization for a given model source uri. The sourceUri is sent to the server.
    await requestModel(actionDispatcher, sourceUri);

    // Optional: Change user preferences in the container by dispatching an action accordingly.
    actionDispatcher.dispatch(
        new SetPreferencesAction({
            resizeToFit: false,
            forceLightBackground: true,
        })
    );
}
```
