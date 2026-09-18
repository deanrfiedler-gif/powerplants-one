#!/usr/bin/env python3
"""Generate the sanitised r03 part identity, coverage and parameter extract.

Usage: python3 scripts/extract-specialist-r03-catalogue.py <path-to-private-screen-estimator-workbook-r04.xlsx>

The workbook is private operational evidence and must never be committed. This script reads its
WEB_APP_SPEC, TEST_CASES and OPTION_SETS sheets and writes only part numbers, descriptions, drive
branches, reviewed part rules, parameters and non-commercial coverage. Prices, historical commercial
values and quote identifiers are deliberately excluded. The part rules below are design-time review
decisions; the application must key lines by part number and never look parts up by description.
"""
import openpyxl, json, hashlib, re, sys
from pathlib import Path
WB=sys.argv[1]
ROOT=Path(__file__).resolve().parents[1]
sha=hashlib.sha256(Path(WB).read_bytes()).hexdigest()
wb=openpyxl.load_workbook(WB,read_only=True,data_only=True)
spec=[[('' if v is None else str(v)) for v in r] for r in wb['WEB_APP_SPEC'].iter_rows(values_only=True)]
parts=[{'id':r[0],'description':' '.join(r[1].split()),'branch':r[2]} for r in spec if r[0].startswith('PPO.')]
assert len(parts)==101 and len({p['id'] for p in parts})==101
CAT={'CLO':'Cloth and screen fittings','MTR':'Motors and switchgear','DRV':'Drive','BRG':'Bearings and pulleys','WIR':'Wire, cable and rope','FIX':'Bolts, nuts and washers','CLP':'Clips, pegs, hooks and clamps','PRF':'Pipe, tube and profile','SEL':'Seals, rubber and tape','SVC':'Services','MSC':'Consumables','GEN':'Unclassified'}
BR={'CAB':'Cable drive only','PIN':'Pinion drive only','ALL':'Both drives or drive-independent'}
for p in parts:
    m=re.fullmatch(r'PPO\.([A-Z]{3})\.(\d{3})\.(CAB|PIN|ALL)',p['id']); assert m and m.group(1) in CAT and m.group(3)==p['branch'],p
ids={p['id'] for p in parts}

