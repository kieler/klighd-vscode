export const karealayout_pre = {
    properties: {},
    revision: 1,
    type: 'graph',
    id: '/home/henri/Documents/FP/examples/karealayout.kgt',
    children: [
        {
            data: [],
            properties: {},
            direction: 0,
            selected: false,
            hoverFeedback: false,
            size: { width: 0.0, height: 0.0 },
            type: 'node',
            id: '$root',
            children: [
                {
                    data: [
                        {
                            text: 'The red rectangle is point-placed and the blue rectangle is area-placed!',
                            cursorSelectable: false,
                            editable: false,
                            type: 'KTextImpl',
                            properties: {
                                'klighd.lsp.rendering.id': '$root$$N0$$$R0',
                            },
                        },
                    ],
                    properties: {},
                    direction: 0,
                    selected: false,
                    hoverFeedback: false,
                    size: { width: 0.0, height: 0.0 },
                    type: 'node',
                    id: '$root$$N0',
                    children: [],
                },
                {
                    data: [
                        {
                            type: 'KRectangleImpl',
                            children: [
                                {
                                    type: 'KRectangleImpl',
                                    children: [],
                                    styles: [
                                        {
                                            type: 'KForegroundImpl',
                                            color: { red: 0, green: 0, blue: 225 },
                                            alpha: 255,
                                            targetAlpha: 255,
                                            gradientAngle: 0.0,
                                            propagateToChildren: false,
                                            selection: false,
                                        },
                                    ],
                                    placementData: {
                                        topLeft: {
                                            x: {
                                                type: 'KLeftPositionImpl',
                                                absolute: 10.0,
                                                relative: 0.0,
                                            },
                                            y: {
                                                type: 'KTopPositionImpl',
                                                absolute: 10.0,
                                                relative: 0.0,
                                            },
                                        },
                                        bottomRight: {
                                            x: {
                                                type: 'KRightPositionImpl',
                                                absolute: 10.0,
                                                relative: 0.0,
                                            },
                                            y: {
                                                type: 'KBottomPositionImpl',
                                                absolute: 10.0,
                                                relative: 0.0,
                                            },
                                        },
                                        type: 'KAreaPlacementDataImpl',
                                    },
                                    properties: {
                                        'klighd.lsp.rendering.id': '$root$$N1$$$R0$R0',
                                    },
                                },
                                {
                                    type: 'KRectangleImpl',
                                    children: [],
                                    styles: [
                                        {
                                            type: 'KForegroundImpl',
                                            color: { red: 225, green: 0, blue: 0 },
                                            alpha: 255,
                                            targetAlpha: 255,
                                            gradientAngle: 0.0,
                                            propagateToChildren: false,
                                            selection: false,
                                        },
                                    ],
                                    placementData: {
                                        referencePoint: {
                                            x: {
                                                type: 'KLeftPositionImpl',
                                                absolute: 20.0,
                                                relative: 0.0,
                                            },
                                            y: {
                                                type: 'KTopPositionImpl',
                                                absolute: 20.0,
                                                relative: 0.0,
                                            },
                                        },
                                        horizontalAlignment: 0,
                                        verticalAlignment: 0,
                                        horizontalMargin: 0.0,
                                        verticalMargin: 0.0,
                                        minWidth: 10.0,
                                        minHeight: 10.0,
                                        type: 'KPointPlacementDataImpl',
                                    },
                                    properties: {
                                        'klighd.lsp.rendering.id': '$root$$N1$$$R0$R1',
                                    },
                                },
                            ],
                            properties: {
                                'klighd.lsp.rendering.id': '$root$$N1$$$R0',
                            },
                        },
                    ],
                    properties: {},
                    direction: 0,
                    selected: false,
                    hoverFeedback: false,
                    size: { width: 60.0, height: 60.0 },
                    type: 'node',
                    id: '$root$$N1',
                    children: [],
                },
            ],
        },
    ],
}

