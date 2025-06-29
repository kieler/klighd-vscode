// Generated from SemanticFiltering.g4 by ANTLR 4.13.2
// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols

import {
	ATN,
	ATNDeserializer, DecisionState, DFA, FailedPredicateException,
	RecognitionException, NoViableAltException, BailErrorStrategy,
	Parser, ParserATNSimulator,
	RuleContext, ParserRuleContext, PredictionMode, PredictionContextCache,
	TerminalNode, RuleNode,
	Token, TokenStream,
	Interval, IntervalSet
} from 'antlr4';
import SemanticFilteringListener from "./SemanticFilteringListener.js";
import SemanticFilteringVisitor from "./SemanticFilteringVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;

export default class SemanticFilteringParser extends Parser {
	public static readonly T__0 = 1;
	public static readonly T__1 = 2;
	public static readonly T__2 = 3;
	public static readonly T__3 = 4;
	public static readonly DOUBLE = 5;
	public static readonly TAG = 6;
	public static readonly NUMTAG = 7;
	public static readonly ID = 8;
	public static readonly SELF = 9;
	public static readonly PARENT = 10;
	public static readonly CHILD = 11;
	public static readonly CHILDREN = 12;
	public static readonly SIBLING = 13;
	public static readonly SIBLINGS = 14;
	public static readonly ADJACENT = 15;
	public static readonly ADJACENTS = 16;
	public static readonly TRUE = 17;
	public static readonly FALSE = 18;
	public static readonly MULT = 19;
	public static readonly DIV = 20;
	public static readonly MOD = 21;
	public static readonly ADD = 22;
	public static readonly SUB = 23;
	public static readonly GEQ = 24;
	public static readonly GT = 25;
	public static readonly LEQ = 26;
	public static readonly LT = 27;
	public static readonly EQ = 28;
	public static readonly NEQ = 29;
	public static readonly NOT = 30;
	public static readonly AND = 31;
	public static readonly OR = 32;
	public static readonly WS = 33;
	public static override readonly EOF = Token.EOF;
	public static readonly RULE_semanticFilterRule = 0;
	public static readonly RULE_positionalFilterRule = 1;
	public static readonly RULE_orExpr = 2;
	public static readonly RULE_andExpr = 3;
	public static readonly RULE_notExpr = 4;
	public static readonly RULE_equalsExpr = 5;
	public static readonly RULE_comparisonExpr = 6;
	public static readonly RULE_addExpr = 7;
	public static readonly RULE_multExpr = 8;
	public static readonly RULE_boolAtom = 9;
	public static readonly RULE_numAtom = 10;
	public static readonly RULE_positionalQuantifier = 11;
	public static readonly RULE_tag = 12;
	public static readonly RULE_numtag = 13;
	public static readonly literalNames: (string | null)[] = [ null, "'['", 
                                                            "']'", "'('", 
                                                            "')'", null, 
                                                            "'#'", "'$'", 
                                                            null, "'~'", 
                                                            null, null, 
                                                            null, null, 
                                                            null, null, 
                                                            null, "'true'", 
                                                            "'false'", "'*'", 
                                                            "'/'", "'%'", 
                                                            "'+'", "'-'", 
                                                            "'>='", "'>'", 
                                                            "'<='", "'<'", 
                                                            "'='", "'!='", 
                                                            "'!'", "'&&'", 
                                                            "'||'" ];
	public static readonly symbolicNames: (string | null)[] = [ null, null, 
                                                             null, null, 
                                                             null, "DOUBLE", 
                                                             "TAG", "NUMTAG", 
                                                             "ID", "SELF", 
                                                             "PARENT", "CHILD", 
                                                             "CHILDREN", 
                                                             "SIBLING", 
                                                             "SIBLINGS", 
                                                             "ADJACENT", 
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
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"semanticFilterRule", "positionalFilterRule", "orExpr", "andExpr", "notExpr", 
		"equalsExpr", "comparisonExpr", "addExpr", "multExpr", "boolAtom", "numAtom", 
		"positionalQuantifier", "tag", "numtag",
	];
	public get grammarFileName(): string { return "SemanticFiltering.g4"; }
	public get literalNames(): (string | null)[] { return SemanticFilteringParser.literalNames; }
	public get symbolicNames(): (string | null)[] { return SemanticFilteringParser.symbolicNames; }
	public get ruleNames(): string[] { return SemanticFilteringParser.ruleNames; }
	public get serializedATN(): number[] { return SemanticFilteringParser._serializedATN; }