# --- Part resolution rules per source position (design-time, reviewed; never a runtime description lookup)
M=lambda i,**k:dict(state='Mapped',id=i,**k)
NP=lambda why='The source description formula selects no part for these inputs.':dict(state='No part selected',note=why)
NC=lambda text,**k:dict(state='Not in catalogue',text=text,**k)
UN=lambda note,cands=():dict(state='Unresolved',note=note,candidates=list(cands))
CF=lambda note,cands=():dict(state='Conflict',note=note,candidates=list(cands))
def case(cond,out):return {'when':cond,'result':out}
def rule(basis,cases,default):return {'basis':basis,'cases':cases,'default':default}
drive=lambda pin,cab,table:rule('Drive-family table '+table,[case([['drive','eq','Pinion']],pin)],cab)
fixed=lambda i,basis='Fixed source description':rule(basis,[],M(i))
yesno=lambda key,out,basis:rule(basis,[case([[key,'eq','Yes']],out)],NP())
R={}
R[219]=rule('Kit supply line',[],NC('Supplier screen-system kit package',note='Kit supply is not a catalogue part and is not configured here.'))
for r in (223,224,227,228,229,230,231):R[r]=rule('Cloth line',[],NC('Screen cloth',note='Cloth products are outside the 101-part catalogue extract.'))
for r in (225,232,233):R[r]=rule('Cloth service line',[],NC('Cutting or sewing service',note='The extract defines an SVC category but contains no service records.'))
R[235]=yesno('seals',M('PPO.GEN.002.ALL'),'C69 edge seals')
R[236]=yesno('seals',M('PPO.FIX.012.ALL'),'C69 edge seals; ABRI branch not configured')
R[237]=yesno('tape',NC('Double-sided tape 50 m roll'),'C75 double-sided tape')
R[240]=rule('LS wire description built from colour, diameter and roll length (G57, C58, G58)',[case([['roll','eq','1700']],M('PPO.WIR.004.ALL'))],NC('LS wire roll of the entered length',note='The catalogue holds only the 1,700 m roll.'))
R[241]=fixed('PPO.WIR.010.ALL','Fixed source description; ABRI branch not configured')
R[242]=fixed('PPO.WIR.006.ALL','Fixed source description; ABRI branch not configured')
R[243]=yesno('replaceLS',M('PPO.WIR.005.ALL'),'C59 replace LS wire')
R[244]=rule('C95 drive family',[case([['drive','eq','Cable']],M('PPO.WIR.007.ALL'))],NP())
R[245]=fixed('PPO.MTR.014.ALL')
R[246]=yesno('footy',M('PPO.MTR.015.CAB',note='Catalogue branch tag CAB reflects its drive-table use; this position is drive-independent.'),'C55 oval edge-wire clamps')
R[247]=rule('C43 bed fastening, then truss chord height G30 ("Truss Clip <G30>mm S/S")',[case([['bed','eq','Truss Clip'],['chordHeight','eq','30']],M('PPO.CLP.007.ALL')),case([['bed','eq','Truss Clip'],['chordHeight','eq','50']],M('PPO.CLP.008.ALL')),case([['bed','eq','Truss Clip']],NC('Truss clip for the selected chord height',note='Only 30 mm and 50 mm clips are in the catalogue extract.'))],NP())
R[248]=rule('C43 bed fastening, then C56 crosswire clips',[case([['bed','eq','Truss Clip']],M('PPO.CLO.007.ALL')),case([['crossClips','eq','Yes']],M('PPO.WIR.002.ALL'))],NP())
R[249]=yesno('plates',UN('Plate type (G52) is not configured.',['PPO.WIR.003.ALL']),'C52 edge-wire plates')
R[250]=yesno('endBeams',UN('End-beam type (G37) is not configured.',['PPO.PRF.010.ALL']),'C37 end beams')
R[251]=yesno('droppers',M('PPO.PRF.010.ALL'),'C103 central-drive droppers')
R[252]=yesno('braces',NC('RHS brace stock sized by G40'),'C40 end braces')
R[253]=yesno('chain',M('PPO.GEN.001.ALL'),'C42 support chain')
R[254]=rule('C39 internal omega brackets',[case([['internalOmega','gt',0]],M('PPO.DRV.011.ALL'))],NP())
R[255]=rule('G39 external omega brackets',[case([['externalOmega','gt',0]],NC('Omega Bracket 50x50mm External'))],NP())
for r,i in ((256,'PPO.FIX.004.ALL'),(257,'PPO.FIX.009.PIN'),(258,'PPO.FIX.015.ALL')):
    R[r]=rule('G104 dropper count',[case([['$drop','gt',0]],M(i,**({'note':'Catalogue branch tag PIN reflects its drive-table use; this position is drive-independent.'} if r==257 else {})))],NP())
