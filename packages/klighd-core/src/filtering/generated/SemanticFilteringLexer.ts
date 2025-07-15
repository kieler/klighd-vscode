// Generated from SemanticFiltering.g4 by ANTLR 4.13.2
// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols
import {
	ATN,
	ATNDeserializer,
	CharStream,
	DecisionState, DFA,
	Lexer,
	LexerATNSimulator,
	RuleContext,
	PredictionContextCache,
	Token
} from "antlr4";
export default class SemanticFilteringLexer extends Lexer {
	public static readonly T__0 = 1;
	public static readonly T__1 = 2;
	public static readonly T__2 = 3;
	public static readonly T__3 = 4;
	public static readonly T__4 = 5;
	public static readonly T__5 = 6;
	public static readonly T__6 = 7;
	public static readonly T__7 = 8;
	public static readonly DOUBLE = 9;
	public static readonly TAG = 10;
	public static readonly NUMTAG = 11;
	public static readonly ID = 12;
	public static readonly SELF = 13;
	public static readonly PARENT = 14;
	public static readonly CHILDREN = 15;
	public static readonly SIBLINGS = 16;
	public static readonly ADJACENTS = 17;
	public static readonly TRUE = 18;
	public static readonly FALSE = 19;
	public static readonly MULT = 20;
	public static readonly DIV = 21;
	public static readonly MOD = 22;
	public static readonly ADD = 23;
	public static readonly SUB = 24;
	public static readonly GEQ = 25;
	public static readonly GT = 26;
	public static readonly LEQ = 27;
	public static readonly LT = 28;
	public static readonly EQ = 29;
	public static readonly NEQ = 30;
	public static readonly NOT = 31;
	public static readonly AND = 32;
	public static readonly OR = 33;
	public static readonly WS = 34;
	public static readonly EOF = Token.EOF;

	public static readonly channelNames: string[] = [ "DEFAULT_TOKEN_CHANNEL", "HIDDEN" ];
	public static readonly literalNames: (string | null)[] = [ null, "'('", 
                                                            "')'", "'forall'", 
                                                            "'['", "':'", 
                                                            "'|'", "']'", 
                                                            "'exists'", 
                                                            null, "'#'", 
                                                            "'$'", null, 
                                                            "'self'", "'parent'", 
                                                            "'children'", 
                                                            "'siblings'", 
                                                            "'adjacents'", 
                                                            "'true'", "'false'", 
                                                            "'*'", "'/'", 
                                                            "'%'", "'+'", 
                                                            "'-'", "'>='", 
                                                            "'>'", "'<='", 
                                                            "'<'", "'='", 
                                                            "'!='", "'!'", 
                                                            "'&&'", "'||'" ];
	public static readonly symbolicNames: (string | null)[] = [ null, null, 
                                                             null, null, 
                                                             null, null, 
                                                             null, null, 
                                                             null, "DOUBLE", 
                                                             "TAG", "NUMTAG", 
                                                             "ID", "SELF", 
                                                             "PARENT", "CHILDREN", 
                                                             "SIBLINGS", 
                                                             "ADJACENTS", 
                                                             "TRUE", "FALSE", 
                                                             "MULT", "DIV", 
                                                             "MOD", "ADD", 
                                                             "SUB", "GEQ", 
                                                             "GT", "LEQ", 
                                                             "LT", "EQ", 
                                                             "NEQ", "NOT", 
                                                             "AND", "OR", 
                                                             "WS" ];
	public static readonly modeNames: string[] = [ "DEFAULT_MODE", ];

	public static readonly ruleNames: string[] = [
		"T__0", "T__1", "T__2", "T__3", "T__4", "T__5", "T__6", "T__7", "DOUBLE", 
		"DIGITS", "EXPONENT_PART", "TAG", "NUMTAG", "ID", "SELF", "PARENT", "CHILDREN", 
		"SIBLINGS", "ADJACENTS", "TRUE", "FALSE", "MULT", "DIV", "MOD", "ADD", 
		"SUB", "GEQ", "GT", "LEQ", "LT", "EQ", "NEQ", "NOT", "AND", "OR", "WS",
	];


