import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({state:{hydrated:false,onboarded:false,diagnostic:null,granularDiagnosticReady:false,interests:[],sessions:[]}}));
vi.mock('@/lib/student-store',()=>({hasStudentBackend:true,useStudentState:()=>f.state}));
vi.mock('@/lib/actions/student',()=>({loadStudentHome:vi.fn(),markBadgesSeen:vi.fn()}));
vi.mock('@/components/student-assignments',()=>({StudentAssignments:()=>null}));
vi.mock('@/components/motivation',()=>({BadgeShelf:()=>null,ClassGoalCard:()=>null,WeekStrip:()=>null,WeeklyRecapCard:()=>null}));
vi.mock('@/components/league',()=>({LeagueCard:()=>null}));
import StudentHome from './home-client';
import {HOME_COPY} from './home-copy';
it('uses the recorded copy across loading, onboarding and learning states',()=>{
 const render=()=>renderToStaticMarkup(React.createElement(StudentHome,{copy:HOME_COPY}));
 let html=render();expect(html).toContain(HOME_COPY.loading);expect(html).toContain(HOME_COPY.greeting);
 f.state.hydrated=true;html=render();expect(html).toContain(HOME_COPY.knowYou);expect(html).toContain(HOME_COPY.onboarding);
 f.state.onboarded=true;html=render();expect(html).toContain(HOME_COPY.diagnosticHelp);
 f.state.granularDiagnosticReady=true;html=render();
 for(const text of [HOME_COPY.lessons,HOME_COPY.results,HOME_COPY.mission,HOME_COPY.profile,HOME_COPY.skillProfile,HOME_COPY.choose])expect(html).toContain(text);
});
