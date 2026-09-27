import {expect,it} from 'vitest';
import {countBlockingGrammar} from './evaluate';
it('does not require a sentence-ending full stop on a title',()=>expect(countBlockingGrammar([{ruleId:'POINT',offset:20}],40)).toBe(0));
it('still blocks missing body punctuation and errors inside titles',()=>expect(countBlockingGrammar([{ruleId:'POINT',offset:50},{ruleId:'ACCORD',offset:20}],40)).toBe(2));
