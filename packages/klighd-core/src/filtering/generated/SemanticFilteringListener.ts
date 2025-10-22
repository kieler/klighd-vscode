// Generated from SemanticFiltering.g4 by ANTLR 4.13.2

import {ParseTreeListener} from "antlr4";


import { SemanticFilterRuleContext } from "./SemanticFilteringParser.js";
import { OrExprContext } from "./SemanticFilteringParser.js";
import { AndExprContext } from "./SemanticFilteringParser.js";
import { NotExprContext } from "./SemanticFilteringParser.js";
import { EqualsExprContext } from "./SemanticFilteringParser.js";
import { ComparisonExprContext } from "./SemanticFilteringParser.js";
import { AddExprContext } from "./SemanticFilteringParser.js";
import { MultExprContext } from "./SemanticFilteringParser.js";
import { BoolAtomContext } from "./SemanticFilteringParser.js";
import { NumAtomContext } from "./SemanticFilteringParser.js";
import { ForallExprContext } from "./SemanticFilteringParser.js";
import { ExistsExprContext } from "./SemanticFilteringParser.js";
import { TagExprContext } from "./SemanticFilteringParser.js";
import { NumtagExprContext } from "./SemanticFilteringParser.js";
import { ListExprContext } from "./SemanticFilteringParser.js";
import { ListComprehensionContext } from "./SemanticFilteringParser.js";
import { VarExprContext } from "./SemanticFilteringParser.js";
import { ListContext } from "./SemanticFilteringParser.js";


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
	 * Enter a parse tree produced by `SemanticFilteringParser.forallExpr`.
	 * @param ctx the parse tree
	 */
	enterForallExpr?: (ctx: ForallExprContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.forallExpr`.
	 * @param ctx the parse tree
	 */
	exitForallExpr?: (ctx: ForallExprContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.existsExpr`.
	 * @param ctx the parse tree
	 */
	enterExistsExpr?: (ctx: ExistsExprContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.existsExpr`.
	 * @param ctx the parse tree
	 */
	exitExistsExpr?: (ctx: ExistsExprContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.tagExpr`.
	 * @param ctx the parse tree
	 */
	enterTagExpr?: (ctx: TagExprContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.tagExpr`.
	 * @param ctx the parse tree
	 */
	exitTagExpr?: (ctx: TagExprContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.numtagExpr`.
	 * @param ctx the parse tree
	 */
	enterNumtagExpr?: (ctx: NumtagExprContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.numtagExpr`.
	 * @param ctx the parse tree
	 */
	exitNumtagExpr?: (ctx: NumtagExprContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.listExpr`.
	 * @param ctx the parse tree
	 */
	enterListExpr?: (ctx: ListExprContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.listExpr`.
	 * @param ctx the parse tree
	 */
	exitListExpr?: (ctx: ListExprContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.listComprehension`.
	 * @param ctx the parse tree
	 */
	enterListComprehension?: (ctx: ListComprehensionContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.listComprehension`.
	 * @param ctx the parse tree
	 */
	exitListComprehension?: (ctx: ListComprehensionContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.varExpr`.
	 * @param ctx the parse tree
	 */
	enterVarExpr?: (ctx: VarExprContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.varExpr`.
	 * @param ctx the parse tree
	 */
	exitVarExpr?: (ctx: VarExprContext) => void;
	/**
	 * Enter a parse tree produced by `SemanticFilteringParser.list`.
	 * @param ctx the parse tree
	 */
	enterList?: (ctx: ListContext) => void;
	/**
	 * Exit a parse tree produced by `SemanticFilteringParser.list`.
	 * @param ctx the parse tree
	 */
	exitList?: (ctx: ListContext) => void;
}