R[259]=yesno('omega',NC('Edge-wire omega strip, 4 m or 6.4 m'),'G59 omega strips')
R[260]=yesno('twine',M('PPO.MSC.001.ALL'),'G53 baling twine')
R[263]=rule('Drive-family table row 2: Cable by C102 drive pipe and bay length (G95 Ultra Groove is Yes for Cable by formula); Pinion by G102 speed',[case([['drive','eq','Cable'],['pipeDiameter','eq','25'],['bay','lt','4.2']],CF('The recovered table selects the 4 m none-split 1-inch drum; every historical 25 NB quote typed the one-piece drum instead.',['PPO.DRV.006.CAB','PPO.DRV.007.ALL'])),case([['drive','eq','Cable'],['pipeDiameter','eq','25']],NC('Drive Drum 8 m split 2 piece, 1 inch',note='Recovered for bays of 4.2 m and over; not in the catalogue extract.')),case([['drive','eq','Cable']],M('PPO.DRV.016.ALL',note='One historical 50 NB quote typed the compact 2-inch drum (PPO.DRV.015.ALL) instead.'))],NC('Pinion push-pull 1:1.8, slow Pinion',note='The catalogue extract holds only the 1:1 push-pull (PPO.CLO.006.PIN); the extract was read from a Cable quote whose cached Pinion table shows 1:1.'))
R[264]=rule('Drive-family table row 4: Cable bearing by C102 drive pipe; Pinion rack by approximate bay lookup',[case([['drive','eq','Pinion']],CF('The r02 position names a THG40 rack chosen by an approximate bay-length lookup; the r04 drive table names one custom rack.',['PPO.DRV.013.PIN'])),case([['pipeDiameter','eq','25']],M('PPO.BRG.006.CAB'))],M('PPO.BRG.002.ALL'))
R[265]=fixed('PPO.DRV.008.ALL')
R[266]=drive(CF('The r02 position names an Asborg clip; the r04 drive table names a bearing plate.',['PPO.BRG.001.PIN']),M('PPO.BRG.004.CAB'),'row 8')
R[267]=rule('Drive-family table row 10: slow Pinion coupling by C102 drive pipe (TABLES!M10:M11); Cable by C96 slip clutches',[case([['drive','eq','Pinion'],['pipeDiameter','eq','25']],NC('Slide Weld Coupling, Pinion, 1 inch pipe',note='Recovered from TABLES!M10; not in the catalogue extract.')),case([['drive','eq','Pinion']],NC('Slide Weld Coupling, Pinion, 5/4 inch pipe',note='TABLES!J10 selects the 5/4 inch coupling for every drive pipe other than 25 NB, including 50 NB; not in the catalogue extract.'))],CF('The r04 drive table names the LE-cable coupling, but r02 activates Ultra Delay Block Parts B and D here, which the source does only when this position is Part A.',['PPO.DRV.004.CAB','PPO.GEN.003.ALL']))
R[268]=drive(NP(),M('PPO.GEN.004.ALL'),'follows position 267')
R[269]=drive(NP(),M('PPO.GEN.005.ALL'),'follows position 267')
R[270]=drive(M('PPO.DRV.003.PIN',note='Catalogue text reads "Endmm"; the r02 position reads 27 mm. Catalogue owner to confirm the description.'),M('PPO.WIR.008.CAB'),'row 12')
R[271]=drive(M('PPO.DRV.010.PIN',note='The r04 drive-table quantity is #N/A. r02 keeps an explicit zero; no replacement rule is inferred.'),NP(),'TABLES!J6')
R[272]=rule('Slip clutches (C96) and spring colour (G96)',[],UN('Selection depends on slip clutches and spring colour, which this workbench does not configure.',['PPO.GEN.006.ALL']))
R[273]=drive(M('PPO.PRF.002.PIN',note='Manual quantity position. The r04 drive-table quantity is #N/A.'),M('PPO.MTR.015.CAB'),'row 14')
R[274]=drive(CF('The r02 position names a swaged 27 mm push-pull connector; the r04 drive table names a flanged M6 bolt whose table quantity is #N/A.',['PPO.DRV.009.PIN']),M('PPO.WIR.011.CAB'),'row 16')
R[275]=rule('C102 drive pipe diameter',[case([['pipeDiameter','eq','25']],M('PPO.PRF.008.ALL')),case([['pipeDiameter','eq','32']],NC('Pipe 32NB (5/4 in) × 2.6 mm × 6.5 m galv'))],M('PPO.PRF.009.ALL'))
R[276]=drive(M('PPO.DRV.014.PIN'),M('PPO.BRG.005.CAB'),'row 20; RETRACTA greenhouse branch not configured')
R[277]=fixed('PPO.FIX.011.ALL','Drive-family table row 22 names the same part for both drives')
R[278]=drive(M('PPO.MTR.013.PIN',note='Catalogue text reads "Endmm"; the r02 position reads 27 mm. Catalogue owner to confirm the description.'),M('PPO.DRV.005.CAB'),'row 24')
for r,p,c,row in ((279,'PPO.MTR.008.PIN',None,26),(280,'PPO.FIX.003.PIN',None,28),(281,'PPO.FIX.008.PIN',None,30),(282,'PPO.FIX.001.PIN','PPO.FIX.005.CAB',32),(283,'PPO.FIX.009.PIN','PPO.FIX.007.CAB',34)):
    R[r]=drive(M(p),M(c) if c else NP(),'row %d'%row)
