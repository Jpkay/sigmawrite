import 'server-only';
import type {ComponentProps} from 'react';
import {PageHeader} from './page';
import {journalCurrentStudentPayload} from '@/lib/diagnostic/granular/server-delivery-journal';

type Props=ComponentProps<typeof PageHeader>&{boundary:string;actionText?:string};
/** Server student routes only. Capture the exact header text, not arbitrary
 * React children, client states or transport URLs inside an action. */
export async function StudentPageHeader({boundary,actionText,...props}:Props) {
  if(props.action&&!actionText?.trim())throw Error('Student header action requires its displayed text');
  await journalCurrentStudentPayload(boundary,{
    title:props.title,description:props.description,eyebrow:props.eyebrow,
    ...(props.action?{actionText}:{}),
  });
  return <PageHeader {...props}/>;
}
