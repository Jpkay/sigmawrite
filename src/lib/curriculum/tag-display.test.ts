import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {CurriculumTags} from '@/components/curriculum-tags';
import {curriculumTagDisplay} from './tag-display';
it('matches the rendered shortened label and retains its full title',()=>{
 const tag={framework:'cycle4' as const,code:'a',labelFr:'Une description de compétence suffisamment longue pour dépasser la limite visible de soixante caractères'};
 for(const compact of [false,true]){
  const display=curriculumTagDisplay(tag,compact);
  const html=renderToStaticMarkup(React.createElement(CurriculumTags,{tags:[tag],compact}));
  expect(html.replace(/<[^>]*>/g,'')).toBe(display.visible);
  expect(html).toContain(`title="${tag.labelFr}"`);
  expect(display.title).toBe(tag.labelFr);
 }
});