	protected createFailedPredicateException(predicate?: string, message?: string): FailedPredicateException {
		return new FailedPredicateException(this, predicate, message);
	}

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(this, SemanticFilteringParser._ATN, SemanticFilteringParser.DecisionsToDFA, new PredictionContextCache());
	}
	// @RuleVersion(0)
	public semanticFilterRule(): SemanticFilterRuleContext {
		let localctx: SemanticFilterRuleContext = new SemanticFilterRuleContext(this, this._ctx, this.state);
		this.enterRule(localctx, 0, SemanticFilteringParser.RULE_semanticFilterRule);
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 28;
			this.positionalFilterRule();
			this.state = 29;
			this.match(SemanticFilteringParser.EOF);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public positionalFilterRule(): PositionalFilterRuleContext {
		let localctx: PositionalFilterRuleContext = new PositionalFilterRuleContext(this, this._ctx, this.state);
		this.enterRule(localctx, 2, SemanticFilteringParser.RULE_positionalFilterRule);
		try {
			this.state = 37;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case 3:
			case 5:
			case 6:
			case 7:
			case 17:
			case 18:
			case 23:
			case 30:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 31;
				this.orExpr();
				}
				break;
			case 9:
			case 10:
			case 11:
			case 12:
			case 13:
			case 14:
			case 15:
			case 16:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 32;
				this.positionalQuantifier();
				this.state = 33;
				this.match(SemanticFilteringParser.T__0);
				this.state = 34;
				this.orExpr();
				this.state = 35;
				this.match(SemanticFilteringParser.T__1);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public orExpr(): OrExprContext {
		let localctx: OrExprContext = new OrExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 4, SemanticFilteringParser.RULE_orExpr);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 39;
			this.andExpr();
			this.state = 44;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===32) {
				{
				{
				this.state = 40;
				this.match(SemanticFilteringParser.OR);
				this.state = 41;
				this.andExpr();
				}
				}
				this.state = 46;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public andExpr(): AndExprContext {
		let localctx: AndExprContext = new AndExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 6, SemanticFilteringParser.RULE_andExpr);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 47;
			this.notExpr();
			this.state = 52;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===31) {
				{
				{
				this.state = 48;
				this.match(SemanticFilteringParser.AND);
				this.state = 49;
				this.notExpr();
				}
				}
				this.state = 54;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public notExpr(): NotExprContext {
		let localctx: NotExprContext = new NotExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 8, SemanticFilteringParser.RULE_notExpr);
		try {
			this.state = 58;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case 30:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 55;
				this.match(SemanticFilteringParser.NOT);
				this.state = 56;
				this.notExpr();
				}
				break;
			case 3:
			case 5:
			case 6:
			case 7:
			case 17:
			case 18:
			case 23:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 57;
				this.equalsExpr();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public equalsExpr(): EqualsExprContext {
		let localctx: EqualsExprContext = new EqualsExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 10, SemanticFilteringParser.RULE_equalsExpr);
		let _la: number;
		try {
			this.state = 70;
			this._errHandler.sync(this);
			switch ( this._interp.adaptivePredict(this._input, 5, this._ctx) ) {
			case 1:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 60;
				this.comparisonExpr();
				this.state = 63;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===28 || _la===29) {
					{
					this.state = 61;
					_la = this._input.LA(1);
					if(!(_la===28 || _la===29)) {
					this._errHandler.recoverInline(this);
					}
					else {
						this._errHandler.reportMatch(this);
					    this.consume();
					}
					this.state = 62;
					this.comparisonExpr();
					}
				}

				}
				break;
			case 2:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 65;
				this.addExpr();
				{
				this.state = 66;
				_la = this._input.LA(1);
				if(!(_la===28 || _la===29)) {
				this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
				    this.consume();
				}
				this.state = 67;
				this.addExpr();
				}
				}
				break;
			case 3:
				this.enterOuterAlt(localctx, 3);
				{
				this.state = 69;
				this.boolAtom();
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public comparisonExpr(): ComparisonExprContext {
		let localctx: ComparisonExprContext = new ComparisonExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 12, SemanticFilteringParser.RULE_comparisonExpr);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 72;
			this.addExpr();
			{
			this.state = 73;
			_la = this._input.LA(1);
			if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 251658240) !== 0))) {
			this._errHandler.recoverInline(this);
			}
			else {
				this._errHandler.reportMatch(this);
			    this.consume();
			}
			this.state = 74;
			this.addExpr();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public addExpr(): AddExprContext {
		let localctx: AddExprContext = new AddExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 14, SemanticFilteringParser.RULE_addExpr);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 76;
			this.multExpr();
			this.state = 81;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===22 || _la===23) {
				{
				{
				this.state = 77;
				_la = this._input.LA(1);
				if(!(_la===22 || _la===23)) {
				this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
				    this.consume();
				}
				this.state = 78;
				this.multExpr();
				}
				}
				this.state = 83;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public multExpr(): MultExprContext {
		let localctx: MultExprContext = new MultExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 16, SemanticFilteringParser.RULE_multExpr);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 84;
			this.numAtom();
			this.state = 89;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 3670016) !== 0)) {
				{
				{
				this.state = 85;
				_la = this._input.LA(1);
				if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 3670016) !== 0))) {
				this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
				    this.consume();
				}
				this.state = 86;
				this.numAtom();
				}
				}
				this.state = 91;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public boolAtom(): BoolAtomContext {
		let localctx: BoolAtomContext = new BoolAtomContext(this, this._ctx, this.state);
		this.enterRule(localctx, 18, SemanticFilteringParser.RULE_boolAtom);
		try {
			this.state = 99;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case 17:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 92;
				this.match(SemanticFilteringParser.TRUE);
				}
				break;
			case 18:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 93;
				this.match(SemanticFilteringParser.FALSE);
				}
				break;
			case 6:
				this.enterOuterAlt(localctx, 3);
				{
				this.state = 94;
				this.tag();
				}
				break;
			case 3:
				this.enterOuterAlt(localctx, 4);
				{
				this.state = 95;
				this.match(SemanticFilteringParser.T__2);
				this.state = 96;
				this.orExpr();
				this.state = 97;
				this.match(SemanticFilteringParser.T__3);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public numAtom(): NumAtomContext {
		let localctx: NumAtomContext = new NumAtomContext(this, this._ctx, this.state);
		this.enterRule(localctx, 20, SemanticFilteringParser.RULE_numAtom);
		let _la: number;
		try {
			this.state = 110;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case 5:
			case 23:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 102;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===23) {
					{
					this.state = 101;
					this.match(SemanticFilteringParser.SUB);
					}
				}

				this.state = 104;
				this.match(SemanticFilteringParser.DOUBLE);
				}
				break;
			case 7:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 105;
				this.numtag();
				}
				break;
			case 3:
				this.enterOuterAlt(localctx, 3);
				{
				this.state = 106;
				this.match(SemanticFilteringParser.T__2);
				this.state = 107;
				this.addExpr();
				this.state = 108;
				this.match(SemanticFilteringParser.T__3);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public positionalQuantifier(): PositionalQuantifierContext {
		let localctx: PositionalQuantifierContext = new PositionalQuantifierContext(this, this._ctx, this.state);
		this.enterRule(localctx, 22, SemanticFilteringParser.RULE_positionalQuantifier);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 112;
			_la = this._input.LA(1);
			if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 130560) !== 0))) {
			this._errHandler.recoverInline(this);
			}
			else {
				this._errHandler.reportMatch(this);
			    this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public tag(): TagContext {
		let localctx: TagContext = new TagContext(this, this._ctx, this.state);
		this.enterRule(localctx, 24, SemanticFilteringParser.RULE_tag);
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 114;
			this.match(SemanticFilteringParser.TAG);
			this.state = 115;
			this.match(SemanticFilteringParser.ID);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public numtag(): NumtagContext {
		let localctx: NumtagContext = new NumtagContext(this, this._ctx, this.state);
		this.enterRule(localctx, 26, SemanticFilteringParser.RULE_numtag);
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 117;
			this.match(SemanticFilteringParser.NUMTAG);
			this.state = 118;
			this.match(SemanticFilteringParser.ID);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}

	public static readonly _serializedATN: number[] = [4,1,33,121,2,0,7,0,2,
	1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,
	10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,
	1,3,1,38,8,1,1,2,1,2,1,2,5,2,43,8,2,10,2,12,2,46,9,2,1,3,1,3,1,3,5,3,51,
	8,3,10,3,12,3,54,9,3,1,4,1,4,1,4,3,4,59,8,4,1,5,1,5,1,5,3,5,64,8,5,1,5,
	1,5,1,5,1,5,1,5,3,5,71,8,5,1,6,1,6,1,6,1,6,1,7,1,7,1,7,5,7,80,8,7,10,7,
	12,7,83,9,7,1,8,1,8,1,8,5,8,88,8,8,10,8,12,8,91,9,8,1,9,1,9,1,9,1,9,1,9,
	1,9,1,9,3,9,100,8,9,1,10,3,10,103,8,10,1,10,1,10,1,10,1,10,1,10,1,10,3,
	10,111,8,10,1,11,1,11,1,12,1,12,1,12,1,13,1,13,1,13,1,13,0,0,14,0,2,4,6,
	8,10,12,14,16,18,20,22,24,26,0,5,1,0,28,29,1,0,24,27,1,0,22,23,1,0,19,21,
	1,0,9,16,121,0,28,1,0,0,0,2,37,1,0,0,0,4,39,1,0,0,0,6,47,1,0,0,0,8,58,1,
	0,0,0,10,70,1,0,0,0,12,72,1,0,0,0,14,76,1,0,0,0,16,84,1,0,0,0,18,99,1,0,
	0,0,20,110,1,0,0,0,22,112,1,0,0,0,24,114,1,0,0,0,26,117,1,0,0,0,28,29,3,
	2,1,0,29,30,5,0,0,1,30,1,1,0,0,0,31,38,3,4,2,0,32,33,3,22,11,0,33,34,5,
	1,0,0,34,35,3,4,2,0,35,36,5,2,0,0,36,38,1,0,0,0,37,31,1,0,0,0,37,32,1,0,
	0,0,38,3,1,0,0,0,39,44,3,6,3,0,40,41,5,32,0,0,41,43,3,6,3,0,42,40,1,0,0,
	0,43,46,1,0,0,0,44,42,1,0,0,0,44,45,1,0,0,0,45,5,1,0,0,0,46,44,1,0,0,0,
	47,52,3,8,4,0,48,49,5,31,0,0,49,51,3,8,4,0,50,48,1,0,0,0,51,54,1,0,0,0,
	52,50,1,0,0,0,52,53,1,0,0,0,53,7,1,0,0,0,54,52,1,0,0,0,55,56,5,30,0,0,56,
	59,3,8,4,0,57,59,3,10,5,0,58,55,1,0,0,0,58,57,1,0,0,0,59,9,1,0,0,0,60,63,
	3,12,6,0,61,62,7,0,0,0,62,64,3,12,6,0,63,61,1,0,0,0,63,64,1,0,0,0,64,71,
	1,0,0,0,65,66,3,14,7,0,66,67,7,0,0,0,67,68,3,14,7,0,68,71,1,0,0,0,69,71,
	3,18,9,0,70,60,1,0,0,0,70,65,1,0,0,0,70,69,1,0,0,0,71,11,1,0,0,0,72,73,
	3,14,7,0,73,74,7,1,0,0,74,75,3,14,7,0,75,13,1,0,0,0,76,81,3,16,8,0,77,78,
	7,2,0,0,78,80,3,16,8,0,79,77,1,0,0,0,80,83,1,0,0,0,81,79,1,0,0,0,81,82,
	1,0,0,0,82,15,1,0,0,0,83,81,1,0,0,0,84,89,3,20,10,0,85,86,7,3,0,0,86,88,
	3,20,10,0,87,85,1,0,0,0,88,91,1,0,0,0,89,87,1,0,0,0,89,90,1,0,0,0,90,17,
	1,0,0,0,91,89,1,0,0,0,92,100,5,17,0,0,93,100,5,18,0,0,94,100,3,24,12,0,
	95,96,5,3,0,0,96,97,3,4,2,0,97,98,5,4,0,0,98,100,1,0,0,0,99,92,1,0,0,0,
	99,93,1,0,0,0,99,94,1,0,0,0,99,95,1,0,0,0,100,19,1,0,0,0,101,103,5,23,0,
	0,102,101,1,0,0,0,102,103,1,0,0,0,103,104,1,0,0,0,104,111,5,5,0,0,105,111,
	3,26,13,0,106,107,5,3,0,0,107,108,3,14,7,0,108,109,5,4,0,0,109,111,1,0,
	0,0,110,102,1,0,0,0,110,105,1,0,0,0,110,106,1,0,0,0,111,21,1,0,0,0,112,
	113,7,4,0,0,113,23,1,0,0,0,114,115,5,6,0,0,115,116,5,8,0,0,116,25,1,0,0,
	0,117,118,5,7,0,0,118,119,5,8,0,0,119,27,1,0,0,0,11,37,44,52,58,63,70,81,
	89,99,102,110];

	private static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!SemanticFilteringParser.__ATN) {
			SemanticFilteringParser.__ATN = new ATNDeserializer().deserialize(SemanticFilteringParser._serializedATN);
		}

		return SemanticFilteringParser.__ATN;
	}


	static DecisionsToDFA = SemanticFilteringParser._ATN.decisionToState.map( (ds: DecisionState, index: number) => new DFA(ds, index) );

}

