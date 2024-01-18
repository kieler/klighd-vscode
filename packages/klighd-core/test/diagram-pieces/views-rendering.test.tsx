//@ts-nochec
/** @jsx svg */
import { VNode, VNodeStyle } from 'snabbdom';
import { IVNodePostprocessor, IView, RenderingTargetKind, SChildElement, SModelRoot, SParentElement, SModelElement, ViewRegistry, Viewport, svg } from 'sprotty';
import { renderChildRenderings, renderLine, renderRectangularShape, renderSVGArc, renderSVGEllipse, renderSVGRect, renderSingleSVGArc, renderSVGLine, renderKText, getJunctionPointRenderings, renderKRendering, renderError, renderChildArea } from '../../src/views-rendering';
import { Arc, KArc, KChildArea, KContainerRendering, KImage, KPolyline, KRendering, KRoundedBendsPolyline, KRoundedRectangle, KShadow, KText, K_POLYGON, K_POLYLINE, K_ROUNDED_BENDS_POLYLINE, K_SPLINE, SKEdge, SKGraphElement, SKNode } from '../../src/skgraph-models';
import { ColorStyles, DEFAULT_CLICKABLE_FILL, DEFAULT_FILL, DEFAULT_LINE_WIDTH, KStyles, LineStyles, getKStyles, getSvgColorStyles, getSvgLineStyles, getSvgShadowStyles, getSvgTextStyles } from '../../src/views-styles';
import { expect } from 'chai';
import { BoundsAndTransformation, findBoundsAndTransformationData, getPoints, transformationToSVGString } from '../../src/views-common';
import { SKGraphModelRenderer } from '../../src/skgraph-model-renderer';
import { AnimateGoToBookmark, Appearance, PinSidebarOption, RenderOptionsRegistry, ResizeToFit, ShadowOption, Shadows, SimplifySmallText, TextSimplificationThreshold, TitleScalingFactor } from '../../src/options/render-options-registry';
import { TitleStorage } from '../../src/titles/title-storage';
import { RenderOption } from '../../src/options/option-models';
import { KGraphData, KNode } from '@kieler/klighd-interactive/lib/constraint-classes';
import { Bounds, Point } from 'sprotty-protocol';
import { DepthMap, Region } from '../../src/depth-map';




