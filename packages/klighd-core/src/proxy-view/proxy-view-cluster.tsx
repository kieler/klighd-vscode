/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/** @jsx html */
import { VNode } from "snabbdom";
import { html } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars

/** Returns the rendering of clusters. */
export function getClusterRendering(id: string, numProxies: number, size: number, x: number, y: number): VNode {
    const squareSize = size * 0.9;
    const squareOffset = size * 0.1;
    const textSize = size * 0.5;
    const color = "rgb(220,220,220)";
    const innerID = `$ProxyView$${id}`;
    const outerID = `keith-diagram_sprotty_${innerID}`;
    <g id={`${outerID}1`} transform={`translate(${x}, ${y})`}>
        {/* Bottom right square in background */}
        <g id={`${innerID}1`}>
            <rect width={`${squareSize}`} height={`${squareSize}`} x={`${squareOffset}`} y={`${squareOffset}`} stroke="black" fill={color} style={{ opacity: "1" }}>
            </rect>
            <g id={`${innerID}2`}>
            </g>
        </g>
        {/* Top left square in foreground */}
        <g id={`${innerID}3`}>
            <rect width={`${squareSize}`} height={`${squareSize}`} stroke="black" fill={color} style={{ opacity: "1" }}>
            </rect>
            <g id={`${innerID}4`}>
            </g>
        </g>
        {/* Text containining number of proxies in cluster */}
        <g id={`${outerID}2`} transform={`translate(${textSize * 0.5}, ${textSize})`}>
            <g id={`${innerID}5`}>
                <text style={{ dominantBaseline: "middle", fontFamily: "overpass, sans-serif", fontSize: `${textSize}`, opacity: "1" }}>
                    {numProxies}
                </text>
            </g>
        </g>
    </g>
    return JSON.parse(
        `{
            "sel": "g",
            "data": {
                "ns": "http://www.w3.org/2000/svg",
                "attrs": {
                    "id": "${outerID}1",
                    "transform": "translate(${x}, ${y})"
                },
                "class": {
                    "selected": false
                }
            },
            "children": [
                ${"" /* Bottom right square in background */}
                {
                    "sel": "g",
                    "data": {
                        "ns": "http://www.w3.org/2000/svg",
                        "attrs": {
                            "id": "${innerID}1"
                        }
                    },
                    "children": [
                        {
                            "sel": "rect",
                            "data": {
                                "ns": "http://www.w3.org/2000/svg",
                                "style": {
                                    "opacity": "1"
                                },
                                "attrs": {
                                    "width":${squareSize},
                                    "height":${squareSize},
                                    "x":${squareOffset},
                                    "y":${squareOffset},
                                    "stroke": "black",
                                    "fill": "${color}"
                                }
                            },
                            "children": []
                        },
                        {
                            "sel": "g",
                            "data": {
                                "ns": "http://www.w3.org/2000/svg",
                                "attrs": {
                                    "id": "${innerID}2"
                                }
                            },
                            "children": []
                        }
                    ]
                },
                ${"" /* Top left square in foreground */}
                {
                    "sel": "g",
                    "data": {
                        "ns": "http://www.w3.org/2000/svg",
                        "attrs": {
                            "id": "${innerID}3"
                        }
                    },
                    "children": [
                        {
                            "sel": "rect",
                            "data": {
                                "ns": "http://www.w3.org/2000/svg",
                                "style": {
                                    "opacity": "1"
                                },
                                "attrs": {
                                    "width":${squareSize},
                                    "height":${squareSize},
                                    "stroke": "black",
                                    "fill": "${color}"
                                }
                            },
                            "children": []
                        },
                        {
                            "sel": "g",
                            "data": {
                                "ns": "http://www.w3.org/2000/svg",
                                "attrs": {
                                    "id": "${innerID}4"
                                }
                            },
                            "children": []
                        }
                    ]
                },
                ${"" /* Text containining number of proxies in cluster */}
                {
                    "sel": "g",
                    "data": {
                        "ns": "http://www.w3.org/2000/svg",
                        "attrs": {
                            "id": "${outerID}2",
                            "transform": "translate(${textSize * 0.5}, ${textSize})"
                        },
                        "class": {
                            "selected": false
                        }
                    },
                    "children": [
                        {
                            "sel": "g",
                            "data": {
                                "ns": "http://www.w3.org/2000/svg",
                                "attrs": {
                                    "id": "${innerID}5"
                                }
                            },
                            "children": [
                                {
                                    "sel": "text",
                                    "data": {
                                        "ns": "http://www.w3.org/2000/svg",
                                        "style": {
                                            "dominant-baseline": "middle",
                                            "font-family": "overpass, sans-serif",
                                            "font-size": "${textSize}",
                                            "opacity": 1
                                        }
                                    },
                                    "text": "${numProxies}"
                                }
                            ]
                        }
                    ],
                    "key": "${innerID}6"
                }
            ],
            "key": "${innerID}7"
        }`);
}