import "reflect-metadata";
import { expect } from 'chai';
import { BoundsAndTransformation, Rotation, Scale, Transformation, Translation, calculateX, calculateY, evaluateKPosition,
        findBoundsAndTransformationData, findById, findTextBoundsAndTransformationData, getKRendering, getPoints, getTransformation, isRotation, isScale, isTranslation, reverseTransformation, transformationToSVGString } from '../../src/views-common';
import { Bounds, Point, toDegrees } from 'sprotty-protocol';
import { HorizontalAlignment, KHorizontalAlignment, KVerticalAlignment,
        KText, VerticalAlignment, KPosition, KRendering, SKGraphElement, Trigger, ModifierState, Decoration, K_TEXT, KRotation, KPolyline, isRendering, KRenderingRef } from '../../src/skgraph-models';
import { DEFAULT_K_HORIZONTAL_ALIGNMENT, DEFAULT_K_VERTICAL_ALIGNMENT, KStyles } from "../../src/views-styles";
import { SKGraphModelRenderer } from "../../src/skgraph-model-renderer";
import { KGraphData} from '@kieler/klighd-interactive/lib/constraint-classes'
import { SParentElement } from "sprotty";
import { SKNode } from "../../src/skgraph-models";

describe('calculation of X', () => {
    const hCENTER: KHorizontalAlignment = {
        horizontalAlignment: HorizontalAlignment.CENTER,
        type: "KHorizontalAlignmentImpl",
        propagateToChildren: false,
        selection: false
    }
    const hRIGHT: KHorizontalAlignment = {
        horizontalAlignment: HorizontalAlignment.RIGHT,
        type: "KHorizontalAlignmentImpl",
        propagateToChildren: false,
        selection: false
    }
    const hLEFT: KHorizontalAlignment = {
        horizontalAlignment: HorizontalAlignment.LEFT,
        type: "KHorizontalAlignmentImpl",
        propagateToChildren: false,
        selection: false
    }

    let x = 10
    let width = 20
    let textWidth = 10

    it('positioning at the left corner with left arguments (without textwidth)', () => {

        for (let i=0; i<50; i++) {
            const result = calculateX(x, width, hLEFT)
            expect(result).to.equal(x)
            x++; width++
        }
        x = 10; width = 20
    });

    it('positioning at the right corner with right arguments (without textwidth)', () => {

        for (let i=0; i<50; i++) {
            const result = calculateX(x, width, hRIGHT)
            expect(result).to.equal(x + width)
            x++; width++
        }
        x = 10; width = 20
    });

    it('positioning in the middle with the middle argument (without textwidth)', () => {
        
        for (let i=0; i<50; i++) {
            const result = calculateX(x, width, hCENTER)
            expect(result).to.equal(x + width/2)
            x++; width++
        }
        x = 10; width = 20
    });

    it('positioning in the middle with the middle argument (with textwidth)', () => {

        for (let i=0; i<50; i++) {
            const result = calculateX(x, width, hCENTER, textWidth)
            expect(result).to.equal(x + width/2 - textWidth/2)
            x++; width++; textWidth++
        }
        x = 10; width = 20; textWidth = 10
    });

    it('positioning at the left corner with the left argument (with textwidth)', () => {

        for (let i=0; i<50; i++) {
            const result = calculateX(x, width, hLEFT, textWidth)
            expect(result).to.equal(x)
            x++; width++; textWidth++
        }
        x = 10; width = 20; textWidth = 10
    });

    it('positioning at the right corner with the right argument (with textwidth)', () => {
        const result = calculateX(10, 100, hRIGHT, 10)
        expect(result).to.equal(10 + 100 - 10)

        for (let i=0; i<50; i++) {
            const result = calculateX(x, width, hRIGHT, textWidth)
            expect(result).to.equal(x + width - textWidth)
            x++; width++; textWidth++
        }
        x = 10; width = 20; textWidth = 10
    }); 
});

describe('calculate of Y', () => {
    const vCENTER: KVerticalAlignment = {
        verticalAlignment: VerticalAlignment.CENTER,
        type: 'KVerticalAlignmentImpl',               // type correct? cause no data
        propagateToChildren: false,
        selection: false
    }
    const vBOTTOM: KVerticalAlignment = {
        verticalAlignment: VerticalAlignment.BOTTOM,
        type: 'KVerticalAlignmentImpl',
        propagateToChildren: false,
        selection: false
    }
    const vTOP: KVerticalAlignment = {
        verticalAlignment: VerticalAlignment.TOP,
        type: 'KVerticalAlignmentImpl',
        propagateToChildren: false,
        selection: false
    }
    
    let y = 10
    let height = 20
    let numberOL = 10

    it('division by zero', () => {
        const result1 = calculateY(10, 20, vBOTTOM, 0)
        expect(function() {return result1}).to.not.throw('Exception: Division by Zero')

        const result2 = calculateY(10, 20, vTOP, 0)
        expect(function() {return result2}).to.not.throw('Exception: Division by Zero')

        const result3 = calculateY(10, 20, vCENTER, 0)
        expect(function() {return result3}).to.not.throw('Exception: Division by Zero')
    });

    it('dealing with floats', () => {
        
        for (let i=0; i<50; i++) {
            const result = calculateY(y, height, vCENTER, numberOL)
            expect(result).to.equal(y + (height/numberOL)/2)
            y++; height++; numberOL++
        }
        y = 20; height = 10; numberOL = 10
    });

    it('positioning at the bottom with bottom argument', () => {

        for (let i=0; i<50; i++) {
            const result = calculateY(y, height, vBOTTOM, numberOL)
            expect(result).to.equal(y + height/numberOL)
            y++; height++; numberOL++
        }
        y = 20; height = 10; numberOL = 10
    });

    it('positioning in the center with center argument',() => {

        for (let i=0; i<50; i++) {
            const result = calculateY(y, height, vCENTER, numberOL)
            expect(result).to.equal(y + (height/numberOL) / 2)
            y++; height++; numberOL++
        }
        y = 20; height = 10; numberOL = 10
    });

    it('positioning at the top with top argument', () => {

        for (let i=0; i<50; i++) {
            const result = calculateY(y, height, vTOP, numberOL)
            expect(result).to.equal(y)
            y++; height++; numberOL++
        }
        y = 20; height = 10; numberOL = 10
    });
});