describe('testing renderRectangularShape', () => {
   
    const boundsAndTransformation: BoundsAndTransformation = {
        bounds: {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        },
        transformation: []
    }

    const styles: KStyles = {
        kBackground: undefined,
        kForeground: undefined,
        kFontBold: undefined,
        kFontItalic: undefined,
        kFontName: undefined,
        kFontSize: undefined,
        kHorizontalAlignment: undefined,
        kInvisibility: undefined,
        kLineCap: undefined,
        kLineJoin: undefined,
        kLineStyle: undefined,
        kLineWidth: {lineWidth: 100, type: '', propagateToChildren: false, modifierId: '', selection: false},
        kRotation: undefined,
        kShadow: {xOffset: 200, yOffset: 300, color: {red: 0, green: 0, blue: 0}, type: '', propagateToChildren: false, selection: false, blur: 10},
        kStyleRef: undefined,
        kTextStrikeout: undefined,
        kTextUnderline: undefined,
        kVerticalAlignment: undefined
    }
    const stylesToPropagate: KStyles = styles
    const parProp: Record<string, unknown> =  {}
    const parentNode = new SKNode as SKGraphElement
    parentNode.opacity = 1;
    (parentNode as any).size = {width: 333.66668701171875, height: 265.64208984375};
    (parentNode as any).position = {x: 12, y: 12};
    parentNode.id = '$root$NABRO'
    parentNode.type = 'node'
    parentNode.properties = parProp;

    const view: any = {elements: {size: 1}}
    const target: RenderingTargetKind = 'main'
    const processors: any = {length : 0}
    const context = new SKGraphModelRenderer(view,target,processors);
    context.renderOptionsRegistry = new RenderOptionsRegistry

    const childOfNodeTitle = false

    it('rendering is K_RoundedRectangle', () => {

        const rendering: KContainerRendering = {
            children: [],
            actions: [],
            properties: {},
            type: 'KRoundedRectangleImpl',
            id: '',
            styles: []
        };
        (rendering as KRoundedRectangle).cornerWidth = 8;
        (rendering as KRoundedRectangle).cornerHeight = 8

        const gAttrs: {
            transform?: string | undefined
            style?: VNodeStyle | undefined
        } = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const colorStyles = getSvgColorStyles(styles, context, parentNode)
        colorStyles.background = DEFAULT_CLICKABLE_FILL
        
        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) == ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        
        const lineStyles = getSvgLineStyles(styles, parentNode, context)
        const lineWidth = (styles.kLineWidth?.lineWidth ?? DEFAULT_LINE_WIDTH)

        rendering.properties['klighd.lsp.rendering.id'] = 'test'
        let element: VNode | undefined = undefined

        const rx = (rendering as KRoundedRectangle).cornerWidth
        const ry = (rendering as KRoundedRectangle).cornerHeight

        element = <g id = 'test'{...gAttrs}>
            {...renderSVGRect(boundsAndTransformation.bounds, lineWidth, rx, ry, lineStyles, colorStyles, shadowStyles, styles.kShadow)}
            {renderChildRenderings(rendering, parentNode, stylesToPropagate, context, childOfNodeTitle)}
                  </g>

        const result = renderRectangularShape(rendering, parentNode, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle)
        expect(result).to.deep.equal(element)
    }) // maybe it is useful to test the renderChildRendering aswell

    it('Rendering is Rectangle', () => {
        //it should behave like rounded rectangle

        const rendering: KContainerRendering = {
            children: [],
            actions: [],
            properties: {},
            type: 'KRectangleImpl',
            id: '',
            styles: []
        };

        const gAttrs: {
            transform?: string | undefined
            style?: VNodeStyle | undefined
        } = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const colorStyles = getSvgColorStyles(styles, context, parentNode)
        colorStyles.background = DEFAULT_CLICKABLE_FILL
        
        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) == ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        
        const lineStyles = getSvgLineStyles(styles, parentNode, context)
        const lineWidth = (styles.kLineWidth?.lineWidth ?? DEFAULT_LINE_WIDTH)

        rendering.properties['klighd.lsp.rendering.id'] = 'test'
        let element: VNode | undefined = undefined

        const rx = (rendering as KRoundedRectangle).cornerWidth
        const ry = (rendering as KRoundedRectangle).cornerHeight

        element = <g id = 'test'{...gAttrs}>
            {...renderSVGRect(boundsAndTransformation.bounds, lineWidth, rx, ry, lineStyles, colorStyles, shadowStyles, styles.kShadow)}
            {renderChildRenderings(rendering, parentNode, stylesToPropagate, context, childOfNodeTitle)}
                  </g>

        const result = renderRectangularShape(rendering, parentNode, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle)
        expect(result).to.deep.equal(element)
    })

    it('Rendering is K_Ellipse', () => {
        const rendering: KContainerRendering = {
            children: [],
            actions: [],
            properties: {},
            type: 'KEllipseImpl',
            id: '',
            styles: []
        };
        (rendering as KRoundedRectangle).cornerWidth = 8;
        (rendering as KRoundedRectangle).cornerHeight = 8

        const gAttrs: {
            transform?: string | undefined
            style?: VNodeStyle | undefined
        } = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const colorStyles = getSvgColorStyles(styles, context, parentNode)
        colorStyles.background = DEFAULT_CLICKABLE_FILL
        
        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) == ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        
        const lineStyles = getSvgLineStyles(styles, parentNode, context)
        const lineWidth = (styles.kLineWidth?.lineWidth ?? DEFAULT_LINE_WIDTH)

        rendering.properties['klighd.lsp.rendering.id'] = 'test'
        let element: VNode | undefined = undefined

        element = <g id={rendering.properties['klighd.lsp.rendering.id'] as string} {...gAttrs}>
                {...renderSVGEllipse(boundsAndTransformation.bounds, lineWidth, lineStyles, colorStyles, shadowStyles, styles.kShadow)}
                {renderChildRenderings(rendering, parentNode, stylesToPropagate, context, childOfNodeTitle)}
            </g>
        const result = renderRectangularShape(rendering, parentNode, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle)
        expect(result).to.deep.equal(element)
    })

    it('Rendering is K_ARC && ARC.OPEN', () => {
        const rendering: KContainerRendering = {
            children: [],
            actions: [],
            properties: {},
            type: 'KArcImpl',
            id: '',
            styles: []
        }

        const gAttrs: {
            transform?: string | undefined
            style?: VNodeStyle | undefined
        } = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const colorStyles = getSvgColorStyles(styles, context, parentNode)
        colorStyles.background = DEFAULT_CLICKABLE_FILL
        
        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) == ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        
        const lineStyles = getSvgLineStyles(styles, parentNode, context)
        const lineWidth = (styles.kLineWidth?.lineWidth ?? DEFAULT_LINE_WIDTH)

        rendering.properties['klighd.lsp.rendering.id'] = 'test'
        let element: VNode | undefined = undefined

        const kArcRendering = rendering as KArc
        kArcRendering.arcType = Arc.OPEN
        kArcRendering.arcAngle = 50

        let sweepFlag = 0
        let angle = kArcRendering.arcAngle
        // For a negative angle, rotate the other way around.
        if (angle < 0) {
            angle = -angle
            sweepFlag = 1
        }
        // If the angle is bigger than or equal to 360 degrees, use the same rendering as a KEllipse via fallthrough to that rendering instead.
        if (angle < 360) {
            // Calculation to get the start and endpoint of the arc from the angles given.
            // Reduce the width and height by half the linewidth on both sides, so the ellipse really stays within the given bounds.
            const width = boundsAndTransformation.bounds.width - lineWidth
            const height = boundsAndTransformation.bounds.height - lineWidth
            const rX = width / 2
            const rY = height / 2
            const midX = rX + lineWidth / 2
            const midY = rY + lineWidth / 2
            const startX = midX + rX * Math.cos(kArcRendering.startAngle * Math.PI / 180)
            const startY = midY - rY * Math.sin(kArcRendering.startAngle * Math.PI / 180)
            const endAngle = kArcRendering.startAngle + kArcRendering.arcAngle
            const endX = midX + rX * Math.cos(endAngle * Math.PI / 180)
            const endY = midY - rY * Math.sin(endAngle * Math.PI / 180)


            // If the angle is bigger or equal 180 degrees, use the large arc as of the w3c path specification
            // https://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
            const largeArcFlag = angle >= 180 ? 1 : 0
            // Rotation is not handled via KArcs but via KRotations, so leave this value as 0.
            const rotate = 0

            // The main arc.
            const d = `M${startX},${startY}A${rX},${rY},${rotate},${largeArcFlag},${sweepFlag},${endX},${endY}`
            
            element = <g id={rendering.properties['klighd.lsp.rendering.id'] as string} {...gAttrs}>
                    {...renderSVGArc(lineStyles, colorStyles, shadowStyles, d, styles.kShadow)}
                    {renderChildRenderings(rendering, parentNode, stylesToPropagate, context, childOfNodeTitle)}
                </g>
        }
        const result = renderRectangularShape(rendering, parentNode, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle)
        expect(result).to.deep.equal(element)
    })

    it('Rendering is K_ARC && Arc.CHORD', () => {
        const rendering: KContainerRendering = {
            children: [],
            actions: [],
            properties: {},
            type: 'KArcImpl',
            id: '',
            styles: []
        }

        const gAttrs: {
            transform?: string | undefined
            style?: VNodeStyle | undefined
        } = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const colorStyles = getSvgColorStyles(styles, context, parentNode)
        colorStyles.background = DEFAULT_CLICKABLE_FILL
        
        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) == ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        
        const lineStyles = getSvgLineStyles(styles, parentNode, context)
        const lineWidth = (styles.kLineWidth?.lineWidth ?? DEFAULT_LINE_WIDTH)

        rendering.properties['klighd.lsp.rendering.id'] = 'test'
        let element: VNode | undefined = undefined

        const kArcRendering = rendering as KArc
        kArcRendering.arcType = Arc.CHORD
        kArcRendering.arcAngle = 50

        let sweepFlag = 0
        let angle = kArcRendering.arcAngle
        // For a negative angle, rotate the other way around.
        if (angle < 0) {
            angle = -angle
            sweepFlag = 1
        }
        // If the angle is bigger than or equal to 360 degrees, use the same rendering as a KEllipse via fallthrough to that rendering instead.
        if (angle < 360) {
            // Calculation to get the start and endpoint of the arc from the angles given.
            // Reduce the width and height by half the linewidth on both sides, so the ellipse really stays within the given bounds.
            const width = boundsAndTransformation.bounds.width - lineWidth
            const height = boundsAndTransformation.bounds.height - lineWidth
            const rX = width / 2
            const rY = height / 2
            const midX = rX + lineWidth / 2
            const midY = rY + lineWidth / 2
            const startX = midX + rX * Math.cos(kArcRendering.startAngle * Math.PI / 180)
            const startY = midY - rY * Math.sin(kArcRendering.startAngle * Math.PI / 180)
            const endAngle = kArcRendering.startAngle + kArcRendering.arcAngle
            const endX = midX + rX * Math.cos(endAngle * Math.PI / 180)
            const endY = midY - rY * Math.sin(endAngle * Math.PI / 180)


            // If the angle is bigger or equal 180 degrees, use the large arc as of the w3c path specification
            // https://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
            const largeArcFlag = angle >= 180 ? 1 : 0
            // Rotation is not handled via KArcs but via KRotations, so leave this value as 0.
            const rotate = 0

            // The main arc.
            let d = `M${startX},${startY}A${rX},${rY},${rotate},${largeArcFlag},${sweepFlag},${endX},${endY}`
            d += `L${startX},${startY}`

            element = <g id={rendering.properties['klighd.lsp.rendering.id'] as string} {...gAttrs}>
                    {...renderSVGArc(lineStyles, colorStyles, shadowStyles, d, styles.kShadow)}
                    {renderChildRenderings(rendering, parentNode, stylesToPropagate, context, childOfNodeTitle)}
                </g>
        }
        const result = renderRectangularShape(rendering, parentNode, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle)
        expect(result).to.deep.equal(element)
    })

    it('Rendering is K_ARC && Arc.PIE', () => {
        const rendering: KContainerRendering = {
            children: [],
            actions: [],
            properties: {},
            type: 'KArcImpl',
            id: '',
            styles: []
        }

        const gAttrs: {
            transform?: string | undefined
            style?: VNodeStyle | undefined
        } = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const colorStyles = getSvgColorStyles(styles, context, parentNode)
        colorStyles.background = DEFAULT_CLICKABLE_FILL
        
        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) == ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        
        const lineStyles = getSvgLineStyles(styles, parentNode, context)
        const lineWidth = (styles.kLineWidth?.lineWidth ?? DEFAULT_LINE_WIDTH)

        rendering.properties['klighd.lsp.rendering.id'] = 'test'
        let element: VNode | undefined = undefined

        const kArcRendering = rendering as KArc
        kArcRendering.arcType = Arc.PIE
        kArcRendering.arcAngle = 50

        let sweepFlag = 0
        let angle = kArcRendering.arcAngle
        // For a negative angle, rotate the other way around.
        if (angle < 0) {
            angle = -angle
            sweepFlag = 1
        }
        // If the angle is bigger than or equal to 360 degrees, use the same rendering as a KEllipse via fallthrough to that rendering instead.
        if (angle < 360) {
            // Calculation to get the start and endpoint of the arc from the angles given.
            // Reduce the width and height by half the linewidth on both sides, so the ellipse really stays within the given bounds.
            const width = boundsAndTransformation.bounds.width - lineWidth
            const height = boundsAndTransformation.bounds.height - lineWidth
            const rX = width / 2
            const rY = height / 2
            const midX = rX + lineWidth / 2
            const midY = rY + lineWidth / 2
            const startX = midX + rX * Math.cos(kArcRendering.startAngle * Math.PI / 180)
            const startY = midY - rY * Math.sin(kArcRendering.startAngle * Math.PI / 180)
            const endAngle = kArcRendering.startAngle + kArcRendering.arcAngle
            const endX = midX + rX * Math.cos(endAngle * Math.PI / 180)
            const endY = midY - rY * Math.sin(endAngle * Math.PI / 180)


            // If the angle is bigger or equal 180 degrees, use the large arc as of the w3c path specification
            // https://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
            const largeArcFlag = angle >= 180 ? 1 : 0
            // Rotation is not handled via KArcs but via KRotations, so leave this value as 0.
            const rotate = 0

            // The main arc.
            let d = `M${startX},${startY}A${rX},${rY},${rotate},${largeArcFlag},${sweepFlag},${endX},${endY}`
            d += `L${midX},${midY}L${startX},${startY}`

            element = <g id={rendering.properties['klighd.lsp.rendering.id'] as string} {...gAttrs}>
                    {...renderSVGArc(lineStyles, colorStyles, shadowStyles, d, styles.kShadow)}
                    {renderChildRenderings(rendering, parentNode, stylesToPropagate, context, childOfNodeTitle)}
                </g>
        }
        const result = renderRectangularShape(rendering, parentNode, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle)
        expect(result).to.deep.equal(element)
    })

    it('Rendering is K_IMAGE', () => {
        /**
         * cannot test this case, because there is no access to
         * the sessionStorage
         */
    })

    it('Rendering is nothing --> should throw error', () => {
        // const rendering: KContainerRendering = {
        //     children: [],
        //     actions: [],
        //     properties: {},
        //     type: 'nothing',
        //     id: '',
        //     styles: []
        // }

        // /**
        //  * should work but it doesn't
        //  */

        // //const result = renderRectangularShape(rendering, parentNode, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle)
        // expect(function() {renderRectangularShape(rendering, parentNode, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle)}).to.throw(new Error('Rendering is neither an KArc, KEllipse, KImage, nor a KRectangle or KRoundedRectangle!'))
        
    })

    it('styles are invisible', () => {

        const rendering: KContainerRendering = {
            children: [],
            actions: [],
            properties: {},
            type: 'KArcImpl',
            id: '',
            styles: []
        }
        
        const styles: KStyles = {
            kBackground: undefined,
            kForeground: undefined,
            kFontBold: undefined,
            kFontItalic: undefined,
            kFontName: undefined,
            kFontSize: undefined,
            kHorizontalAlignment: undefined,
            kInvisibility: {invisible: true, type: '', propagateToChildren: false, selection: false},
            kLineCap: undefined,
            kLineJoin: undefined,
            kLineStyle: undefined,
            kLineWidth: {lineWidth: 100, type: '', propagateToChildren: false, modifierId: '', selection: false},
            kRotation: undefined,
            kShadow: {xOffset: 200, yOffset: 300, color: {red: 0, green: 0, blue: 0}, type: '', propagateToChildren: false, selection: false, blur: 10},
            kStyleRef: undefined,
            kTextStrikeout: undefined,
            kTextUnderline: undefined,
            kVerticalAlignment: undefined
        }

        const gAttrs: {
            transform?: string | undefined
            style?: VNodeStyle | undefined
        } = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const result = renderRectangularShape(rendering, parentNode, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle)
        expect(result).to.deep.equal(<g {...gAttrs}>
            {renderChildRenderings(rendering, parentNode, stylesToPropagate, context, childOfNodeTitle)}
        </g>)
    })
})

