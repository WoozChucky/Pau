import { Get, Path, Route } from "tsoa";

import { Block } from "../../../model/block";

// TODO: Finish this spec (and create the others) for swagger documentation

@Route("/v1/blocks")
export class BlockController {
  @Get("/")
  public async findAll(): Promise<object> {
    return {
      message: "pong",
    };
  }

  @Get("/:hash")
  public async findOneByHash(@Path() hash: string): Promise<Block> {
    return {
      timestamp: 0,
      index: 0,
      data: {},
      hash: "",
      difficulty: 0,
      nonce: 0,
      previousHash: "",
    };
  }
}