describe('testing the method evaluateKPosition', () => {

    const pos: KPosition = {
        x: {
            type: 'KLeftPositionImpl',
            absolute: 0,
            relative: 0
        },
        y: {
            type: 'KTopPositionImpl',
            absolute: 0,
            relative: 0
        }
    }

    const parent: Bounds = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    }

    // mit zahlen > 0
    const parent2 : Bounds = {
        x: 200,
        y: 300,
        width: 69,
        height: 42
    }

    it('right calculations for x with bool "true" in case of undefined', () => {

        const result = evaluateKPosition(pos,parent, true)

        expect(result.x).to.equal(parent.width)
    });

    it('right calculations for Y with bool "true" in case of undefined', () => {

        const result = evaluateKPosition(pos,parent, true)

        expect(result.y).to.equal(0*parent.height + 0)
    });

    it('right calculations for x with bool "false" in case of undefined', () => {
        const posFalse: KPosition = {
            x: {
                type: 'K_RIGHT_POSITION',
                absolute: 0,
                relative: 0
            },
            y: {
                type: 'K_BOTTOM_POSITION',
                absolute: 0,
                relative: 0
            }
        }

        const result = evaluateKPosition(posFalse,parent, false)

        expect(result.x).to.equal(parent.width - 0 * parent.width - 0)
    });

    it('right calculations for y with bool "false" in case of undefined', () => {
        const posFalse: KPosition = {
            x: {
                type: 'K_RIGHT_POSITION',
                absolute: 0,
                relative: 0
            },
            y: {
                type: 'K_BOTTOM_POSITION',
                absolute: 0,
                relative: 0
            }
        }

        const result = evaluateKPosition(posFalse,parent, false)

        expect(result.y).to.equal(parent.height - 0 * parent.height - 0)
    });

    it('positions are not undefined x.type = K_LEFT_POSITION && y.type = K_TOP_POSITION', () => {
        const pos2: KPosition = {
            x: {
                type: 'KLeftPositionImpl',
                absolute: 20,
                relative: 50
            },
            y: {
                type: 'KTopPositionImpl',
                absolute: 30,
                relative: 10
            }
        }
        const point = {x:0, y:0}
        const width = parent2.width
        const height = parent2.height
        const xPos = pos2.x
        const yPos = pos2.y

        point.x = xPos.relative * width + xPos.absolute
        point.y = yPos.relative * height + yPos.absolute
        const result = evaluateKPosition(pos2,parent2,true)
        expect(result).to.deep.equal(point)
    })

    it('positions are not undefined x.type != K_LEFT_POSITION && y.type != K_TOP_POSITION', () => {
        const pos2: KPosition = {
            x: {
                type: 'something',
                absolute: 20,
                relative: 50
            },
            y: {
                type: 'something',
                absolute: 30,
                relative: 10
            }
        }
        const point = {x:0, y:0}
        const width = parent2.width
        const height = parent2.height
        const xPos = pos2.x
        const yPos = pos2.y

        point.x = width - xPos.relative * width - xPos.absolute
        point.y = height - yPos.relative * height - yPos.absolute
        const result = evaluateKPosition(pos2,parent2,true)
        expect(result).to.deep.equal(point)
    })

    it('positions are not undefined x.type = K_LEFT_POSITION && y.type != K_TOP_POSITION', () => {
        const pos2: KPosition = {
            x: {
                type: 'KLeftPositionImpl',
                absolute: 20,
                relative: 50
            },
            y: {
                type: 'something',
                absolute: 30,
                relative: 10
            }
        }
        const point = {x:0, y:0}
        const width = parent2.width
        const height = parent2.height
        const xPos = pos2.x
        const yPos = pos2.y


        point.x = xPos.relative * width + xPos.absolute
        point.y = height - yPos.relative * height - yPos.absolute
        const result = evaluateKPosition(pos2, parent2, true)
        expect(result).to.deep.equal(point)
    })

    it('positions are not undefined x.type != K_LEFT_POSITION && y.type = K_TOP_POSITION', () => {
        const pos2: KPosition = {
            x: {
                type: 'something',
                absolute: 20,
                relative: 50
            },
            y: {
                type: 'KTopPositionImpl',
                absolute: 30,
                relative: 10
            }
        }
        const point = {x:0, y:0}
        const width = parent2.width
        const height = parent2.height
        const xPos = pos2.x
        const yPos = pos2.y

        point.x = width - xPos.relative * width - xPos.absolute
        point.y = yPos.relative * height + yPos.absolute
        const result = evaluateKPosition(pos2, parent2, true)
        expect(result).to.deep.equal(point)
    })

})