R[284]=drive(NP(),M('PPO.FIX.014.CAB'),'row 36')
R[285]=rule('G64 leading-edge part from C63 and span',[case([['leading','eq','Tube - Alum']],M('PPO.PRF.001.ALL')),case([['leading','eq','Profile'],['span','eq','6.4']],NC('LE Profile UltraLock 44 × 6.4 m')),case([['leading','eq','Profile']],M('PPO.PRF.006.ALL'))],NC('CHS 19 mm steel leading-edge tube',note='The steel tube description is outside the catalogue extract.'))
R[286]=rule('C63 leading edge and C65 seal colour',[case([['leading','eq','Profile']],UN('Silicone strip follows the profile seal colour (C65), which this workbench does not configure.',['PPO.PRF.011.ALL']))],NP())
R[287]=rule('C63 leading edge',[case([['leading','eq','Profile']],M('PPO.PRF.005.ALL'))],NP())
R[288]=rule('C63 leading edge',[case([['leading','eq','Profile']],M('PPO.DRV.017.ALL')),case([['leading','eq','Tube - Steel']],NC('19 mm leading-edge joiner 16 mm'))],M('PPO.PRF.007.ALL'))
R[289]=rule('C63 leading edge and G108 wall pulleys',[case([['leading','ne','Profile'],['wallPulleys','eq','Yes']],NC('Pulley 50 mm swivel single Z/P'))],NP())
R[290]=fixed('PPO.FIX.010.ALL')
R[291]=rule('C63 leading edge',[case([['leading','eq','Profile']],M('PPO.CLO.002.ALL'))],M('PPO.PRF.004.ALL'))
R[292]=drive(NC('Roll pin 26 mm × 6 mm'),NP(),'C95 drive family')
R[293]=yesno('delay',NC('Push-pull delay unit',note='The source chooses the description from the Pinion tube diameter (C99 = 27).'),'G109 delay units')
R[296]=yesno('motors',UN('Motor selection is not approved (REV-04, REV-19).',['PPO.MTR.003.ALL','PPO.MTR.004.ALL','PPO.MTR.005.ALL','PPO.MTR.006.ALL']),'E295 motors and switchgear')
R[297]=rule('C102 drive pipe diameter (C297 = 2 × included motors when 50 NB)',[case([['pipeDiameter','eq','50']],M('PPO.MTR.012.ALL'))],NP())
for r in (298,299):R[r]=rule('C93 universal joints',[],NP('Universal joints are not configured in this workbench.'))
R[300]=yesno('motors',UN('Motor mount follows greenhouse type (G29), which this workbench does not configure.',['PPO.MTR.001.ALL','PPO.MTR.007.ALL']),'E295 motors and switchgear')
R[301]=rule('C91 smart controls',[],NP('Smart controls are not configured in this workbench.'))
for r in (302,303,304):R[r]=rule('G110 wall gearbox',[],NP('Wall gearboxes are not configured in this workbench.'))
R[305]=rule('C107 motor support',[],NP('Motor supports are not configured in this workbench.'))
for r,i in ((306,'PPO.FIX.002.ALL'),(307,'PPO.FIX.006.ALL'),(308,'PPO.FIX.013.ALL')):R[r]=fixed(i)
R[311]=fixed('PPO.CLP.003.ALL','Fixed source description; old ALUM bed branch not configured')
R[312]=rule('C63 leading edge (TABLES!C18:E26)',[case([['leading','eq','Profile']],M('PPO.WIR.009.ALL'))],M('PPO.CLP.006.ALL'))
R[313]=rule('C63 leading edge (TABLES!C18:E26)',[case([['leading','eq','Profile']],M('PPO.CLP.002.ALL',note='Catalogue record is a 250 pack; the quantity is pieces.'))],M('PPO.CLP.005.ALL'))
R[314]=rule('C73 overhang fixing (EdgeHooks)',[case([['edge','ne','Hooks']],M('PPO.CLO.008.ALL'))],NP())
R[315]=rule('Follows position 314',[case([['edge','ne','Hooks']],NC('Weight disc pin plastic'))],NP())
R[316]=rule('C63 leading edge',[case([['leading','eq','Profile']],M('PPO.CLO.003.ALL'))],NP())
R[317]=rule('C73 overhang fixing (EdgeHooks)',[case([['edge','eq','Blackout']],M('PPO.CLP.001.ALL'))],M('PPO.MTR.002.ALL'))
for r in range(320,326):R[r]=rule('One-off material slot',[],NP('One-off materials are not configured in this workbench.'))
for r in range(328,354):R[r]=rule('Catalogue addition slot',[],NP('Catalogue additions are not configured in this workbench.'))
for r in (356,357,358,359):R[r]=rule('Freight service',[],NC('Freight or duty service',note='The extract contains no SVC service records.'))
for r in range(362,381):R[r]=rule('Installation resource or expense',[],NC('Installation resource or expense',note='The extract contains no SVC service records.'))
R[383]=rule('Commercial adjustment',[],NC('Materials discount',note='Controlled by the commercial inputs, not a part.'))
R[384]=rule('Commercial adjustment',[],NC('Commission',note='Not configured in this workbench.'))
def outs(x):
    for c in x['cases']: yield c['result']
    yield x['default']
