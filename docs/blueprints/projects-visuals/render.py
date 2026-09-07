"""Rebuild static BP-06 SVG/PNG review plates; no application behaviour.
Uses existing embedded Roboto and unchanged logo. Requires fontTools and PyMuPDF.
"""
from pathlib import Path
import base64,io,re,html
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
import fitz
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(__file__).resolve().parent
font_data=re.search(r'data:font/ttf;base64,([A-Za-z0-9+/=]+)',(ROOT/'docs/blueprints/crm-board-grid-mockup.html').read_text())[1]
font=TTFont(io.BytesIO(base64.b64decode(font_data)))
glyphs=font.getGlyphSet(); cmap=font.getBestCmap(); units=font['head'].unitsPerEm
logo=base64.b64encode((ROOT/'docs/standards/ui-assets/powerplants-logo-green-white.png').read_bytes()).decode()
N='#242a37';G='#62bb46';M='#606977';BG='#f5f6f8';D='#dce0e5';WARN='#865900';ERR='#b42318'
class Plate:
 def __init__(self,w,h,title):
  self.w,self.h=w,h;self.parts=[f'<title>{html.escape(title)}</title>'];self.rect(0,0,w,h,BG)
 def rect(self,x,y,w,h,fill='white',stroke=None,rx=0):
  self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"'+(f' stroke="{stroke}"' if stroke else '')+'/>')
 def width(self,s,size):
  return sum(font['hmtx'][cmap.get(ord(c),'.notdef')][0] for c in s)*size/units
 def text(self,x,y,s,size=15,colour=N):
  paths=[];cursor=0
  for c in s:
   g=cmap.get(ord(c),'.notdef');pen=SVGPathPen(glyphs);glyphs[g].draw(pen)
   paths.append(f'<path transform="translate({cursor} 0)" d="{pen.getCommands()}"/>');cursor+=font['hmtx'][g][0]
  self.parts.append(f'<g aria-label="{html.escape(s,quote=True)}" fill="{colour}" transform="translate({x} {y}) scale({size/units} {-size/units})">'+''.join(paths)+'</g>')
 def lines(self,x,y,s,width,size=15,colour=N,leading=22):
  line=''
  for word in s.split():
   trial=(line+' '+word).strip()
   if self.width(trial,size)>width and line:self.text(x,y,line,size,colour);y+=leading;line=word
   else:line=trial
  if line:self.text(x,y,line,size,colour);y+=leading
  return y
 def button(self,x,y,w,label,primary=False):
  self.rect(x,y,w,44,G if primary else 'white',N if primary else '#7d8794',6);self.text(x+14,y+28,label,15)
 def pill(self,x,y,label,kind='neutral'):
  colour,bg={'neutral':(M,'#eef0f3'),'good':('#315e43','#edf6e9'),'warn':(WARN,'#fff5df'),'bad':(ERR,'#fef3f2')}[kind]
  w=self.width(label,13)+24;self.rect(x,y,w,28,bg,None,14);self.text(x+12,y+19,label,13,colour)
 def shell(self,phone=False):
  if phone:
   self.rect(0,0,self.w,120,N);self.parts.append(f'<image x="8" y="14" width="88" height="88" href="data:image/png;base64,{logo}"/>');self.text(112,44,'Powerplants One',18,'white');self.text(112,72,'Projects',15,'white');self.text(112,98,'Synthetic design · r01',12,'white')
  else:
   self.rect(0,0,112,self.h,N);self.parts.append(f'<image x="12" y="18" width="88" height="88" href="data:image/png;base64,{logo}"/>')
   for i,l in enumerate(['My Work','Customers','CRM','Estimating','Projects','Service']):
    y=155+i*65
    if l=='Projects':self.rect(8,y-27,96,47,'#3a4655',None,6);self.rect(8,y-27,4,47,G)
    self.text(20,y,l,14,'white')
   self.text(18,self.h-50,'PRIVATE',12,'white');self.text(18,self.h-28,'SYNTHETIC',11,'white')
   self.rect(112,0,self.w-112,62,'white');self.text(140,38,'Powerplants One / Projects',16);self.text(self.w-330,38,'Alex Lee · Synthetic coordinator',14,M)
 def save(self,name):
  svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}" role="img">'+''.join(self.parts)+'</svg>'
  (OUT/(name+'.svg')).write_text(svg)
  doc=fitz.open(stream=svg.encode(),filetype='svg');pdf=fitz.open('pdf',doc.convert_to_pdf());pdf[0].get_pixmap(matrix=fitz.Matrix(1.25,1.25)).save(OUT/(name+'.png'))