describe('find bounds and transformation data', () => {
    
    const properties: Record<string, unknown> =  {}

    const textRendering: KText = {
        actions: [{
            actionId: 'KTextImpl',
            trigger: Trigger.SINGLECLICK,
            altPressed: ModifierState.DONT_CARE,
            ctrlCmdPressed: ModifierState.DONT_CARE,
            shiftPressed: ModifierState.DONT_CARE
        }],
        properties: properties,
        type: K_TEXT,
        id: 'KTextImpl',
        styles: [],
        text: 'ABRO',
        cursorSelectable: false,
        editable: false
    };

    const parent = new SParentElement as SKGraphElement
    parent.opacity = 1;
    (parent as any).size = {width: 333.66668701171875, height: 265.64208984375};
    (parent as any).position = {x: 12, y: 12};
    parent.id = '$root$NABRO'
    parent.type = 'node'

    const parProp: Record<string, unknown> =  {}
    const parentNode = new SKNode as SKGraphElement
    parentNode.opacity = 1;
    (parentNode as any).size = {width: 333.66668701171875, height: 265.64208984375};
    (parentNode as any).position = {x: 12, y: 12};
    parentNode.id = '$root$NABRO'
    parentNode.type = 'node'
    parentNode.properties = parProp;

    const styles = new KStyles
    let a: any, b: any, c: any
    const context = new SKGraphModelRenderer(a,b,c)
    const isEdge = true 
    const boundingBox = true

    it('right result for boundingBox = false && rendering = K_TEXT',() => {
        const bbox = false

        const result = findBoundsAndTransformationData(textRendering, styles, parentNode, context, isEdge, bbox)
        expect(result).to.deep.equal(findTextBoundsAndTransformationData(textRendering as KText, styles, parentNode, context))
    })

    it('nothing is defined but size and position exist in parent',() => {

        let bounds
        let decoration

        if (decoration === undefined && bounds === undefined && 'size' in parent && 'position' in parent) {
            bounds = {
                x: (parent as any).position.x,
                y: (parent as any).position.y,
                width: (parent as any).size.width,
                height: (parent as any).size.height
            }
        } else if (decoration === undefined && bounds === undefined) {
            return
        }


        const transformation = getTransformation(bounds, decoration, styles.kRotation, isEdge)
        const result = findBoundsAndTransformationData(textRendering, styles, parentNode, context, isEdge, boundingBox)
        expect(result).to.deep.equal({bounds: bounds,transformation: transformation})
     })

     it('rendering.properties[klighd.lsp.calculated.bounds] as Bounds !== undefined', () => {

        let decoration
        textRendering.properties['klighd.lsp.calculated.bounds'] = ''
        
        const bounds = textRendering.properties['klighd.lsp.calculated.bounds'] as Bounds
        const transformation = getTransformation(bounds, decoration, styles.kRotation, isEdge)
        const result = findBoundsAndTransformationData(textRendering, styles, parentNode, context, isEdge, boundingBox)
        expect(result).to.deep.equal({bounds: bounds, transformation: transformation})
        textRendering.properties['klighd.lsp.calculated.bounds'] = undefined
     })

     it('bounds === undefined && context.boundsMap !== undefined', () => {
        let decoration
        let bounds
        const boundsMapProp: Record<string, unknown> =  {}
        boundsMapProp['klighd.lsp.rendering.id'] = 'hello there'
        textRendering.properties['klighd.lsp.rendering.id'] = 'klighd.lsp.rendering.id'
        context.boundsMap = boundsMapProp
        
        const result = findBoundsAndTransformationData(textRendering, styles, parentNode, context, isEdge, boundingBox)
        bounds = findById(context.boundsMap, textRendering.properties['klighd.lsp.rendering.id'] as string)
        const transformation = getTransformation(bounds, decoration, styles.kRotation, isEdge)
        expect(result).to.deep.equal({bounds: bounds, transformation: transformation})
        bounds = undefined
        context.boundsMap['klighd.lsp.rendering.id'] = undefined
        textRendering.properties['klighd.lsp.rendering.id'] = undefined
     })

     it('rendering.properties[klighd.lsp.calculated.decoration] as Decoration !== undefined', () => {
        let bounds
        let decoration
        textRendering.properties['klighd.lsp.calculated.decoration'] = {origin: {x:1,y:2}, bounds: {x:1,y:2,width:3,height:4}, rotation:10}
        decoration = textRendering.properties['klighd.lsp.calculated.decoration'] as Decoration
        bounds = {
            x: decoration.bounds.x + decoration.origin.x,
            y: decoration.bounds.y + decoration.origin.y,
            width: decoration.bounds.width,
            height: decoration.bounds.height
        }
        const transformation = getTransformation(bounds, decoration, styles.kRotation, isEdge)
        const result = findBoundsAndTransformationData(textRendering, styles, parentNode, context, isEdge, boundingBox)
        expect(result).to.deep.equal({bounds: bounds, transformation: transformation})
        decoration = undefined
        bounds = undefined
        textRendering.properties['klighd.lsp.calculated.decoration'] = undefined
     })

     it('decoration === undefined && context.decorationMap !== undefined', () => {
        let bounds = {x:1,y:2,width:3,height:4}
        let decoration
        context.decorationMap = {}
        context.decorationMap['test'] = {origin: {x:1,y:2}, bounds: {x:1,y:2,width:3,height:4}, rotation:10}
        textRendering.properties['klighd.lsp.rendering.id'] = 'test'
        decoration = findById(context.decorationMap, textRendering.properties['klighd.lsp.rendering.id'] as string)
        bounds = {
            x: decoration.bounds.x + decoration.origin.x,
            y: decoration.bounds.y + decoration.origin.y,
            width: decoration.bounds.width,
            height: decoration.bounds.height
        }
        const transformation = getTransformation(bounds, decoration, styles.kRotation, isEdge)
        const result = findBoundsAndTransformationData(textRendering, styles, parentNode, context, isEdge, boundingBox)
        expect(result).to.deep.equal({bounds: bounds, transformation: transformation})
        decoration = undefined
     })

     it('decoration and bounds are undefined && size and position not in parent', () => {
        const parentWithoutSizeAndPosition = new SParentElement as SKGraphElement
        let a: any, b: any, c: any
        const contextNew = new SKGraphModelRenderer(a,b,c)
        parentWithoutSizeAndPosition.opacity = 1
        const result = findBoundsAndTransformationData(textRendering, styles, parentWithoutSizeAndPosition, contextNew, isEdge, boundingBox)
        expect(result).to.deep.equal(undefined)
     })

    it('parent instance of SKNode && parent.shadow', () => {
        const parentAsSKNode = new SKNode as SKGraphElement;
        (parentAsSKNode as any).shadow = true;
        (parentAsSKNode as any).size = 1;
        (parentAsSKNode as any).position = 1
        let a: any, b: any, c: any
        const contextNew = new SKGraphModelRenderer(a,b,c)
        parentAsSKNode.opacity = 1
        let decoration
        const bounds =  {
            x: (parentAsSKNode as any).shadowX - (parentAsSKNode as any).position.x,
            y: (parentAsSKNode as any).shadowY - (parentAsSKNode as any).position.y,
            width: (parentAsSKNode as any).size.width,
            height: (parentAsSKNode as any).size.height
        }
        const transformation = getTransformation(bounds, decoration, styles.kRotation, isEdge)
        const result = findBoundsAndTransformationData(textRendering, styles, parentAsSKNode, contextNew, isEdge, boundingBox)
        expect(result).to.deep.equal({bounds: bounds, transformation: transformation})
    })
})

