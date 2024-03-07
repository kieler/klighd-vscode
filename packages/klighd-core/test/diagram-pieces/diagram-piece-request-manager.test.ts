import { expect } from 'chai'
import { describe, it } from 'mocha'
import { GridDiagramPieceRequestManager } from '../../src/diagram-pieces/diagram-piece-request-manager'

describe('coordinate-integer-conversion', () => {
    it('getKey encodes coordinates in a single 32 bit encoding', () => {
        const manager = new GridDiagramPieceRequestManager()
        const key = manager.getKey({ x: 0, y: 0 })
        expect(key).to.equal(0)

        const key2 = manager.getKey({ x: 32766, y: 32766 })
        expect(key2).to.equal(2147352576 + 32766)
    })

    it('getKey throws an error if coordinates are larger than 16 bit unsigned integers', () => {
        const manager = new GridDiagramPieceRequestManager()
        expect(() => manager.getKey({ x: 32768, y: 32768 })).to.throw('Invalid x or y coordinates')
    })

    it('getCoords decodes a 32 bit integer into two 16 bit coordinates', () => {
        const manager = new GridDiagramPieceRequestManager()
        const coords = manager.getCoords(2147352576 + 32766)
        expect(coords).to.deep.equal({ x: 32766, y: 32766 })

        const coords2 = manager.getCoords(0)
        expect(coords2).to.deep.equal({ x: 0, y: 0 })
    })

    it('getCoords throws an error if the integer is larger than 32 bit', () => {
        const manager = new GridDiagramPieceRequestManager()
        expect(() => manager.getCoords(2147352576 + 32766 + 1)).to.throw('Invalid key')
    })
})