p=Plate(1440,960,'Projects register — J1 desktop design, fictional records');p.shell()
p.text(144,110,'Projects',30);p.text(144,140,'Milestones, progress and the next action for every project.',16,M);p.button(1248,91,156,'+ New project',True)
p.rect(144,163,1260,40,'#edf6e9',None,6);p.text(160,189,'Design preview · Synthetic records · Fixed example date: 7 Sep 2026 · No live source connection',14,'#315e43')
for x,k,v in [(144,'Matching projects','4'),(466,'Blocked milestones','1'),(788,'Overdue actions','1'),(1110,'Projects without finish date','1')]:
 p.rect(x,224,294,95,'white',D,8);p.text(x+20,250,k,14,M);p.text(x+20,295,v,30)
p.rect(144,340,390,44,'white','#7d8794',6);p.text(160,368,'Search projects or customer',16,M);p.button(546,340,182,'Coordinator: All');p.button(740,340,161,'Health: All');p.button(913,340,240,'Sort: Forecast finish');p.button(1165,340,239,'Clear filters')
p.rect(144,405,1260,418,'white',D,8);p.rect(145,406,1258,42,'#eef0f3');
for x,l in [(160,'Project / customer'),(522,'Stage / health'),(725,'Forecast finish'),(882,'Next milestone'),(1113,'Next action')]:p.text(x,433,l,13,M)
rows=[('SYN-PPO-PRJ-000001','Greenhouse controls upgrade','Demo Grower A · North site','Planning','Attention','warn','24 Sep 2026','Readiness review','10 Sep 2026','Confirm water test','Alex Lee · Due 8 Sep'),('SYN-PPO-PRJ-000002','Irrigation extension','Demo Grower B · East site','Delivery','On track','good','30 Sep 2026','Delivery review','18 Sep 2026','Confirm access window','Alex Lee · Due 9 Sep'),('SYN-PPO-PRJ-000003','Propagation monitoring','Demo Grower C · West site','Intake','Not assessed','neutral','Date needed','Kickoff','Date needed','Plan the kickoff','Morgan Reed · Date needed'),('SYN-PPO-PRJ-000004','Fertigation control upgrade','Demo Grower D · South site','Handover','On track','good','8 Oct 2026','Training review','5 Oct 2026','Review draft manual','Alex Lee · Overdue 6 Sep')]
rows=[rows[0],rows[1],rows[3],rows[2]]
for i,row in enumerate(rows):
 ref,title,customer,stage,health,kind,finish,ms,md,act,ad=row;y=474+i*92
 if i:p.rect(160,y-22,1228,1,D)
 p.text(160,y,title,17);p.text(160,y+24,customer,14,M);p.text(160,y+47,"Alex Lee · "+ref,12,M);p.text(522,y,stage,15);p.pill(522,y+12,health,kind);p.text(725,y,finish,15,WARN if finish=='Date needed' else N);p.text(882,y,ms,15);p.text(882,y+26,md,13,M);p.text(1113,y,act,15);p.text(1113,y+26,ad,13,ERR if 'Overdue' in ad else M)
p.text(160,858,'Showing all 4 matching synthetic projects · Counts use these same permitted records',14,M)
p.text(144,905,'J1: manual coordination dates and stages. Technical approval, bookings and Finance remain separate.',14,M)
p.save('projects-register-desktop')
p=Plate(1440,960,'Project detail — J1 desktop design, fictional records');p.shell();p.text(144,98,'Projects / SYN-PPO-PRJ-000001',13,M);p.text(144,138,'Greenhouse controls upgrade',29);p.text(144,168,'Demo Grower A · North site · Coordinator Alex Lee',16,M);p.button(1248,112,156,'Record update',True)
p.pill(144,187,'Active');p.pill(230,187,'Planning');p.pill(334,187,'Attention','warn');p.text(485,207,'Last update 7 Sep 2026, 9:30 am AEST',14,M)
p.rect(144,235,1260,66,'#fff5df',None,8);p.text(164,262,'1 blocked milestone · Water test evidence is still needed.',16,WARN);p.text(164,286,'Next action: Confirm water test · Alex Lee · Due 8 Sep, 4:00 pm AEST',14,WARN)
p.text(144,334,'Overview',16);p.text(270,334,'Milestones & actions',16,M);p.text(466,334,'History',16,M);p.rect(144,345,78,3,G)
p.rect(144,371,811,140,'white',D,8);p.text(164,399,'Delivery outlook',19);p.text(164,430,'Target finish',13,M);p.text(164,465,'22 Sep 2026',21);p.text(425,430,'Forecast finish',13,M);p.text(425,465,'24 Sep 2026',21);p.text(678,430,'Change from target',13,M);p.text(678,465,'+2 calendar days',19,WARN);p.text(164,491,'Manual forecast · Target is a coordination objective, not a contract baseline.',13,M)
p.rect(979,371,425,249,'white',D,8);p.text(999,400,'Next action',20);p.text(999,434,'Confirm water test',18);p.text(999,462,'Alex Lee · Due 8 Sep, 4:00 pm AEST',14,M);p.lines(999,494,'Ask for the test result before the readiness review.',380,15);p.button(999,540,200,'Open activity');p.text(999,610,'Action completion keeps its own outcome.',13,M)
p.rect(144,532,811,274,'white',D,8);p.text(164,563,'Milestones',20);p.button(765,544,170,'+ Add milestone')
for i,(name,date,status,kind) in enumerate([('Readiness review','10 Sep 2026','Blocked','bad'),('Installation coordination','18 Sep 2026','Planned','neutral'),('Handover review','24 Sep 2026','Planned','neutral')]):
 y=617+i*70;p.text(164,y,name,16);p.text(164,y+23,'Alex Lee · Forecast '+date,13,M);p.pill(792,y-17,status,kind)
