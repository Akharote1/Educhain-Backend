import * as fs from 'fs';
import { TemplateHandler } from 'easy-template-x';
import path from 'path';
import libre from "libreoffice-convert";
import { promisify } from 'util';

libre.convertAsync = promisify(libre.convert);

export const generateMarksheetDocument = async (data) => {
  const template = fs.readFileSync(path.resolve('src/templates/som_template.docx'));

  const handler = new TemplateHandler();
  const doc = await handler.process(template, data);

  const output = await libre.convertAsync(doc, '.pdf', undefined);
  
  console.log('Successfully processed document')
  return output;
}