for r,x in R.items():
    for o in outs(x):
        for i in ([o['id']] if o.get('id') else [])+o.get('candidates',[]): assert i in ids,(r,i)
used=sorted({o['id'] for x in R.values() for o in outs(x) if o.get('id')}|{c for x in R.values() for o in outs(x) for c in o.get('candidates',[])})

# --- Parameters (section 3) with explicit r03 binding decisions
P={}
for r in spec:
    if r[0] and r[1] and r[0] in ('odd_bay_default_m','end_beam_divisor','crosswire_waste_factor','baling_twine_factor','ls_wire_spacing_m','cloth_markup_divisor','cloth_fx_uplift','cable_size_band_1','drive_span_deduction_m','delay_unit_interval_m','crosswire_clip_spare','drum_spare_factor'):
        P[r[0]]={'id':r[0],'default':r[1],'unit':r[2],'controls':r[3],'legacy':r[4]}
assert len(P)==12
bind={
 'odd_bay_default_m':('Physical length and every length-driven quantity',None),
 'end_beam_divisor':('CE-LINE-250 end-beam stock',None),
 'crosswire_waste_factor':(None,'Legacy use is the crosswire length helper G43, which this bounded model does not calculate. Other 5% allowances (C243, C248) are separate literals and are not rebound.'),
 'baling_twine_factor':('CE-LINE-260 baling twine rolls',None),
 'ls_wire_spacing_m':('Bottom LS wire count C61, used by CE-LINE-243 crimps and the extra-screw allowance in CE-LINE-277; CE-LINE-247 truss clips, with CE-LINE-248 following 247',"Other 0.4 m literals (C240, C311–C313) are separate source expressions and are not rebound without a definition decision."),
 'cloth_markup_divisor':(None,'Cloth sell price derivation. This workbench prices cloth with synthetic SYN-PRICE-02 rates, so the constant is recorded but not applied.'),
 'cloth_fx_uplift':(None,'Cloth cost FX uplift. Not applied for the same reason as the cloth markup divisor.'),
 'cable_size_band_1':('Recovered Cable torque result for the first area band (below 600 m²)','The extract labels this a millimetre threshold. In the source expression it is the Nm result of the first Cable band; the Pinion first band stays a separate literal.'),
 'drive_span_deduction_m':('Drive spacing, drive positions and every drive-count quantity',None),
 'delay_unit_interval_m':('CE-LINE-293 delay units',None),
 'crosswire_clip_spare':('CE-LINE-247 truss clips, with CE-LINE-248 following 247',None),
 'drum_spare_factor':(None,'Legacy use is a formula at C273 in the r04 workbook. In the authoritative r02 register C273 is one of the 14 manual quantities, so no formula is adopted.'),
}
params=[]
for k in ['odd_bay_default_m','end_beam_divisor','crosswire_waste_factor','baling_twine_factor','ls_wire_spacing_m','cloth_markup_divisor','cloth_fx_uplift','cable_size_band_1','drive_span_deduction_m','delay_unit_interval_m','crosswire_clip_spare','drum_spare_factor']:
    p=P[k];d,n=bind[k]
    params.append({'id':k,'default':str(float(p['default'])).rstrip('0').rstrip('.'),'unit':'Nm' if k=='cable_size_band_1' else p['unit'],'controls':p['controls'],'legacy':p['legacy'],'consumer':d,'note':n,'bound':d is not None,'positive':True})