describe('testing renderLine', () => {

    const boundsAndTransformation: BoundsAndTransformation = {
        bounds: {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        },
        transformation: []
    }

    const styles: KStyles = {
        kBackground: undefined,
        kForeground: undefined,
        kFontBold: undefined,
        kFontItalic: undefined,
        kFontName: undefined,
        kFontSize: undefined,
        kHorizontalAlignment: undefined,
        kInvisibility: undefined,
        kLineCap: undefined,
        kLineJoin: undefined,
        kLineStyle: undefined,
        kLineWidth: {lineWidth: 100, type: '', propagateToChildren: false, modifierId: '', selection: false},
        kRotation: undefined,
        kShadow: {xOffset: 200, yOffset: 300, color: {red: 0, green: 0, blue: 0}, type: '', propagateToChildren: false, selection: false, blur: 10},
        kStyleRef: undefined,
        kTextStrikeout: undefined,
        kTextUnderline: undefined,
        kVerticalAlignment: undefined
    }

    const stylesToPropagate: KStyles = styles
    
    const parProp: Record<string, unknown> =  {}
    const parentNode = new SKNode as SKGraphElement
    parentNode.opacity = 1;
    (parentNode as any).size = {width: 333.66668701171875, height: 265.64208984375};
    (parentNode as any).position = {x: 12, y: 12};
    parentNode.id = '$root$NABRO'
    parentNode.type = 'node'
    parentNode.properties = parProp;

    const view: any = {elements: {size: 1}}
    const target: RenderingTargetKind = 'main'
    const processors: any = {length : 0}
    const context = new SKGraphModelRenderer(view,target,processors);
    context.renderOptionsRegistry = new RenderOptionsRegistry

    const childOfNodeTitle = false

    it('styles are invisible', () => {
        
        const rendering: KPolyline = {
            children: [],
            actions: [],
            properties: {},
            type: 'KArcImpl',
            id: '',
            styles: [],
            points: [],
            junctionPointRendering: {actions: [], properties: parProp, type: '', id: '', styles: []}
        }
        
        const styles: KStyles = {
            kBackground: undefined,
            kForeground: undefined,
            kFontBold: undefined,
            kFontItalic: undefined,
            kFontName: undefined,
            kFontSize: undefined,
            kHorizontalAlignment: undefined,
            kInvisibility: {invisible: true, type: '', propagateToChildren: false, selection: false},
            kLineCap: undefined,
            kLineJoin: undefined,
            kLineStyle: undefined,
            kLineWidth: {lineWidth: 100, type: '', propagateToChildren: false, modifierId: '', selection: false},
            kRotation: undefined,
            kShadow: {xOffset: 200, yOffset: 300, color: {red: 0, green: 0, blue: 0}, type: '', propagateToChildren: false, selection: false, blur: 10},
            kStyleRef: undefined,
            kTextStrikeout: undefined,
            kTextUnderline: undefined,
            kVerticalAlignment: undefined
        }

        const gAttrs: {
            transform?: string | undefined
            style?: VNodeStyle | undefined
        } = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const result = renderLine( rendering, parentNode, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle)
        expect(result).to.deep.equal(<g {...gAttrs}>
            {renderChildRenderings(rendering, parentNode, stylesToPropagate, context, childOfNodeTitle)}
        </g>)
    })

    it('length of points === 0', () => {

        const parProp: Record<string, unknown> =  {}

        const rendering: KPolyline = {
            children: [],
            actions: [],
            properties: {},
            type: 'KPolygonImpl',
            id: '',
            styles: [],
            points: [],
            junctionPointRendering: {actions: [], properties: parProp, type: '', id: '', styles: []}
        }

        const parentNode = new SKNode as SKGraphElement
        parentNode.opacity = 1;
        (parentNode as any).size = {width: 333.66668701171875, height: 265.64208984375};
        (parentNode as any).position = {x: 12, y: 12};
        parentNode.id = '$root$NABRO'
        parentNode.type = 'node'
        parentNode.properties = parProp;
        (parentNode as any).routingPoints = 0

        const result = renderLine(rendering, parentNode, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle)
        expect(result).to.deep.equal(<g>
            {renderChildRenderings(rendering, parentNode, stylesToPropagate, context, childOfNodeTitle)}
        </g>)
    })

    it('rendering is K_SPLINE', () => {
        
        const rendering: KPolyline = {
            children: [],
            actions: [],
            properties: {},
            type: 'KSplineImpl',
            id: '',
            styles: [],  
            points: [{x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}},
                      {x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}},
                      {x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}},
                      {x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}}],
                      // genrating 4 points
            junctionPointRendering: {actions: [], properties: parProp, type: '', id: '', styles: []}
        }

        const gAttrs = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }
        const colorStyles = getSvgColorStyles(styles, context, parentNode)
        colorStyles.background = DEFAULT_FILL
        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) === ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        const lineStyles = getSvgLineStyles(styles, parentNode, context)
        const points = getPoints(parentNode, rendering, boundsAndTransformation)
        let path = ''


        // because there are 4 points we are going through all the ifs
        path += `M${points[0].x},${points[0].y}`
        for (let i = 1; i < points.length; i = i + 3) {
            const remainingPoints = points.length - i
            if (remainingPoints === 1) {
                // if one routing point is left, draw a straight line to there.
                path += `L${points[i].x},${points[i].y}`
            } else if (remainingPoints === 2) {
                // if two routing points are left, draw a quadratic bezier curve with those two points.
                path += `Q${points[i].x},${points[i].y} ${points[i + 1].x},${points[i + 1].y}`
            } else {
                // if three or more routing points are left, draw a cubic bezier curve with those points.
                path += `C${points[i].x},${points[i].y} `
                    + `${points[i + 1].x},${points[i + 1].y} `
                    + `${points[i + 2].x},${points[i + 2].y}`
            }
        }
        rendering.properties['klighd.lsp.rendering.id'] = 'test'

        const element = <g id={rendering.properties['klighd.lsp.rendering.id'] as string} {...gAttrs}>
            {...renderSVGLine(lineStyles, colorStyles, shadowStyles, path, rendering.type == K_POLYGON ? styles.kShadow : undefined)}
            {renderChildRenderings(rendering, parentNode, stylesToPropagate, context, childOfNodeTitle)}
        </g>
        
        const result = renderLine(rendering, parentNode, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle)
        expect(result).to.deep.equal(element)

    })

    it('rendering is K_POLYGON', () => {

        const rendering: KPolyline = {
            children: [],
            actions: [],
            properties: {},
            type: 'KPolygonImpl',
            id: '',
            styles: [],
            points: [{x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}},
                      {x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}},
                      {x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}},
                      {x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}}],
                      // genrating 4 points
            junctionPointRendering: {actions: [], properties: parProp, type: '', id: '', styles: []}
        }


        const gAttrs = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const colorStyles = getSvgColorStyles(styles, context, parentNode)
        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) === ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        const lineStyles = getSvgLineStyles(styles, parentNode, context)
        const points = getPoints(parentNode, rendering, boundsAndTransformation)

        let path = ''

        path += `M${points[0].x},${points[0].y}`
        for (let i = 1; i < points.length; i++) {
            path += `L${points[i].x},${points[i].y}`
        }
        // because we have a K_POLYGON
        path += 'Z'

        const element = <g id={rendering.properties['klighd.lsp.rendering.id'] as string} {...gAttrs}>
            {...renderSVGLine(lineStyles, colorStyles, shadowStyles, path, rendering.type == K_POLYGON ? styles.kShadow : undefined)}
            {renderChildRenderings(rendering, parentNode, stylesToPropagate, context, childOfNodeTitle)}
        </g>

        const result = renderLine(rendering, parentNode, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle)
        expect(result).to.deep.equal(element)
    })

    it('rendering is K_POLYLINE', () => {
        // should be treated like K_POLYGON, but without 'Z' beeing added to path

        const rendering: KPolyline = {
            children: [],
            actions: [],
            properties: {},
            type: 'KPolylineImpl',
            id: '',
            styles: [],
            points: [{x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}},
                      {x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}},
                      {x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}},
                      {x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}}],
                      // genrating 4 points
            junctionPointRendering: {actions: [], properties: parProp, type: '', id: '', styles: []}
        }


        const gAttrs = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const colorStyles = getSvgColorStyles(styles, context, parentNode)
        colorStyles.background = DEFAULT_FILL
        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) === ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        const lineStyles = getSvgLineStyles(styles, parentNode, context)
        const points = getPoints(parentNode, rendering, boundsAndTransformation)

        let path = ''

        path += `M${points[0].x},${points[0].y}`
        for (let i = 1; i < points.length; i++) {
            path += `L${points[i].x},${points[i].y}`
        }

        const element = <g id={rendering.properties['klighd.lsp.rendering.id'] as string} {...gAttrs}>
            {...renderSVGLine(lineStyles, colorStyles, shadowStyles, path, rendering.type == K_POLYGON ? styles.kShadow : undefined)}
            {renderChildRenderings(rendering, parentNode, stylesToPropagate, context, childOfNodeTitle)}
        </g>

        const result = renderLine(rendering, parentNode, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle)
        expect(result).to.deep.equal(element)
    })

    it('rendering is K_ROUNDED_BENDS_POLYLINE', () =>  {

        const rendering: KPolyline = {
            children: [],
            actions: [],
            properties: {},
            type: 'KRoundedBendsPolylineImpl',
            id: '',
            styles: [],
            points: [{x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}},
                      {x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}},
                      {x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}},
                      {x: {type: '', absolute: 10, relative: 10},
                      y: {type: '', absolute: 20, relative: 20}}],
                      // genrating 4 points
            junctionPointRendering: {actions: [], properties: parProp, type: '', id: '', styles: []}
        };
        (rendering as KRoundedBendsPolyline).bendRadius = 10

        const result = renderLine(rendering, parentNode, boundsAndTransformation, styles, stylesToPropagate, context, childOfNodeTitle)

        const gAttrs = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const colorStyles = getSvgColorStyles(styles, context, parentNode)
        colorStyles.background = DEFAULT_FILL
        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) === ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        const lineStyles = getSvgLineStyles(styles, parentNode, context)
        const points = getPoints(parentNode, rendering, boundsAndTransformation)

        let path = ''

        const bendRadius = (rendering as KRoundedBendsPolyline).bendRadius

        path += `M${points[0].x},${points[0].y}`

        for (let i = 1; i < points.length - 1; i++) {
            const p0 = points[i - 1]
            const p = points[i]
            const p1 = points[i + 1]
            // last point
            const x0 = p0.x
            const y0 = p0.y
            // current point where a bend should be rendered
            const xp = p.x
            const yp = p.y
            // next point
            const x1 = p1.x
            const y1 = p1.y
            // distance between the last point and the current point
            const dist0 = Math.sqrt((x0 - xp) * (x0 - xp) + (y0 - yp) * (y0 - yp))
            // distance between the current point and the next point
            const dist1 = Math.sqrt((x1 - xp) * (x1 - xp) + (y1 - yp) * (y1 - yp))
            // If the previous / next point is too close, use a smaller bend radius
            const usedBendRadius = Math.min(bendRadius, dist0 / 2, dist1 / 2)
            // start and end points of the bend
            let xs, ys, xe, ye
            if (usedBendRadius === 0) {
                // Avoid division by zero if two points are identical.
                xs = xp
                ys = yp
                xe = xp
                ye = yp
            } else {
                xs = xp + (usedBendRadius * (x0 - xp)) / dist0
                ys = yp + (usedBendRadius * (y0 - yp)) / dist0
                xe = xp + (usedBendRadius * (x1 - xp)) / dist1
                ye = yp + (usedBendRadius * (y1 - yp)) / dist1
            }
            // draw a line to the start of the bend point (from the last end of its bend)
            // and then draw the bend with the control points of the point itself and the bend end point.
            path += `L${xs},${ys}Q${xp},${yp} ${xe},${ye}`
        }
        // because points.length > 1 :
        const lastPoint = points[points.length - 1]
        path += `L${lastPoint.x},${lastPoint.y}`
        
        const element = <g id={rendering.properties['klighd.lsp.rendering.id'] as string} {...gAttrs}>
            {...renderSVGLine(lineStyles, colorStyles, shadowStyles, path, rendering.type == K_POLYGON ? styles.kShadow : undefined)}
            {renderChildRenderings(rendering, parentNode, stylesToPropagate, context, childOfNodeTitle)}
        </g>

        expect(result).to.deep.equal(element)
    })
})