describe('testing find text bounds and transformation data', () => {

    const properties: Record<string, unknown> =  {}

    const textRendering: KText = {
        actions: [{
            actionId: 'KTextImpl',
            trigger: Trigger.SINGLECLICK,
            altPressed: ModifierState.DONT_CARE,
            ctrlCmdPressed: ModifierState.DONT_CARE,
            shiftPressed: ModifierState.DONT_CARE
        }],
        properties: properties,
        type: K_TEXT,
        id: 'KTextImpl',
        styles: [],
        text: 'ABRO',
        cursorSelectable: false,
        editable: false
    };

    const parProp: Record<string, unknown> =  {}

    const parentNode = new SKNode as SKGraphElement
    parentNode.opacity = 1;
    (parentNode as any).size = {width: 333.66668701171875, height: 265.64208984375};
    (parentNode as any).position = {x: 12, y: 12};
    parentNode.id = '$root$NABRO'
    parentNode.type = 'node'
    parentNode.properties = parProp;

    const styles = new KStyles
    let a: any, b: any, c: any
    const context = new SKGraphModelRenderer(a,b,c)

    it('klighd calc and klighd lsp calc are not undefined', () => {
        // we wanna go into the 'if's of
        // line 427 if (rendering.properties['klighd.calculated.text.bounds'] as Bounds !== undefined)
        // line 431 if (rendering.properties['klighd.lsp.calculated.bounds'] as Bounds !== undefined)

        const bounds: {
            x: number | undefined,
            y: number | undefined,
            height: number | undefined,
            width: number | undefined
        } = {
            x: undefined,
            y: undefined,
            width: undefined,
            height: undefined
        }
        let decoration
    
        const lines = textRendering.text?.split('\n')?.length ?? 1

        textRendering.properties['klighd.calculated.text.bounds'] = {x:1,y:2,width:3,height:4} as Bounds

        const textWidth = (textRendering.properties['klighd.calculated.text.bounds'] as Bounds).width
        const textHeight = (textRendering.properties['klighd.calculated.text.bounds'] as Bounds).height

        textRendering.properties['klighd.lsp.calculated.bounds'] = {x:1,y:2,width:3,height:4} as Bounds
        const foundBounds = textRendering.properties['klighd.lsp.calculated.bounds'] as Bounds
            bounds.x = calculateX(foundBounds.x, foundBounds.width, styles.kHorizontalAlignment ?? DEFAULT_K_HORIZONTAL_ALIGNMENT, textWidth)
            bounds.y = calculateY(foundBounds.y, foundBounds.height, styles.kVerticalAlignment ?? DEFAULT_K_VERTICAL_ALIGNMENT, lines)
            bounds.width = textWidth
            bounds.height = textHeight

        const transformation = getTransformation(bounds as Bounds, decoration, styles.kRotation, false, true)

        const result = findTextBoundsAndTransformationData(textRendering, styles, parentNode, context)
        expect(result).to.deep.equal({bounds: bounds as Bounds, transformation: transformation})

        textRendering.properties['klighd.calculated.text.bounds'] = undefined
        textRendering.properties['klighd.lsp.calculated.bounds'] = undefined
    })

    it('klighd calc isnt undefined && bounds.x === undefined && context.boundsMap !== undefined plus if condition is true', () => {

        const bounds: {
            x: number | undefined,
            y: number | undefined,
            height: number | undefined,
            width: number | undefined
        } = {
            x: undefined,
            y: undefined,
            width: undefined,
            height: undefined
        }
        let decoration
    
        const lines = textRendering.text?.split('\n')?.length ?? 1
        const boundsMapProp: Record<string, unknown> = {}
        context.boundsMap = boundsMapProp

        textRendering.properties['klighd.calculated.text.bounds'] = {x:1,y:2,width:3,height:4} as Bounds
        const textWidth = (textRendering.properties['klighd.calculated.text.bounds'] as Bounds).width
        const textHeight = (textRendering.properties['klighd.calculated.text.bounds'] as Bounds).height

        textRendering.properties['klighd.lsp.rendering.id'] = 'test'
        context.boundsMap['test'] = {x:1,y:2,width:3,height:4} as Bounds

        const foundBounds = findById(context.boundsMap, textRendering.properties['klighd.lsp.rendering.id'] as string)
            if (bounds !== undefined) {
                bounds.x = calculateX(foundBounds.x, foundBounds.width, styles.kHorizontalAlignment ?? DEFAULT_K_HORIZONTAL_ALIGNMENT, textWidth)
                bounds.y = calculateY(foundBounds.y, foundBounds.height, styles.kVerticalAlignment ?? DEFAULT_K_VERTICAL_ALIGNMENT, lines)
                bounds.width = textWidth
                bounds.height = textHeight
            }

        const transformation = getTransformation(bounds as Bounds, decoration, styles.kRotation, false, true)

        const result = findTextBoundsAndTransformationData(textRendering, styles, parentNode, context)
        expect(result).to.deep.equal({bounds: bounds as Bounds, transformation: transformation})

        textRendering.properties['klighd.calculated.text.bounds'] = undefined
        textRendering.properties['klighd.lsp.calculated.bounds'] = undefined
        context.boundsMap['test'] = undefined
    })

    it('decoration property not undefined', () => {

        const bounds: {
            x: number | undefined,
            y: number | undefined,
            height: number | undefined,
            width: number | undefined
        } = {
            x: undefined,
            y: undefined,
            width: undefined,
            height: undefined
        }
        let decoration

        const lines = textRendering.text?.split('\n')?.length ?? 1

        textRendering.properties['klighd.calculated.text.bounds'] = {x:1,y:2,width:3,height:4} as Bounds
        const textWidth = (textRendering.properties['klighd.calculated.text.bounds'] as Bounds).width
        const textHeight = (textRendering.properties['klighd.calculated.text.bounds'] as Bounds).height
        context.boundsMap['test'] = {x:1,y:2,width:3,height:4} as Bounds
        textRendering.properties['klighd.lsp.calculated.decoration'] = {origin: {x:1,y:2}, bounds: {x:1,y:2,width:3,height:4}, rotation:10} as Decoration
        decoration = textRendering.properties['klighd.lsp.calculated.decoration'] as Decoration
        bounds.x = calculateX(decoration.bounds.x + decoration.origin.x, textWidth, styles.kHorizontalAlignment ?? DEFAULT_K_HORIZONTAL_ALIGNMENT, textWidth)
        bounds.y = calculateY(decoration.bounds.y + decoration.origin.y, textHeight, styles.kVerticalAlignment ?? DEFAULT_K_VERTICAL_ALIGNMENT, lines)
        bounds.width = decoration.bounds.width
        bounds.height = decoration.bounds.height
        const result = findTextBoundsAndTransformationData(textRendering, styles, parentNode, context)
        const transformation = getTransformation(bounds as Bounds, decoration, styles.kRotation, false, true)
        expect(result).to.deep.equal({bounds: bounds as Bounds, transformation: transformation})
        decoration = undefined
        textRendering.properties['klighd.lsp.calculated.decoration'] = undefined
    })

    it('decoration is still undefined && decorationMap isnt undefined', () => {

        const bounds: {
            x: number | undefined,
            y: number | undefined,
            height: number | undefined,
            width: number | undefined
        } = {
            x: undefined,
            y: undefined,
            width: undefined,
            height: undefined
        }
        context.boundsMap['test'] = undefined // !
        const context2 = new SKGraphModelRenderer(a,b,c)
        let decoration
        const textWidth = (textRendering.properties['klighd.calculated.text.bounds'] as Bounds).width
        const textHeight = (textRendering.properties['klighd.calculated.text.bounds'] as Bounds).height
        const lines = textRendering.text?.split('\n')?.length ?? 1
        const decMap: Record<string, unknown> = {}
        context2.decorationMap = decMap
        textRendering.properties['klighd.lsp.rendering.id'] = 'test'
        context2.decorationMap['test'] = {origin: {x:1,y:2}, bounds: {x:1,y:2,width:3,height:4}, rotation:10} 
        textRendering.properties['klighd.lsp.calculated.decoration'] = undefined

        decoration = findById(context2.decorationMap, textRendering.properties['klighd.lsp.rendering.id'] as string)
        if (decoration !== undefined) {
            bounds.x = calculateX(decoration.bounds.x + decoration.origin.x, textWidth, styles.kHorizontalAlignment ?? DEFAULT_K_HORIZONTAL_ALIGNMENT, textWidth)
            bounds.y = calculateY(decoration.bounds.y + decoration.origin.y, textHeight, styles.kVerticalAlignment ?? DEFAULT_K_VERTICAL_ALIGNMENT, lines)
            bounds.width = decoration.bounds.width
            bounds.height = decoration.bounds.height
        }


        const result = findTextBoundsAndTransformationData(textRendering, styles, parentNode, context2)
        const transformation = getTransformation(bounds as Bounds, decoration, styles.kRotation, false, true)
        expect(result).to.deep.equal({bounds: bounds as Bounds, transformation: transformation})
        decoration = undefined
    })

    it('error check: if there are no bounds either decorations', () => {

        const bounds: {
            x: number | undefined,
            y: number | undefined,
            height: number | undefined,
            width: number | undefined
        } = {
            x: undefined,
            y: undefined,
            width: undefined,
            height: undefined
        }
        const context2 = new SKGraphModelRenderer(a,b,c)
        let decoration
        bounds.x = (parentNode as any).position.x
        bounds.y = (parentNode as any).position.y
        bounds.width = (parentNode as any).size.width
        bounds.height = (parentNode as any).size.height

        const result = findTextBoundsAndTransformationData(textRendering, styles, parentNode, context2)
        const transformation = getTransformation(bounds as Bounds, decoration, styles.kRotation, false, true)
        expect(result).to.deep.equal({bounds: bounds as Bounds, transformation: transformation})
    })

    it('not even size and pos are in parent', () => {
        const emptyParent = new SParentElement as SKGraphElement
        emptyParent.properties = parProp
        const context2 = new SKGraphModelRenderer(a,b,c)
        const result = findTextBoundsAndTransformationData(textRendering, styles, emptyParent, context2)
        expect(result).to.deep.equal(undefined)
    })

    it('nothing at all was found so bounds is 0 with all values', () => {

        let bounds: {
            x: number | undefined,
            y: number | undefined,
            height: number | undefined,
            width: number | undefined
        } = {
            x: undefined,
            y: undefined,
            width: undefined,
            height: undefined
        }
        const context2 = new SKGraphModelRenderer(a,b,c)
        let decoration
        textRendering.properties['klighd.calculated.text.bounds'] = undefined

        bounds = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        }
        const result = findTextBoundsAndTransformationData(textRendering, styles, parentNode, context2)
        const transformation = getTransformation(bounds as Bounds, decoration, styles.kRotation, false, true)
        expect(result).to.deep.equal({bounds: bounds as Bounds, transformation: transformation})
    })
})