p.rect(979,640,425,166,'white',D,8);p.text(999,670,'Latest update',20);p.lines(999,704,'Water test pending. Forecast revised by two calendar days; follow-up assigned to Alex.',375,15);p.text(999,784,'7 Sep 2026 · Alex Lee · View history',13,M)
p.text(144,850,'Milestone completion records progress. It does not approve technical work or confirm attendance.',14,M);p.text(144,893,'Synthetic design · Fixed example date 7 Sep 2026 · No live source connection',13,M);p.save('project-detail-desktop')
p=Plate(390,1080,'Project detail — J1 phone design, fictional record');p.shell(True);p.text(16,150,'Projects / SYN-PPO-PRJ-000001',12,M);p.lines(16,186,'Greenhouse controls upgrade',310,24,leading=29);p.text(16,247,'Demo Grower A · North site',15,M);p.text(16,273,'Coordinator Alex Lee',14,M);p.pill(16,291,'Planning');p.pill(125,291,'Attention','warn');p.button(16,336,358,'Record update',True)
p.rect(16,397,358,112,'#fff5df',None,8);p.text(30,423,'1 blocked milestone',16,WARN);p.lines(30,449,'Water test evidence is needed before the readiness review.',327,15,WARN);p.text(30,495,'Last update 7 Sep, 9:30 am AEST',12,WARN)
p.rect(16,527,358,145,'white',D,8);p.text(30,554,'Delivery outlook',19);p.text(30,584,'Target finish',13,M);p.text(200,584,'Forecast finish',13,M);p.text(30,613,'22 Sep 2026',17);p.text(200,613,'24 Sep 2026',17);p.text(30,648,'Manual forecast · +2 calendar days',13,WARN)
p.rect(16,690,358,173,'white',D,8);p.text(30,718,'Next action',19);p.text(30,750,'Confirm water test',18);p.text(30,777,'Alex Lee · Due 8 Sep, 4:00 pm AEST',13,M);p.button(30,796,330,'Open activity')
p.rect(16,881,358,147,'white',D,8);p.text(30,911,'Next milestone',19);p.text(30,942,'Readiness review',17);p.text(30,970,'Forecast 10 Sep 2026 · Alex Lee',13,M);p.pill(30,985,'Blocked','bad');p.text(16,1058,'Milestones and history continue below.',13,M);p.save('project-detail-phone')
p=Plate(1280,840,'J1 save and access states — static design examples');p.text(32,54,'Projects · Recovery states',28);p.text(32,85,'Static design examples. These controls do not execute commands.',15,M)
states=[('Save not confirmed','The connection dropped before we could confirm the result. Keep this proposal open while we check the original save.','Check save status',WARN,'#fff5df'),('This project has changed','Your proposal is retained. Review the latest saved version and compare it before applying your changes.','Review latest version',WARN,'#fff5df'),('No matching projects','No projects match the current search and filters. Your selected view is preserved.','Clear filters',M,'#eef0f3'),('Access has changed','This project is no longer available to your current identity. Project details and unsaved sensitive input have been cleared.','Return to projects',ERR,'#fef3f2')]
for i,(title,body,button,colour,bg) in enumerate(states):
 x=32+(i%2)*624;y=124+(i//2)*334;p.rect(x,y,592,310,'white',D,8);p.rect(x+16,y+16,560,44,bg,None,6);p.text(x+30,y+45,title,21,colour);p.lines(x+24,y+94,body,538,17,leading=27);p.button(x+24,y+224,300,button);p.text(x+24,y+292,'Synthetic design · r01',12,M)
p.save('project-recovery-states')
print('Rendered four SVG and PNG review plates')
