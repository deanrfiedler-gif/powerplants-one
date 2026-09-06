import ts from "typescript";
import { mkdir,readFile,writeFile } from "node:fs/promises";
const modules=["offline/protocol","offline/store","offline/client","offline/app","field/validation","shared/validation","platform/validation","platform/errors"];
for(const name of modules){
 const source=await readFile(`src/${name}.ts`,"utf8");
 const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:`${name}.ts`});
 const output=result.outputText.replace(/from (["'])(\.[^"']+)\1/g,(_all,quote:string,path:string)=>`from ${quote}${path.endsWith(".js")?path:path+".js"}${quote}`);
 const filename=`public/offline/modules/${name}.js`;await mkdir(filename.slice(0,filename.lastIndexOf("/")),{recursive:true});await writeFile(filename,output);
}
