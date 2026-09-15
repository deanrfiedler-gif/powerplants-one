// Shared, targeted r01 audit refinements. Used by the builder and existing-file edit.
export function refineWorkbook(wb) {
  const overview=wb.worksheets.getItem('Overview');
  const project=wb.worksheets.getItem('Project');
  const lines=wb.worksheets.getItem('Estimate lines');

  // Summary labels and membership follow the editable scope, not the fixture.
  for(let row=6;row<=12;row++) {
    overview.getRange(`D${row}`).formulas=[[`=IF('Scope'!B${row}="","",'Scope'!B${row})`]];
    overview.getRange(`E${row}:F${row}`).formulas=[[
      `=IF(OR($B$6="",'Scope'!A${row}=""),"",SUMIFS('Estimate lines'!N6:N105,'Estimate lines'!B6:B105,'Scope'!A${row}))`,
      `=IF(OR($B$7="",'Scope'!A${row}=""),"",SUMIFS('Estimate lines'!O6:O105,'Estimate lines'!B6:B105,'Scope'!A${row}))`
    ]];
  }
  overview.getRange('B8').formulas=[['=IF(OR(B7="",COUNTIF(\'Estimate lines\'!L6:L105,"Yes")+COUNTIF(\'Estimate lines\'!L6:L105,"No")<>B9),"",SUMIFS(\'Estimate lines\'!O6:O105,\'Estimate lines\'!L6:L105,"Yes"))']];
  overview.getRange('D15').values=[['Before you upload']];
  overview.getRange('D15').format.font={bold:true,color:'#242a37'};
  overview.getRange('D16').values=[['Blank totals mean required values are missing.']];
  overview.getRange('D17').values=[['Check every populated row, including hidden rows.']];
  overview.getRange('D18').values=[['This template prepares 100 lines and seven sections.']];
  overview.getRange('D19').values=[['Extend the summary and export together if redesigned.']];
  overview.getRange('A30').values=[['Keep the 100 prepared rows. Do not sort or edit the calculated export.']];
  overview.getRange('A34').values=[['Synthetic preview only. Context downloads and live import are not implemented.']];
  overview.getRange('A35').values=[['Do not add subtotal rows. Keep alternative estimating options in separate files.']];
  project.getRange('A3').values=[['Synthetic context for the import preview; operational adoption is pending.']];

  // Compact identity panes leave working columns visible on ordinary screens.
  lines.freezePanes.unfreeze();lines.freezePanes.freezeRows(5);lines.freezePanes.freezeColumns(2);
  const exported=wb.worksheets.getItem('PPO export');
  lines.getRange('F6:F105').format.horizontalAlignment='center';
  exported.getRange('F6:F105').format.horizontalAlignment='center';
  exported.freezePanes.unfreeze();exported.freezePanes.freezeRows(5);exported.freezePanes.freezeColumns(2);
  overview.getRange('A16:B19').format.fill='#f5f6f8';
  for(const sheet of [overview,project,lines,exported,wb.worksheets.getItem('Scope'),wb.worksheets.getItem('Sources')]) {
    for(const table of sheet.tables.items)table.style='TableStyleLight1';
  }
}

export function verifyRefinements(wb) {
  const overview=wb.worksheets.getItem('Overview');
  const scope=wb.worksheets.getItem('Scope');
  const lines=wb.worksheets.getItem('Estimate lines');
  const check=(ok,message)=>{if(!ok)throw Error(message);};
  const label=scope.getRange('B6').values;
  scope.getRange('B6').values=[['Revised climate scope']];wb.recalculate();
  check(overview.getRange('D6').values[0][0]==='Revised climate scope','Section label did not follow scope');
  scope.getRange('B6').values=label;
  const section=scope.getRange('A6').values;
  scope.getRange('A6').values=[['SEC-02']];wb.recalculate();
  check(Number(overview.getRange('E6').values[0][0])===21118.38,'Section membership did not follow scope');
  scope.getRange('A6').values=section;
  const cost=lines.getRange('G6').values;
  lines.getRange('G6').values=[[null]];wb.recalculate();
  check(overview.getRange('B6').values[0][0]===''&&overview.getRange('E6').values[0][0]==='','Missing amount appeared as a complete section total');
  lines.getRange('G6').values=cost;
  const include=lines.getRange('L6').values;
  lines.getRange('L6').values=[[null]];wb.recalculate();
  check(overview.getRange('B8').values[0][0]==='','Missing inclusion choice appeared as an excluded line');
  lines.getRange('L6').values=include;wb.recalculate();
  check(Number(overview.getRange('B6').values[0][0])===62952.38&&Number(overview.getRange('B8').values[0][0])===85607.63,'Fixture totals changed');
  return {checks:5,status:'passed'};
}