# --- Coverage from TEST_CASES (77 varying + 65 constant); commercial values withheld
tc=[[('' if v is None else v) for v in r] for r in wb['TEST_CASES'].iter_rows(values_only=True)]
def rows_between(start_text,stop_text):
    out=[];on=False
    for r in tc:
        s=str(r[0])
        if s.startswith(start_text):on=True;continue
        if on and s.startswith(stop_text):break
        if on and r[0] and r[0] not in ('input_field',) and not s.startswith('INPUT VALUES'):out.append(r)
    return out
vary=rows_between('INPUT VALUES — fields that DIFFER','INPUT VALUES — fields IDENTICAL')
const=rows_between('INPUT VALUES — fields IDENTICAL','@@@')
const=[r for r in const if re.fullmatch(r'[a-z0-9_]+',str(r[0]))]
assert len(vary)==77 and len(const)==65,(len(vary),len(const))
opts={}
for r in wb['OPTION_SETS'].iter_rows(min_row=5,values_only=True):
    if r[0] and r[3]: opts[r[0]]={'cell':r[1],'options':[x.strip() for x in str(r[3]).split('|')] if 'TABLES' not in str(r[3]) else None}
opts['cable_drive_location']={'cell':'C99','options':['Central','End']}
WITHHELD={'cloth_rate_1','freight_calc','freight_total','fx_rate_quoted','grand_total','installation_calc','installation_total','materials_discount_amt','materials_discount_pct','materials_subtotal','materials_total','rate_per_sqm','rounded_sell','fx_rate_simpro','airfreight_margin_pct','roadfreight_margin_pct','import_duty_pct','install_expense_margin_pct','kit_margin_pct','kit_price','commission_pct'}
CONTROL={'truss_cord_height_mm':'chordHeight','spans_entered':'spans','spans_extra':'wallSpans','greenhouse_span_m':'span','bays_down_length':'bays','bay_size_m':'bay','has_odd_bay':'odd','truss_shape':'truss','height_to_screen_m':'height','screen_overhang_m':'overhang','shrinkage_pct':'shrink','individual_screens_per_span':'individual','edge_seals_included':'seals','cut_from_wider_sheet':'wider','wider_sheet_width_m':'sheet','overhang_edge_fixing':'edge','le_type':'leading','bed_fastening_method':'bed','ls_wires_need_replacing':'replaceLS','baling_twine_needed':'twine','omega_profile_needed':'omega','drive_type':'drive','cable_drive_location':'cableLocation','motors_across_width':'across','motors_down_length':'down','drive_spacing_target_m':'spacing','droppers_for_central_drive':'droppers','droppers_per_8m':'dropPerStock','walls_by_pulleys':'wallPulleys','end_beams_by_ppa':'endBeams','support_chain_required':'chain','brace_length_m':'braceLength','chain_length_per_span_m':'chainLength','double_sided_tape_needed':'tape','tape_rolls_50m_count':'tapeRolls','drive_pipe_diameter_nb':'pipeDiameter'}
def fmt(v):
    if isinstance(v,(int,float)) and not isinstance(v,bool):
        x=round(float(v),3);return str(int(x)) if x==int(x) else str(x)
    return ' '.join(str(v).lstrip('* ').split())
