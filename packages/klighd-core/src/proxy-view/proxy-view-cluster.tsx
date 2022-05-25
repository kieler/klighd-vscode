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

import { VNode } from "snabbdom";

/** Returns the rendering of clusters. */
export function getClusterRendering(id: string, numProxies: number, size: number, x: number, y: number): VNode {
    const squareSize = size * 0.9;
    const squareOffset = size * 0.1;
    const textSize = size * 0.5;
    return JSON.parse(
        `{
            "sel": "g",
            "data": {
                "ns": "http://www.w3.org/2000/svg",
                "attrs": {
                    "id": "keith-diagram_sprotty_$ProxyView$${id}",
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
                            "id": "$ProxyView${id}1"
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
                                    "fill": "rgb(220,220,220)"
                                }
                            },
                            "children": []
                        },
                        {
                            "sel": "g",
                            "data": {
                                "ns": "http://www.w3.org/2000/svg",
                                "attrs": {
                                    "id": "$ProxyView${id}2"
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
                            "id": "$ProxyView${id}3"
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
                                    "fill": "rgb(220,220,220)"
                                }
                            },
                            "children": []
                        },
                        {
                            "sel": "g",
                            "data": {
                                "ns": "http://www.w3.org/2000/svg",
                                "attrs": {
                                    "id": "$ProxyView${id}4"
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
                            "id": "keith-diagram_sprotty_$ProxyView$${id}2",
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
                                    "id": "$ProxyView${id}5"
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
                    "key": "$ProxyView$${id}2"
                }
            ],
            "key": "$ProxyView$${id}"
        }`);
}