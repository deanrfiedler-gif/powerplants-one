import { FieldJobScreen } from '../../../../components/field-screens';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <FieldJobScreen id={id}/>;}
