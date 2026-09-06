"""Check the proposed arithmetic oracle and BP-04 coverage, never runtime parity."""
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
import copy
import json
import re

ROOT = Path(__file__).resolve().parents[2]
data = json.loads((ROOT / 'docs/testing/estimating-calculation-fixtures.json').read_text())
cases = {c['id']: c for c in data['cases']}
Q = Decimal('0.01')
def number(value):
    if value is None:
        raise ValueError('Unknown')
    d = Decimal(value)
    if not d.is_finite():
        raise ValueError('Non-finite')
    return d
def money(value):
    return value.quantize(Q, rounding=ROUND_HALF_UP)
def lines(case):
    rows = copy.deepcopy(case.get('lines') or lines(cases[case['base']]))
    for row in rows:
        row.update(case.get('changes', {}).get(row['id'], {}))
        if row['included'] and 'replace_included_discount' in case:
            row['discount'] = case['replace_included_discount']
    return rows
def calculate(rows):
    all_cost = included_cost = sell = printed = hidden = Decimal(0)
    for r in rows:
        q, cost, price, discount = (number(r[k]) for k in ['quantity','cost','sell','discount'])
        if q <= 0 or cost < 0 or price < 0 or not 0 <= discount <= 100:
            raise ValueError('Invalid input')
        rate = number(r.get('rate','1'))
        if rate <= 0:
            raise ValueError('Invalid FX')
        unit = cost * rate + number(r.get('freight_per_unit_aud','0')) + number(r.get('duty_per_unit_aud','0'))
        extended_cost, extended_sell = money(q * unit), money(q * price * (1-discount/100))
        all_cost += extended_cost
        if r['included']:
            included_cost += extended_cost
            sell += extended_sell
            if r['print']:
                printed += extended_sell
            else:
                hidden += extended_sell
    diff = sell-included_cost
    pct = lambda denominator: str(money(diff/denominator*100)) if denominator else None
    return dict(all_cost=str(money(all_cost)),included_cost=str(money(included_cost)),sell=str(money(sell)),difference=str(money(diff)),margin_percent=pct(sell),markup_percent=pct(included_cost),printed=str(money(printed)),hidden_allowance=str(money(hidden)))

for c in data['cases']:
    rows = lines(c)
    actual = calculate(rows)
    assert actual == c['expected'], (c['id'],actual,c['expected'])
    assert number(actual['printed']) + number(actual['hidden_allowance']) == number(actual['sell'])
    if 'expected_discounts' in c:
        assert {r['id']:r['discount'] for r in rows} == c['expected_discounts']
for c in data['invalid_cases']:
    rows = lines(cases['EF-01']); rows[0][c['field']] = c['value']
    try:
        calculate(rows)
    except (ValueError,ArithmeticError):
        pass
    else:
        raise AssertionError(c['id'])
assert calculate(lines(cases['EF-01'])) == cases['EF-01']['expected'], 'Successor modified source fixture'
evidence = (ROOT/'docs/blueprints/estimating-evidence.md').read_text()
assert set(re.findall(r'^\| (CRE-\d{2}) \|',evidence,re.M)) == {f'CRE-{i:02}' for i in range(1,27)}
spec = (ROOT/'docs/blueprints/BP-04-estimating-quotation.md').read_text()
assert set(re.findall(r'^\| (EST-\d{2}) \|',spec,re.M)) == {f'EST-{i:02}' for i in range(1,10)}
acceptance = (ROOT/'docs/testing/estimating-acceptance.md').read_text()
assert set(re.findall(r'^\| (EA-\d{2}) /',acceptance,re.M)) == {f'EA-{i:02}' for i in range(1,19)}
for line in acceptance.splitlines():
    if line.startswith('| EA-'):
        assert line.endswith('| Not run |')
print(json.dumps({'status':'passed','numeric_fixtures':8,'invalid_input_cases':4,'crems_dispositions':26,'estimating_parents':9,'authored_runtime_cases':18,'scope':'Proposed design arithmetic and coverage only; no CREMS parity, application or owner acceptance'},indent=2))
