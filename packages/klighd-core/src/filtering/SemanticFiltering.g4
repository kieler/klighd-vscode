grammar SemanticFiltering;

semanticFilterRule: positionalFilterRule EOF;

positionalFilterRule
    : orExpr
    | positionalQuantifier '[' orExpr ']'
    ;

orExpr
    : andExpr (OR andExpr)*    // low precedence
    ;

andExpr
    : notExpr (AND notExpr)*         // high precedence
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