describe('testing transformationToSVGString', () => {

    it('transformation is a rotation and t.x && t.y are undefined', () => {
        const transformation: Transformation = {
            kind: 'rotate'
        }
        const result = transformationToSVGString(transformation)
        if (isRotation(transformation)) {
            expect(result).to.deep.equal(`${transformation.kind}(${transformation.angle})`)}
    })

    it('transformation is a rotation but t.x && t.y are defined', () => {
        const transformation: Transformation = {
            kind: 'rotate',
        };
        (transformation as any).x = 0;
        (transformation as any).y = 0
        const result = transformationToSVGString(transformation)
        if (isRotation(transformation)) {
            expect(result).to.deep.equal(`${transformation.kind}(${transformation.angle}, ${transformation.x}, ${transformation.y})`)
        }
    })

    it('transformation is translation', () => {
        const transformation: Transformation = {
            kind: 'translate'
        }
        if (isTranslation(transformation)) {
            const result = transformationToSVGString(transformation)
            expect(result).to.deep.equal(`${transformation.kind}(${transformation.x}, ${transformation.y})`)
        }
    })

    it('transformation is scale', () => {
        const transformation: Transformation = {
            kind: 'scale'
        }
        if (isScale(transformation)) {
            const result = transformationToSVGString(transformation)
            expect(result).to.deep.equal(`${transformation.kind}(${transformation.factor})`)
        }
    })

    it('transformation is nothing at all',() => {
        const transformation: Transformation = {
            kind: 'scale'
        };
        (transformation as any).kind = 'something'
        const result = transformationToSVGString(transformation)
        expect(result).to.deep.equal('')
        
    })
})