describe('testing renderText', () => {

    const parProp: Record<string, unknown> =  {}

    const rendering: KText = {
        text: 'test',
        cursorSelectable: false,
        editable: false,
        actions: [],
        properties: parProp,
        type: '',
        id: '',
        styles: []
    }

    const styles: KStyles = {
        kBackground: {
            color: {red: 10, green: 20, blue: 30},
            alpha: 10,
            gradientAngle: 10,
            type: '',
            propagateToChildren: false,
            selection: false
        },
        kForeground: undefined,
        kFontBold: undefined,
        kFontItalic: undefined,
        kFontName: undefined,
        kFontSize: undefined,
        kHorizontalAlignment: undefined,
        kInvisibility: undefined,
        kLineCap: undefined,
        kLineJoin: undefined,
        kLineStyle: undefined,
        kLineWidth: {lineWidth: 100, type: '', propagateToChildren: false, modifierId: '', selection: false},
        kRotation: undefined,
        kShadow: {xOffset: 200, yOffset: 300, color: {red: 0, green: 0, blue: 0}, type: '', propagateToChildren: false, selection: false, blur: 10},
        kStyleRef: undefined,
        kTextStrikeout: undefined,
        kTextUnderline: undefined,
        kVerticalAlignment: undefined
    }

    const parentNode = new SKNode as SKGraphElement
    parentNode.opacity = 1;
    (parentNode as any).size = {width: 333.66668701171875, height: 265.64208984375};
    (parentNode as any).position = {x: 12, y: 12};
    parentNode.id = '$root$NABRO'
    parentNode.type = 'node'
    parentNode.properties = parProp;
    (parentNode as any).shadow = true

    const view: any = {elements: {size: 1}}
    const target: RenderingTargetKind = 'main'
    const processors: any = {length : 0}
    const context = new SKGraphModelRenderer(view,target,processors);
    context.renderOptionsRegistry = new RenderOptionsRegistry;
    (context as any).mListener = {
        data: [],
        hasDragged: true
    }
   // context.mListener.hasDragged = true

    const boundsAndTransformation: BoundsAndTransformation = {
        bounds: {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        },
        transformation: []
    }

    const childOfNodeTitle = true

    it('text is undefined', () => {
        
        const rendering: KText = {
            text: '',
            cursorSelectable: false,
            editable: false,
            actions: [],
            properties: parProp,
            type: '',
            id: '',
            styles: []
        };
        (rendering as any).text = undefined

        const result = renderKText(rendering, parentNode, boundsAndTransformation, styles, context)
        expect(result).to.deep.equal(<g />)
    })

    it('styles are invisible', () => {
        
        const styles: KStyles = {
            kBackground: undefined,
            kForeground: undefined,
            kFontBold: undefined,
            kFontItalic: undefined,
            kFontName: undefined,
            kFontSize: undefined,
            kHorizontalAlignment: undefined,
            kInvisibility: {invisible: true, type: '', propagateToChildren: false, selection: false},
            kLineCap: undefined,
            kLineJoin: undefined,
            kLineStyle: undefined,
            kLineWidth: {lineWidth: 100, type: '', propagateToChildren: false, modifierId: '', selection: false},
            kRotation: undefined,
            kShadow: {xOffset: 200, yOffset: 300, color: {red: 0, green: 0, blue: 0}, type: '', propagateToChildren: false, selection: false, blur: 10},
            kStyleRef: undefined,
            kTextStrikeout: undefined,
            kTextUnderline: undefined,
            kVerticalAlignment: undefined
        }

        const result = renderKText(rendering, parentNode, boundsAndTransformation, styles, context)
        expect(result).to.deep.equal(<g />)
    })

    it('going through the first relevant three ifs', () => {

        rendering.properties['klighd.calculated.text.bounds'] = {
            x: 10,
            y: 20,
            width: 30,
            height: 40
        }
        context.viewport = {scroll: {x:10,y:20}, zoom: 0}

        const text = rendering.text
        const lines = text.split('\n')

        const colorStyles = getSvgColorStyles(styles, context, parentNode)

        let background: VNode | undefined = undefined

        // first relevant if
        const boundingBoxAndTransformation = findBoundsAndTransformationData(rendering, styles, parentNode, context, false, true)
        background = <rect 
            x={boundingBoxAndTransformation?.bounds?.x ?? 0}
            y={boundingBoxAndTransformation?.bounds?.y ?? 0}
            width={boundingBoxAndTransformation?.bounds?.width ?? 0}
            height={boundingBoxAndTransformation?.bounds?.height ?? 0}
            fill={colorStyles.background.color}
            style={{'opacity': colorStyles.background.opacity ?? '1'}}
        />

        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) === ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        const textStyles = getSvgTextStyles(styles)

        const simplifySmallTextOption = context.renderOptionsRegistry.getValue(SimplifySmallText)
        const simplifySmallText = simplifySmallTextOption ?? false // Only enable, if option is found.

        // second relevant if
        const simplificationThreshold = context.renderOptionsRegistry.getValueOrDefault(TextSimplificationThreshold)
        const proportionalHeight = 0.5

        // third relevant if statement
        const replacements: VNode[] = background ? [background] : []
            lines.forEach((line, index) => {
                const xPos = boundsAndTransformation?.bounds?.x ?? 0
                const yPos = boundsAndTransformation?.bounds?.y && rendering.properties['klighd.calculated.text.line.heights'] as number[] && boundsAndTransformation?.bounds?.height ?
                    boundsAndTransformation.bounds.y - boundsAndTransformation.bounds.height / 2 + (rendering.properties['klighd.calculated.text.line.heights'] as number[])[index] / 2 * proportionalHeight : 0
                const width = rendering.properties['klighd.calculated.text.line.widths'] as number[] ? (rendering.properties['klighd.calculated.text.line.widths'] as number[])[index] : 0
                const height = rendering.properties['klighd.calculated.text.line.heights'] as number[] ? (rendering.properties['klighd.calculated.text.line.heights'] as number[])[index] * proportionalHeight : 0
                // Generate rectangle for each line with color style.
                const curLine = colorStyles.foreground ? <rect x={xPos} y={yPos} width={width} height={height} fill={colorStyles.foreground.color} opacity="0.5" />
                    : <rect x={xPos} y={yPos} width={width} height={height} fill="#000000" opacity="0.5" />
                replacements.push(curLine)
            })
        
        const result = renderKText(rendering, parentNode, boundsAndTransformation, styles, context)
        expect(result).to.deep.equal(<g id={rendering.properties['klighd.lsp.rendering.id'] as string}>
        {...replacements}
    </g>)

    })

    it('the third relevent if = false',() => {
        
        rendering.properties['klighd.calculated.text.bounds'] = {
            x: 10,
            y: 20,
            width: 30,
            height: 40
        }
        context.viewport = {scroll: {x:10,y:20}, zoom: 0}

        const text = rendering.text
        const lines = text.split('\n')

        const colorStyles = getSvgColorStyles(styles, context, parentNode)

        let background: VNode | undefined = undefined

        // first relevant if
        const boundingBoxAndTransformation = findBoundsAndTransformationData(rendering, styles, parentNode, context, false, true)
        background = <rect 
            x={boundingBoxAndTransformation?.bounds?.x ?? 0}
            y={boundingBoxAndTransformation?.bounds?.y ?? 0}
            width={boundingBoxAndTransformation?.bounds?.width ?? 0}
            height={boundingBoxAndTransformation?.bounds?.height ?? 0}
            fill={colorStyles.background.color}
            style={{'opacity': colorStyles.background.opacity ?? '1'}}
        />

        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) === ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        const textStyles = getSvgTextStyles(styles)

        const simplifySmallTextOption = context.renderOptionsRegistry.getValue(SimplifySmallText)
        const simplifySmallText = simplifySmallTextOption ?? false // Only enable, if option is found.

        // second relevant if
        const simplificationThreshold = context.renderOptionsRegistry.getValueOrDefault(TextSimplificationThreshold)
        const proportionalHeight = 0.5;

        //set the last if to false
        (context as any).viewport = undefined

        const opacity = context.mListener.hasDragged ? 0.1 : (parent as any).opacity
        const style = {
            ...{ 'dominant-baseline': textStyles.dominantBaseline },
            ...{ 'font-family': textStyles.fontFamily },
            ...{ 'font-size': textStyles.fontSize },
            ...{ 'font-style': textStyles.fontStyle },
            ...{ 'font-weight': textStyles.fontWeight },
            ...{ 'text-decoration-line': textStyles.textDecorationLine },
            ...{ 'text-decoration-style': textStyles.textDecorationStyle },
            ...{ 'opacity': opacity },
            ...(colorStyles.foreground ? { 'fill-opacity': colorStyles.foreground.opacity } : {})
        }

        // The attributes to be contained in the returned text node.
        const attrs = {
            x: boundsAndTransformation.bounds.x,
            style: style,
            ...(colorStyles.foreground ? { fill: colorStyles.foreground.color } : {}),
            ...(shadowStyles ? { filter: shadowStyles } : {}),
            ...{ 'xml:space': 'preserve' } // This attribute makes the text size adjustment include any trailing white spaces.
        } as any

        const elements: VNode[] = background ? [background] : []

        // next if = true
        attrs.y = boundsAndTransformation.bounds.y;

        rendering.properties['klighd.calculated.text.line.widths'] = 42
        // going inside the next sub if
        attrs.textLength = rendering.properties['klighd.calculated.text.line.widths'] as number[][0]
        attrs.lengthAdjust = 'spacingAndGlyphs'

        elements.push(
            <text {...attrs}>
                {...lines}
            </text>
        )

        const gAttrs = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const result = renderKText(rendering, parentNode, boundsAndTransformation, styles, context)
        expect(result).to.deep.equal(<g id={rendering.properties['klighd.lsp.rendering.id'] as string} {...gAttrs}>
        {...elements}
    </g>)
    })

    it('still the same if as before, but now the last else case', () => {

        rendering.properties['klighd.calculated.text.bounds'] = {
            x: 10,
            y: 20,
            width: 30,
            height: 40
        }
        rendering.calculatedTextLineWidths = [42,420,4200,42000]
        context.viewport = {scroll: {x:10,y:20}, zoom: 0}
        rendering.text = 'hello this is a text for testing \n and it should have a longer length than 1 \n test test test'
        const text = rendering.text
        const lines = text.split('\n')

        const colorStyles = getSvgColorStyles(styles, context, parentNode)

        let background: VNode | undefined = undefined

        // first relevant if
        const boundingBoxAndTransformation = findBoundsAndTransformationData(rendering, styles, parentNode, context, false, true)
        background = <rect 
            x={boundingBoxAndTransformation?.bounds?.x ?? 0}
            y={boundingBoxAndTransformation?.bounds?.y ?? 0}
            width={boundingBoxAndTransformation?.bounds?.width ?? 0}
            height={boundingBoxAndTransformation?.bounds?.height ?? 0}
            fill={colorStyles.background.color}
            style={{'opacity': colorStyles.background.opacity ?? '1'}}
        />

        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) === ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        const textStyles = getSvgTextStyles(styles)

        const simplifySmallTextOption = context.renderOptionsRegistry.getValue(SimplifySmallText)
        const simplifySmallText = simplifySmallTextOption ?? false // Only enable, if option is found.

        // second relevant if
        const simplificationThreshold = context.renderOptionsRegistry.getValueOrDefault(TextSimplificationThreshold)
        const proportionalHeight = 0.5;

        //set the last if to false
        (context as any).viewport = undefined

        const opacity = context.mListener.hasDragged ? 0.1 : (parent as any).opacity
        const style = {
            ...{ 'dominant-baseline': textStyles.dominantBaseline },
            ...{ 'font-family': textStyles.fontFamily },
            ...{ 'font-size': textStyles.fontSize },
            ...{ 'font-style': textStyles.fontStyle },
            ...{ 'font-weight': textStyles.fontWeight },
            ...{ 'text-decoration-line': textStyles.textDecorationLine },
            ...{ 'text-decoration-style': textStyles.textDecorationStyle },
            ...{ 'opacity': opacity },
            ...(colorStyles.foreground ? { 'fill-opacity': colorStyles.foreground.opacity } : {})
        }

        // The attributes to be contained in the returned text node.
        const attrs = {
            x: boundsAndTransformation.bounds.x,
            style: style,
            ...(colorStyles.foreground ? { fill: colorStyles.foreground.color } : {}),
            ...(shadowStyles ? { filter: shadowStyles } : {}),
            ...{ 'xml:space': 'preserve' } // This attribute makes the text size adjustment include any trailing white spaces.
        } as any

        const elements: VNode[] = background ? [background] : []

        // lines.length should not be 1 now so we run into the else case

        const calculatedTextLineWidths = rendering.properties['klighd.calculated.text.line.widths'] as number[]
        const calculatedTextLineHeights = rendering.properties['klighd.calculated.text.line.heights'] as number[]
        let currentY = boundsAndTransformation.bounds.y ?? 0
        
        // sub if = true
        attrs.lengthAdjust = 'spacingAndGlyphs'

        lines.forEach((line, index) => {
            const currentElement = <text
                {...attrs}
                y={currentY}
                {...(calculatedTextLineWidths ? { textLength: calculatedTextLineWidths[index] } : {})}
            >{line}</text>

            elements.push(currentElement)
            currentY = calculatedTextLineHeights ? currentY + calculatedTextLineHeights[index] : currentY
        });

        const gAttrs = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }
        const result = renderKText(rendering, parentNode, boundsAndTransformation, styles, context)
        expect(result).to.deep.equal(<g id={rendering.properties['klighd.lsp.rendering.id'] as string} {...gAttrs}>
        {...elements}
    </g>)
    })

    it('same test as before but the if inside the else case is false', () => {
        
        rendering.properties['klighd.calculated.text.bounds'] = {
            x: 10,
            y: 20,
            width: 30,
            height: 40
        }
        rendering.calculatedTextLineWidths = undefined
        context.viewport = {scroll: {x:10,y:20}, zoom: 0}
        rendering.text = 'hello this is a text for testing \n and it should have a longer length than 1 \n test test test'
        const text = rendering.text
        const lines = text.split('\n')

        const colorStyles = getSvgColorStyles(styles, context, parentNode)

        let background: VNode | undefined = undefined

        // first relevant if
        const boundingBoxAndTransformation = findBoundsAndTransformationData(rendering, styles, parentNode, context, false, true)
        background = <rect 
            x={boundingBoxAndTransformation?.bounds?.x ?? 0}
            y={boundingBoxAndTransformation?.bounds?.y ?? 0}
            width={boundingBoxAndTransformation?.bounds?.width ?? 0}
            height={boundingBoxAndTransformation?.bounds?.height ?? 0}
            fill={colorStyles.background.color}
            style={{'opacity': colorStyles.background.opacity ?? '1'}}
        />

        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) === ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        const textStyles = getSvgTextStyles(styles)

        const simplifySmallTextOption = context.renderOptionsRegistry.getValue(SimplifySmallText)
        const simplifySmallText = simplifySmallTextOption ?? false // Only enable, if option is found.

        // second relevant if
        const simplificationThreshold = context.renderOptionsRegistry.getValueOrDefault(TextSimplificationThreshold)
        const proportionalHeight = 0.5;

        //set the last if to false
        (context as any).viewport = undefined

        const opacity = context.mListener.hasDragged ? 0.1 : (parent as any).opacity
        const style = {
            ...{ 'dominant-baseline': textStyles.dominantBaseline },
            ...{ 'font-family': textStyles.fontFamily },
            ...{ 'font-size': textStyles.fontSize },
            ...{ 'font-style': textStyles.fontStyle },
            ...{ 'font-weight': textStyles.fontWeight },
            ...{ 'text-decoration-line': textStyles.textDecorationLine },
            ...{ 'text-decoration-style': textStyles.textDecorationStyle },
            ...{ 'opacity': opacity },
            ...(colorStyles.foreground ? { 'fill-opacity': colorStyles.foreground.opacity } : {})
        }

        // The attributes to be contained in the returned text node.
        const attrs = {
            x: boundsAndTransformation.bounds.x,
            style: style,
            ...(colorStyles.foreground ? { fill: colorStyles.foreground.color } : {}),
            ...(shadowStyles ? { filter: shadowStyles } : {}),
            ...{ 'xml:space': 'preserve' } // This attribute makes the text size adjustment include any trailing white spaces.
        } as any

        const elements: VNode[] = background ? [background] : []

        // lines.length should not be 1 now so we run into the else case

        const calculatedTextLineWidths = rendering.properties['klighd.calculated.text.line.widths'] as number[]
        const calculatedTextLineHeights = rendering.properties['klighd.calculated.text.line.heights'] as number[]
        let currentY = boundsAndTransformation.bounds.y ?? 0
        
        // sub if = false

        lines.forEach((line, index) => {
            const currentElement = <text
                {...attrs}
                y={currentY}
                {...(calculatedTextLineWidths ? { textLength: calculatedTextLineWidths[index] } : {})}
            >{line}</text>

            elements.push(currentElement)
            currentY = calculatedTextLineHeights ? currentY + calculatedTextLineHeights[index] : currentY
        });

        const gAttrs = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }
        const result = renderKText(rendering, parentNode, boundsAndTransformation, styles, context)
        expect(result).to.deep.equal(<g id={rendering.properties['klighd.lsp.rendering.id'] as string} {...gAttrs}>
        {...elements}
    </g>)
    })

    it('now the first relevant if = true', () => {
        
        rendering.properties['klighd.calculated.text.bounds'] = {
            x: 10,
            y: 20,
            width: 30,
            height: 40
        }
        rendering.calculatedTextLineWidths = undefined
        context.viewport = {scroll: {x:10,y:20}, zoom: 0}
        rendering.text = 'hello this is a text for testing'
        const text = rendering.text
        const lines = text.split('\n')

        const colorStyles = getSvgColorStyles(styles, context, parentNode)

        let background: VNode | undefined = undefined

        // the first if = true
        const boundingBoxAndTransformation = findBoundsAndTransformationData(rendering, styles, parentNode, context, false, true)
        background = <rect 
            x={boundingBoxAndTransformation?.bounds?.x ?? 0}
            y={boundingBoxAndTransformation?.bounds?.y ?? 0}
            width={boundingBoxAndTransformation?.bounds?.width ?? 0}
            height={boundingBoxAndTransformation?.bounds?.height ?? 0}
            fill={colorStyles.background.color}
            style={{'opacity': colorStyles.background.opacity ?? '1'}}
        />

        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) === ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        const textStyles = getSvgTextStyles(styles)

        const simplifySmallTextOption = context.renderOptionsRegistry.getValue(SimplifySmallText)
        const simplifySmallText = simplifySmallTextOption ?? false // Only enable, if option is found.

        // so 2nd if should be false
        rendering.properties['klighd.isNodeTitle'] = true

        const opacity = context.mListener.hasDragged ? 0.1 : (parent as any).opacity
        const style = {
            ...{ 'dominant-baseline': textStyles.dominantBaseline },
            ...{ 'font-family': textStyles.fontFamily },
            ...{ 'font-size': textStyles.fontSize },
            ...{ 'font-style': textStyles.fontStyle },
            ...{ 'font-weight': textStyles.fontWeight },
            ...{ 'text-decoration-line': textStyles.textDecorationLine },
            ...{ 'text-decoration-style': textStyles.textDecorationStyle },
            ...{ 'opacity': opacity },
            ...(colorStyles.foreground ? { 'fill-opacity': colorStyles.foreground.opacity } : {})
        }

        // The attributes to be contained in the returned text node.
        const attrs = {
            x: boundsAndTransformation.bounds.x,
            style: style,
            ...(colorStyles.foreground ? { fill: colorStyles.foreground.color } : {}),
            ...(shadowStyles ? { filter: shadowStyles } : {}),
            ...{ 'xml:space': 'preserve' } // This attribute makes the text size adjustment include any trailing white spaces.
        } as any

        const elements: VNode[] = background ? [background] : []

        attrs.y = boundsAndTransformation.bounds.y;
        // Force any SVG renderer rendering this text to use the exact width calculated for it.
        // This avoids overlapping texts or too big gaps at the cost of slightly bigger/tighter glyph spacings
        // when viewed in a different SVG viewer after exporting.
        rendering.properties['klighd.calculated.text.line.widths'] = 42

        // this if is true
        if (rendering.properties['klighd.calculated.text.line.widths'] as number[]) {
            attrs.textLength = rendering.properties['klighd.calculated.text.line.widths'] as number[][0]
            attrs.lengthAdjust = 'spacingAndGlyphs'
        }

        elements.push(
            <text {...attrs}>
                {...lines}
            </text>
        )

        const gAttrs = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const result = renderKText(rendering, parentNode, boundsAndTransformation, styles, context)
        expect(result).to.deep.equal(<g id={rendering.properties['klighd.lsp.rendering.id'] as string} {...gAttrs}>
        {...elements}
    </g>)
    })

    it('the same test case as before but now the sub if = false', () => {

        rendering.properties['klighd.calculated.text.bounds'] = {
            x: 10,
            y: 20,
            width: 30,
            height: 40
        }
        rendering.calculatedTextLineWidths = undefined
        context.viewport = {scroll: {x:10,y:20}, zoom: 0}
        rendering.text = 'hello this is a text for testing'
        const text = rendering.text
        const lines = text.split('\n')

        const colorStyles = getSvgColorStyles(styles, context, parentNode)

        let background: VNode | undefined = undefined

        // the first if = true
        const boundingBoxAndTransformation = findBoundsAndTransformationData(rendering, styles, parentNode, context, false, true)
        background = <rect 
            x={boundingBoxAndTransformation?.bounds?.x ?? 0}
            y={boundingBoxAndTransformation?.bounds?.y ?? 0}
            width={boundingBoxAndTransformation?.bounds?.width ?? 0}
            height={boundingBoxAndTransformation?.bounds?.height ?? 0}
            fill={colorStyles.background.color}
            style={{'opacity': colorStyles.background.opacity ?? '1'}}
        />

        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) === ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        const textStyles = getSvgTextStyles(styles)

        const simplifySmallTextOption = context.renderOptionsRegistry.getValue(SimplifySmallText)
        const simplifySmallText = simplifySmallTextOption ?? false // Only enable, if option is found.

        // so 2nd if should be false
        rendering.properties['klighd.isNodeTitle'] = true
        
        const opacity = context.mListener.hasDragged ? 0.1 : (parent as any).opacity
        const style = {
            ...{ 'dominant-baseline': textStyles.dominantBaseline },
            ...{ 'font-family': textStyles.fontFamily },
            ...{ 'font-size': textStyles.fontSize },
            ...{ 'font-style': textStyles.fontStyle },
            ...{ 'font-weight': textStyles.fontWeight },
            ...{ 'text-decoration-line': textStyles.textDecorationLine },
            ...{ 'text-decoration-style': textStyles.textDecorationStyle },
            ...{ 'opacity': opacity },
            ...(colorStyles.foreground ? { 'fill-opacity': colorStyles.foreground.opacity } : {})
        }

        // The attributes to be contained in the returned text node.
        const attrs = {
            x: boundsAndTransformation.bounds.x,
            style: style,
            ...(colorStyles.foreground ? { fill: colorStyles.foreground.color } : {}),
            ...(shadowStyles ? { filter: shadowStyles } : {}),
            ...{ 'xml:space': 'preserve' } // This attribute makes the text size adjustment include any trailing white spaces.
        } as any

        const elements: VNode[] = background ? [background] : []

        attrs.y = boundsAndTransformation.bounds.y;
        // Force any SVG renderer rendering this text to use the exact width calculated for it.
        // This avoids overlapping texts or too big gaps at the cost of slightly bigger/tighter glyph spacings
        // when viewed in a different SVG viewer after exporting.
        rendering.properties['klighd.calculated.text.line.widths'] = undefined

        // this if is false
        if (rendering.properties['klighd.calculated.text.line.widths'] as number[]) {
            attrs.textLength = rendering.properties['klighd.calculated.text.line.widths'] as number[][0]
            attrs.lengthAdjust = 'spacingAndGlyphs'
        }

        elements.push(
            <text {...attrs}>
                {...lines}
            </text>
        )

        const gAttrs = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const result = renderKText(rendering, parentNode, boundsAndTransformation, styles, context)
        expect(result).to.deep.equal(<g id={rendering.properties['klighd.lsp.rendering.id'] as string} {...gAttrs}>
        {...elements}
    </g>)
    })

    it('the same test case but this time we want the else case with the if = true', () => {

        rendering.properties['klighd.calculated.text.bounds'] = {
            x: 10,
            y: 20,
            width: 30,
            height: 40
        }
        rendering.calculatedTextLineWidths = undefined
        context.viewport = {scroll: {x:10,y:20}, zoom: 0}
        rendering.text = 'hello \n this is a text for testing'
        const text = rendering.text
        const lines = text.split('\n')

        const colorStyles = getSvgColorStyles(styles, context, parentNode)

        let background: VNode | undefined = undefined

        // the first if = true
        const boundingBoxAndTransformation = findBoundsAndTransformationData(rendering, styles, parentNode, context, false, true)
        background = <rect 
            x={boundingBoxAndTransformation?.bounds?.x ?? 0}
            y={boundingBoxAndTransformation?.bounds?.y ?? 0}
            width={boundingBoxAndTransformation?.bounds?.width ?? 0}
            height={boundingBoxAndTransformation?.bounds?.height ?? 0}
            fill={colorStyles.background.color}
            style={{'opacity': colorStyles.background.opacity ?? '1'}}
        />

        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) === ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        const textStyles = getSvgTextStyles(styles)

        const simplifySmallTextOption = context.renderOptionsRegistry.getValue(SimplifySmallText)
        const simplifySmallText = simplifySmallTextOption ?? false // Only enable, if option is found.

        // so 2nd if should be false
        rendering.properties['klighd.isNodeTitle'] = true
        
        const opacity = context.mListener.hasDragged ? 0.1 : (parent as any).opacity
        const style = {
            ...{ 'dominant-baseline': textStyles.dominantBaseline },
            ...{ 'font-family': textStyles.fontFamily },
            ...{ 'font-size': textStyles.fontSize },
            ...{ 'font-style': textStyles.fontStyle },
            ...{ 'font-weight': textStyles.fontWeight },
            ...{ 'text-decoration-line': textStyles.textDecorationLine },
            ...{ 'text-decoration-style': textStyles.textDecorationStyle },
            ...{ 'opacity': opacity },
            ...(colorStyles.foreground ? { 'fill-opacity': colorStyles.foreground.opacity } : {})
        }

        // The attributes to be contained in the returned text node.
        const attrs = {
            x: boundsAndTransformation.bounds.x,
            style: style,
            ...(colorStyles.foreground ? { fill: colorStyles.foreground.color } : {}),
            ...(shadowStyles ? { filter: shadowStyles } : {}),
            ...{ 'xml:space': 'preserve' } // This attribute makes the text size adjustment include any trailing white spaces.
        } as any

        const elements: VNode[] = background ? [background] : []

        // else case 
        const calculatedTextLineWidths = rendering.properties['klighd.calculated.text.line.widths'] as number[]
        const calculatedTextLineHeights = rendering.properties['klighd.calculated.text.line.heights'] as number[]
        let currentY = boundsAndTransformation.bounds.y ?? 0

        rendering.calculatedTextLineWidths = [42,420,4200,42000]
        //should be true now
        if (rendering.calculatedTextLineWidths) {
            attrs.lengthAdjust = 'spacingAndGlyphs'
        }

        lines.forEach((line, index) => {
            const currentElement = <text
                {...attrs}
                y={currentY}
                {...(calculatedTextLineWidths ? { textLength: calculatedTextLineWidths[index] } : {})}
            >{line}</text>

            elements.push(currentElement)
            currentY = calculatedTextLineHeights ? currentY + calculatedTextLineHeights[index] : currentY
        });

        const gAttrs = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const result = renderKText(rendering, parentNode, boundsAndTransformation, styles, context)
        expect(result).to.deep.equal(<g id={rendering.properties['klighd.lsp.rendering.id'] as string} {...gAttrs}>
        {...elements}
    </g>)
    })

    it('same as before but the if inside the else case is false', () => {

        rendering.properties['klighd.calculated.text.bounds'] = {
            x: 10,
            y: 20,
            width: 30,
            height: 40
        }
        rendering.calculatedTextLineWidths = undefined
        context.viewport = {scroll: {x:10,y:20}, zoom: 0}
        rendering.text = 'hello \n this is a text for testing'
        const text = rendering.text
        const lines = text.split('\n')

        const colorStyles = getSvgColorStyles(styles, context, parentNode)

        let background: VNode | undefined = undefined

        // the first if = true
        const boundingBoxAndTransformation = findBoundsAndTransformationData(rendering, styles, parentNode, context, false, true)
        background = <rect 
            x={boundingBoxAndTransformation?.bounds?.x ?? 0}
            y={boundingBoxAndTransformation?.bounds?.y ?? 0}
            width={boundingBoxAndTransformation?.bounds?.width ?? 0}
            height={boundingBoxAndTransformation?.bounds?.height ?? 0}
            fill={colorStyles.background.color}
            style={{'opacity': colorStyles.background.opacity ?? '1'}}
        />

        const paperShadows: boolean = context.renderOptionsRegistry.getValueOrDefault(Shadows) === ShadowOption.PAPER_MODE
        const shadowStyles = paperShadows ? getSvgShadowStyles(styles, context) : undefined
        const textStyles = getSvgTextStyles(styles)

        const simplifySmallTextOption = context.renderOptionsRegistry.getValue(SimplifySmallText)
        const simplifySmallText = simplifySmallTextOption ?? false // Only enable, if option is found.

        // so 2nd if should be false
        rendering.properties['klighd.isNodeTitle'] = true
        
        const opacity = context.mListener.hasDragged ? 0.1 : (parent as any).opacity
        const style = {
            ...{ 'dominant-baseline': textStyles.dominantBaseline },
            ...{ 'font-family': textStyles.fontFamily },
            ...{ 'font-size': textStyles.fontSize },
            ...{ 'font-style': textStyles.fontStyle },
            ...{ 'font-weight': textStyles.fontWeight },
            ...{ 'text-decoration-line': textStyles.textDecorationLine },
            ...{ 'text-decoration-style': textStyles.textDecorationStyle },
            ...{ 'opacity': opacity },
            ...(colorStyles.foreground ? { 'fill-opacity': colorStyles.foreground.opacity } : {})
        }

        // The attributes to be contained in the returned text node.
        const attrs = {
            x: boundsAndTransformation.bounds.x,
            style: style,
            ...(colorStyles.foreground ? { fill: colorStyles.foreground.color } : {}),
            ...(shadowStyles ? { filter: shadowStyles } : {}),
            ...{ 'xml:space': 'preserve' } // This attribute makes the text size adjustment include any trailing white spaces.
        } as any

        const elements: VNode[] = background ? [background] : []

        // else case 
        const calculatedTextLineWidths = rendering.properties['klighd.calculated.text.line.widths'] as number[]
        const calculatedTextLineHeights = rendering.properties['klighd.calculated.text.line.heights'] as number[]
        let currentY = boundsAndTransformation.bounds.y ?? 0

        rendering.calculatedTextLineWidths = undefined
        //should be false now
        if (rendering.calculatedTextLineWidths) {
            attrs.lengthAdjust = 'spacingAndGlyphs'
        }

        lines.forEach((line, index) => {
            const currentElement = <text
                {...attrs}
                y={currentY}
                {...(calculatedTextLineWidths ? { textLength: calculatedTextLineWidths[index] } : {})}
            >{line}</text>

            elements.push(currentElement)
            currentY = calculatedTextLineHeights ? currentY + calculatedTextLineHeights[index] : currentY
        });

        const gAttrs = {
            ...(boundsAndTransformation.transformation.length !== 0 ? { transform: boundsAndTransformation.transformation.map(transformationToSVGString).join('') } : {})
        }

        const result = renderKText(rendering, parentNode, boundsAndTransformation, styles, context)
        expect(result).to.deep.equal(<g id={rendering.properties['klighd.lsp.rendering.id'] as string} {...gAttrs}>
        {...elements}
    </g>)
    })
})

