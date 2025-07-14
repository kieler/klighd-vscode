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

semanticFilterRule
└── orExpr                              (||)
    └── andExpr                         (&&)
        └── notExpr                     (!)
            └── equalsExpr              (=, !=)
                ├── comparisonExpr      (>=, >, <=, <)
                │   └── addExpr         (+, -)
                │       └── multExpr    (*, /, %)
                │           └── numAtom (unary -)
                │               └── DOUBLE | numtag | NUMTAG listExpr | (addExpr)
                ├── addExpr ((EQ|NEQ) addExpr)
                ├── VAR (EQ|NEQ) VAR
                └── boolAtom
                    ├── TRUE | FALSE
                    ├── tag                   (#id)
                    ├── TAG listExpr          (# [x:list | pred])
                    ├── existsExpr            exists[x:list|pred]
                    ├── forallExpr            forall[x:list|pred]
                    └── (orExpr)

existsExpr
└── 'exists' '[' VAR ':' listExpr '|' varExpr ']'

forallExpr
└── 'forall' '[' VAR ':' listExpr '|' varExpr ']'

listExpr
└── list
    └── SELF | PARENT | CHILDREN | SIBLINGS | ADJACENTS
└── '[' VAR ':' listExpr '|' varExpr ']'

varExpr
└── orExpr
└── VAR '<' orExpr '>'


 */
grammar SemanticFiltering;

semanticFilterRule: orExpr EOF;

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
    | VAR (EQ | NEQ) VAR 
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
    | TAG listExpr
    | existsExpr
    | forallExpr
    | '(' orExpr ')'
    ;

numAtom
    : SUB? DOUBLE
    | numtag
    | NUMTAG listExpr
    | '(' addExpr ')'
    ;

forallExpr
    : 'forall' '[' VAR ':' listExpr '|' varExpr ']'
    ;

existsExpr
    : 'exists' '[' VAR ':' listExpr '|' varExpr ']'
    ;

listExpr
    : list
    | '[' VAR ':' listExpr '|' varExpr ']'
    ;

varExpr
    : orExpr
    | VAR '<' orExpr '>'
    ;

DOUBLE
    : DIGITS                                  // Integers
    | DIGITS? '.' DIGITS (EXPONENT_PART)?     // 0.456, .456, 123.456, .456e-10
    | DIGITS '.' (DIGITS?) (EXPONENT_PART)?   // 123., 123.456, 123.e+10
    | DIGITS EXPONENT_PART                    // 1e10, 1E-10
    ;

VAR: ID;

fragment DIGITS
    : [0-9]+
    ;

fragment EXPONENT_PART
    : [eE] [+-]? DIGITS
    ;

list
    : SELF
    | PARENT
    | CHILDREN
    | SIBLINGS
    | ADJACENTS
    ;
    
tag: TAG ID;
numtag: NUMTAG ID;

TAG: '#';
NUMTAG: '$';
ID: [a-zA-Z]+;

SELF:      'self';
PARENT:    'parent';
CHILDREN:  'children';
SIBLINGS:  'siblings';
ADJACENTS: 'adjacents';

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
