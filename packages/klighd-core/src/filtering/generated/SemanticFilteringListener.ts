// Generated from SemanticFiltering.g4 by ANTLR 4.13.2

import {ParseTreeListener} from "antlr4";


import { SemanticFilterRuleContext } from "./SemanticFilteringParser.js";
import { PositionalFilterRuleContext } from "./SemanticFilteringParser.js";
import { OrExprContext } from "./SemanticFilteringParser.js";
import { AndExprContext } from "./SemanticFilteringParser.js";
import { NotExprContext } from "./SemanticFilteringParser.js";
import { EqualsExprContext } from "./SemanticFilteringParser.js";
import { ComparisonExprContext } from "./SemanticFilteringParser.js";
import { AddExprContext } from "./SemanticFilteringParser.js";
import { MultExprContext } from "./SemanticFilteringParser.js";
import { BoolAtomContext } from "./SemanticFilteringParser.js";
import { NumAtomContext } from "./SemanticFilteringParser.js";
import { PositionalQuantifierContext } from "./SemanticFilteringParser.js";
import { TagContext } from "./SemanticFilteringParser.js";
import { NumtagContext } from "./SemanticFilteringParser.js";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `SemanticFilteringParser`.
 */
export default class SemanticFilteringListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.semanticFilterRule`.
	 * @param ctx the parse tree
	 */
	enterSemanticFilterRule?: (ctx: SemanticFilterRuleContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.semanticFilterRule`.
	 * @param ctx the parse tree
	 */
	exitSemanticFilterRule?: (ctx: SemanticFilterRuleContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.positionalFilterRule`.
	 * @param ctx the parse tree
	 */
	enterPositionalFilterRule?: (ctx: PositionalFilterRuleContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.positionalFilterRule`.
	 * @param ctx the parse tree
	 */
	exitPositionalFilterRule?: (ctx: PositionalFilterRuleContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.orExpr`.
	 * @param ctx the parse tree
	 */
	enterOrExpr?: (ctx: OrExprContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.orExpr`.
	 * @param ctx the parse tree
	 */
	exitOrExpr?: (ctx: OrExprContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.andExpr`.
	 * @param ctx the parse tree
	 */
	enterAndExpr?: (ctx: AndExprContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.andExpr`.
	 * @param ctx the parse tree
	 */
	exitAndExpr?: (ctx: AndExprContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.notExpr`.
	 * @param ctx the parse tree
	 */
	enterNotExpr?: (ctx: NotExprContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.notExpr`.
	 * @param ctx the parse tree
	 */
	exitNotExpr?: (ctx: NotExprContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.equalsExpr`.
	 * @param ctx the parse tree
	 */
	enterEqualsExpr?: (ctx: EqualsExprContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.equalsExpr`.
	 * @param ctx the parse tree
	 */
	exitEqualsExpr?: (ctx: EqualsExprContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.comparisonExpr`.
	 * @param ctx the parse tree
	 */
	enterComparisonExpr?: (ctx: ComparisonExprContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.comparisonExpr`.
	 * @param ctx the parse tree
	 */
	exitComparisonExpr?: (ctx: ComparisonExprContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.addExpr`.
	 * @param ctx the parse tree
	 */
	enterAddExpr?: (ctx: AddExprContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.addExpr`.
	 * @param ctx the parse tree
	 */
	exitAddExpr?: (ctx: AddExprContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.multExpr`.
	 * @param ctx the parse tree
	 */
	enterMultExpr?: (ctx: MultExprContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.multExpr`.
	 * @param ctx the parse tree
	 */
	exitMultExpr?: (ctx: MultExprContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.boolAtom`.
	 * @param ctx the parse tree
	 */
	enterBoolAtom?: (ctx: BoolAtomContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.boolAtom`.
	 * @param ctx the parse tree
	 */
	exitBoolAtom?: (ctx: BoolAtomContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.numAtom`.
	 * @param ctx the parse tree
	 */
	enterNumAtom?: (ctx: NumAtomContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.numAtom`.
	 * @param ctx the parse tree
	 */
	exitNumAtom?: (ctx: NumAtomContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.positionalQuantifier`.
	 * @param ctx the parse tree
	 */
	enterPositionalQuantifier?: (ctx: PositionalQuantifierContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.positionalQuantifier`.
	 * @param ctx the parse tree
	 */
	exitPositionalQuantifier?: (ctx: PositionalQuantifierContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.tag`.
	 * @param ctx the parse tree
	 */
	enterTag?: (ctx: TagContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.tag`.
	 * @param ctx the parse tree
	 */
	exitTag?: (ctx: TagContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.numtag`.
	 * @param ctx the parse tree
	 */
	enterNumtag?: (ctx: NumtagContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.numtag`.
	 * @param ctx the parse tree
	 */
	exitNumtag?: (ctx: NumtagContext) => void;
}

