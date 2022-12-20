import { SModelRoot } from 'sprotty';

export type Anchor = MouseEvent | { x: number, y: number };

export function toAnchor(anchor: HTMLElement | { x: number, y: number }): Anchor {
    return anchor instanceof HTMLElement ? { x: anchor.offsetLeft, y: anchor.offsetTop } : anchor;
}

export interface KlighdIContextMenuService {
    show(root: SModelRoot, anchor: Anchor, onHide?: () => void): void;
}

export type KlighdIContextMenuServiceProvider = () => Promise<KlighdIContextMenuService>;