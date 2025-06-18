/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2025 by
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


/*
The following tree shows the precedences of the semantic filtering grammar.
Deeper levels of the tree have a higher precedence i.e. bind more tightly.

positionalFilterRule
└── orExpr                              (||)
    └── andExpr                         (&&)
        └── notExpr                     (!)
            └── equalsExpr              (=, !=)
                ├── comparisonExpr      (>=, >, <=, <)
                │   └── addExpr         (+, -)
                │       └── multExpr    (*, /, %)
                │           └── numAtom (unary -)
                │               └── DOUBLE | numtag | (addExpr)
                └── addExpr (alternative path)
                    └── multExpr
                        └── numAtom

boolAtom (used in equalsExpr)
└── TRUE | FALSE | tag | (orExpr)

tag / numtag
└── TAG/NUMTAG ID

positionalQuantifier
└── SELF | PARENT | CHILD | CHILDREN | ...
 */
grammar SemanticFiltering;

semanticFilterRule: positionalFilterRule EOF;

positionalFilterRule
    : orExpr
    | positionalQuantifier '[' orExpr ']'
    ;

orExpr
    : andExpr (OR andExpr)*
    ;

andExpr
    : notExpr (AND notExpr)*
    ;

notExpr
    : NOT notExpr
    | equalsExpr
    ;

equalsExpr
    : comparisonExpr ((EQ | NEQ) comparisonExpr)?
    | addExpr ((EQ | NEQ) addExpr)
    | boolAtom
    ;

comparisonExpr
    : addExpr ((GEQ | GT | LEQ | LT) addExpr)
    ;

addExpr
    :  multExpr ((ADD | SUB) multExpr)*
    ;

multExpr
    : numAtom ((MULT | DIV | MOD) numAtom)*
    ;

boolAtom
    : TRUE
    | FALSE
    | tag
    | '(' orExpr ')'
    ;

numAtom
    : SUB? DOUBLE
    | numtag
    | '(' addExpr ')'
    ;

DOUBLE
    : DIGITS                                  // Integers
    | DIGITS? '.' DIGITS (EXPONENT_PART)?     // 0.456, .456, 123.456, .456e-10
    | DIGITS '.' (DIGITS?) (EXPONENT_PART)?   // 123., 123.456, 123.e+10
    | DIGITS EXPONENT_PART                    // 1e10, 1E-10
    ;

fragment DIGITS
    : [0-9]+
    ;

fragment EXPONENT_PART
    : [eE] [+-]? DIGITS
    ;

positionalQuantifier
    : SELF
    | PARENT
    | CHILD
    | CHILDREN
    | SIBLING
    | SIBLINGS
    | ADJACENT
    | ADJACENTS
    ;
    
tag: TAG ID;
numtag: NUMTAG ID;

TAG: '#';
NUMTAG: '$';
ID: [a-zA-Z]+;

SELF:      '~';
PARENT:    '~'( 'p' | 'parent' );
CHILD:     '~'( 'c' | 'child' );
CHILDREN:  '~'( 'cs' | 'children' );
SIBLING:   '~'( 's' | 'sibling' );
SIBLINGS:  '~'( 'ss' | 'siblings' );
ADJACENT:  '~'( 'a' | 'adjacent' );
ADJACENTS: '~'( 'as' | 'adjacents' );

TRUE: 'true';
FALSE: 'false';

MULT: '*';
DIV: '/';
MOD: '%';
ADD: '+';
SUB: '-';

GEQ: '>=';
GT: '>';
LEQ: '<=';
LT: '<';

EQ: '=';
NEQ: '!=';

NOT: '!';
AND: '&&';
OR: '||';
WS: [\t\r\n ]+ -> skip;