describe('testing renderKRendering', () => {
    
    const parProp: Record<string, unknown> =  {}

    const rendering: KRendering = {
        type: '',
        id: '',
        styles: [],
        actions: [],
        properties: parProp
    }

    const propagatedStyles: KStyles = {
        kBackground: {
            color: {red: 10, green: 20, blue: 30},
            alpha: 10,
            gradientAngle: 10,
            type: '',
            propagateToChildren: false,
            selection: false
        },
        kForeground: undefined,
        kFontBold: undefined,
        kFontItalic: undefined,
        kFontName: undefined,
        kFontSize: undefined,
        kHorizontalAlignment: undefined,
        kInvisibility: undefined,
        kLineCap: undefined,
        kLineJoin: undefined,
        kLineStyle: undefined,
        kLineWidth: {lineWidth: 100, type: '', propagateToChildren: false, modifierId: '', selection: false},
        kRotation: undefined,
        kShadow: {xOffset: 200, yOffset: 300, color: {red: 0, green: 0, blue: 0}, type: '', propagateToChildren: false, selection: false, blur: 10},
        kStyleRef: undefined,
        kTextStrikeout: undefined,
        kTextUnderline: undefined,
        kVerticalAlignment: undefined
    }

    //const modelElement = new SModelRoot as SModelElement
    //modelElement.root = {}

    const parentNode = new SKNode as SKGraphElement
    parentNode.opacity = 1;
    (parentNode as any).size = {width: 333.66668701171875, height: 265.64208984375};
    (parentNode as any).position = {x: 12, y: 12};
    parentNode.id = '$root$NABRO'
    parentNode.type = 'node'
    parentNode.properties = parProp;
    (parentNode as any).shadow = true;
    (parentNode as any).parent = new SParentElement;
    (parentNode as any).root = {
        canvasBounds: {x:1,y:2,width:3,height:4},
        size: {width: -1, height: -1}
    }
    // error at the root attribute

    const view: any = {elements: {size: 1}}
    const target: RenderingTargetKind = 'main'
    const processors: any = {length : 0}
    const context = new SKGraphModelRenderer(view,target,processors);
    context.renderOptionsRegistry = new RenderOptionsRegistry;
    (context as any).mListener = {
        data: [],
        hasDragged: true
    }
    context.titleStorage = new TitleStorage
    context.titleStorage.decendToChild()
    
    it('boundsAndTransformation is undefined', () => {
        
        const parent = new SParentElement as SKGraphElement
        parent.properties = parProp

        const result = renderKRendering(rendering, parent, propagatedStyles, context)
        expect(result).to.deep.equal(renderError(rendering))
    })

    it('rendering is K_CONTAINER_RENDERING (throws also an error)', () => {
        
        rendering.type = 'KContainerRenderingImpl'
        rendering.properties['klighd.lsp.calculated.bounds'] = {x:1,y:2,width:3,height:4}
        rendering.properties['klighd.lsp.calculated.decoration'] = {origin: {x:1,y:2}, bounds: {x:1,y:2,width:3,height:4}, rotation:10}

        const result = renderKRendering(rendering, parentNode, propagatedStyles, context)
        expect(result).to.deep.equal(undefined)
    })

    it('rendering is K_CHILD_AREA, all ifs are false', () => {

        rendering.type = 'KChildAreaImpl'
        rendering.properties['klighd.lsp.calculated.bounds'] = {x:1,y:2,width:3,height:4}
        rendering.properties['klighd.lsp.calculated.decoration'] = {origin: {x:1,y:2}, bounds: {x:1,y:2,width:3,height:4}, rotation:10}
        context.viewport = {
            scroll: {x: 10,y: 20},
            zoom: 42
        };

        const someRegion: any = {
            boundingRectangle:{}
        };

        (context as any).depthMap = undefined

        const result = renderKRendering(rendering, parentNode, propagatedStyles, context)

        const stylesToPropagate = new KStyles(false)
        // Extract the styles of the rendering into a more presentable object.
        const styles = getKStyles(parentNode, rendering, propagatedStyles, context, stylesToPropagate)

        // Determine the bounds of the rendering first and where it has to be placed.
        const isEdge = [K_POLYLINE, K_POLYGON, K_ROUNDED_BENDS_POLYLINE, K_SPLINE].includes(rendering.type)
        const boundsAndTransformation = findBoundsAndTransformationData(rendering, styles, parentNode, context, isEdge)

        const providingRegion = context.depthMap?.getProvidingRegion(parentNode as KNode, context.viewport, context.renderOptionsRegistry)

        console.log(providingRegion)
        // The rectangle that may be drawn behind the title rendering to highlight the overlay
        const overlayRectangle: VNode | undefined = undefined
        // remembers if this rendering is a title rendering and should therefore be rendered overlaying the other renderings.
        const isOverlay = false

        //context has viewport ->
        // maxScale = maxScale / context.viewport.zoom
        let svgRendering = {};
        if (boundsAndTransformation != undefined) {
            context.titleStorage.addTransformations(boundsAndTransformation.transformation)

            // switch case line
            svgRendering = renderChildArea(rendering as KChildArea, parentNode, boundsAndTransformation, context);
            (svgRendering as any).data = {ns:'http://www.w3.org/2000/svg', attrs: {id:undefined}}
            // overlayRectangle is still undefined 

            context.titleStorage.removeTransformations(boundsAndTransformation.transformation.length)
       }
       expect(result).to.deep.equal(svgRendering)
    })

    it('rendering is K_CHILD_AREA, all ifs are true except there are false ifs resulting of previous ifs', () => {
        rendering.type = 'KChildAreaImpl'
        rendering.properties['klighd.lsp.calculated.bounds'] = {x:1,y:2,width:3,height:4}
        rendering.properties['klighd.lsp.calculated.decoration'] = {origin: {x:1,y:2}, bounds: {x:1,y:2,width:3,height:4}, rotation:10}
        context.viewport = {
            scroll: {x: 10,y: 20},
            zoom: 42
        };

        const someRegion: any = {
            boundingRectangle:{}
        };

        const smodelRoot = new SParentElement
        DepthMap.init((smodelRoot as any))
        context.depthMap = DepthMap.getDM()

        const result = renderKRendering(rendering, parentNode, propagatedStyles, context)

        const stylesToPropagate = new KStyles(false)
        // Extract the styles of the rendering into a more presentable object.
        const styles = getKStyles(parentNode, rendering, propagatedStyles, context, stylesToPropagate)

        // Determine the bounds of the rendering first and where it has to be placed.
        const isEdge = [K_POLYLINE, K_POLYGON, K_ROUNDED_BENDS_POLYLINE, K_SPLINE].includes(rendering.type)
        const boundsAndTransformation = findBoundsAndTransformationData(rendering, styles, parentNode, context, isEdge)

        const providingRegion = context.depthMap?.getProvidingRegion(parentNode as KNode, context.viewport, context.renderOptionsRegistry)

        console.log(providingRegion)
        // The rectangle that may be drawn behind the title rendering to highlight the overlay
        const overlayRectangle: VNode | undefined = undefined
        // remembers if this rendering is a title rendering and should therefore be rendered overlaying the other renderings.
        const isOverlay = false

        rendering.properties['klighd.isNodeTitle'] = true

        const titleScalingFactorOption = context.renderOptionsRegistry.getValueOrDefault(TitleScalingFactor) as number
        let maxScale = titleScalingFactorOption

        // context has viewport ->
        maxScale = maxScale / context.viewport.zoom

        let svgRendering = {};
        if (boundsAndTransformation != undefined) {
            context.titleStorage.addTransformations(boundsAndTransformation.transformation)

            // switch case line
            svgRendering = renderChildArea(rendering as KChildArea, parentNode, boundsAndTransformation, context);
            (svgRendering as any).data = {ns:'http://www.w3.org/2000/svg', attrs: {id:undefined}}
            // overlayRectangle is still undefined 

            context.titleStorage.removeTransformations(boundsAndTransformation.transformation.length)
       }
       expect(result).to.deep.equal(svgRendering)
    })
})

describe('testing getJunctionPointRenderings', () => {

    const edge: any = {};
    (edge.data as KGraphData[]) = []

    const view: any = {elements: {size: 1}}
    const target: RenderingTargetKind = 'main'
    const processors: any = {length : 0}
    const context = new SKGraphModelRenderer(view,target,processors);
    context.renderOptionsRegistry = new RenderOptionsRegistry;
    (context as any).mListener = {
        data: [],
        hasDragged: true
    }

    it('kRendering is undefined', () => {

        const result = getJunctionPointRenderings(edge, context)
        expect(result).to.deep.equal([])
    })

    it('kRendering is K_CUSTOM_RENDERING', () => {
        //
    })
})
