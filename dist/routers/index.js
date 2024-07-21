"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const constants_1 = require("../parser/constants");
exports.default = ((fastify, opt, done) => {
    fastify.register(require("@fastify/static"), {
        root: path_1.default.join(constants_1.ROOT, "public"),
    });
    done();
});
//# sourceMappingURL=index.js.map