// Generated from SemanticFiltering.g4 by ANTLR 4.13.2

import {ParseTreeVisitor} from 'antlr4';


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
import { VarExprContext } from "./SemanticFilteringParser.js";
import { ListContext } from "./SemanticFilteringParser.js";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `SemanticFilteringParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export default class SemanticFilteringVisitor<Result> extends ParseTreeVisitor<Result> {
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.semanticFilterRule`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitSemanticFilterRule?: (ctx: SemanticFilterRuleContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.orExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitOrExpr?: (ctx: OrExprContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.andExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAndExpr?: (ctx: AndExprContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.notExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitNotExpr?: (ctx: NotExprContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.equalsExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitEqualsExpr?: (ctx: EqualsExprContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.comparisonExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitComparisonExpr?: (ctx: ComparisonExprContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.addExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAddExpr?: (ctx: AddExprContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.multExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitMultExpr?: (ctx: MultExprContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.boolAtom`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitBoolAtom?: (ctx: BoolAtomContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.numAtom`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitNumAtom?: (ctx: NumAtomContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.forallExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitForallExpr?: (ctx: ForallExprContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.existsExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExistsExpr?: (ctx: ExistsExprContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.tagExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitTagExpr?: (ctx: TagExprContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.numtagExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitNumtagExpr?: (ctx: NumtagExprContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.listExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitListExpr?: (ctx: ListExprContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.varExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitVarExpr?: (ctx: VarExprContext) => Result;
	/**
	 * Visit a parse tree produced by `SemanticFilteringParser.list`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitList?: (ctx: ListContext) => Result;
}

