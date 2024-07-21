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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const pagepool_1 = __importDefault(require("./browser/pagepool"));
const fastify = (0, fastify_1.default)({ logger: true });
const { PAGE_COUNT = "5", PORT = "8999" } = process.env;
(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("initializing pages...");
    try {
        yield new pagepool_1.default(parseInt(PAGE_COUNT, 10)).init();
    }
    catch (e) {
        console.log("Failed to initialize pages");
        console.error(e);
        process.exit(1);
    }
    console.log("ready");
    fastify.register(require("./routers/api").default, { prefix: "/api" });
    fastify.register(require("./routers/index").default, { prefix: "/" });
    try {
        yield fastify.listen({
            port: Number(PORT),
            host: "0.0.0.0",
        });
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}))();
//# sourceMappingURL=app.js.map