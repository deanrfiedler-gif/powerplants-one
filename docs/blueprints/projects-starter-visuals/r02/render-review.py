from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.colors import HexColor
from PIL import Image
from fontTools.ttLib import TTFont as FTFont
from fontTools.varLib.instancer import instantiateVariableFont
import tempfile,json
D=Path(__file__).resolve().parent;R=D.parents[3];OUT=D/'projects-starter-design-r02.pdf'
with tempfile.TemporaryDirectory() as td:
 for name,w in [('R',400),('RB',650)]:
  f=FTFont(R/'public/brand/Roboto-variable.ttf');instantiateVariableFont(f,{'wght':w,'wdth':100},inplace=True);p=Path(td)/(name+'.ttf');f.save(p);pdfmetrics.registerFont(TTFont(name,str(p)))
W,H=841.89,595.28;N='#242a37';M='#626f80';G='#62bb46';page=0
c=canvas.Canvas(str(OUT),pagesize=(W,H));c.setTitle('Powerplants One - Projects design refinement r02');c.setAuthor('Powerplants One - prepared for Dean Fiedler')
def rect(x,y,w,h,color):c.setFillColor(HexColor(color));c.rect(x,H-y-h,w,h,fill=1,stroke=0)
def text(x,y,s,size=11,w=760,b=False,color=N):
 p=Paragraph(s,ParagraphStyle('p',fontName='RB' if b else 'R',fontSize=size,leading=size*1.4,textColor=HexColor(color)));ww,hh=p.wrap(w,1000);p.drawOn(c,x,H-y-hh);return hh

def start(title,sub):
 global page
 if page:c.showPage()
 page+=1;rect(0,0,W,17,N);rect(0,17,90,3,G);text(36,33,'POWERPLANTS ONE / PROJECTS / r02',9,color=M);text(36,55,title,25,b=True);text(36,93,sub,10.5,color=M);rect(36,556,770,1,'#dfe4e9');text(36,568,'9 Sep 2026 · Synthetic interactive design · No application implementation',8,color=M);text(773,568,f'{page:02}',8,w=30,color=M)
def shot(name,x,y,w,h):
 p=D/name;i=Image.open(p);iw,ih=i.size;scale=min(w/iw,h/ih);c.drawImage(str(p),x+(w-iw*scale)/2,H-y-ih*scale,width=iw*scale,height=ih*scale)
def note(x,y,title,body,w=177):
 text(x,y,title,13,b=True,w=w);return text(x,y+27,body,10.5,w=w,color=M)

start('A more complete Projects workspace','Eight realistic synthetic projects, a complete coordination journey and a separate future handover review.')
shot('register-1366.png',30,137,584,400)
note(637,148,'Portfolio at work','Eight projects across four stages. Two blocked milestones, one overdue action and two unknown finish dates.')
note(637,282,'One consistent result','Search, coordinator, health and stage filters update the records and counts together. Returning preserves your search.')
note(637,417,'Start here','Open the HTML review and choose Open worked example. All changes reset on reload.')

start('The detail page answers the useful questions','Identity, accountable coordinator, blocker, delivery outlook, next action and retained history.')
shot('detail-1366.png',30,137,584,400)
note(637,147,'What changed?','Record a reasoned forecast or stage update. Original context remains in history.')
note(637,285,'Who acts next?','The Activity owner can differ from the project coordinator. Completing an Activity does not resolve the milestone.')
note(637,422,'What is stopping work?','An owned blocker stays visible until it is explicitly reviewed and resolved.')

start('The same journey on a phone','390 px and 320 px viewport captures. Content continues by scrolling; the bottom navigation stays available.')
shot('register-390.png',35,134,194,411);shot('detail-390.png',244,134,194,411);shot('detail-320.png',454,134,160,411)
note(639,147,'Designed for touch','Stacked cards, wrapping titles, explicit reference and update time, and labelled actions.')
note(639,290,'Less review clutter','Prototype-only controls collapse behind Review tools. They are separate from the product.')
note(639,428,'Clear save state','Changes say Updated in this preview. No durable save or offline sync is implied.')

start('Structured scope without losing the source','A later-design view distinguishes included work, exclusions, assumptions and deliverables.')
shot('scope-1366.png',30,137,584,400)
note(637,149,'Accepted r03','The future fixture binds the six-zone scope to an exact synthetic quotation and response.')
note(637,283,'Proposed r04','Inspect the eight-zone change and its implications. There is no one-click replacement of accepted scope.')
note(637,416,'J1 remains focused','The initial implementation uses internal scope context. Formal scope and document review belong to a later increment.')

start('Receive a handover deliberately','Review the source, scope and owned unknowns before creating or linking a project.')
shot('handover-1366.png',30,137,584,400)
note(637,147,'Three explicit checks','Review exact acceptance evidence, inclusions/exclusions and open-item treatment.')
note(637,282,'One destination','A repeat receipt returns the same preview destination. Linking keeps the existing project dates and coordinator.')
note(637,417,'Return with ownership','A return records clarification and a follow-up. A new source revision is needed before receiving again.')

start('Review outcome and next build boundary','r02 refines the design. It does not invoke the Projects runtime or publish repository changes.')
text(36,141,'What you can exercise',17,b=True)
items=['Create a known-site project with an initial owned Activity.','Add a milestone; update progress and retain a correction.','Record an Activity outcome, resolve the blocker, then reassess health.','Inspect history and return to the original filtered register.','Simulate an uncertain save, a conflicting update and unavailable content.','Explore exact-document descriptions and future receiving review.']
y=180
for item in items:
 rect(39,y+6,4,4,G);h=text(52,y,item,11,w=420);y+=h+11
text(507,141,'Verification and limits',17,b=True,w=300)
evidence=json.loads((D/'review-check-results.json').read_text());checks=sum(x.get('result')=='passed' for x in evidence['results'])
text(507,180,f'{checks} browser design checks passed across 1366, 390 and 320 px. Browser: Chromium {evidence["browser"]}. No uncaught page errors. Screens shown are actual prototype captures.',11,w=295)
text(507,281,'These checks cover the local HTML interaction model. They do not establish real permissions, database transactions, persistence, quotation acceptance or native-device acceptance.',11,w=295,color=M)
text(507,385,'Recommended next build: J1 register, milestones, owned Activities and update history. Future scope/documents/quotation handover remain separately bounded.',11,w=295)
text(36,511,'Source: BP-06/J1 and r01 review on main f8035b5c. The companion HTML is the primary review deliverable; full contracts and evidence accompany the prepared repository changes.',9.5,w=770,color=M)
c.save();print(OUT)
