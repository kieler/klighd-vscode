import { expect } from 'chai'
import { describe, it } from 'mocha'
import { parse } from '../../src/filtering/parser'
import { createFilter } from '../../src/filtering/semantic-filtering-util'
import { SKNode } from '../../src/skgraph-models'

describe('tag expression parsing', () => {
    it('rule: #someTag && #anotherTag', () => {
        const ruleString = '#someTag && #anotherTag'
        const rule = parse(ruleString)
        const filter = createFilter(rule)

        const node = new SKNode()
        node.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'someTag' }, { tag: 'anotherTag' }],
        }
        expect(filter.filterFun(node), 'node with exactly matching tags').to.equal(true)

        const nodeOneTag = new SKNode()
        nodeOneTag.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'differentTag' }, { tag: 'anotherTag' }],
        }
        expect(filter.filterFun(nodeOneTag), 'node with only one matching tag').to.equal(false)

        const nodeMoreTags = new SKNode()
        nodeMoreTags.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'differentTag' },
                { tag: 'anotherTag' },
                { tag: 'someTag' },
            ],
        }
        expect(filter.filterFun(nodeMoreTags), 'node with matching tags and an additional tag').to.equal(true)
    })

    it('rule: #visible && ! #hidden', () => {
        const ruleString = '#visible && ! #hidden'
        const rule = parse(ruleString)
        const filter = createFilter(rule)
    
        const visibleNode = new SKNode()
        visibleNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'visible' }],
        }
        expect(filter.filterFun(visibleNode), 'visible and not hidden').to.equal(true)
    
        const hiddenNode = new SKNode()
        hiddenNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'visible' },
                { tag: 'hidden' },
            ],
        }
        expect(filter.filterFun(hiddenNode), 'visible but also hidden').to.equal(false)
    
        const irrelevantNode = new SKNode()
        irrelevantNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [],
        }
        expect(filter.filterFun(irrelevantNode), 'node with no relevant tags').to.equal(false)
    })

    it('rule: $number = 1', () => {
        const ruleString = '$number = 1'
        const rule = parse(ruleString)
        const filter = createFilter(rule)
    
        const matchingNode = new SKNode()
        matchingNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'number', num: 1 }],
        }
        expect(filter.filterFun(matchingNode), 'node with number = 1').to.equal(true)
    
        const nonMatchingNode = new SKNode()
        nonMatchingNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'number', num: 2 }],
        }
        expect(filter.filterFun(nonMatchingNode), 'node with number != 1').to.equal(false)
    
        const missingValueNode = new SKNode()
        missingValueNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [],
        }
        expect(filter.filterFun(missingValueNode), 'node with no number tag').to.equal(false)
    })

    it('rule: $priority >= 5', () => {
        const ruleString = '$priority >= 5'
        const rule = parse(ruleString)
        const filter = createFilter(rule)
    
        const node = new SKNode()
        node.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'priority', num: 7 }],
        }
        expect(filter.filterFun(node), 'node with priority >= 5').to.equal(true)
    
        const lowPriorityNode = new SKNode()
        lowPriorityNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'priority', num: 3 }],
        }
        expect(filter.filterFun(lowPriorityNode), 'node with priority < 5').to.equal(false)
    })
    
    it('rule: $score + 2 > 10', () => {
        const ruleString = '$score + 2 > 10'
        const rule = parse(ruleString)
        const filter = createFilter(rule)
    
        const node = new SKNode()
        node.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'score', num: 9 }],
        }
        expect(filter.filterFun(node), 'node where score + 2 > 10').to.equal(true)
    
        const nodeTooLow = new SKNode()
        nodeTooLow.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'score', num: 7 }],
        }
        expect(filter.filterFun(nodeTooLow), 'node where score + 2 <= 10').to.equal(false)
    })
    
    it('rule: #active || ( $load < 0.5 && ! #error )', () => {
        const ruleString = '#active || ( $load < 0.5 && ! $error )'
        const rule = parse(ruleString)
        const filter = createFilter(rule)
    
        const activeNode = new SKNode()
        activeNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'active' }],
        }
        expect(filter.filterFun(activeNode), 'active node').to.equal(true)
    
        const efficientNode = new SKNode()
        efficientNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'load', num: 0.3 },
            ],
        }
        expect(filter.filterFun(efficientNode), 'efficient and not erroring').to.equal(true)
    
        const failingNode = new SKNode()
        failingNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'load', num: 0.3 },
                { tag: 'error'},
            ],
        }
        expect(filter.filterFun(failingNode), 'low load but with error').to.equal(false)
    })
    
    it('rule: ! #archived && ( $version = 2 || $version > 3 )', () => {
        const ruleString = '! #archived && ( $version = 2 || $version > 3 )'
        const rule = parse(ruleString)
        const filter = createFilter(rule)
    
        const matchingNode = new SKNode()
        matchingNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'version', num: 4 },
            ],
        }
        expect(filter.filterFun(matchingNode), 'node not archived and version > 3').to.equal(true)
    
        const archivedNode = new SKNode()
        archivedNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'archived' },
                { tag: 'version', num: 4 },
            ],
        }
        expect(filter.filterFun(archivedNode), 'archived node').to.equal(false)
    
        const oldNode = new SKNode()
        oldNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'version', num: 1 },
            ],
        }
        expect(filter.filterFun(oldNode), 'node with version < 2 and not archived').to.equal(false)
    })
    
})