describe('testing reverse transformation', () => {

    it('transformation is translation', () => {
        const transformation: Transformation = {
            kind: 'translate'
        }
        if (isTranslation(transformation)) {
            const result = reverseTransformation(transformation)
            expect(result).to.deep.equal({
                kind: 'translate',
                x: -transformation.x,
                y: -transformation.y
            } as Translation)
        }
    })

    it('transformation is rotation', () => {
        const transformation: Transformation = {
            kind: 'rotate',
        };
        (transformation as any).x = 0;
        (transformation as any).y = 0
        const result = reverseTransformation(transformation)
        if (isRotation(transformation)) {
            expect(result).to.deep.equal({
                kind: 'rotate',
                angle: -transformation.angle,
                x: transformation.x,
                y: transformation.y
            } as Rotation)
        }
    })

    it('transformation is scale', () => {
        const transformation: Transformation = {
            kind: 'scale'
        };
        const result = reverseTransformation(transformation)
        expect(result).to.deep.equal({
            kind: 'scale',
            factor: 1 / (transformation as Scale).factor
        } as Scale)
    })
})

describe('testing get transformation', () => {
    // i dont count the first two ifs for isEdge and isText
    const bound: Bounds = {
        x:1,
        y:2,
        width:3,
        height: 4
    }
    const decoration: Decoration = {origin: {x:1,y:2}, bounds: {x:1,y:2,width:3,height:4}, rotation:10}
    const pos: KPosition = {
        x: {
            type: 'KLeftPositionImpl',
            absolute: 1,
            relative: 1
        },
        y: {
            type: 'KTopPositionImpl',
            absolute: 1,
            relative: 1
        }
    }
    const kRotation: KRotation = {
        rotation: 1,
        rotationAnchor: pos,
        type: '',
        propagateToChildren: false,
        selection: false
    }

    const isEdge = false
    const isText = false

    it('everything defined but isEdge && isText', () => {

        const result = getTransformation(bound, decoration, kRotation)

        const transform: Transformation[] = []

        // 1st if
        // The rotation itself
        const rotation: Rotation = {kind: 'rotate', angle: toDegrees(decoration.rotation)}
        // If the rotation is around a point other than (0,0), add the additional parameters to the rotation.
        if (decoration.origin.x !== 0 || decoration.origin.y !== 0) {
            rotation.x = decoration.origin.x
            rotation.y = decoration.origin.y
        }
        transform.push(rotation)

        // 2nd if
        transform.push({kind: 'translate', x: bound.x, y: bound.y} as Translation)

        // 3rd if
        const rotation2: Rotation = {kind: 'rotate', angle: kRotation.rotation}

        // 4th 
        const rotationAnchor = evaluateKPosition(kRotation.rotationAnchor, bound, true)

        // 6th if
        rotation2.x = rotationAnchor.x
        rotation2.y = rotationAnchor.y

        transform.push(rotation2)

        expect(result).to.deep.equal(transform)
    })

    it('everything is defined but isEdge && isText and rotationanchor x,y = 0', () => {
        
        const pos: KPosition = {
            x: {
                type: 'KLeftPositionImpl',
                absolute: 0,
                relative: 0
            },
            y: {
                type: 'KTopPositionImpl',
                absolute: 0,
                relative: 0
            }
        }
        const kRotation2: KRotation = {
            rotation: 1,
            rotationAnchor: pos,
            type: '',
            propagateToChildren: false,
            selection: false
        }
        
        const result = getTransformation(bound, decoration, kRotation2)

        const transform: Transformation[] = []

        // 1st if
        // The rotation itself
        const rotation: Rotation = {kind: 'rotate', angle: toDegrees(decoration.rotation)}
        // If the rotation is around a point other than (0,0), add the additional parameters to the rotation.
        if (decoration.origin.x !== 0 || decoration.origin.y !== 0) {
            rotation.x = decoration.origin.x
            rotation.y = decoration.origin.y
        }
        transform.push(rotation)

        // 2nd if
        transform.push({kind: 'translate', x: bound.x, y: bound.y} as Translation)

        // 3rd if
        const rotation2: Rotation = {kind: 'rotate', angle: kRotation2.rotation}

        // 4th 
        const rotationAnchor = evaluateKPosition(kRotation2.rotationAnchor, bound, true)

        transform.push(rotation2)

        expect(result).to.deep.equal(transform)
    })

    it('rotationAnchor is undefined', () => {

        const pos: KPosition = {
            x: {
                type: 'KLeftPositionImpl',
                absolute: 1,
                relative: 1
            },
            y: {
                type: 'KTopPositionImpl',
                absolute: 1,
                relative: 1
            }
        }
        const kRotation3: KRotation = {
            rotation: 1,
            rotationAnchor: pos,
            type: '',
            propagateToChildren: false,
            selection: false
        };
        (kRotation3 as any).rotationAnchor = undefined

        const result = getTransformation(bound, decoration, kRotation3)
        
        const transform: Transformation[] = []

        // 1st if
        // The rotation itself
        const rotation: Rotation = {kind: 'rotate', angle: toDegrees(decoration.rotation)}
        // If the rotation is around a point other than (0,0), add the additional parameters to the rotation.
        if (decoration.origin.x !== 0 || decoration.origin.y !== 0) {
            rotation.x = decoration.origin.x
            rotation.y = decoration.origin.y
        }
        transform.push(rotation)

        // 2nd if
        transform.push({kind: 'translate', x: bound.x, y: bound.y} as Translation)

        // 3rd if
        const rotation2: Rotation = {kind: 'rotate', angle: kRotation3.rotation}

        // 4th 
        const rotationAnchor = evaluateKPosition(kRotation3.rotationAnchor, bound, true)

        // 5th if
        const CENTER = {
            x: {
                type: 'KLeftPositionImpl',
                absolute: 0,
                relative: 0.5
            },
            y: {
                type: 'KTopPositionImpl',
                absolute: 0,
                relative: 0.5
            }
        }
        kRotation3.rotationAnchor = CENTER

        // 6th if
        rotation2.x = rotationAnchor.x
        rotation2.y = rotationAnchor.y

        transform.push(rotation2)

        expect(result).to.deep.equal(transform)
    })

    it('isEdge is true/defined', () => {
        const result = getTransformation(bound, decoration, kRotation, true, isText)

        const transform: Transformation[] = []

        // 1st if
        // The rotation itself
        const rotation: Rotation = {kind: 'rotate', angle: toDegrees(decoration.rotation)}
        // If the rotation is around a point other than (0,0), add the additional parameters to the rotation.
        if (decoration.origin.x !== 0 || decoration.origin.y !== 0) {
            rotation.x = decoration.origin.x
            rotation.y = decoration.origin.y
        }
        transform.push(rotation)

        // 3rd if
        const rotation2: Rotation = {kind: 'rotate', angle: kRotation.rotation}

        transform.push(rotation2)

        expect(result).to.deep.equal(transform)
    })

    it('isText is true/defined', () => {

        const result = getTransformation(bound, decoration, kRotation, false, true)

        const transform: Transformation[] = []

        // 1st if
        // The rotation itself
        const rotation: Rotation = {kind: 'rotate', angle: toDegrees(decoration.rotation)}
        // If the rotation is around a point other than (0,0), add the additional parameters to the rotation.
        if (decoration.origin.x !== 0 || decoration.origin.y !== 0) {
            rotation.x = decoration.origin.x
            rotation.y = decoration.origin.y
        }
        transform.push(rotation)

        // 3rd if
        const rotation2: Rotation = {kind: 'rotate', angle: kRotation.rotation}

        // 4th 
        const rotationAnchor = evaluateKPosition(kRotation.rotationAnchor, bound, true)

        // 5th if
        const CENTER = {
            x: {
                type: 'KLeftPositionImpl',
                absolute: 0,
                relative: 0.5
            },
            y: {
                type: 'KTopPositionImpl',
                absolute: 0,
                relative: 0.5
            }
        }
        kRotation.rotationAnchor = CENTER

        // 6th if
        rotation2.x = rotationAnchor.x
        rotation2.y = rotationAnchor.y

        transform.push(rotation2)

        expect(result).to.deep.equal(transform)
    })

    it('kRotation.rotation is 0', () => {
        kRotation.rotation = 0
        const result = getTransformation(bound, decoration, kRotation, true, true)

        const transform: Transformation[] = []

        // 1st if
        // The rotation itself
        const rotation: Rotation = {kind: 'rotate', angle: toDegrees(decoration.rotation)}
        // If the rotation is around a point other than (0,0), add the additional parameters to the rotation.
        if (decoration.origin.x !== 0 || decoration.origin.y !== 0) {
            rotation.x = decoration.origin.x
            rotation.y = decoration.origin.y
        }
        transform.push(rotation)

        expect(result).to.deep.equal(transform)
    })

    it('no if statement is true', () => {
        decoration.rotation = 0
        const transform: Transformation[] = []
        const result = getTransformation(bound, decoration, kRotation, true, true)
        expect(result).to.deep.equal(transform)
    })
})

