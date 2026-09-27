import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
vi.mock('next/navigation',()=>({usePathname:()=>'/student',useRouter:()=>({})}));
vi.mock('@/lib/analytics',()=>({identifyAnalytics:()=>{}}));
vi.mock('@/lib/student-store',()=>({resetStudentState:()=>{},hasStudentBackend:true,retryStudentHydration:async()=>{},useStudentState:()=>({hydrated:false})}));
import {DashboardShell} from './dashboard-shell';
import {StudentAccessPending} from './student-access-pending';
import {StudentAssessmentGate} from './student-assessment-gate';
import {DASHBOARD_COPY,STUDENT_INTERFACE_COPY} from '@/lib/student-interface-copy';
import {deliveredTextFragments} from '@/lib/diagnostic/granular/delivery-journal';
type OptionalChildren<T extends React.ElementType> = React.ComponentType<Omit<React.ComponentProps<T>,'children'> & {children?:React.ReactNode}>;
const DashboardShellForTest=DashboardShell as OptionalChildren<typeof DashboardShell>;
const StudentAssessmentGateForTest=StudentAssessmentGate as OptionalChildren<typeof StudentAssessmentGate>;
it('renders the same French shell, access and loading wording recorded by the layout',()=>{
 const recorded=deliveredTextFragments({controls:STUDENT_INTERFACE_COPY,shell:DASHBOARD_COPY.fr,brand:DASHBOARD_COPY.brand});
 const html=renderToStaticMarkup(React.createElement(DashboardShellForTest,{area:'Élève',nav:[{href:'/student',label:'Accueil'}],tabs:[{href:'/student',label:'Accueil',icon:'home'}]},null));
 for(const text of [DASHBOARD_COPY.fr.skip,DASHBOARD_COPY.fr.quickNavigation,DASHBOARD_COPY.brand,STUDENT_INTERFACE_COPY.theme,STUDENT_INTERFACE_COPY.signOut]){expect(html).toContain(text);expect(recorded).toContain(text);}
 const access=renderToStaticMarkup(React.createElement(StudentAccessPending));
 for(const text of Object.values(STUDENT_INTERFACE_COPY.access)){expect(access).toContain(text);expect(recorded).toContain(text);}
 const loading=renderToStaticMarkup(React.createElement(StudentAssessmentGateForTest,null,null));
 expect(loading).toContain(STUDENT_INTERFACE_COPY.loading);expect(recorded).toContain(STUDENT_INTERFACE_COPY.loading);
});
