import { expect } from "chai";
import Field from "./types/field.js";

describe("test field functions", () => {
  it("should convert correctly to the hi-lo form", () => {
    let hi = BigInt(938498794821);
    let lo = BigInt(398795278719);

    let field = Field.fromHilo(hi, lo);
    let expectedHiLo = field.hilo;

    expect(hi).to.be.equal(expectedHiLo[0]);
    expect(lo).to.be.equal(expectedHiLo[1]);
  });

  it("should convert correctly to the LE-byte form", () => {
    let leBytes = new Array(32);
    for (let i = 0; i < 32; i++) {
      leBytes[i] = BigInt(5 * i + 11);
    }

    let field = Field.fromLEBytes(leBytes);
    let expectedLEBytes = field.leBytes;
    for (let i = 0; i < 32; i++) {
      expect(expectedLEBytes[i]).to.be.equal(leBytes[i]);
    }
  });

  it("should convert correctly to the Uint8Array form", () => {
    let field = new Field(BigInt("48739874932483429"));
    let expectedField = Field.fromUint8Array(field.uint8Array);
    expect(field.valueOf === expectedField.valueOf).to.be.true;
  });
});
