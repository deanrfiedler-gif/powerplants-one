from fractions import Fraction
from pathlib import Path
import json, random
rng=random.Random(20261012)
def scalar():
    number=rng.randint(-999999,999999) or 1
    scale=rng.randint(0,6)
    sign='-' if number<0 else ''
    digits=str(abs(number)).zfill(scale+1)
    return sign+(digits if scale==0 else digits[:-scale]+'.'+digits[-scale:])
cases=[]
for index in range(5000):
    facts={name:scalar() for name in 'abcd'}
    a,b,c,d=(Fraction(facts[x]) for x in 'abcd')
    mode=index%4
    expression=['(a+b)*c/d','a-b/c','-(a*b)+c/d','a/(b/c)'][mode]
    exact=[(a+b)*c/d,a-b/c,-(a*b)+c/d,a/(b/c)][mode]
    cases.append({'expression':expression,'facts':facts,'numerator':str(exact.numerator),'denominator':str(exact.denominator)})
(Path(__file__).parent/'arithmetic-oracle.json').write_text(json.dumps(cases,separators=(',',':')),encoding='utf8')
print(json.dumps({'oracle':'Python standard-library fractions.Fraction','seed':20261012,'cases':len(cases)}))