fields=[]
for r,kind in [(r,'Varies') for r in vary]+[(r,'Constant') for r in const]:
    name=r[0];raw=[v for v in r[1:11] if v not in ('',None)]
    entry={'field':name,'kind':kind,'control':CONTROL.get(name)}
    if name in WITHHELD:
        entry.update(withheld=True,distinct=len({fmt(v) for v in raw}))
    else:
        vals=sorted({fmt(v) for v in raw},key=lambda s:(0,float(s)) if re.fullmatch(r'-?\d+(\.\d+)?',s) else (1,s))
        entry.update(withheld=False,observed=vals,blankQuotes=10-len(raw))
    o=opts.get(name)
    if o and o['options']:
        entry['options']=o['options'];entry['cell']=o['cell']
        if not entry['withheld']:entry['never']=[x for x in o['options'] if x not in entry['observed']]
    fields.append(entry)
assert len(fields)==142
# Section 15 as supplied, with corrections recorded against the same workbook's data
s15=[];on=False
for r in spec:
    if r[0].startswith('15 '):on=True;continue
    if on and r[0] and r[0]!='Field' and r[1]:s15.append({'field':r[0],'never':r[1],'observed':r[2],'risk':r[3]})
assert len(s15)==19,len(s15)
for x in s15:x['risk']=re.sub(r'\s*\(finding REV-01\)','',x['risk'])
T={
 'drive_type':[['drive','Pinion']],'has_odd_bay':[['odd','Yes']],'individual_screens_per_span':[['individual','Yes']],'le_type':[['leading','Tube - Steel']],
 'truss_shape':[['truss','ROUND']],'overhang_edge_fixing':[['edge','Blackout'],['edge','Weights']],'walls_by_pulleys':[['wallPulleys','Yes']],
 'omega_profile_needed':[['omega','Yes']],'end_beams_by_ppa':[['endBeams','Yes']],'double_sided_tape_needed':[['tape','Yes']],'drive_pipe_diameter_nb':[['pipeDiameter','32']]}
untested=[]
for x in s15:
    e={'field':x['field'],'never':x['never'],'observedInstead':x['observed'],'risk':x['risk'],'triggers':T.get(x['field'],[]),'source':'WEB_APP_SPEC §15'}
    if x['field']=='drive_type':e['risk']='Highest risk. The whole Pinion branch is unvalidated. Three Pinion quantity rules return #N/A in the r04 drive table (CE-LINE-271, CE-LINE-273, CE-LINE-274); r02 keeps an explicit zero at 271 and manual quantities at 273 and 274.'
    if x['field']=='drive_pipe_diameter_nb':
        e.update(never='32',observedInstead='25, 50 (on Cable quotes)',risk='Only 32 NB lacks a historical example. §15 says the field was never populated and is Pinion-only; TEST_CASES records 25 and 50 on all ten Cable quotes, so the §15 statement is corrected here.',source='WEB_APP_SPEC §15, corrected from TEST_CASES')
    untested.append(e)
