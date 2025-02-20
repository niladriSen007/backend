import { GlobalErrorResponse } from './../utils/global-error';
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes"
import { config } from "../config";
const { logger } = config;
export const errorHandler = (err: GlobalErrorResponse, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);
  res.status(err?.statusCode || StatusCodes?.INTERNAL_SERVER_ERROR).json({
    message: err?.message || "Internal Server Error",
    error: err?.error || {}
  });
}