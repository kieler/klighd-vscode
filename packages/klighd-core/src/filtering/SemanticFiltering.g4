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
└── orExpr                              (||, lowest precedence)
    └── andExpr                        (&&)
        └── notExpr                    (!)
            └── equalsExpr             (=, !=)
                ├── boolAtom
                │   ├── TRUE | FALSE
                │   ├── tagExpr        (#id or # [x:list | pred])
                │   ├── existsExpr     (exists[x:list|pred])
                │   ├── forallExpr     (forall[x:list|pred])
                │   └── '(' orExpr ')' (parentheses)
                ├── comparisonExpr ((EQ|NEQ) comparisonExpr)?
                │   └── addExpr       (+, -)
                ├── addExpr ((EQ|NEQ) addExpr)?
                │   └── multExpr      (*, /, %)
                │       └── numAtom   (unary - optional)
                │           ├── DOUBLE
                │           ├── numtagExpr ($id or $ [x:list|pred])
                │           └── '(' addExpr ')'
                └── ID ((EQ | NEQ) ID)?  (simple identifiers with optional =/!=)
                
comparisonExpr
└── addExpr ((>=, >, <=, <) addExpr)

addExpr
└── multExpr ((+, -) multExpr)*

multExpr
└── numAtom ((* / %) numAtom)*

boolAtom
└── TRUE | FALSE | tagExpr | existsExpr | forallExpr | '(' orExpr ')'

numAtom
└── optional '-' DOUBLE
└── numtagExpr
└── '(' addExpr ')'

forallExpr
└── 'forall' '[' ID ':' listExpr '|' varExpr ']'

existsExpr
└── 'exists' '[' ID ':' listExpr '|' varExpr ']'

tagExpr
└── '#' ID
└── '#' listExpr

numtagExpr
└── '$' ID
└── '$' listExpr

listExpr
└── list (SELF | PARENT | CHILDREN | SIBLINGS | ADJACENTS)
└── '[' ID ':' listExpr '|' varExpr ']'

varExpr
└── orExpr
└── ID '<' orExpr '>'

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
    : boolAtom
    | comparisonExpr ((EQ | NEQ) comparisonExpr)?
    | addExpr ((EQ | NEQ) addExpr)
    | ID ((EQ | NEQ) ID)
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
    | tagExpr
    | existsExpr
    | forallExpr
    | '(' orExpr ')'
    ;

numAtom
    : SUB? DOUBLE
    | numtagExpr
    | '(' addExpr ')'
    ;

forallExpr
    : 'forall' listComprehension
    ;

existsExpr
    : 'exists' listComprehension
    ;

tagExpr
    : TAG ID
    | TAG listExpr
    ;

numtagExpr
    : NUMTAG ID
    | NUMTAG listExpr
    ;

listExpr
    : list
    | listComprehension
    ;

listComprehension
    : '[' ID ':' listExpr '|' varExpr ']'
    ;

varExpr
    : orExpr
    | ID '<' orExpr '>'
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

list
    : SELF
    | PARENT
    | CHILDREN
    | SIBLINGS
    | ADJACENTS
    ;

TAG: '#';
NUMTAG: '$';

SELF:      'self';
PARENT:    'parent';
CHILDREN:  'children';
SIBLINGS:  'siblings';
ADJACENTS: 'adjacents';

TRUE: 'true';
FALSE: 'false';

ID: [a-zA-Z]+;

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