describe('testing getPoints', () => {
    // parent: SKGraphElement | SKEdge, rendering: KPolyline, boundsAndTransformation: BoundsAndTransformation
    const parProp: Record<string, unknown> =  {}

    const parent = new SKNode as SKGraphElement
    parent.opacity = 1;
    (parent as any).size = {width: 333.66668701171875, height: 265.64208984375};
    (parent as any).position = {x: 12, y: 12};
    parent.id = '$root$NABRO'
    parent.type = 'node'
    parent.properties = parProp;

    const pos: KPosition = {
        x: {
            type: 'KLeftPositionImpl',
            absolute: 1,
            relative: 1
        },
        y: {
            type: 'KTopPositionImpl',
            absolute: 1,
            relative: 1
        }
    }

    const kRendering: KRendering = {
        actions: [],
        properties: parProp,
        type: "",
        id: "",
        styles: []
    }

    const rendering: KPolyline = {
        points: [pos],
        junctionPointRendering: kRendering,
        children: [],
        actions: [],
        properties: parProp,
        type: 'KPolygonImpl',
        id: "",
        styles: []
    }

    const boundsAndTransformation: BoundsAndTransformation = {
        bounds: {x:1,y:2,width:3,height:4},
        transformation: []
    }

    it('points is in rendering', () => {
        const result = getPoints(parent,rendering,boundsAndTransformation)
        
        const points: Point[] = []

        const kPositions = rendering.points
        kPositions.forEach(kPosition => {
            const pos = evaluateKPosition(kPosition, boundsAndTransformation.bounds, true)
            points.push({
                x: pos.x + boundsAndTransformation.bounds.x,
                y: pos.y + boundsAndTransformation.bounds.y
            })
        });

        const firstPoint = points[0]
        let minX, maxX, minY, maxY: number

        minX = firstPoint.x
        maxX = firstPoint.x
        minY = firstPoint.y
        maxY = firstPoint.y
        for (let i = 1; i < points.length - 1; i++) {
            const p = points[i]
            if (p.x < minX) {
                minX = p.x
            }
            if (p.x > maxX) {
                maxX = p.x
            }
            if (p.y < minY) {
                minY = p.y
            }
            if (p.y > maxY) {
                maxY = p.y
            }
        }
        
        expect(result).to.deep.equal(points)
    })

    it('points in rendering and length > 1 and last two ifs are true', () => {
        rendering.points = [pos,pos]
        const result = getPoints(parent,rendering,boundsAndTransformation)
        
        const points: Point[] = []

        const kPositions = rendering.points
        kPositions.forEach(kPosition => {
            const pos = evaluateKPosition(kPosition, boundsAndTransformation.bounds, true)
            points.push({
                x: pos.x + boundsAndTransformation.bounds.x,
                y: pos.y + boundsAndTransformation.bounds.y
            })
        });

        const firstPoint = points[0]
        let minX, maxX, minY, maxY: number

        minX = firstPoint.x
        maxX = firstPoint.x
        minY = firstPoint.y
        maxY = firstPoint.y
        for (let i = 1; i < points.length - 1; i++) {
            const p = points[i]
            if (p.x < minX) {
                minX = p.x
            }
            if (p.x > maxX) {
                maxX = p.x
            }
            if (p.y < minY) {
                minY = p.y
            }
            if (p.y > maxY) {
                maxY = p.y
            }
        }

        const EPSILON = 0.001
        const lastPoint = points[points.length - 1]
        let lastX = lastPoint.x
        let lastY = lastPoint.y

        if (maxX - minX === 0 && lastX === maxX) {
            lastX += EPSILON
            points[points.length - 1] = { x: lastX, y: lastY }
        }
        // same for Y
        if (maxY - minY === 0 && lastY === maxY) {
            lastY += EPSILON
            points[points.length - 1] = { x: lastX, y: lastY }
        }
        
        expect(result).to.deep.equal(points)
    })

    it('length of points = 0 && points from rendering', () => {
        rendering.points = []
        const result = getPoints(parent,rendering,boundsAndTransformation)
        
        const points: Point[] = []

        const kPositions = rendering.points
        kPositions.forEach(kPosition => {
            const pos = evaluateKPosition(kPosition, boundsAndTransformation.bounds, true)
            points.push({
                x: pos.x + boundsAndTransformation.bounds.x,
                y: pos.y + boundsAndTransformation.bounds.y
            })
        })
        expect(result).to.deep.equal(points)

    })

    it('length of points = 0 && points from parent', () => {
       // (rendering as any).points = undefined;

        const rendering2: any = {};

        (parent as any).routingPoints = []
        
        const result = getPoints(parent,rendering2,boundsAndTransformation)
        
        let points: Point[] = []
        points = []

        expect(result).to.deep.equal(points)
    })

    it('throw error because points could not be found', () => {
        const rendering2: any = {}
        const parent2: any = {}
        const points: Point[] = []

        const result = getPoints(parent2,rendering2,boundsAndTransformation)
        expect(result).to.deep.equal(points)
    })
})

