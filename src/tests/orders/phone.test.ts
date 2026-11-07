import { UNKNOWN_PHONE, normalizePhone } from "../../shared/validation/phone";

describe("normalizePhone", () => {
  it.each([
    ["(11) 91234-5678", "11912345678"],
    ["(11) 3456-7890", "1134567890"],
    ["+55 (21) 98765-4321", "21987654321"],
    ["5521987654321", "21987654321"],
    ["+1 415 555 2671", "+14155552671"],
    ["  11912345678  ", "11912345678"],
  ])("%s vira %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it("DDD 55 não é confundido com o código do país", () => {
    expect(normalizePhone("55912345678")).toBe("55912345678");
  });

  it("mantém o marcador de telefone ausente", () => {
    expect(normalizePhone(UNKNOWN_PHONE)).toBe(UNKNOWN_PHONE);
    expect(normalizePhone("(00) 0 0000-0000")).toBe(UNKNOWN_PHONE);
  });

  it.each([
    "",
    "abc",
    "N/A",
    "1234567",
    "(00) 91234-5678",
    "(11) 01234-5678",
    "(11) 61234-5678",
    "+0123456789",
    "+1234",
    "+1234567890123456",
  ])("recusa %s", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});
