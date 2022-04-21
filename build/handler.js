"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const handler = (req, res, next) => {
  if (req.path === "/hello") {
    return res.end("hey bro");
  }
  next();
};
exports.handler = handler;
