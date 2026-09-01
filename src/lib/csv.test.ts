import{describe,expect,it}from"vitest";import{spreadsheetSafeCsvCell as cell}from"./csv";
describe("spreadsheetSafeCsvCell",()=>{it.each(["=CMD()","+1+1","-2+3","@SUM(A1)","  =1+1","\t@x"])("neutralizes %s",value=>expect(cell(value)).toMatch(/^"'/));it("quotes embedded quotes",()=>expect(cell('a"b')).toBe('"a""b"'));it("does not alter ordinary text",()=>expect(cell("Alice")).toBe('"Alice"'));});
