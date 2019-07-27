/** @jsx svg */
import { svg } from 'snabbdom-jsx';
import { VNode } from 'snabbdom/vnode';

/**
 * Creates a rectangle.
 * @param x Left x coordinate of the rectangle.
 * @param y Top y coordinate of the rectangle.
 * @param width Width of the rectangle.
 * @param height Height of the rectangle.
 */
export function createRect(x: number, y: number, width: number, height: number): VNode {
    return  <g> <rect
                    x={x}
                    y={y - 20}
                    width={width}
                    height={height + 40}
                    fill='none'
                    stroke='grey'
                    style={{ 'stroke-dasharray': "4" } as React.CSSProperties}>
                </rect>
            </g>
}

/**
 * Creates a vertical line.
 * @param x x coordinate of the line.
 * @param topY Start of the line on the y-axis.
 * @param botY End of the line on the y-axis.
 */
export function createVerticalLine(x: number, topY: number, botY: number): VNode {
    return  <g> <line
                    x1={x}
                    y1={topY - 20}
                    x2={x}
                    y2={botY + 20}
                    fill='none'
                    stroke='grey'
                    style={{ 'stroke-dasharray': "4" } as React.CSSProperties}
                />
            </g>
}

/**
 * Creates a circle.
 * @param fill Determines whether the circle is filled.
 * @param x The x coordinate of the center.
 * @param y The y coordinate of the center.
 */
export function createCircle(fill: boolean, x: number, y: number): VNode {
    return  <g> <circle
                    cx={x}
                    cy={y}
                    r="2"
                    stroke='grey'
                    fill={fill ? 'grey' : "none"}
                    style={{ 'stroke-width': "0.5" } as React.CSSProperties}
                />
            </g>
}

/**
 * Creates a lock icon.
 * @param xTranslate
 * @param yTranslate
 */
export function lock(xTranslate: number, yTranslate: number): VNode {
    let s = "translate(" + xTranslate + ","
            + yTranslate + ") scale(0.0004,-0.00036)"
    return  <g transform={s}
                fill="grey" stroke="none">
                <path d="M4265 12794 c-22 -2 -92 -9 -155 -15 -1278 -120 -2434 -919 -3018
                    -2085 -162 -323 -287 -708 -346 -1064 -49 -297 -49 -287 -53 -1502 l-4 -1158
                    -329 0 c-285 0 -331 -2 -344 -16 -15 -14 -16 -343 -16 -3468 0 -3332 1 -3453
                    18 -3469 17 -16 343 -17 4484 -17 4313 0 4465 1 4481 18 16 17 17 272 17 3470
                    0 3124 -1 3452 -16 3466 -13 14 -59 16 -344 16 l-329 0 -4 1158 c-4 1215 -4
                    1205 -53 1502 -119 720 -458 1409 -960 1952 -617 666 -1440 1082 -2359 1194
                    -122 14 -579 27 -670 18z m609 -1079 c136 -19 236 -40 351 -71 1030 -282 1806
                    -1137 1984 -2184 38 -225 41 -318 41 -1417 l0 -1073 -2750 0 -2750 0 0 1073
                    c0 1099 3 1192 41 1417 178 1047 953 1900 1984 2184 149 41 348 75 525 90 98
                    8 471 -4 574 -19z"/>
            </g>
}

/**
 * Creates an arrow icon.
 * @param xTranslate
 * @param yTranslate
 * @param vertical Determines whether the arrow should be vertical or horizontal.
 */
export function arrow(xTranslate: number, yTranslate: number, vertical: boolean): VNode {
    let s = "translate(" + xTranslate + ","
            + yTranslate + ")"
    if (vertical) {
        s += " scale(0.0004,-0.0006) rotate(90)"
    } else {
        s += " scale(0.0006,-0.0004)"
    }
    return <g transform={s}
                fill="grey" stroke="none">
                <path d="M3583 6153 c-44 -34 -632 -506 -2778 -2233 -845 -681 -824 -662 -794
                    -726 20 -41 3601 -2972 3637 -2976 33 -5 78 16 92 41 6 13 10 256 10 710 l0
                    691 2650 0 2650 0 0 -695 0 -696 25 -24 c17 -18 35 -25 64 -25 37 0 122 68
                    1838 1473 1100 901 1803 1484 1812 1501 30 64 51 45 -794 726 -2415 1943
                    -2788 2243 -2813 2257 -40 23 -93 11 -115 -26 -16 -27 -17 -86 -17 -720 l0
                    -691 -2650 0 -2650 0 0 690 c0 587 -2 695 -15 719 -28 54 -84 56 -152 4z"/>
            </g>
}