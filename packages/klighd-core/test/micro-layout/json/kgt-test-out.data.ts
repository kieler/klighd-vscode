const message: unknown = {
    jsonrpc: '2.0',
    method: 'diagram/accept',
    params: {
        clientId: 'keith-diagram_sprotty',
        action: {
            kind: 'updateModel',
            newRoot: {
                properties: {},
                revision: 10,
                type: 'graph',
                id: 'file:///c:/Users/User/Downloads/test.kgt',
                children: [
                    {
                        data: [
                            {
                                renderings: [
                                    {
                                        junctionPointRendering: {
                                            type: 'KEllipseImpl',
                                            children: [],
                                            styles: [
                                                {
                                                    type: 'KBackgroundImpl',
                                                    color: { red: 0, green: 0, blue: 0 },
                                                    alpha: 255,
                                                    targetAlpha: 255,
                                                    gradientAngle: 0.0,
                                                    propagateToChildren: false,
                                                    selection: false,
                                                },
                                            ],
                                            placementData: {
                                                horizontalAlignment: 1,
                                                verticalAlignment: 1,
                                                horizontalMargin: 0.0,
                                                verticalMargin: 0.0,
                                                minWidth: 4.0,
                                                minHeight: 4.0,
                                                type: 'KPointPlacementDataImpl',
                                            },
                                            properties: { 'klighd.lsp.rendering.id': '$$lib$$$R0$J' },
                                        },
                                        type: 'KPolylineImpl',
                                        children: [
                                            {
                                                type: 'KPolygonImpl',
                                                points: [
                                                    {
                                                        x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: 0.0 },
                                                        y: { type: 'KTopPositionImpl', absolute: 0.0, relative: 0.0 },
                                                    },
                                                    {
                                                        x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: 0.4 },
                                                        y: { type: 'KTopPositionImpl', absolute: 0.0, relative: 0.5 },
                                                    },
                                                    {
                                                        x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: 0.0 },
                                                        y: {
                                                            type: 'KBottomPositionImpl',
                                                            absolute: 0.0,
                                                            relative: 0.0,
                                                        },
                                                    },
                                                    {
                                                        x: { type: 'KRightPositionImpl', absolute: 0.0, relative: 0.0 },
                                                        y: {
                                                            type: 'KBottomPositionImpl',
                                                            absolute: 0.0,
                                                            relative: 0.5,
                                                        },
                                                    },
                                                ],
                                                children: [],
                                                styles: [
                                                    {
                                                        lineWidth: 1.0,
                                                        type: 'KLineWidthImpl',
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                    {
                                                        type: 'KForegroundImpl',
                                                        color: { red: 0, green: 0, blue: 0 },
                                                        alpha: 255,
                                                        targetAlpha: 255,
                                                        gradientAngle: 0.0,
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                    {
                                                        type: 'KBackgroundImpl',
                                                        color: { red: 0, green: 0, blue: 0 },
                                                        alpha: 255,
                                                        targetAlpha: 255,
                                                        gradientAngle: 0.0,
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                    {
                                                        lineJoin: 1,
                                                        miterLimit: 10.0,
                                                        type: 'KLineJoinImpl',
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                ],
                                                placementData: {
                                                    absolute: -2.0,
                                                    xOffset: -6.0,
                                                    yOffset: -3.0,
                                                    rotateWithLine: true,
                                                    width: 8.0,
                                                    height: 6.0,
                                                    relative: 1.0,
                                                    type: 'KDecoratorPlacementDataImpl',
                                                },
                                                properties: { 'klighd.lsp.rendering.id': '$$lib$$$R0$R0' },
                                            },
                                        ],
                                        styles: [
                                            {
                                                lineCap: 0,
                                                type: 'KLineCapImpl',
                                                propagateToChildren: false,
                                                selection: false,
                                            },
                                        ],
                                        id: 'DefaultEdgeRendering',
                                        properties: { 'klighd.lsp.rendering.id': '$$lib$$$R0' },
                                    },
                                    {
                                        junctionPointRendering: {
                                            type: 'KEllipseImpl',
                                            styles: [
                                                {
                                                    type: 'KBackgroundImpl',
                                                    color: { red: 0, green: 0, blue: 0 },
                                                    alpha: 255,
                                                    targetAlpha: 255,
                                                    gradientAngle: 0.0,
                                                    propagateToChildren: false,
                                                    selection: false,
                                                },
                                            ],
                                            placementData: {
                                                horizontalAlignment: 1,
                                                verticalAlignment: 1,
                                                horizontalMargin: 0.0,
                                                verticalMargin: 0.0,
                                                minWidth: 4.0,
                                                minHeight: 4.0,
                                                type: 'KPointPlacementDataImpl',
                                            },
                                            properties: { 'klighd.lsp.rendering.id': '$$lib$$$R1$J' },
                                        },
                                        type: 'KPolylineImpl',
                                        children: [],
                                        id: 'DefaultNoArrowPolylineEdgeRendering',
                                        properties: { 'klighd.lsp.rendering.id': '$$lib$$$R1' },
                                    },
                                    {
                                        type: 'KSplineImpl',
                                        children: [
                                            {
                                                type: 'KPolygonImpl',
                                                points: [
                                                    {
                                                        x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: 0.0 },
                                                        y: { type: 'KTopPositionImpl', absolute: 0.0, relative: 0.0 },
                                                    },
                                                    {
                                                        x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: 0.4 },
                                                        y: { type: 'KTopPositionImpl', absolute: 0.0, relative: 0.5 },
                                                    },
                                                    {
                                                        x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: 0.0 },
                                                        y: {
                                                            type: 'KBottomPositionImpl',
                                                            absolute: 0.0,
                                                            relative: 0.0,
                                                        },
                                                    },
                                                    {
                                                        x: { type: 'KRightPositionImpl', absolute: 0.0, relative: 0.0 },
                                                        y: {
                                                            type: 'KBottomPositionImpl',
                                                            absolute: 0.0,
                                                            relative: 0.5,
                                                        },
                                                    },
                                                ],
                                                children: [],
                                                styles: [
                                                    {
                                                        lineWidth: 1.0,
                                                        type: 'KLineWidthImpl',
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                    {
                                                        type: 'KForegroundImpl',
                                                        color: { red: 0, green: 0, blue: 0 },
                                                        alpha: 255,
                                                        targetAlpha: 255,
                                                        gradientAngle: 0.0,
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                    {
                                                        type: 'KBackgroundImpl',
                                                        color: { red: 0, green: 0, blue: 0 },
                                                        alpha: 255,
                                                        targetAlpha: 255,
                                                        gradientAngle: 0.0,
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                    {
                                                        lineJoin: 1,
                                                        miterLimit: 10.0,
                                                        type: 'KLineJoinImpl',
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                ],
                                                placementData: {
                                                    absolute: -2.0,
                                                    xOffset: -6.0,
                                                    yOffset: -3.0,
                                                    rotateWithLine: true,
                                                    width: 8.0,
                                                    height: 6.0,
                                                    relative: 1.0,
                                                    type: 'KDecoratorPlacementDataImpl',
                                                },
                                                properties: { 'klighd.lsp.rendering.id': '$$lib$$$R2$R0' },
                                            },
                                        ],
                                        styles: [
                                            {
                                                lineCap: 0,
                                                type: 'KLineCapImpl',
                                                propagateToChildren: false,
                                                selection: false,
                                            },
                                        ],
                                        id: 'SplineEdgeRendering',
                                        properties: { 'klighd.lsp.rendering.id': '$$lib$$$R2' },
                                    },
                                    {
                                        type: 'KSplineImpl',
                                        children: [],
                                        id: 'NoArrowSplineEdgeRendering',
                                        properties: { 'klighd.lsp.rendering.id': '$$lib$$$R3' },
                                    },
                                    {
                                        cornerWidth: 5.0,
                                        cornerHeight: 5.0,
                                        type: 'KRoundedRectangleImpl',
                                        children: [],
                                        styles: [
                                            {
                                                type: 'KBackgroundImpl',
                                                color: { red: 235, green: 246, blue: 250 },
                                                alpha: 255,
                                                targetColor: { red: 196, green: 227, blue: 243 },
                                                targetAlpha: 255,
                                                gradientAngle: 90.0,
                                                propagateToChildren: false,
                                                selection: false,
                                            },
                                        ],
                                        id: 'DefaultNodeRendering',
                                        properties: { 'klighd.lsp.rendering.id': '$$lib$$$R4' },
                                    },
                                ],
                                type: 'KRenderingLibraryImpl',
                            },
                            null,
                        ],
                        properties: {
                            'org.eclipse.elk.direction': 3,
                            'org.eclipse.elk.padding': { top: 0.0, bottom: 0.0, left: 0.0, right: 0.0 },
                            'klighd.initialNodeSize': false,
                            'org.eclipse.elk.scaleFactor': 1.0,
                        },
                        direction: 3,
                        selected: false,
                        hoverFeedback: false,
                        position: { x: 0.0, y: 0.0 },
                        size: { width: 340.0, height: 309.33203125 },
                        type: 'node',
                        id: '$root',
                        children: [
                            {
                                data: [
                                    {
                                        type: 'KRectangleImpl',
                                        children: [],
                                        styles: [
                                            {
                                                type: 'KBackgroundImpl',
                                                color: { red: 255, green: 0, blue: 0 },
                                                alpha: 255,
                                                targetAlpha: 255,
                                                gradientAngle: 0.0,
                                                propagateToChildren: false,
                                                selection: false,
                                            },
                                        ],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 50.0,
                                                height: 50.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$Nn1$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 50.0, y: 50.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 50.0, y: 50.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 30.83333396911621, y: 170.0 },
                                size: { width: 50.0, height: 50.0 },
                                type: 'node',
                                id: '$root$Nn1',
                                children: [],
                            },
                            {
                                data: [
                                    {
                                        type: 'KRectangleImpl',
                                        children: [],
                                        styles: [],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 50.0,
                                                height: 50.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$Nn3$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 50.0, y: 50.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 50.0, y: 50.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 115.0, y: 240.0 },
                                size: { width: 50.0, height: 50.0 },
                                type: 'node',
                                id: '$root$Nn3',
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
                                                        type: 'KBackgroundImpl',
                                                        color: { red: 255, green: 0, blue: 0 },
                                                        alpha: 150,
                                                        targetColor: { red: 0, green: 0, blue: 128 },
                                                        targetAlpha: 255,
                                                        gradientAngle: 0.0,
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                ],
                                                placementData: {
                                                    minCellWidth: 0.0,
                                                    minCellHeight: 15.0,
                                                    flexibleWidth: true,
                                                    flexibleHeight: true,
                                                    type: 'KGridPlacementDataImpl',
                                                    topLeft: {
                                                        x: { type: 'KLeftPositionImpl', absolute: 50.0, relative: 0.0 },
                                                        y: { type: 'KTopPositionImpl', absolute: 0.0, relative: 0.0 },
                                                    },
                                                },
                                                properties: {
                                                    'klighd.lsp.calculated.bounds': {
                                                        x: 50.0,
                                                        y: 0.0,
                                                        width: 45.0,
                                                        height: 15.0,
                                                    },
                                                    'klighd.lsp.rendering.id': '$root$Nn2$$$R1$R0',
                                                },
                                            },
                                            {
                                                type: 'KChildAreaImpl',
                                                styles: [
                                                    {
                                                        rotation: 270.0,
                                                        type: 'KRotationImpl',
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                ],
                                                placementData: {
                                                    minCellWidth: 0.0,
                                                    minCellHeight: 0.0,
                                                    flexibleWidth: true,
                                                    flexibleHeight: true,
                                                    type: 'KGridPlacementDataImpl',
                                                    topLeft: {
                                                        x: { type: 'KLeftPositionImpl', absolute: 15.0, relative: 0.0 },
                                                        y: { type: 'KTopPositionImpl', absolute: 15.0, relative: 0.0 },
                                                    },
                                                    bottomRight: {
                                                        x: { type: 'KRightPositionImpl', absolute: 0.0, relative: 0.0 },
                                                        y: {
                                                            type: 'KBottomPositionImpl',
                                                            absolute: 0.0,
                                                            relative: 0.0,
                                                        },
                                                    },
                                                },
                                                properties: {
                                                    'klighd.lsp.calculated.bounds': {
                                                        x: 15.0,
                                                        y: 30.0,
                                                        width: 80.0,
                                                        height: 39.33203,
                                                    },
                                                    'klighd.lsp.rendering.id': '$root$Nn2$$$R1$R1',
                                                },
                                            },
                                        ],
                                        childPlacement: { numColumns: 1, type: 'KGridPlacementImpl' },
                                        styles: [
                                            {
                                                rotation: 31.0,
                                                type: 'KRotationImpl',
                                                propagateToChildren: false,
                                                selection: false,
                                            },
                                        ],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 95.0,
                                                height: 69.33203,
                                            },
                                            'klighd.lsp.rendering.id': '$root$Nn2$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 50.0, y: 50.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 50.0, y: 50.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 0.0, y: 240.0 },
                                size: { width: 95.0, height: 69.33203125 },
                                type: 'node',
                                id: '$root$Nn2',
                                children: [
                                    {
                                        data: [
                                            {
                                                type: 'KRectangleImpl',
                                                children: [
                                                    {
                                                        text: 'Childarea',
                                                        cursorSelectable: false,
                                                        editable: false,
                                                        type: 'KTextImpl',
                                                        styles: [
                                                            {
                                                                rotation: 90.0,
                                                                type: 'KRotationImpl',
                                                                propagateToChildren: false,
                                                                selection: false,
                                                            },
                                                            {
                                                                type: 'KForegroundImpl',
                                                                color: { red: 0, green: 0, blue: 128 },
                                                                alpha: 255,
                                                                targetAlpha: 255,
                                                                gradientAngle: 0.0,
                                                                propagateToChildren: false,
                                                                selection: false,
                                                            },
                                                            {
                                                                bold: true,
                                                                type: 'KFontBoldImpl',
                                                                propagateToChildren: false,
                                                                selection: false,
                                                            },
                                                            {
                                                                italic: true,
                                                                type: 'KFontItalicImpl',
                                                                propagateToChildren: false,
                                                                selection: false,
                                                            },
                                                            {
                                                                size: 10,
                                                                scaleWithZoom: false,
                                                                type: 'KFontSizeImpl',
                                                                propagateToChildren: false,
                                                                selection: false,
                                                            },
                                                            {
                                                                name: 'Times New Roman',
                                                                type: 'KFontNameImpl',
                                                                propagateToChildren: false,
                                                                selection: false,
                                                            },
                                                            {
                                                                underline: 4,
                                                                type: 'KTextUnderlineImpl',
                                                                propagateToChildren: false,
                                                                selection: false,
                                                            },
                                                            {
                                                                xOffset: 3.0,
                                                                yOffset: 3.0,
                                                                blur: 0.0,
                                                                color: { red: 0, green: 0, blue: 0 },
                                                                type: 'KShadowImpl',
                                                                propagateToChildren: false,
                                                                selection: false,
                                                            },
                                                        ],
                                                        properties: {
                                                            'klighd.lsp.calculated.bounds': {
                                                                x: 0.0,
                                                                y: 0.0,
                                                                width: 56.0,
                                                                height: 15.332031,
                                                            },
                                                            'klighd.calculated.text.line.heights': [15.332031],
                                                            'klighd.lsp.rendering.id': '$root$Nn2$Ni$$$R1$R0',
                                                            'klighd.calculated.text.line.widths': [56.0],
                                                            'klighd.calculated.text.bounds': {
                                                                x: 0.0,
                                                                y: -8.911133,
                                                                width: 56.0,
                                                                height: 15.332031,
                                                            },
                                                        },
                                                    },
                                                ],
                                                styles: [
                                                    {
                                                        type: 'KForegroundImpl',
                                                        color: { red: 0, green: 0, blue: 128 },
                                                        alpha: 255,
                                                        targetAlpha: 255,
                                                        gradientAngle: 0.0,
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                ],
                                                properties: {
                                                    'klighd.lsp.calculated.bounds': {
                                                        x: 0.0,
                                                        y: 0.0,
                                                        width: 56.0,
                                                        height: 15.332031,
                                                    },
                                                    'klighd.lsp.rendering.id': '$root$Nn2$Ni$$$R1',
                                                },
                                            },
                                        ],
                                        properties: {
                                            'org.eclipse.elk.nodeSize.minimum': { x: 56.0, y: 15.33203125 },
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
                                            'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 10.0, y: 10.0 },
                                        },
                                        direction: 0,
                                        selected: false,
                                        hoverFeedback: false,
                                        position: { x: 27.0, y: 42.0 },
                                        size: { width: 56.0, height: 15.33203125 },
                                        type: 'node',
                                        id: '$root$Nn2$Ni',
                                        children: [],
                                    },
                                ],
                            },
                            {
                                data: [
                                    {
                                        type: 'KRectangleImpl',
                                        children: [
                                            {
                                                startAngle: 90.0,
                                                arcAngle: 90.0,
                                                arcType: 2,
                                                type: 'KArcImpl',
                                                children: [],
                                                styles: [
                                                    {
                                                        xOffset: 4.0,
                                                        yOffset: 4.0,
                                                        blur: 0.0,
                                                        color: { red: 0, green: 0, blue: 0 },
                                                        type: 'KShadowImpl',
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                    {
                                                        type: 'KBackgroundImpl',
                                                        color: { red: 255, green: 255, blue: 255 },
                                                        alpha: 255,
                                                        targetAlpha: 255,
                                                        gradientAngle: 0.0,
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                ],
                                                properties: {
                                                    'klighd.lsp.calculated.bounds': {
                                                        x: 0.0,
                                                        y: 0.0,
                                                        width: 50.0,
                                                        height: 80.0,
                                                    },
                                                    'klighd.lsp.rendering.id': '$root$Narc$$$R1$R0',
                                                },
                                            },
                                        ],
                                        styles: [],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 50.0,
                                                height: 80.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$Narc$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 50.0, y: 80.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 50.0, y: 80.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 289.5, y: 70.0 },
                                size: { width: 50.0, height: 80.0 },
                                type: 'node',
                                id: '$root$Narc',
                                children: [],
                            },
                            {
                                data: [
                                    {
                                        bundleName: 'de.cau.cs.kieler.klighd.ide',
                                        imagePath: 'icons/full/model/error_sign.png',
                                        type: 'KImageImpl',
                                        children: [],
                                        styles: [],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 50.0,
                                                height: 50.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$NimageInJar$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 50.0, y: 50.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 50.0, y: 50.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 150.0, y: 0.0 },
                                size: { width: 50.0, height: 50.0 },
                                type: 'node',
                                id: '$root$NimageInJar',
                                children: [],
                            },
                            {
                                data: [
                                    {
                                        bundleName: 'de.cau.cs.kieler.klighd.ide',
                                        imagePath: 'icons/full/model/error_sign.png',
                                        type: 'KImageImpl',
                                        children: [],
                                        styles: [],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 50.0,
                                                height: 50.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$NimageInJar2$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 50.0, y: 50.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 50.0, y: 50.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 220.0, y: 0.0 },
                                size: { width: 50.0, height: 50.0 },
                                type: 'node',
                                id: '$root$NimageInJar2',
                                children: [],
                            },
                            {
                                data: [
                                    {
                                        bundleName: 'de.cau.cs.kieler.klighd.ide',
                                        imagePath: 'icons/full/model/error_sign.png',
                                        clipShape: {
                                            type: 'KPolygonImpl',
                                            points: [
                                                {
                                                    x: { type: 'KRightPositionImpl', absolute: 0.0, relative: 0.0 },
                                                    y: { type: 'KBottomPositionImpl', absolute: 0.0, relative: 0.0 },
                                                },
                                                {
                                                    x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: 0.0 },
                                                    y: { type: 'KBottomPositionImpl', absolute: 0.0, relative: 0.0 },
                                                },
                                                {
                                                    x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: 0.5 },
                                                    y: { type: 'KTopPositionImpl', absolute: 0.0, relative: 0.26 },
                                                },
                                            ],
                                            children: [],
                                            styles: [],
                                            properties: {
                                                'klighd.lsp.calculated.bounds': {
                                                    x: 0.0,
                                                    y: 0.0,
                                                    width: 50.0,
                                                    height: 50.0,
                                                },
                                            },
                                        },
                                        type: 'KImageImpl',
                                        children: [],
                                        styles: [
                                            {
                                                xOffset: 4.0,
                                                yOffset: 4.0,
                                                blur: 0.0,
                                                color: { red: 0, green: 0, blue: 0 },
                                                type: 'KShadowImpl',
                                                propagateToChildren: false,
                                                selection: false,
                                            },
                                        ],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 50.0,
                                                height: 50.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$NimageInJarClipped$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 50.0, y: 50.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 50.0, y: 50.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 290.0, y: 0.0 },
                                size: { width: 50.0, height: 50.0 },
                                type: 'node',
                                id: '$root$NimageInJarClipped',
                                children: [],
                            },
                            {
                                data: [
                                    {
                                        bundleName: 'URI',
                                        imagePath:
                                            'https://encrypted-tbn0.gstatic.com/images?q\u003dtbn:ANd9GcREzt4ZWyEnmX04Vevy8B8TZdIOU8OyrsBvrQ\u0026s',
                                        type: 'KImageImpl',
                                        children: [],
                                        styles: [],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 50.0,
                                                height: 50.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$NimageURL$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 50.0, y: 50.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 50.0, y: 50.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 0.0, y: 70.0 },
                                size: { width: 50.0, height: 50.0 },
                                type: 'node',
                                id: '$root$NimageURL',
                                children: [],
                            },
                            {
                                data: [
                                    {
                                        bundleName: 'URI',
                                        imagePath: 'file:///C:/Users/Yorik/Downloads/maskable-icon.png',
                                        type: 'KImageImpl',
                                        children: [],
                                        styles: [],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 50.0,
                                                height: 50.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$NimageLocalURI$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 50.0, y: 50.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 50.0, y: 50.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 70.0, y: 70.0 },
                                size: { width: 50.0, height: 50.0 },
                                type: 'node',
                                id: '$root$NimageLocalURI',
                                children: [],
                            },
                            {
                                data: [
                                    {
                                        bundleName: 'URI',
                                        imagePath: './ono.png',
                                        type: 'KImageImpl',
                                        children: [],
                                        styles: [],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 50.0,
                                                height: 50.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$NimageLocalRelativePath$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 50.0, y: 50.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 50.0, y: 50.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 140.0, y: 70.0 },
                                size: { width: 50.0, height: 50.0 },
                                type: 'node',
                                id: '$root$NimageLocalRelativePath',
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
                                                styles: [],
                                                placementData: {
                                                    topLeft: {
                                                        x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: 0.1 },
                                                        y: { type: 'KTopPositionImpl', absolute: 0.0, relative: 0.1 },
                                                    },
                                                    bottomRight: {
                                                        x: { type: 'KRightPositionImpl', absolute: 0.0, relative: 0.1 },
                                                        y: {
                                                            type: 'KBottomPositionImpl',
                                                            absolute: 0.0,
                                                            relative: 0.1,
                                                        },
                                                    },
                                                    type: 'KAreaPlacementDataImpl',
                                                },
                                                properties: {
                                                    'klighd.lsp.calculated.bounds': {
                                                        x: 5.0,
                                                        y: 5.0,
                                                        width: 40.0,
                                                        height: 40.0,
                                                    },
                                                    'klighd.lsp.rendering.id': '$root$NoffsetPorts$$$R1$R0',
                                                },
                                            },
                                        ],
                                        styles: [],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 50.0,
                                                height: 50.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$NoffsetPorts$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 50.0, y: 50.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'org.eclipse.elk.portConstraints': 2,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 50.0, y: 50.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 210.0, y: 71.75 },
                                size: { width: 50.0, height: 50.0 },
                                type: 'node',
                                id: '$root$NoffsetPorts',
                                children: [
                                    {
                                        data: [
                                            {
                                                startAngle: 270.0,
                                                arcAngle: 270.0,
                                                arcType: 0,
                                                type: 'KArcImpl',
                                                children: [],
                                                styles: [],
                                                placementData: {
                                                    topLeft: {
                                                        x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: -1.0 },
                                                        y: { type: 'KTopPositionImpl', absolute: 0.0, relative: 0.0 },
                                                    },
                                                    type: 'KAreaPlacementDataImpl',
                                                },
                                                properties: {
                                                    'klighd.lsp.calculated.bounds': {
                                                        x: -9.5,
                                                        y: 0.0,
                                                        width: 19.0,
                                                        height: 19.0,
                                                    },
                                                    'klighd.lsp.rendering.id': '$root$NoffsetPorts$$P0$$$R0',
                                                },
                                            },
                                        ],
                                        properties: { 'org.eclipse.elk.port.side': 2, 'klighd.layout.port.side': 2 },
                                        selected: false,
                                        hoverFeedback: false,
                                        position: { x: 50.0, y: -1.75 },
                                        size: { width: 9.5, height: 19.0 },
                                        type: 'port',
                                        id: '$root$NoffsetPorts$$P0',
                                        children: [],
                                    },
                                    {
                                        data: [
                                            {
                                                type: 'KRectangleImpl',
                                                children: [
                                                    {
                                                        startAngle: 270.0,
                                                        arcAngle: 360.0,
                                                        arcType: 0,
                                                        type: 'KArcImpl',
                                                        children: [],
                                                        styles: [],
                                                        placementData: {
                                                            topLeft: {
                                                                x: {
                                                                    type: 'KLeftPositionImpl',
                                                                    absolute: 0.0,
                                                                    relative: -1.0,
                                                                },
                                                                y: {
                                                                    type: 'KTopPositionImpl',
                                                                    absolute: 0.0,
                                                                    relative: 0.0,
                                                                },
                                                            },
                                                            type: 'KAreaPlacementDataImpl',
                                                        },
                                                        properties: {
                                                            'klighd.lsp.calculated.bounds': {
                                                                x: -9.5,
                                                                y: 0.0,
                                                                width: 19.0,
                                                                height: 19.0,
                                                            },
                                                            'klighd.lsp.rendering.id': '$root$NoffsetPorts$$P1$$$R0$R0',
                                                        },
                                                    },
                                                ],
                                                styles: [],
                                                properties: {
                                                    'klighd.lsp.calculated.bounds': {
                                                        x: 0.0,
                                                        y: 0.0,
                                                        width: 9.5,
                                                        height: 19.0,
                                                    },
                                                    'klighd.lsp.rendering.id': '$root$NoffsetPorts$$P1$$$R0',
                                                },
                                            },
                                        ],
                                        properties: { 'org.eclipse.elk.port.side': 2, 'klighd.layout.port.side': 2 },
                                        selected: false,
                                        hoverFeedback: false,
                                        position: { x: 50.0, y: 15.5 },
                                        size: { width: 9.5, height: 19.0 },
                                        type: 'port',
                                        id: '$root$NoffsetPorts$$P1',
                                        children: [],
                                    },
                                    {
                                        data: [
                                            {
                                                type: 'KRectangleImpl',
                                                children: [],
                                                styles: [],
                                                placementData: {
                                                    topLeft: {
                                                        x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: -1.0 },
                                                        y: { type: 'KTopPositionImpl', absolute: 0.0, relative: 0.0 },
                                                    },
                                                    type: 'KAreaPlacementDataImpl',
                                                },
                                                properties: {
                                                    'klighd.lsp.calculated.bounds': {
                                                        x: -9.5,
                                                        y: 0.0,
                                                        width: 19.0,
                                                        height: 19.0,
                                                    },
                                                    'klighd.lsp.rendering.id': '$root$NoffsetPorts$$P2$$$R0',
                                                },
                                            },
                                        ],
                                        properties: { 'org.eclipse.elk.port.side': 2, 'klighd.layout.port.side': 2 },
                                        selected: false,
                                        hoverFeedback: false,
                                        position: { x: 50.0, y: 32.75 },
                                        size: { width: 9.5, height: 19.0 },
                                        type: 'port',
                                        id: '$root$NoffsetPorts$$P2',
                                        children: [],
                                    },
                                ],
                            },
                            {
                                data: [
                                    {
                                        type: 'KRectangleImpl',
                                        children: [
                                            {
                                                type: 'KRectangleImpl',
                                                children: [],
                                                styles: [],
                                                placementData: {
                                                    topLeft: {
                                                        x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: -1.0 },
                                                        y: { type: 'KTopPositionImpl', absolute: 0.0, relative: 0.0 },
                                                    },
                                                    type: 'KAreaPlacementDataImpl',
                                                },
                                                properties: {
                                                    'klighd.lsp.calculated.bounds': {
                                                        x: -50.0,
                                                        y: 0.0,
                                                        width: 100.0,
                                                        height: 50.0,
                                                    },
                                                    'klighd.lsp.rendering.id': '$root$NtwoSquares$$$R1$R0',
                                                },
                                            },
                                        ],
                                        styles: [],
                                        placementData: {
                                            topLeft: {
                                                x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: -1.0 },
                                                y: { type: 'KTopPositionImpl', absolute: 0.0, relative: 0.0 },
                                            },
                                            type: 'KAreaPlacementDataImpl',
                                        },
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: -25.0,
                                                y: 0.0,
                                                width: 50.0,
                                                height: 50.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$NtwoSquares$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 25.0, y: 50.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 25.0, y: 50.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 45.0, y: 0.0 },
                                size: { width: 25.0, height: 50.0 },
                                type: 'node',
                                id: '$root$NtwoSquares',
                                children: [],
                            },
                            {
                                data: [
                                    {
                                        type: 'KRectangleImpl',
                                        children: [],
                                        styles: [
                                            {
                                                xOffset: 4.0,
                                                yOffset: 4.0,
                                                blur: 0.0,
                                                color: { red: 0, green: 0, blue: 0 },
                                                type: 'KShadowImpl',
                                                propagateToChildren: false,
                                                selection: false,
                                            },
                                        ],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 10.0,
                                                height: 10.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$Nl$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 10.0, y: 10.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 10.0, y: 10.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 90.0, y: 0.0 },
                                size: { width: 10.0, height: 10.0 },
                                type: 'node',
                                id: '$root$Nl',
                                children: [
                                    {
                                        data: [
                                            {
                                                type: 'KRectangleImpl',
                                                children: [],
                                                styles: [
                                                    {
                                                        type: 'KForegroundImpl',
                                                        color: { red: 0, green: 0, blue: 0 },
                                                        alpha: 255,
                                                        targetAlpha: 255,
                                                        gradientAngle: 0.0,
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                    {
                                                        type: 'KBackgroundImpl',
                                                        color: { red: 0, green: 0, blue: 0 },
                                                        alpha: 255,
                                                        targetAlpha: 255,
                                                        gradientAngle: 0.0,
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                ],
                                                properties: {
                                                    'klighd.lsp.calculated.bounds': {
                                                        x: 0.0,
                                                        y: 0.0,
                                                        width: 5.0,
                                                        height: 5.0,
                                                    },
                                                    'klighd.lsp.rendering.id': '$root$Nl$Pp$$$R2',
                                                },
                                            },
                                        ],
                                        properties: { 'klighd.layout.port.side': 3 },
                                        selected: false,
                                        hoverFeedback: false,
                                        position: { x: 2.5, y: 10.0 },
                                        size: { width: 5.0, height: 5.0 },
                                        type: 'port',
                                        id: '$root$Nl$Pp',
                                        children: [],
                                    },
                                ],
                            },
                            {
                                data: [
                                    {
                                        type: 'KRectangleImpl',
                                        children: [],
                                        styles: [],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 10.0,
                                                height: 10.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$Nr1$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 10.0, y: 10.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 10.0, y: 10.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 90.0, y: 35.0 },
                                size: { width: 10.0, height: 10.0 },
                                type: 'node',
                                id: '$root$Nr1',
                                children: [],
                            },
                            {
                                data: [
                                    {
                                        type: 'KRectangleImpl',
                                        children: [],
                                        styles: [
                                            {
                                                xOffset: 4.0,
                                                yOffset: 4.0,
                                                blur: 0.0,
                                                color: { red: 0, green: 0, blue: 0 },
                                                type: 'KShadowImpl',
                                                propagateToChildren: false,
                                                selection: false,
                                            },
                                        ],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 10.0,
                                                height: 10.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$Nr2$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 10.0, y: 10.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 10.0, y: 10.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 120.0, y: 35.0 },
                                size: { width: 10.0, height: 10.0 },
                                type: 'node',
                                id: '$root$Nr2',
                                children: [],
                            },
                            {
                                data: [
                                    {
                                        type: 'KPolygonImpl',
                                        points: [
                                            {
                                                x: { type: 'KRightPositionImpl', absolute: 0.0, relative: 0.0 },
                                                y: { type: 'KBottomPositionImpl', absolute: 0.0, relative: 0.0 },
                                            },
                                            {
                                                x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: 0.0 },
                                                y: { type: 'KBottomPositionImpl', absolute: 0.0, relative: 0.0 },
                                            },
                                            {
                                                x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: 0.5 },
                                                y: { type: 'KTopPositionImpl', absolute: 0.0, relative: 0.0 },
                                            },
                                        ],
                                        children: [],
                                        styles: [
                                            {
                                                xOffset: 4.0,
                                                yOffset: 4.0,
                                                blur: 0.0,
                                                color: { red: 0, green: 0, blue: 0 },
                                                type: 'KShadowImpl',
                                                propagateToChildren: false,
                                                selection: false,
                                            },
                                        ],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 25.0,
                                                height: 25.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$Ntriangle$$$R1',
                                        },
                                    },
                                ],
                                properties: {
                                    'org.eclipse.elk.nodeSize.minimum': { x: 25.0, y: 25.0 },
                                    'org.eclipse.elk.layered.crossingMinimization.positionId': -1,
                                    'org.eclipse.elk.padding': { top: 12.0, bottom: 12.0, left: 12.0, right: 12.0 },
                                    'klighd.initialNodeSize': false,
                                    'org.eclipse.elk.layered.layering.layerId': -1,
                                    'org.eclipse.elk.scaleFactor': 1.0,
                                    'de.cau.cs.kieler.klighd.minimalNodeSize': { x: 25.0, y: 25.0 },
                                },
                                direction: 3,
                                selected: false,
                                hoverFeedback: false,
                                position: { x: 0.0, y: 0.0 },
                                size: { width: 25.0, height: 25.0 },
                                type: 'node',
                                id: '$root$Ntriangle',
                                children: [],
                            },
                            {
                                data: [
                                    {
                                        type: 'KSplineImpl',
                                        children: [
                                            {
                                                type: 'KRectangleImpl',
                                                children: [
                                                    {
                                                        type: 'KRectangleImpl',
                                                        children: [],
                                                        styles: [
                                                            {
                                                                lineJoin: 0,
                                                                miterLimit: 10.0,
                                                                type: 'KLineJoinImpl',
                                                                propagateToChildren: false,
                                                                selection: false,
                                                            },
                                                        ],
                                                        placementData: {
                                                            minCellWidth: 0.0,
                                                            minCellHeight: 0.0,
                                                            flexibleWidth: true,
                                                            flexibleHeight: true,
                                                            type: 'KGridPlacementDataImpl',
                                                            topLeft: {
                                                                x: {
                                                                    type: 'KLeftPositionImpl',
                                                                    absolute: 3.0,
                                                                    relative: 0.0,
                                                                },
                                                                y: {
                                                                    type: 'KTopPositionImpl',
                                                                    absolute: 3.0,
                                                                    relative: 0.0,
                                                                },
                                                            },
                                                            bottomRight: {
                                                                x: {
                                                                    type: 'KRightPositionImpl',
                                                                    absolute: 3.0,
                                                                    relative: 0.0,
                                                                },
                                                                y: {
                                                                    type: 'KBottomPositionImpl',
                                                                    absolute: 3.0,
                                                                    relative: 0.0,
                                                                },
                                                            },
                                                        },
                                                        properties: {
                                                            'klighd.lsp.calculated.bounds': {
                                                                x: 3.0,
                                                                y: 3.0,
                                                                width: 9.0,
                                                                height: 9.0,
                                                            },
                                                            'klighd.lsp.rendering.id': '$root$Nn1$$E0$$$R0$R0$R0',
                                                        },
                                                    },
                                                    {
                                                        points: [
                                                            {
                                                                x: {
                                                                    type: 'KLeftPositionImpl',
                                                                    absolute: 0.0,
                                                                    relative: 0.2,
                                                                },
                                                                y: {
                                                                    type: 'KTopPositionImpl',
                                                                    absolute: 0.0,
                                                                    relative: 0.2,
                                                                },
                                                            },
                                                            {
                                                                x: {
                                                                    type: 'KLeftPositionImpl',
                                                                    absolute: 0.0,
                                                                    relative: 0.2,
                                                                },
                                                                y: {
                                                                    type: 'KBottomPositionImpl',
                                                                    absolute: 0.0,
                                                                    relative: 0.2,
                                                                },
                                                            },
                                                            {
                                                                x: {
                                                                    type: 'KRightPositionImpl',
                                                                    absolute: 0.0,
                                                                    relative: 0.2,
                                                                },
                                                                y: {
                                                                    type: 'KBottomPositionImpl',
                                                                    absolute: 0.0,
                                                                    relative: 0.5,
                                                                },
                                                            },
                                                            {
                                                                x: {
                                                                    type: 'KLeftPositionImpl',
                                                                    absolute: 0.0,
                                                                    relative: 0.2,
                                                                },
                                                                y: {
                                                                    type: 'KTopPositionImpl',
                                                                    absolute: 0.0,
                                                                    relative: 0.2,
                                                                },
                                                            },
                                                        ],
                                                        type: 'KPolylineImpl',
                                                        children: [
                                                            {
                                                                type: 'KEllipseImpl',
                                                                children: [
                                                                    {
                                                                        bendRadius: 3.0,
                                                                        type: 'KRoundedBendsPolylineImpl',
                                                                        points: [
                                                                            {
                                                                                x: {
                                                                                    type: 'KLeftPositionImpl',
                                                                                    absolute: 0.0,
                                                                                    relative: 0.2,
                                                                                },
                                                                                y: {
                                                                                    type: 'KTopPositionImpl',
                                                                                    absolute: 0.0,
                                                                                    relative: 0.2,
                                                                                },
                                                                            },
                                                                            {
                                                                                x: {
                                                                                    type: 'KLeftPositionImpl',
                                                                                    absolute: 0.0,
                                                                                    relative: 0.2,
                                                                                },
                                                                                y: {
                                                                                    type: 'KBottomPositionImpl',
                                                                                    absolute: 0.0,
                                                                                    relative: 0.2,
                                                                                },
                                                                            },
                                                                            {
                                                                                x: {
                                                                                    type: 'KRightPositionImpl',
                                                                                    absolute: 0.0,
                                                                                    relative: 0.2,
                                                                                },
                                                                                y: {
                                                                                    type: 'KBottomPositionImpl',
                                                                                    absolute: 0.0,
                                                                                    relative: 0.5,
                                                                                },
                                                                            },
                                                                            {
                                                                                x: {
                                                                                    type: 'KLeftPositionImpl',
                                                                                    absolute: 0.0,
                                                                                    relative: 0.2,
                                                                                },
                                                                                y: {
                                                                                    type: 'KTopPositionImpl',
                                                                                    absolute: 0.0,
                                                                                    relative: 0.2,
                                                                                },
                                                                            },
                                                                        ],
                                                                        children: [],
                                                                        styles: [],
                                                                        placementData: {
                                                                            minCellWidth: 0.0,
                                                                            minCellHeight: 0.0,
                                                                            flexibleWidth: true,
                                                                            flexibleHeight: true,
                                                                            type: 'KGridPlacementDataImpl',
                                                                            topLeft: {
                                                                                x: {
                                                                                    type: 'KLeftPositionImpl',
                                                                                    absolute: 0.0,
                                                                                    relative: 0.0,
                                                                                },
                                                                                y: {
                                                                                    type: 'KTopPositionImpl',
                                                                                    absolute: 0.0,
                                                                                    relative: 0.0,
                                                                                },
                                                                            },
                                                                            bottomRight: {
                                                                                x: {
                                                                                    type: 'KRightPositionImpl',
                                                                                    absolute: 0.0,
                                                                                    relative: 0.0,
                                                                                },
                                                                                y: {
                                                                                    type: 'KBottomPositionImpl',
                                                                                    absolute: 0.0,
                                                                                    relative: 0.0,
                                                                                },
                                                                            },
                                                                        },
                                                                        properties: {
                                                                            'klighd.lsp.calculated.bounds': {
                                                                                x: 0.0,
                                                                                y: 0.0,
                                                                                width: 10.0,
                                                                                height: 10.0,
                                                                            },
                                                                            'klighd.lsp.rendering.id':
                                                                                '$root$Nn1$$E0$$$R0$R0$R1$R0$R0',
                                                                        },
                                                                    },
                                                                ],
                                                                styles: [
                                                                    {
                                                                        xOffset: 4.0,
                                                                        yOffset: 4.0,
                                                                        blur: 0.0,
                                                                        color: { red: 0, green: 0, blue: 0 },
                                                                        type: 'KShadowImpl',
                                                                        propagateToChildren: false,
                                                                        selection: false,
                                                                    },
                                                                ],
                                                                placementData: {
                                                                    referencePoint: {
                                                                        x: {
                                                                            type: 'KLeftPositionImpl',
                                                                            absolute: 0.0,
                                                                            relative: 0.0,
                                                                        },
                                                                        y: {
                                                                            type: 'KTopPositionImpl',
                                                                            absolute: 0.0,
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
                                                                        x: 0.0,
                                                                        y: 0.0,
                                                                        width: 10.0,
                                                                        height: 10.0,
                                                                    },
                                                                    'klighd.lsp.rendering.id':
                                                                        '$root$Nn1$$E0$$$R0$R0$R1$R0',
                                                                },
                                                            },
                                                        ],
                                                        styles: [],
                                                        placementData: {
                                                            minCellWidth: 0.0,
                                                            minCellHeight: 0.0,
                                                            flexibleWidth: true,
                                                            flexibleHeight: true,
                                                            type: 'KGridPlacementDataImpl',
                                                            topLeft: {
                                                                x: {
                                                                    type: 'KLeftPositionImpl',
                                                                    absolute: 0.0,
                                                                    relative: 0.0,
                                                                },
                                                                y: {
                                                                    type: 'KTopPositionImpl',
                                                                    absolute: 0.0,
                                                                    relative: 0.0,
                                                                },
                                                            },
                                                            bottomRight: {
                                                                x: {
                                                                    type: 'KRightPositionImpl',
                                                                    absolute: 0.0,
                                                                    relative: 0.0,
                                                                },
                                                                y: {
                                                                    type: 'KBottomPositionImpl',
                                                                    absolute: 0.0,
                                                                    relative: 0.0,
                                                                },
                                                            },
                                                        },
                                                        properties: {
                                                            'klighd.lsp.calculated.bounds': {
                                                                x: 0.0,
                                                                y: 0.0,
                                                                width: 15.0,
                                                                height: 15.0,
                                                            },
                                                            'klighd.lsp.rendering.id': '$root$Nn1$$E0$$$R0$R0$R1',
                                                        },
                                                    },
                                                ],
                                                styles: [
                                                    {
                                                        rotation: 45.0,
                                                        type: 'KRotationImpl',
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                    {
                                                        lineJoin: 1,
                                                        miterLimit: 10.0,
                                                        type: 'KLineJoinImpl',
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                    {
                                                        lineStyle: 5,
                                                        dashPattern: [7.0, 1.0],
                                                        dashOffset: 0.0,
                                                        type: 'KLineStyleImpl',
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                    {
                                                        type: 'KForegroundImpl',
                                                        color: { red: 0, green: 0, blue: 128 },
                                                        alpha: 255,
                                                        targetAlpha: 255,
                                                        gradientAngle: 0.0,
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                ],
                                                placementData: {
                                                    absolute: -7.5,
                                                    xOffset: -7.5,
                                                    yOffset: -7.5,
                                                    rotateWithLine: true,
                                                    width: 15.0,
                                                    height: 15.0,
                                                    relative: 1.0,
                                                    type: 'KDecoratorPlacementDataImpl',
                                                },
                                                properties: {
                                                    'klighd.lsp.calculated.bounds': {
                                                        x: -7.5,
                                                        y: -7.5,
                                                        width: 15.0,
                                                        height: 15.0,
                                                    },
                                                    'klighd.lsp.rendering.id': '$root$Nn1$$E0$$$R0$R0',
                                                    'klighd.lsp.calculated.decoration': {
                                                        origin: { x: 47.5, y: 232.5 },
                                                        bounds: { x: -7.5, y: -7.5, width: 15.0, height: 15.0 },
                                                        rotation: 1.5707964,
                                                    },
                                                },
                                            },
                                        ],
                                        styles: [
                                            {
                                                rotation: 322.0,
                                                type: 'KRotationImpl',
                                                propagateToChildren: false,
                                                selection: false,
                                            },
                                        ],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 0.0,
                                                height: 20.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$Nn1$$E0$$$R0',
                                        },
                                    },
                                ],
                                junctionPoints: [],
                                properties: { 'org.eclipse.elk.edge.type': 0, 'org.eclipse.elk.junctionPoints': [] },
                                sourceId: '$root$Nn1',
                                targetId: '$root$Nn2',
                                routingPoints: [
                                    { x: 47.5, y: 220.0 },
                                    { x: 47.5, y: 240.0 },
                                ],
                                selected: false,
                                hoverFeedback: false,
                                type: 'edge',
                                id: '$root$Nn1$$E0',
                                children: [],
                            },
                            {
                                data: [
                                    {
                                        bendRadius: 5.0,
                                        type: 'KRoundedBendsPolylineImpl',
                                        children: [
                                            {
                                                text: 'Decorator\nMultiline!',
                                                cursorSelectable: false,
                                                editable: false,
                                                type: 'KTextImpl',
                                                styles: [
                                                    {
                                                        xOffset: 4.0,
                                                        yOffset: 4.0,
                                                        blur: 0.0,
                                                        color: { red: 0, green: 0, blue: 0 },
                                                        type: 'KShadowImpl',
                                                        propagateToChildren: false,
                                                        selection: false,
                                                    },
                                                ],
                                                placementData: {
                                                    absolute: 0.0,
                                                    xOffset: 0.0,
                                                    yOffset: 0.0,
                                                    rotateWithLine: false,
                                                    width: 0.0,
                                                    height: 0.0,
                                                    relative: 0.5,
                                                    type: 'KDecoratorPlacementDataImpl',
                                                },
                                                properties: {
                                                    'klighd.lsp.calculated.bounds': {
                                                        x: 0.0,
                                                        y: 0.0,
                                                        width: 0.0,
                                                        height: 0.0,
                                                    },
                                                    'klighd.calculated.text.line.heights': [16.879986, 16.879986],
                                                    'klighd.lsp.rendering.id': '$root$Nn1$$E1$$$R0$R0',
                                                    'klighd.calculated.text.line.widths': [61.333336, 58.666668],
                                                    'klighd.calculated.text.bounds': {
                                                        x: 0.0,
                                                        y: -7.499993,
                                                        width: 61.333336,
                                                        height: 33.75997,
                                                    },
                                                    'klighd.lsp.calculated.decoration': {
                                                        origin: { x: 102.08333206176758, y: 230.0 },
                                                        bounds: { x: 0.0, y: 0.0, width: 0.0, height: 0.0 },
                                                        rotation: 0.0,
                                                    },
                                                },
                                            },
                                            {
                                                type: 'KRectangleImpl',
                                                children: [],
                                                styles: [],
                                                placementData: {
                                                    absolute: 0.0,
                                                    xOffset: 0.0,
                                                    yOffset: 0.0,
                                                    rotateWithLine: false,
                                                    width: 10.0,
                                                    height: 10.0,
                                                    relative: 1.0,
                                                    type: 'KDecoratorPlacementDataImpl',
                                                },
                                                properties: {
                                                    'klighd.lsp.calculated.bounds': {
                                                        x: 0.0,
                                                        y: 0.0,
                                                        width: 10.0,
                                                        height: 10.0,
                                                    },
                                                    'klighd.lsp.rendering.id': '$root$Nn1$$E1$$$R0$R1',
                                                    'klighd.lsp.calculated.decoration': {
                                                        origin: { x: 140.0, y: 240.0 },
                                                        bounds: { x: 0.0, y: 0.0, width: 10.0, height: 10.0 },
                                                        rotation: 0.0,
                                                    },
                                                },
                                            },
                                            {
                                                type: 'KEllipseImpl',
                                                children: [],
                                                styles: [],
                                                placementData: {
                                                    referencePoint: {
                                                        x: { type: 'KLeftPositionImpl', absolute: 0.0, relative: 0.0 },
                                                        y: { type: 'KTopPositionImpl', absolute: 0.0, relative: 0.0 },
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
                                                        x: 0.0,
                                                        y: 0.0,
                                                        width: 10.0,
                                                        height: 10.0,
                                                    },
                                                    'klighd.lsp.rendering.id': '$root$Nn1$$E1$$$R0$R2',
                                                },
                                            },
                                        ],
                                        styles: [],
                                        properties: {
                                            'klighd.lsp.calculated.bounds': {
                                                x: 0.0,
                                                y: 0.0,
                                                width: 75.833336,
                                                height: 20.0,
                                            },
                                            'klighd.lsp.rendering.id': '$root$Nn1$$E1$$$R0',
                                        },
                                    },
                                ],
                                junctionPoints: [],
                                properties: { 'org.eclipse.elk.edge.type': 0, 'org.eclipse.elk.junctionPoints': [] },
                                sourceId: '$root$Nn1',
                                targetId: '$root$Nn3',
                                routingPoints: [
                                    { x: 64.16666412353516, y: 220.0 },
                                    { x: 64.16666412353516, y: 230.0 },
                                    { x: 140.0, y: 230.0 },
                                    { x: 140.0, y: 240.0 },
                                ],
                                selected: false,
                                hoverFeedback: false,
                                type: 'edge',
                                id: '$root$Nn1$$E1',
                                children: [],
                            },
                            {
                                data: [
                                    {
                                        type: 'KRenderingRefImpl',
                                        actions: [
                                            {
                                                actionId: 'de.cau.cs.kieler.klighd.actions.FocusAndContextAction',
                                                trigger: 0,
                                                altPressed: 0,
                                                ctrlCmdPressed: 0,
                                                shiftPressed: 0,
                                            },
                                        ],
                                        properties: {
                                            'klighd.lsp.calculated.bounds.map': {
                                                $$lib$$$R0$J: { x: -2.0, y: -2.0, width: 4.0, height: 4.0 },
                                                $$lib$$$R0: { x: 0.0, y: 0.0, width: 0.0, height: 20.0 },
                                                $$lib$$$R0$R0: { x: -6.0, y: -3.0, width: 8.0, height: 6.0 },
                                            },
                                            'klighd.lsp.calculated.decoration.map': {
                                                $$lib$$$R0$R0: {
                                                    origin: { x: 95.0, y: 33.0 },
                                                    bounds: { x: -6.0, y: -3.0, width: 8.0, height: 6.0 },
                                                    rotation: 1.5707964,
                                                },
                                            },
                                            'klighd.lsp.rendering.id': '$root$Nl$$E0$$lib$$$R0',
                                        },
                                    },
                                ],
                                junctionPoints: [],
                                properties: { 'org.eclipse.elk.edge.type': 0, 'org.eclipse.elk.junctionPoints': [] },
                                sourceId: '$root$Nl',
                                targetId: '$root$Nr1',
                                routingPoints: [
                                    { x: 95.0, y: 15.0 },
                                    { x: 95.0, y: 35.0 },
                                ],
                                selected: false,
                                hoverFeedback: false,
                                type: 'edge',
                                id: '$root$Nl$$E0',
                                children: [],
                            },
                            {
                                data: [
                                    {
                                        type: 'KRenderingRefImpl',
                                        actions: [
                                            {
                                                actionId: 'de.cau.cs.kieler.klighd.actions.FocusAndContextAction',
                                                trigger: 0,
                                                altPressed: 0,
                                                ctrlCmdPressed: 0,
                                                shiftPressed: 0,
                                            },
                                        ],
                                        properties: {
                                            'klighd.lsp.calculated.bounds.map': {
                                                $$lib$$$R0$J: { x: -2.0, y: -2.0, width: 4.0, height: 4.0 },
                                                $$lib$$$R0: { x: 0.0, y: 0.0, width: 30.0, height: 20.0 },
                                                $$lib$$$R0$R0: { x: -6.0, y: -3.0, width: 8.0, height: 6.0 },
                                            },
                                            'klighd.lsp.calculated.decoration.map': {
                                                $$lib$$$R0$R0: {
                                                    origin: { x: 125.0, y: 33.0 },
                                                    bounds: { x: -6.0, y: -3.0, width: 8.0, height: 6.0 },
                                                    rotation: 1.5707964,
                                                },
                                            },
                                            'klighd.lsp.rendering.id': '$root$Nl$$E1$$lib$$$R0',
                                        },
                                    },
                                ],
                                junctionPoints: [{ x: 95.0, y: 25.0 }],
                                properties: {
                                    'org.eclipse.elk.edge.type': 0,
                                    'org.eclipse.elk.junctionPoints': [{ x: 95.0, y: 25.0 }],
                                },
                                sourceId: '$root$Nl',
                                targetId: '$root$Nr2',
                                routingPoints: [
                                    { x: 95.0, y: 15.0 },
                                    { x: 95.0, y: 25.0 },
                                    { x: 125.0, y: 25.0 },
                                    { x: 125.0, y: 35.0 },
                                ],
                                selected: false,
                                hoverFeedback: false,
                                type: 'edge',
                                id: '$root$Nl$$E1',
                                children: [],
                            },
                        ],
                    },
                ],
            },
        },
    },
}

export default message