tw=next(f for f in fields if f['field']=='baling_twine_needed');assert tw['observed']==['Yes']
untested.append({'field':'truss_cord_height_mm','never':'20, 25, 35, 40, 60','observedInstead':'30, 50','risk':'The truss clip part follows the chord height; only 30 mm and 50 mm clips exist in the catalogue extract. The legacy validation list is 20 | 25 | 30 | 35 | 40 | 50 | 60; WEB_APP_SPEC lists 25 | 30 | 50.','triggers':[['chordHeight',v] for v in ['20','25','35','40','60']],'source':'Legacy validation list G30 (omitted from §15)'})
untested.append({'field':'baling_twine_needed','never':'No','observedInstead':'Yes (all 10)','risk':'The twine exclusion path has no historical example. This option is missing from §15 but follows from the TEST_CASES constant list.','triggers':[['twine','No']],'source':'TEST_CASES (omitted from §15)'})
quality=[
 {'id':'WAS-01','title':'Pinion tube and drive pipe diameters are separate fields','detail':'§9 lists 25 | 32 | 50 against C99. The r02 register, the legacy validation lists and TABLES!J40:J41 place 27 | 32 at C99 and 25 | 32 | 50 at C102 (Drive Pipe Diameter). r03 keeps both identities.'},
 {'id':'WAS-02','title':'Cloth width lookup rows disagree inside the extract','detail':'§1 and §7 list five bay sizes; §8 lists six including 5 m → 5.3 m. r02 already implemented six rows; r03 retains them.'},
 {'id':'WAS-03','title':'§14 coverage is an abridged extract','detail':'§14 lists 16 of 142 fields and omits the observed 15-bay value. The r03 coverage view uses the full TEST_CASES comparison.'},
 {'id':'WAS-04','title':'§15 count and one row are inconsistent','detail':'The text says 21 of 29 choice fields; the table has 19 rows. The drive pipe diameter row contradicts TEST_CASES. Baling twine No is missing.'},
 {'id':'WAS-05','title':'Two catalogue descriptions look altered','detail':'"Connector Endmm for rack Z/P" and "Table Clamp Endmm" appear to be "27mm" descriptions changed by a text replacement.'},
 {'id':'WAS-06','title':'Cable location list wording differs','detail':'§2 lists End | Middle. The r02 register and the source table list Central | End. r03 keeps Central | End.'},
 {'id':'WAS-07','title':'Some Pinion drive-table parts differ from r02 positions','detail':'Positions 264, 266, 267 and 274 name different parts in r02 and in the r04 drive table. r03 shows a conflict instead of choosing.'},
 {'id':'WAS-08','title':'Catalogue prices are not published','detail':'The extract carries indicative and placeholder cost and sell values. r03 keeps SYN-PRICE-02 position rates and embeds no catalogue prices.'},
 {'id':'WAS-09','title':'A parameter label does not match its use','detail':'cable_size_band_1 is labelled a 100 mm threshold; the source uses 100 as the Nm result of the first Cable torque band.'},
 {'id':'WAS-10','title':'Truss chord height has seven recovered values','detail':'§1 lists 25 | 30 | 50 for truss_cord_height_mm. The legacy validation at G30 lists 20, 25, 30, 35, 40, 50 and 60. r03 offers the recovered list; the truss clip part exists only for 30 and 50.'},
 {'id':'WAS-11','title':'Pinion catalogue rows were read from a Cable quote','detail':'The drive table in the extract was cached with Cable selected. Pinion descriptions that depend on speed or drive pipe (push-pull 1:1 versus 1:1.8, slide-weld couplings) therefore differ from what a Pinion quote would show. r03 applies the recovered formulas and marks the missing descriptions as not in the catalogue.'},
 {'id':'WAS-12','title':'Ultra Groove drum is formula-driven','detail':'G95 is IF(drive = Cable, Yes, N/A), so the 2-inch drum rule always selects the Ultra Groove drum for Cable. No control is exposed; the formula is applied.'},
]
data={'version':'SS-PART-IDENTITY-r03-PROVISIONAL','source':{'name':'Screen estimator analysis workbook r04 · WEB_APP_SPEC','sha256':sha,'role':'Secondary, partial source. r02 remains authoritative except where the owner has corrected it.'},
 'categories':CAT,'branches':BR,'parts':parts,'rules':{str(k):v for k,v in sorted(R.items())},'usedIds':used,'parameters':params,
 'coverage':{'quotes':10,'fields':fields,'varying':77,'constant':65,'withheld':sorted(WITHHELD)},'untested':untested,'quality':quality}
txt=json.dumps(data,ensure_ascii=False,separators=(',',':'))
assert not re.search(r'OP0\d{4}',txt), 'Quote identifier found in extract'
assert not re.search(r'"(cost|sell|price)"\s*:',txt,re.I), 'Price field found in extract'
out='/* Sanitised part identity, parameter and coverage extract. No catalogue prices, historical commercial values or quote identifiers. */\nglobalThis.SSCatalogue = '+txt+';\n'
(ROOT/'docs/design/specialist/r03/catalogue.js').write_text(out,encoding='utf-8')
print('catalogue.js',hashlib.sha256(out.encode()).hexdigest(),'rules',len(R),'reachable parts',len(used),'withheld fields',sum(1 for f in fields if f['withheld']),'untested options',len(untested))