export const karealayout_post = {
    properties: {},
    revision: 2,
    type: 'graph',
    id: '/home/henri/Documents/FP/examples/karealayout.kgt',
    children: [
        {
            data: [],
            properties: {
                'org.eclipse.elk.padding': {
                    top: 0.0,
                    bottom: 0.0,
                    left: 0.0,
                    right: 0.0,
                },
                'klighd.initialNodeSize': false,
                'org.eclipse.elk.scaleFactor': 1.0,
            },
            direction: 0,
            selected: false,
            hoverFeedback: false,
            position: { x: 0.0, y: 0.0 },
            size: { width: 428.0, height: 96.88038635253906 },
            type: 'node',
            id: '$root',
            children: [
                {
                    data: [
                        {
                            text: 'The red rectangle is point-placed and the blue rectangle is area-placed!',
                            cursorSelectable: false,
                            editable: false,
                            type: 'KTextImpl',
                            styles: [],
                            properties: {
                                'klighd.lsp.calculated.bounds': {
                                    x: 0.0,
                                    y: 0.0,
                                    width: 428.0,
                                    height: 16.880386,
                                },
                                'klighd.calculated.text.line.heights': [16.880386],
                                'klighd.lsp.rendering.id': '$root$$N0$$$R0',
                                'klighd.calculated.text.line.widths': [428.0],
                                'klighd.calculated.text.bounds': {
                                    x: 0.0,
                                    y: -8.830202,
                                    width: 428.0,
                                    height: 16.880386,
                                },
                            },
                        },
                    ],
                    properties: {
                        'org.eclipse.elk.nodeSize.minimum': {
                            x: 428.0,
                            y: 16.880386352539062,
                        },
                        'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                        'org.eclipse.elk.padding': {
                            top: 12.0,
                            bottom: 12.0,
                            left: 12.0,
                            right: 12.0,
                        },
                        'klighd.initialNodeSize': false,
                        'org.eclipse.elk.layered.layering.layerId': -1,
                        'org.eclipse.elk.scaleFactor': 1.0,
                        'de.cau.cs.kieler.klighd.minimalNodeSize': {
                            x: 10.0,
                            y: 10.0,
                        },
                    },
                    direction: 0,
                    selected: false,
                    hoverFeedback: false,
                    position: { x: 0.0, y: 80.0 },
                    size: { width: 428.0, height: 16.880386352539062 },
                    type: 'node',
                    id: '$root$$N0',
                    children: [],
                },
                {
                    data: [
                        {
                            type: 'KRectangleImpl',
                            children: [
                                {
                                    type: 'KRectangleImpl',
                                    children: [],
                                    styles: [
                                        {
                                            type: 'KForegroundImpl',
                                            color: { red: 0, green: 0, blue: 225 },
                                            alpha: 255,
                                            targetAlpha: 255,
                                            gradientAngle: 0.0,
                                            propagateToChildren: false,
                                            selection: false,
                                        },
                                    ],
                                    placementData: {
                                        topLeft: {
                                            x: {
                                                type: 'KLeftPositionImpl',
                                                absolute: 10.0,
                                                relative: 0.0,
                                            },
                                            y: {
                                                type: 'KTopPositionImpl',
                                                absolute: 10.0,
                                                relative: 0.0,
                                            },
                                        },
                                        bottomRight: {
                                            x: {
                                                type: 'KRightPositionImpl',
                                                absolute: 10.0,
                                                relative: 0.0,
                                            },
                                            y: {
                                                type: 'KBottomPositionImpl',
                                                absolute: 10.0,
                                                relative: 0.0,
                                            },
                                        },
                                        type: 'KAreaPlacementDataImpl',
                                    },
                                    properties: {
                                        'klighd.lsp.calculated.bounds': {
                                            x: 10.0,
                                            y: 10.0,
                                            width: 40.0,
                                            height: 40.0,
                                        },
                                        'klighd.lsp.rendering.id': '$root$$N1$$$R0$R0',
                                    },
                                },
                                {
                                    type: 'KRectangleImpl',
                                    children: [],
                                    styles: [
                                        {
                                            type: 'KForegroundImpl',
                                            color: { red: 225, green: 0, blue: 0 },
                                            alpha: 255,
                                            targetAlpha: 255,
                                            gradientAngle: 0.0,
                                            propagateToChildren: false,
                                            selection: false,
                                        },
                                    ],
                                    placementData: {
                                        referencePoint: {
                                            x: {
                                                type: 'KLeftPositionImpl',
                                                absolute: 20.0,
                                                relative: 0.0,
                                            },
                                            y: {
                                                type: 'KTopPositionImpl',
                                                absolute: 20.0,
                                                relative: 0.0,
                                            },
                                        },
                                        horizontalAlignment: 0,
                                        verticalAlignment: 0,
                                        horizontalMargin: 0.0,
                                        verticalMargin: 0.0,
                                        minWidth: 10.0,
                                        minHeight: 10.0,
                                        type: 'KPointPlacementDataImpl',
                                    },
                                    properties: {
                                        'klighd.lsp.calculated.bounds': {
                                            x: 20.0,
                                            y: 20.0,
                                            width: 10.0,
                                            height: 10.0,
                                        },
                                        'klighd.lsp.rendering.id': '$root$$N1$$$R0$R1',
                                    },
                                },
                            ],
                            styles: [],
                            properties: {
                                'klighd.lsp.calculated.bounds': {
                                    x: 0.0,
                                    y: 0.0,
                                    width: 60.0,
                                    height: 60.0,
                                },
                                'klighd.lsp.rendering.id': '$root$$N1$$$R0',
                            },
                        },
                    ],
                    properties: {
                        'org.eclipse.elk.nodeSize.minimum': { x: 60.0, y: 60.0 },
                        'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                        'org.eclipse.elk.padding': {
                            top: 12.0,
                            bottom: 12.0,
                            left: 12.0,
                            right: 12.0,
                        },
                        'klighd.initialNodeSize': false,
                        'org.eclipse.elk.layered.layering.layerId': -1,
                        'org.eclipse.elk.scaleFactor': 1.0,
                        'de.cau.cs.kieler.klighd.minimalNodeSize': {
                            x: 60.0,
                            y: 60.0,
                        },
                    },
                    direction: 0,
                    selected: false,
                    hoverFeedback: false,
                    position: { x: 0.0, y: 0.0 },
                    size: { width: 60.0, height: 60.0 },
                    type: 'node',
                    id: '$root$$N1',
                    children: [],
                },
            ],
        },
    ],
}
