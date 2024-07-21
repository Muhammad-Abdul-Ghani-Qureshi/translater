"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagepool_1 = require("../browser/pagepool");
const parser_1 = require("../parser/parser");
const handler = (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const options = Object.assign(Object.assign({}, request.query), request.body);
    const { text, from = "auto", to = "zh-CN", lite = false } = options;
    if (!text) {
        reply
            .code(400)
            .header("Content-Type", "application/json; charset=utf-8")
            .send({
            error: 1,
            message: "text is required",
        });
        return;
    }
    const page = pagepool_1.pagePool.getPage();
    if (!page) {
        reply
            .code(400)
            .header("Content-Type", "application/json; charset=utf-8")
            .send({
            error: 1,
            message: "We're running out of resources. Please wait for a moment and retry.",
        });
        return;
    }
    let response;
    try {
        const res = yield (0, parser_1.parsePage)(page, { text, from, to, lite });
        response = {
            result: res.result,
            pronunciation: res.pronunciation,
            from: {
                // iso: res.fromISO,
                pronunciation: res.fromPronunciation,
                didYouMean: res.fromDidYouMean,
                suggestions: res.fromSuggestions,
            },
            definitions: res.definitions,
            examples: res.examples,
            translations: res.translations,
        };
        Object.keys(response).forEach((key) => {
            if (response[key] === undefined ||
                (typeof response[key] === "object" &&
                    Object.keys(response[key]).length === 0) ||
                (Array.isArray(response[key]) && response[key].length === 0))
                delete response[key];
        });
        reply
            .code(200)
            .header("Content-Type", "application/json; charset=utf-8")
            .send(response);
    }
    catch (e) {
        throw e;
    }
    finally {
        pagepool_1.pagePool.releasePage(page);
    }
});
exports.default = ((fastify, opts, done) => {
    fastify.route({
        method: "GET",
        url: "/",
        schema: {
            querystring: {
                text: { type: "string" },
                from: { type: "string" },
                to: { type: "string" },
                lite: { type: "boolean" },
            },
        },
        handler,
    });
    fastify.route({
        method: "POST",
        url: "/",
        schema: {
            body: {
                text: { type: "string" },
                from: { type: "string" },
                to: { type: "string" },
                lite: { type: "boolean" },
            },
        },
        handler,
    });
    done();
});
//# sourceMappingURL=api.js.map