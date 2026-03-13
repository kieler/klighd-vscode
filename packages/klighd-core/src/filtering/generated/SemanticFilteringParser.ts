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
	public static readonly T__4 = 5;
	public static readonly T__5 = 6;
	public static readonly T__6 = 7;
	public static readonly T__7 = 8;
	public static readonly DOUBLE = 9;
	public static readonly TAG = 10;
	public static readonly NUMTAG = 11;
	public static readonly SELF = 12;
	public static readonly PARENT = 13;
	public static readonly CHILDREN = 14;
	public static readonly SIBLINGS = 15;
	public static readonly ADJACENTS = 16;
	public static readonly INCOMING = 17;
	public static readonly OUTGOING = 18;
	public static readonly TRUE = 19;
	public static readonly FALSE = 20;
	public static readonly ID = 21;
	public static readonly MULT = 22;
	public static readonly DIV = 23;
	public static readonly MOD = 24;
	public static readonly ADD = 25;
	public static readonly SUB = 26;
	public static readonly GEQ = 27;
	public static readonly GT = 28;
	public static readonly LEQ = 29;
	public static readonly LT = 30;
	public static readonly EQ = 31;
	public static readonly NEQ = 32;
	public static readonly NOT = 33;
	public static readonly AND = 34;
	public static readonly OR = 35;
	public static readonly WS = 36;
	public static override readonly EOF = Token.EOF;
	public static readonly RULE_semanticFilterRule = 0;
	public static readonly RULE_orExpr = 1;
	public static readonly RULE_andExpr = 2;
	public static readonly RULE_notExpr = 3;
	public static readonly RULE_equalsExpr = 4;
	public static readonly RULE_comparisonExpr = 5;
	public static readonly RULE_addExpr = 6;
	public static readonly RULE_multExpr = 7;
	public static readonly RULE_boolAtom = 8;
	public static readonly RULE_numAtom = 9;
	public static readonly RULE_forallExpr = 10;
	public static readonly RULE_existsExpr = 11;
	public static readonly RULE_tagExpr = 12;
	public static readonly RULE_numtagExpr = 13;
	public static readonly RULE_listExpr = 14;
	public static readonly RULE_listComprehension = 15;
	public static readonly RULE_varExpr = 16;
	public static readonly RULE_list = 17;
	public static readonly literalNames: (string | null)[] = [ null, "'('", 
                                                            "')'", "'forall'", 
                                                            "'exists'", 
                                                            "'['", "':'", 
                                                            "'|'", "']'", 
                                                            null, "'#'", 
                                                            "'$'", "'self'", 
                                                            "'parent'", 
                                                            "'children'", 
                                                            "'siblings'", 
                                                            "'adjacents'", 
                                                            "'incoming'", 
                                                            "'outgoing'", 
                                                            "'true'", "'false'", 
                                                            null, "'*'", 
                                                            "'/'", "'%'", 
                                                            "'+'", "'-'", 
                                                            "'>='", "'>'", 
                                                            "'<='", "'<'", 
                                                            "'='", "'!='", 
                                                            "'!'", "'&&'", 
                                                            "'||'" ];
	public static readonly symbolicNames: (string | null)[] = [ null, null, 
                                                             null, null, 
                                                             null, null, 
                                                             null, null, 
                                                             null, "DOUBLE", 
                                                             "TAG", "NUMTAG", 
                                                             "SELF", "PARENT", 
                                                             "CHILDREN", 
                                                             "SIBLINGS", 
                                                             "ADJACENTS", 
                                                             "INCOMING", 
                                                             "OUTGOING", 
                                                             "TRUE", "FALSE", 
                                                             "ID", "MULT", 
                                                             "DIV", "MOD", 
                                                             "ADD", "SUB", 
                                                             "GEQ", "GT", 
                                                             "LEQ", "LT", 
                                                             "EQ", "NEQ", 
                                                             "NOT", "AND", 
                                                             "OR", "WS" ];
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"semanticFilterRule", "orExpr", "andExpr", "notExpr", "equalsExpr", "comparisonExpr", 
		"addExpr", "multExpr", "boolAtom", "numAtom", "forallExpr", "existsExpr", 
		"tagExpr", "numtagExpr", "listExpr", "listComprehension", "varExpr", "list",
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
			this.state = 36;
			this.orExpr();
			this.state = 37;
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
	public orExpr(): OrExprContext {
		let localctx: OrExprContext = new OrExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 2, SemanticFilteringParser.RULE_orExpr);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 39;
			this.andExpr();
			this.state = 44;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===35) {
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
		this.enterRule(localctx, 4, SemanticFilteringParser.RULE_andExpr);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 47;
			this.notExpr();
			this.state = 52;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===34) {
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
		this.enterRule(localctx, 6, SemanticFilteringParser.RULE_notExpr);
		try {
			this.state = 58;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case 33:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 55;
				this.match(SemanticFilteringParser.NOT);
				this.state = 56;
				this.notExpr();
				}
				break;
			case 1:
			case 3:
			case 4:
			case 9:
			case 10:
			case 11:
			case 19:
			case 20:
			case 21:
			case 26:
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
		this.enterRule(localctx, 8, SemanticFilteringParser.RULE_equalsExpr);
		let _la: number;
		try {
			this.state = 73;
			this._errHandler.sync(this);
			switch ( this._interp.adaptivePredict(this._input, 4, this._ctx) ) {
			case 1:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 60;
				this.boolAtom();
				}
				break;
			case 2:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 61;
				this.comparisonExpr();
				this.state = 64;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===31 || _la===32) {
					{
					this.state = 62;
					_la = this._input.LA(1);
					if(!(_la===31 || _la===32)) {
					this._errHandler.recoverInline(this);
					}
					else {
						this._errHandler.reportMatch(this);
					    this.consume();
					}
					this.state = 63;
					this.comparisonExpr();
					}
				}

				}
				break;
			case 3:
				this.enterOuterAlt(localctx, 3);
				{
				this.state = 66;
				this.addExpr();
				{
				this.state = 67;
				_la = this._input.LA(1);
				if(!(_la===31 || _la===32)) {
				this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
				    this.consume();
				}
				this.state = 68;
				this.addExpr();
				}
				}
				break;
			case 4:
				this.enterOuterAlt(localctx, 4);
				{
				this.state = 70;
				this.match(SemanticFilteringParser.ID);
				{
				this.state = 71;
				_la = this._input.LA(1);
				if(!(_la===31 || _la===32)) {
				this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
				    this.consume();
				}
				this.state = 72;
				this.match(SemanticFilteringParser.ID);
				}
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
		this.enterRule(localctx, 10, SemanticFilteringParser.RULE_comparisonExpr);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 75;
			this.addExpr();
			{
			this.state = 76;
			_la = this._input.LA(1);
			if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 2013265920) !== 0))) {
			this._errHandler.recoverInline(this);
			}
			else {
				this._errHandler.reportMatch(this);
			    this.consume();
			}
			this.state = 77;
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
		this.enterRule(localctx, 12, SemanticFilteringParser.RULE_addExpr);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 79;
			this.multExpr();
			this.state = 84;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===25 || _la===26) {
				{
				{
				this.state = 80;
				_la = this._input.LA(1);
				if(!(_la===25 || _la===26)) {
				this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
				    this.consume();
				}
				this.state = 81;
				this.multExpr();
				}
				}
				this.state = 86;
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
		this.enterRule(localctx, 14, SemanticFilteringParser.RULE_multExpr);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 87;
			this.numAtom();
			this.state = 92;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 29360128) !== 0)) {
				{
				{
				this.state = 88;
				_la = this._input.LA(1);
				if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 29360128) !== 0))) {
				this._errHandler.recoverInline(this);
				}
				else {
					this._errHandler.reportMatch(this);
				    this.consume();
				}
				this.state = 89;
				this.numAtom();
				}
				}
				this.state = 94;
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
		this.enterRule(localctx, 16, SemanticFilteringParser.RULE_boolAtom);
		try {
			this.state = 104;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case 19:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 95;
				this.match(SemanticFilteringParser.TRUE);
				}
				break;
			case 20:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 96;
				this.match(SemanticFilteringParser.FALSE);
				}
				break;
			case 10:
				this.enterOuterAlt(localctx, 3);
				{
				this.state = 97;
				this.tagExpr();
				}
				break;
			case 4:
				this.enterOuterAlt(localctx, 4);
				{
				this.state = 98;
				this.existsExpr();
				}
				break;
			case 3:
				this.enterOuterAlt(localctx, 5);
				{
				this.state = 99;
				this.forallExpr();
				}
				break;
			case 1:
				this.enterOuterAlt(localctx, 6);
				{
				this.state = 100;
				this.match(SemanticFilteringParser.T__0);
				this.state = 101;
				this.orExpr();
				this.state = 102;
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
	public numAtom(): NumAtomContext {
		let localctx: NumAtomContext = new NumAtomContext(this, this._ctx, this.state);
		this.enterRule(localctx, 18, SemanticFilteringParser.RULE_numAtom);
		let _la: number;
		try {
			this.state = 115;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case 9:
			case 26:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 107;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===26) {
					{
					this.state = 106;
					this.match(SemanticFilteringParser.SUB);
					}
				}

				this.state = 109;
				this.match(SemanticFilteringParser.DOUBLE);
				}
				break;
			case 11:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 110;
				this.numtagExpr();
				}
				break;
			case 1:
				this.enterOuterAlt(localctx, 3);
				{
				this.state = 111;
				this.match(SemanticFilteringParser.T__0);
				this.state = 112;
				this.addExpr();
				this.state = 113;
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
	public forallExpr(): ForallExprContext {
		let localctx: ForallExprContext = new ForallExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 20, SemanticFilteringParser.RULE_forallExpr);
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 117;
			this.match(SemanticFilteringParser.T__2);
			this.state = 118;
			this.listComprehension();
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
	public existsExpr(): ExistsExprContext {
		let localctx: ExistsExprContext = new ExistsExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 22, SemanticFilteringParser.RULE_existsExpr);
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 120;
			this.match(SemanticFilteringParser.T__3);
			this.state = 121;
			this.listComprehension();
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
	public tagExpr(): TagExprContext {
		let localctx: TagExprContext = new TagExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 24, SemanticFilteringParser.RULE_tagExpr);
		try {
			this.state = 127;
			this._errHandler.sync(this);
			switch ( this._interp.adaptivePredict(this._input, 10, this._ctx) ) {
			case 1:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 123;
				this.match(SemanticFilteringParser.TAG);
				this.state = 124;
				this.match(SemanticFilteringParser.ID);
				}
				break;
			case 2:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 125;
				this.match(SemanticFilteringParser.TAG);
				this.state = 126;
				this.listExpr();
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
	public numtagExpr(): NumtagExprContext {
		let localctx: NumtagExprContext = new NumtagExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 26, SemanticFilteringParser.RULE_numtagExpr);
		try {
			this.state = 133;
			this._errHandler.sync(this);
			switch ( this._interp.adaptivePredict(this._input, 11, this._ctx) ) {
			case 1:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 129;
				this.match(SemanticFilteringParser.NUMTAG);
				this.state = 130;
				this.match(SemanticFilteringParser.ID);
				}
				break;
			case 2:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 131;
				this.match(SemanticFilteringParser.NUMTAG);
				this.state = 132;
				this.listExpr();
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
	public listExpr(): ListExprContext {
		let localctx: ListExprContext = new ListExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 28, SemanticFilteringParser.RULE_listExpr);
		try {
			this.state = 137;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case 12:
			case 13:
			case 14:
			case 15:
			case 16:
			case 17:
			case 18:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 135;
				this.list();
				}
				break;
			case 5:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 136;
				this.listComprehension();
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
	public listComprehension(): ListComprehensionContext {
		let localctx: ListComprehensionContext = new ListComprehensionContext(this, this._ctx, this.state);
		this.enterRule(localctx, 30, SemanticFilteringParser.RULE_listComprehension);
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 139;
			this.match(SemanticFilteringParser.T__4);
			this.state = 140;
			this.match(SemanticFilteringParser.ID);
			this.state = 141;
			this.match(SemanticFilteringParser.T__5);
			this.state = 142;
			this.listExpr();
			this.state = 143;
			this.match(SemanticFilteringParser.T__6);
			this.state = 144;
			this.varExpr();
			this.state = 145;
			this.match(SemanticFilteringParser.T__7);
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
	public varExpr(): VarExprContext {
		let localctx: VarExprContext = new VarExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 32, SemanticFilteringParser.RULE_varExpr);
		try {
			this.state = 153;
			this._errHandler.sync(this);
			switch ( this._interp.adaptivePredict(this._input, 13, this._ctx) ) {
			case 1:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 147;
				this.orExpr();
				}
				break;
			case 2:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 148;
				this.match(SemanticFilteringParser.ID);
				this.state = 149;
				this.match(SemanticFilteringParser.LT);
				this.state = 150;
				this.orExpr();
				this.state = 151;
				this.match(SemanticFilteringParser.GT);
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
	public list(): ListContext {
		let localctx: ListContext = new ListContext(this, this._ctx, this.state);
		this.enterRule(localctx, 34, SemanticFilteringParser.RULE_list);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 155;
			_la = this._input.LA(1);
			if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 520192) !== 0))) {
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

	public static readonly _serializedATN: number[] = [4,1,36,158,2,0,7,0,2,
	1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,
	10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,
	7,17,1,0,1,0,1,0,1,1,1,1,1,1,5,1,43,8,1,10,1,12,1,46,9,1,1,2,1,2,1,2,5,
	2,51,8,2,10,2,12,2,54,9,2,1,3,1,3,1,3,3,3,59,8,3,1,4,1,4,1,4,1,4,3,4,65,
	8,4,1,4,1,4,1,4,1,4,1,4,1,4,1,4,3,4,74,8,4,1,5,1,5,1,5,1,5,1,6,1,6,1,6,
	5,6,83,8,6,10,6,12,6,86,9,6,1,7,1,7,1,7,5,7,91,8,7,10,7,12,7,94,9,7,1,8,
	1,8,1,8,1,8,1,8,1,8,1,8,1,8,1,8,3,8,105,8,8,1,9,3,9,108,8,9,1,9,1,9,1,9,
	1,9,1,9,1,9,3,9,116,8,9,1,10,1,10,1,10,1,11,1,11,1,11,1,12,1,12,1,12,1,
	12,3,12,128,8,12,1,13,1,13,1,13,1,13,3,13,134,8,13,1,14,1,14,3,14,138,8,
	14,1,15,1,15,1,15,1,15,1,15,1,15,1,15,1,15,1,16,1,16,1,16,1,16,1,16,1,16,
	3,16,154,8,16,1,17,1,17,1,17,0,0,18,0,2,4,6,8,10,12,14,16,18,20,22,24,26,
	28,30,32,34,0,5,1,0,31,32,1,0,27,30,1,0,25,26,1,0,22,24,1,0,12,18,160,0,
	36,1,0,0,0,2,39,1,0,0,0,4,47,1,0,0,0,6,58,1,0,0,0,8,73,1,0,0,0,10,75,1,
	0,0,0,12,79,1,0,0,0,14,87,1,0,0,0,16,104,1,0,0,0,18,115,1,0,0,0,20,117,
	1,0,0,0,22,120,1,0,0,0,24,127,1,0,0,0,26,133,1,0,0,0,28,137,1,0,0,0,30,
	139,1,0,0,0,32,153,1,0,0,0,34,155,1,0,0,0,36,37,3,2,1,0,37,38,5,0,0,1,38,
	1,1,0,0,0,39,44,3,4,2,0,40,41,5,35,0,0,41,43,3,4,2,0,42,40,1,0,0,0,43,46,
	1,0,0,0,44,42,1,0,0,0,44,45,1,0,0,0,45,3,1,0,0,0,46,44,1,0,0,0,47,52,3,
	6,3,0,48,49,5,34,0,0,49,51,3,6,3,0,50,48,1,0,0,0,51,54,1,0,0,0,52,50,1,
	0,0,0,52,53,1,0,0,0,53,5,1,0,0,0,54,52,1,0,0,0,55,56,5,33,0,0,56,59,3,6,
	3,0,57,59,3,8,4,0,58,55,1,0,0,0,58,57,1,0,0,0,59,7,1,0,0,0,60,74,3,16,8,
	0,61,64,3,10,5,0,62,63,7,0,0,0,63,65,3,10,5,0,64,62,1,0,0,0,64,65,1,0,0,
	0,65,74,1,0,0,0,66,67,3,12,6,0,67,68,7,0,0,0,68,69,3,12,6,0,69,74,1,0,0,
	0,70,71,5,21,0,0,71,72,7,0,0,0,72,74,5,21,0,0,73,60,1,0,0,0,73,61,1,0,0,
	0,73,66,1,0,0,0,73,70,1,0,0,0,74,9,1,0,0,0,75,76,3,12,6,0,76,77,7,1,0,0,
	77,78,3,12,6,0,78,11,1,0,0,0,79,84,3,14,7,0,80,81,7,2,0,0,81,83,3,14,7,
	0,82,80,1,0,0,0,83,86,1,0,0,0,84,82,1,0,0,0,84,85,1,0,0,0,85,13,1,0,0,0,
	86,84,1,0,0,0,87,92,3,18,9,0,88,89,7,3,0,0,89,91,3,18,9,0,90,88,1,0,0,0,
	91,94,1,0,0,0,92,90,1,0,0,0,92,93,1,0,0,0,93,15,1,0,0,0,94,92,1,0,0,0,95,
	105,5,19,0,0,96,105,5,20,0,0,97,105,3,24,12,0,98,105,3,22,11,0,99,105,3,
	20,10,0,100,101,5,1,0,0,101,102,3,2,1,0,102,103,5,2,0,0,103,105,1,0,0,0,
	104,95,1,0,0,0,104,96,1,0,0,0,104,97,1,0,0,0,104,98,1,0,0,0,104,99,1,0,
	0,0,104,100,1,0,0,0,105,17,1,0,0,0,106,108,5,26,0,0,107,106,1,0,0,0,107,
	108,1,0,0,0,108,109,1,0,0,0,109,116,5,9,0,0,110,116,3,26,13,0,111,112,5,
	1,0,0,112,113,3,12,6,0,113,114,5,2,0,0,114,116,1,0,0,0,115,107,1,0,0,0,
	115,110,1,0,0,0,115,111,1,0,0,0,116,19,1,0,0,0,117,118,5,3,0,0,118,119,
	3,30,15,0,119,21,1,0,0,0,120,121,5,4,0,0,121,122,3,30,15,0,122,23,1,0,0,
	0,123,124,5,10,0,0,124,128,5,21,0,0,125,126,5,10,0,0,126,128,3,28,14,0,
	127,123,1,0,0,0,127,125,1,0,0,0,128,25,1,0,0,0,129,130,5,11,0,0,130,134,
	5,21,0,0,131,132,5,11,0,0,132,134,3,28,14,0,133,129,1,0,0,0,133,131,1,0,
	0,0,134,27,1,0,0,0,135,138,3,34,17,0,136,138,3,30,15,0,137,135,1,0,0,0,
	137,136,1,0,0,0,138,29,1,0,0,0,139,140,5,5,0,0,140,141,5,21,0,0,141,142,
	5,6,0,0,142,143,3,28,14,0,143,144,5,7,0,0,144,145,3,32,16,0,145,146,5,8,
	0,0,146,31,1,0,0,0,147,154,3,2,1,0,148,149,5,21,0,0,149,150,5,30,0,0,150,
	151,3,2,1,0,151,152,5,28,0,0,152,154,1,0,0,0,153,147,1,0,0,0,153,148,1,
	0,0,0,154,33,1,0,0,0,155,156,7,4,0,0,156,35,1,0,0,0,14,44,52,58,64,73,84,
	92,104,107,115,127,133,137,153];

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
	public orExpr(): OrExprContext {
		return this.getTypedRuleContext(OrExprContext, 0) as OrExprContext;
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
	public boolAtom(): BoolAtomContext {
		return this.getTypedRuleContext(BoolAtomContext, 0) as BoolAtomContext;
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
	public ID_list(): TerminalNode[] {
	    	return this.getTokens(SemanticFilteringParser.ID);
	}
	public ID(i: number): TerminalNode {
		return this.getToken(SemanticFilteringParser.ID, i);
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
	public tagExpr(): TagExprContext {
		return this.getTypedRuleContext(TagExprContext, 0) as TagExprContext;
	}
	public existsExpr(): ExistsExprContext {
		return this.getTypedRuleContext(ExistsExprContext, 0) as ExistsExprContext;
	}
	public forallExpr(): ForallExprContext {
		return this.getTypedRuleContext(ForallExprContext, 0) as ForallExprContext;
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
	public numtagExpr(): NumtagExprContext {
		return this.getTypedRuleContext(NumtagExprContext, 0) as NumtagExprContext;
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


export class ForallExprContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public listComprehension(): ListComprehensionContext {
		return this.getTypedRuleContext(ListComprehensionContext, 0) as ListComprehensionContext;
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_forallExpr;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterForallExpr) {
	 		listener.enterForallExpr(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitForallExpr) {
	 		listener.exitForallExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitForallExpr) {
			return visitor.visitForallExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ExistsExprContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public listComprehension(): ListComprehensionContext {
		return this.getTypedRuleContext(ListComprehensionContext, 0) as ListComprehensionContext;
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_existsExpr;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterExistsExpr) {
	 		listener.enterExistsExpr(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitExistsExpr) {
	 		listener.exitExistsExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitExistsExpr) {
			return visitor.visitExistsExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class TagExprContext extends ParserRuleContext {
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
	public listExpr(): ListExprContext {
		return this.getTypedRuleContext(ListExprContext, 0) as ListExprContext;
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_tagExpr;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterTagExpr) {
	 		listener.enterTagExpr(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitTagExpr) {
	 		listener.exitTagExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitTagExpr) {
			return visitor.visitTagExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class NumtagExprContext extends ParserRuleContext {
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
	public listExpr(): ListExprContext {
		return this.getTypedRuleContext(ListExprContext, 0) as ListExprContext;
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_numtagExpr;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterNumtagExpr) {
	 		listener.enterNumtagExpr(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitNumtagExpr) {
	 		listener.exitNumtagExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitNumtagExpr) {
			return visitor.visitNumtagExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ListExprContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public list(): ListContext {
		return this.getTypedRuleContext(ListContext, 0) as ListContext;
	}
	public listComprehension(): ListComprehensionContext {
		return this.getTypedRuleContext(ListComprehensionContext, 0) as ListComprehensionContext;
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_listExpr;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterListExpr) {
	 		listener.enterListExpr(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitListExpr) {
	 		listener.exitListExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitListExpr) {
			return visitor.visitListExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ListComprehensionContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public ID(): TerminalNode {
		return this.getToken(SemanticFilteringParser.ID, 0);
	}
	public listExpr(): ListExprContext {
		return this.getTypedRuleContext(ListExprContext, 0) as ListExprContext;
	}
	public varExpr(): VarExprContext {
		return this.getTypedRuleContext(VarExprContext, 0) as VarExprContext;
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_listComprehension;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterListComprehension) {
	 		listener.enterListComprehension(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitListComprehension) {
	 		listener.exitListComprehension(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitListComprehension) {
			return visitor.visitListComprehension(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class VarExprContext extends ParserRuleContext {
	constructor(parser?: SemanticFilteringParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public orExpr(): OrExprContext {
		return this.getTypedRuleContext(OrExprContext, 0) as OrExprContext;
	}
	public ID(): TerminalNode {
		return this.getToken(SemanticFilteringParser.ID, 0);
	}
	public LT(): TerminalNode {
		return this.getToken(SemanticFilteringParser.LT, 0);
	}
	public GT(): TerminalNode {
		return this.getToken(SemanticFilteringParser.GT, 0);
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_varExpr;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterVarExpr) {
	 		listener.enterVarExpr(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitVarExpr) {
	 		listener.exitVarExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitVarExpr) {
			return visitor.visitVarExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ListContext extends ParserRuleContext {
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
	public CHILDREN(): TerminalNode {
		return this.getToken(SemanticFilteringParser.CHILDREN, 0);
	}
	public SIBLINGS(): TerminalNode {
		return this.getToken(SemanticFilteringParser.SIBLINGS, 0);
	}
	public ADJACENTS(): TerminalNode {
		return this.getToken(SemanticFilteringParser.ADJACENTS, 0);
	}
	public INCOMING(): TerminalNode {
		return this.getToken(SemanticFilteringParser.INCOMING, 0);
	}
	public OUTGOING(): TerminalNode {
		return this.getToken(SemanticFilteringParser.OUTGOING, 0);
	}
    public get ruleIndex(): number {
    	return SemanticFilteringParser.RULE_list;
	}
	public enterRule(listener: SemanticFilteringListener): void {
	    if(listener.enterList) {
	 		listener.enterList(this);
		}
	}
	public exitRule(listener: SemanticFilteringListener): void {
	    if(listener.exitList) {
	 		listener.exitList(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SemanticFilteringVisitor<Result>): Result {
		if (visitor.visitList) {
			return visitor.visitList(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