export class SemanticFilterRuleContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public positionalFilterRule(): PositionalFilterRuleContext {
		return this.getTypedRuleContext(PositionalFilterRuleContext, 0) as PositionalFilterRuleContext;
	}
	public EOF(): TerminalNode {
		return this.getToken(SemanticFilteringParser.EOF, 0);
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_semanticFilterRule;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterSemanticFilterRule) {
	 		listener.enterSemanticFilterRule(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitSemanticFilterRule) {
	 		listener.exitSemanticFilterRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitSemanticFilterRule) {
			return visitor.visitSemanticFilterRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class PositionalFilterRuleContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public orExpr(): OrExprContext {
		return this.getTypedRuleContext(OrExprContext, 0) as OrExprContext;
	}
	public positionalQuantifier(): PositionalQuantifierContext {
		return this.getTypedRuleContext(PositionalQuantifierContext, 0) as PositionalQuantifierContext;
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_positionalFilterRule;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterPositionalFilterRule) {
	 		listener.enterPositionalFilterRule(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitPositionalFilterRule) {
	 		listener.exitPositionalFilterRule(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitPositionalFilterRule) {
			return visitor.visitPositionalFilterRule(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class OrExprContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public andExpr_list(): AndExprContext[] {
		return this.getTypedRuleContexts(AndExprContext) as AndExprContext[];
	}
	public andExpr(i: number): AndExprContext {
		return this.getTypedRuleContext(AndExprContext, i) as AndExprContext;
	}
	public OR_list(): TerminalNode[] {
	    	return this.getTokens(SemanticFilteringParser.OR);
	}
	public OR(i: number): TerminalNode {
		return this.getToken(SemanticFilteringParser.OR, i);
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_orExpr;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterOrExpr) {
	 		listener.enterOrExpr(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitOrExpr) {
	 		listener.exitOrExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitOrExpr) {
			return visitor.visitOrExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class AndExprContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public notExpr_list(): NotExprContext[] {
		return this.getTypedRuleContexts(NotExprContext) as NotExprContext[];
	}
	public notExpr(i: number): NotExprContext {
		return this.getTypedRuleContext(NotExprContext, i) as NotExprContext;
	}
	public AND_list(): TerminalNode[] {
	    	return this.getTokens(SemanticFilteringParser.AND);
	}
	public AND(i: number): TerminalNode {
		return this.getToken(SemanticFilteringParser.AND, i);
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_andExpr;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterAndExpr) {
	 		listener.enterAndExpr(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitAndExpr) {
	 		listener.exitAndExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitAndExpr) {
			return visitor.visitAndExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class NotExprContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public NOT(): TerminalNode {
		return this.getToken(SemanticFilteringParser.NOT, 0);
	}
	public notExpr(): NotExprContext {
		return this.getTypedRuleContext(NotExprContext, 0) as NotExprContext;
	}
	public equalsExpr(): EqualsExprContext {
		return this.getTypedRuleContext(EqualsExprContext, 0) as EqualsExprContext;
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_notExpr;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterNotExpr) {
	 		listener.enterNotExpr(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitNotExpr) {
	 		listener.exitNotExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitNotExpr) {
			return visitor.visitNotExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class EqualsExprContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public comparisonExpr_list(): ComparisonExprContext[] {
		return this.getTypedRuleContexts(ComparisonExprContext) as ComparisonExprContext[];
	}
	public comparisonExpr(i: number): ComparisonExprContext {
		return this.getTypedRuleContext(ComparisonExprContext, i) as ComparisonExprContext;
	}
	public EQ(): TerminalNode {
		return this.getToken(SemanticFilteringParser.EQ, 0);
	}
	public NEQ(): TerminalNode {
		return this.getToken(SemanticFilteringParser.NEQ, 0);
	}
	public addExpr_list(): AddExprContext[] {
		return this.getTypedRuleContexts(AddExprContext) as AddExprContext[];
	}
	public addExpr(i: number): AddExprContext {
		return this.getTypedRuleContext(AddExprContext, i) as AddExprContext;
	}
	public boolAtom(): BoolAtomContext {
		return this.getTypedRuleContext(BoolAtomContext, 0) as BoolAtomContext;
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_equalsExpr;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterEqualsExpr) {
	 		listener.enterEqualsExpr(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitEqualsExpr) {
	 		listener.exitEqualsExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitEqualsExpr) {
			return visitor.visitEqualsExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ComparisonExprContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public addExpr_list(): AddExprContext[] {
		return this.getTypedRuleContexts(AddExprContext) as AddExprContext[];
	}
	public addExpr(i: number): AddExprContext {
		return this.getTypedRuleContext(AddExprContext, i) as AddExprContext;
	}
	public GEQ(): TerminalNode {
		return this.getToken(SemanticFilteringParser.GEQ, 0);
	}
	public GT(): TerminalNode {
		return this.getToken(SemanticFilteringParser.GT, 0);
	}
	public LEQ(): TerminalNode {
		return this.getToken(SemanticFilteringParser.LEQ, 0);
	}
	public LT(): TerminalNode {
		return this.getToken(SemanticFilteringParser.LT, 0);
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_comparisonExpr;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterComparisonExpr) {
	 		listener.enterComparisonExpr(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitComparisonExpr) {
	 		listener.exitComparisonExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitComparisonExpr) {
			return visitor.visitComparisonExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class AddExprContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public multExpr_list(): MultExprContext[] {
		return this.getTypedRuleContexts(MultExprContext) as MultExprContext[];
	}
	public multExpr(i: number): MultExprContext {
		return this.getTypedRuleContext(MultExprContext, i) as MultExprContext;
	}
	public ADD_list(): TerminalNode[] {
	    	return this.getTokens(SemanticFilteringParser.ADD);
	}
	public ADD(i: number): TerminalNode {
		return this.getToken(SemanticFilteringParser.ADD, i);
	}
	public SUB_list(): TerminalNode[] {
	    	return this.getTokens(SemanticFilteringParser.SUB);
	}
	public SUB(i: number): TerminalNode {
		return this.getToken(SemanticFilteringParser.SUB, i);
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_addExpr;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterAddExpr) {
	 		listener.enterAddExpr(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitAddExpr) {
	 		listener.exitAddExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitAddExpr) {
			return visitor.visitAddExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class MultExprContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public numAtom_list(): NumAtomContext[] {
		return this.getTypedRuleContexts(NumAtomContext) as NumAtomContext[];
	}
	public numAtom(i: number): NumAtomContext {
		return this.getTypedRuleContext(NumAtomContext, i) as NumAtomContext;
	}
	public MULT_list(): TerminalNode[] {
	    	return this.getTokens(SemanticFilteringParser.MULT);
	}
	public MULT(i: number): TerminalNode {
		return this.getToken(SemanticFilteringParser.MULT, i);
	}
	public DIV_list(): TerminalNode[] {
	    	return this.getTokens(SemanticFilteringParser.DIV);
	}
	public DIV(i: number): TerminalNode {
		return this.getToken(SemanticFilteringParser.DIV, i);
	}
	public MOD_list(): TerminalNode[] {
	    	return this.getTokens(SemanticFilteringParser.MOD);
	}
	public MOD(i: number): TerminalNode {
		return this.getToken(SemanticFilteringParser.MOD, i);
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_multExpr;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterMultExpr) {
	 		listener.enterMultExpr(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitMultExpr) {
	 		listener.exitMultExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitMultExpr) {
			return visitor.visitMultExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class BoolAtomContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public TRUE(): TerminalNode {
		return this.getToken(SemanticFilteringParser.TRUE, 0);
	}
	public FALSE(): TerminalNode {
		return this.getToken(SemanticFilteringParser.FALSE, 0);
	}
	public tag(): TagContext {
		return this.getTypedRuleContext(TagContext, 0) as TagContext;
	}
	public orExpr(): OrExprContext {
		return this.getTypedRuleContext(OrExprContext, 0) as OrExprContext;
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_boolAtom;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterBoolAtom) {
	 		listener.enterBoolAtom(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitBoolAtom) {
	 		listener.exitBoolAtom(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitBoolAtom) {
			return visitor.visitBoolAtom(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class NumAtomContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public DOUBLE(): TerminalNode {
		return this.getToken(SemanticFilteringParser.DOUBLE, 0);
	}
	public SUB(): TerminalNode {
		return this.getToken(SemanticFilteringParser.SUB, 0);
	}
	public numtag(): NumtagContext {
		return this.getTypedRuleContext(NumtagContext, 0) as NumtagContext;
	}
	public addExpr(): AddExprContext {
		return this.getTypedRuleContext(AddExprContext, 0) as AddExprContext;
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_numAtom;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterNumAtom) {
	 		listener.enterNumAtom(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitNumAtom) {
	 		listener.exitNumAtom(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitNumAtom) {
			return visitor.visitNumAtom(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class PositionalQuantifierContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public SELF(): TerminalNode {
		return this.getToken(SemanticFilteringParser.SELF, 0);
	}
	public PARENT(): TerminalNode {
		return this.getToken(SemanticFilteringParser.PARENT, 0);
	}
	public CHILD(): TerminalNode {
		return this.getToken(SemanticFilteringParser.CHILD, 0);
	}
	public CHILDREN(): TerminalNode {
		return this.getToken(SemanticFilteringParser.CHILDREN, 0);
	}
	public SIBLING(): TerminalNode {
		return this.getToken(SemanticFilteringParser.SIBLING, 0);
	}
	public SIBLINGS(): TerminalNode {
		return this.getToken(SemanticFilteringParser.SIBLINGS, 0);
	}
	public ADJACENT(): TerminalNode {
		return this.getToken(SemanticFilteringParser.ADJACENT, 0);
	}
	public ADJACENTS(): TerminalNode {
		return this.getToken(SemanticFilteringParser.ADJACENTS, 0);
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_positionalQuantifier;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterPositionalQuantifier) {
	 		listener.enterPositionalQuantifier(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitPositionalQuantifier) {
	 		listener.exitPositionalQuantifier(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitPositionalQuantifier) {
			return visitor.visitPositionalQuantifier(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class TagContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public TAG(): TerminalNode {
		return this.getToken(SemanticFilteringParser.TAG, 0);
	}
	public ID(): TerminalNode {
		return this.getToken(SemanticFilteringParser.ID, 0);
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_tag;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterTag) {
	 		listener.enterTag(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitTag) {
	 		listener.exitTag(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitTag) {
			return visitor.visitTag(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class NumtagContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public NUMTAG(): TerminalNode {
		return this.getToken(SemanticFilteringParser.NUMTAG, 0);
	}
	public ID(): TerminalNode {
		return this.getToken(SemanticFilteringParser.ID, 0);
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_numtag;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterNumtag) {
	 		listener.enterNumtag(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitNumtag) {
	 		listener.exitNumtag(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitNumtag) {
			return visitor.visitNumtag(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