describe('testing getKRendering', () => {

    const prop: Record<string, unknown> =  {}

    const datas: KGraphData[] = [{type:'KChildAreaImpl'}]

    const context: any = {kRenderingLibrary: undefined}
    context.kRenderingLibrary = {renderings: [{properties: prop}]}
    context.kRenderingLibrary.renderings = [{properties: prop}]
    const rendering = context.kRenderingLibrary.renderings[0]

    it('there is no data.type = K_RENDERING_REF && data is undefined', () => {

            if (isRendering(datas[0])) {
                const result = getKRendering(datas, context)
                expect(result).to.deep.equal(datas[0])
            }
    })

    it('should return undefined', () => {
        const datas: KGraphData[] = []
        const result = getKRendering(datas, context);
        expect(result).to.deep.equal(undefined);
    })

    it('datatype is K_RENDERING_DEF && context has kRenderingLibrary', () => {
        const datas: KGraphData[] = [{type:'KRenderingRefImpl'}]
        const data = datas[0];
        
        (data as KRenderingRef).properties = prop;
        //(rendering as KRendering).properties = prop;
        (data as KRenderingRef).properties['klighd.lsp.rendering.id'] = 'something';
        (data as KRenderingRef).properties['klighd.lsp.calculated.bounds.map'] = prop;
        (data as KRenderingRef).properties['klighd.lsp.calculated.decoration.map'] = prop
        context.boundsMap = {}
        context.decorationMap = {}
        //context.decorationMap['test'] = {origin: {x:1,y:2}, bounds: {x:1,y:2,width:3,height:4}, rotation:10}

        const id = (data as KRenderingRef).properties['klighd.lsp.rendering.id'] as string
        rendering.properties['klighd.lsp.rendering.id'] = id

        const result = getKRendering(datas, context)

        if ((rendering as KRendering).properties['klighd.lsp.rendering.id'] as string === id) {
            context.boundsMap = (data as KRenderingRef).properties['klighd.lsp.calculated.bounds.map'] as Record<string, unknown>
            context.decorationMap = (data as KRenderingRef).properties['klighd.lsp.calculated.decoration.map'] as Record<string, unknown>
            expect(result).to.deep.equal(rendering as KRendering)
        }
    })

    // //vlt nicht so guter test, da der console.log nicht returnt wird
    // it('should throw error: datatype K_RENDERING_REF', () => {
    //     const datas: KGraphData[] = [{type: 'KRenderingRefImpl'}]
    //     const context: any = {}
    //     const result = getKRendering(datas, context)
    //     expect(function() {return result}).to.throw('No KRenderingLibrary for KRenderingRef in context')
    // })
})