	constructor(input: CharStream) {
		super(input);
		this._interp = new LexerATNSimulator(this, SemanticFilteringLexer._ATN, SemanticFilteringLexer.DecisionsToDFA, new PredictionContextCache());
	}

	public get grammarFileName(): string { return "SemanticFiltering.g4"; }

	public get literalNames(): (string | null)[] { return SemanticFilteringLexer.literalNames; }
	public get symbolicNames(): (string | null)[] { return SemanticFilteringLexer.symbolicNames; }
	public get ruleNames(): string[] { return SemanticFilteringLexer.ruleNames; }

	public get serializedATN(): number[] { return SemanticFilteringLexer._serializedATN; }

	public get channelNames(): string[] { return SemanticFilteringLexer.channelNames; }

	public get modeNames(): string[] { return SemanticFilteringLexer.modeNames; }

	public static readonly _serializedATN: number[] = [4,0,34,232,6,-1,2,0,
	7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,6,2,7,7,7,2,8,7,8,2,9,
	7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,2,14,7,14,2,15,7,15,2,16,7,
	16,2,17,7,17,2,18,7,18,2,19,7,19,2,20,7,20,2,21,7,21,2,22,7,22,2,23,7,23,
	2,24,7,24,2,25,7,25,2,26,7,26,2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,
	31,7,31,2,32,7,32,2,33,7,33,2,34,7,34,2,35,7,35,1,0,1,0,1,1,1,1,1,2,1,2,
	1,2,1,2,1,2,1,2,1,2,1,3,1,3,1,4,1,4,1,5,1,5,1,6,1,6,1,7,1,7,1,7,1,7,1,7,
	1,7,1,7,1,8,1,8,3,8,102,8,8,1,8,1,8,1,8,3,8,107,8,8,1,8,1,8,1,8,3,8,112,
	8,8,1,8,3,8,115,8,8,1,8,1,8,1,8,3,8,120,8,8,1,9,4,9,123,8,9,11,9,12,9,124,
	1,10,1,10,3,10,129,8,10,1,10,1,10,1,11,1,11,1,12,1,12,1,13,4,13,138,8,13,
	11,13,12,13,139,1,14,1,14,1,14,1,14,1,14,1,15,1,15,1,15,1,15,1,15,1,15,
	1,15,1,16,1,16,1,16,1,16,1,16,1,16,1,16,1,16,1,16,1,17,1,17,1,17,1,17,1,
	17,1,17,1,17,1,17,1,17,1,18,1,18,1,18,1,18,1,18,1,18,1,18,1,18,1,18,1,18,
	1,19,1,19,1,19,1,19,1,19,1,20,1,20,1,20,1,20,1,20,1,20,1,21,1,21,1,22,1,
	22,1,23,1,23,1,24,1,24,1,25,1,25,1,26,1,26,1,26,1,27,1,27,1,28,1,28,1,28,
	1,29,1,29,1,30,1,30,1,31,1,31,1,31,1,32,1,32,1,33,1,33,1,33,1,34,1,34,1,
	34,1,35,4,35,227,8,35,11,35,12,35,228,1,35,1,35,0,0,36,1,1,3,2,5,3,7,4,
	9,5,11,6,13,7,15,8,17,9,19,0,21,0,23,10,25,11,27,12,29,13,31,14,33,15,35,
	16,37,17,39,18,41,19,43,20,45,21,47,22,49,23,51,24,53,25,55,26,57,27,59,
	28,61,29,63,30,65,31,67,32,69,33,71,34,1,0,5,1,0,48,57,2,0,69,69,101,101,
	2,0,43,43,45,45,2,0,65,90,97,122,3,0,9,10,13,13,32,32,240,0,1,1,0,0,0,0,
	3,1,0,0,0,0,5,1,0,0,0,0,7,1,0,0,0,0,9,1,0,0,0,0,11,1,0,0,0,0,13,1,0,0,0,
	0,15,1,0,0,0,0,17,1,0,0,0,0,23,1,0,0,0,0,25,1,0,0,0,0,27,1,0,0,0,0,29,1,
	0,0,0,0,31,1,0,0,0,0,33,1,0,0,0,0,35,1,0,0,0,0,37,1,0,0,0,0,39,1,0,0,0,
	0,41,1,0,0,0,0,43,1,0,0,0,0,45,1,0,0,0,0,47,1,0,0,0,0,49,1,0,0,0,0,51,1,
	0,0,0,0,53,1,0,0,0,0,55,1,0,0,0,0,57,1,0,0,0,0,59,1,0,0,0,0,61,1,0,0,0,
	0,63,1,0,0,0,0,65,1,0,0,0,0,67,1,0,0,0,0,69,1,0,0,0,0,71,1,0,0,0,1,73,1,
	0,0,0,3,75,1,0,0,0,5,77,1,0,0,0,7,84,1,0,0,0,9,86,1,0,0,0,11,88,1,0,0,0,
	13,90,1,0,0,0,15,92,1,0,0,0,17,119,1,0,0,0,19,122,1,0,0,0,21,126,1,0,0,
	0,23,132,1,0,0,0,25,134,1,0,0,0,27,137,1,0,0,0,29,141,1,0,0,0,31,146,1,
	0,0,0,33,153,1,0,0,0,35,162,1,0,0,0,37,171,1,0,0,0,39,181,1,0,0,0,41,186,
	1,0,0,0,43,192,1,0,0,0,45,194,1,0,0,0,47,196,1,0,0,0,49,198,1,0,0,0,51,
	200,1,0,0,0,53,202,1,0,0,0,55,205,1,0,0,0,57,207,1,0,0,0,59,210,1,0,0,0,
	61,212,1,0,0,0,63,214,1,0,0,0,65,217,1,0,0,0,67,219,1,0,0,0,69,222,1,0,
	0,0,71,226,1,0,0,0,73,74,5,40,0,0,74,2,1,0,0,0,75,76,5,41,0,0,76,4,1,0,
	0,0,77,78,5,102,0,0,78,79,5,111,0,0,79,80,5,114,0,0,80,81,5,97,0,0,81,82,
	5,108,0,0,82,83,5,108,0,0,83,6,1,0,0,0,84,85,5,91,0,0,85,8,1,0,0,0,86,87,
	5,58,0,0,87,10,1,0,0,0,88,89,5,124,0,0,89,12,1,0,0,0,90,91,5,93,0,0,91,
	14,1,0,0,0,92,93,5,101,0,0,93,94,5,120,0,0,94,95,5,105,0,0,95,96,5,115,
	0,0,96,97,5,116,0,0,97,98,5,115,0,0,98,16,1,0,0,0,99,120,3,19,9,0,100,102,
	3,19,9,0,101,100,1,0,0,0,101,102,1,0,0,0,102,103,1,0,0,0,103,104,5,46,0,
	0,104,106,3,19,9,0,105,107,3,21,10,0,106,105,1,0,0,0,106,107,1,0,0,0,107,
	120,1,0,0,0,108,109,3,19,9,0,109,111,5,46,0,0,110,112,3,19,9,0,111,110,
	1,0,0,0,111,112,1,0,0,0,112,114,1,0,0,0,113,115,3,21,10,0,114,113,1,0,0,
	0,114,115,1,0,0,0,115,120,1,0,0,0,116,117,3,19,9,0,117,118,3,21,10,0,118,
	120,1,0,0,0,119,99,1,0,0,0,119,101,1,0,0,0,119,108,1,0,0,0,119,116,1,0,
	0,0,120,18,1,0,0,0,121,123,7,0,0,0,122,121,1,0,0,0,123,124,1,0,0,0,124,
	122,1,0,0,0,124,125,1,0,0,0,125,20,1,0,0,0,126,128,7,1,0,0,127,129,7,2,
	0,0,128,127,1,0,0,0,128,129,1,0,0,0,129,130,1,0,0,0,130,131,3,19,9,0,131,
	22,1,0,0,0,132,133,5,35,0,0,133,24,1,0,0,0,134,135,5,36,0,0,135,26,1,0,
	0,0,136,138,7,3,0,0,137,136,1,0,0,0,138,139,1,0,0,0,139,137,1,0,0,0,139,
	140,1,0,0,0,140,28,1,0,0,0,141,142,5,115,0,0,142,143,5,101,0,0,143,144,
	5,108,0,0,144,145,5,102,0,0,145,30,1,0,0,0,146,147,5,112,0,0,147,148,5,
	97,0,0,148,149,5,114,0,0,149,150,5,101,0,0,150,151,5,110,0,0,151,152,5,
	116,0,0,152,32,1,0,0,0,153,154,5,99,0,0,154,155,5,104,0,0,155,156,5,105,
	0,0,156,157,5,108,0,0,157,158,5,100,0,0,158,159,5,114,0,0,159,160,5,101,
	0,0,160,161,5,110,0,0,161,34,1,0,0,0,162,163,5,115,0,0,163,164,5,105,0,
	0,164,165,5,98,0,0,165,166,5,108,0,0,166,167,5,105,0,0,167,168,5,110,0,
	0,168,169,5,103,0,0,169,170,5,115,0,0,170,36,1,0,0,0,171,172,5,97,0,0,172,
	173,5,100,0,0,173,174,5,106,0,0,174,175,5,97,0,0,175,176,5,99,0,0,176,177,
	5,101,0,0,177,178,5,110,0,0,178,179,5,116,0,0,179,180,5,115,0,0,180,38,
	1,0,0,0,181,182,5,116,0,0,182,183,5,114,0,0,183,184,5,117,0,0,184,185,5,
	101,0,0,185,40,1,0,0,0,186,187,5,102,0,0,187,188,5,97,0,0,188,189,5,108,
	0,0,189,190,5,115,0,0,190,191,5,101,0,0,191,42,1,0,0,0,192,193,5,42,0,0,
	193,44,1,0,0,0,194,195,5,47,0,0,195,46,1,0,0,0,196,197,5,37,0,0,197,48,
	1,0,0,0,198,199,5,43,0,0,199,50,1,0,0,0,200,201,5,45,0,0,201,52,1,0,0,0,
	202,203,5,62,0,0,203,204,5,61,0,0,204,54,1,0,0,0,205,206,5,62,0,0,206,56,
	1,0,0,0,207,208,5,60,0,0,208,209,5,61,0,0,209,58,1,0,0,0,210,211,5,60,0,
	0,211,60,1,0,0,0,212,213,5,61,0,0,213,62,1,0,0,0,214,215,5,33,0,0,215,216,
	5,61,0,0,216,64,1,0,0,0,217,218,5,33,0,0,218,66,1,0,0,0,219,220,5,38,0,
	0,220,221,5,38,0,0,221,68,1,0,0,0,222,223,5,124,0,0,223,224,5,124,0,0,224,
	70,1,0,0,0,225,227,7,4,0,0,226,225,1,0,0,0,227,228,1,0,0,0,228,226,1,0,
	0,0,228,229,1,0,0,0,229,230,1,0,0,0,230,231,6,35,0,0,231,72,1,0,0,0,10,
	0,101,106,111,114,119,124,128,139,228,1,6,0,0];

	private static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!SemanticFilteringLexer.__ATN) {
			SemanticFilteringLexer.__ATN = new ATNDeserializer().deserialize(SemanticFilteringLexer._serializedATN);
		}

		return SemanticFilteringLexer.__ATN;
	}


	static DecisionsToDFA = SemanticFilteringLexer._ATN.decisionToState.map( (ds: DecisionState, index: number) => new DFA(ds, index) );
}