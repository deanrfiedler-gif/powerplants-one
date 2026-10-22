# Nursery Automation equipment-data template

<!-- versioning: git; committed history is authoritative -->

Document ID: PPO-NURSERY-EQUIPMENT-DATA-GUIDE. Owner: Dean Fiedler. Status: draft template for review, 22 October 2026.

Use [the editable Excel template](equipment-data-template.xlsx) to collect a reviewed equipment configuration and its delivery information. The [JSON field dictionary](equipment-data-template.json) defines the same fields, allowed choices, required conditions, units and blank records in a reviewable format. Its schema version 1 describes this template only; it is not the workbench parts-proposal schema or an import API.

## Filling out the template

1. Make a working copy in the approved private document location. Enter values in the amber **Entry**, **Evidence state** and **Source ref** cells. Blank means unknown, never zero. Grey examples are synthetic guidance and are not active inputs.
2. Use one Equipment sheet per exact model/region/options variant. Duplicate record sheets for additional equipment, options, connections, profiles, standards, activity selections or sources. Give every record a stable unique ID; preserve existing supplier identifiers exactly.
3. Reference the Equipment/option IDs from related records. Reference an Evidence record in each field's Source ref cell. Distinct claims from different documents need separate source references even within one equipment record.
4. Record applicability and review separately from the value's evidence state. A supplier document is not a trial result, and a reviewer does not certify an unknown value by changing its status.
5. Resolve delivery scope using exact reviewed profiles/standards and explicit coverage. Do not copy synthetic productivity numbers into operating standards. CPQ owns calculation, costs and selling prices; this workbook contains no price fields or labour engine.
6. Submit the completed copy to the nominated Products/technical/commercial reviewers. A workbook edit does not publish a Product, standard, clause or profile. Import and runtime enforcement are future implementation work.

## Records and relationships

| Sheet | One record represents | References and use |
|---|---|---|
| Equipment | Exact model/variant and technical observations | Links exact Products Variant/revision/hash/unit and delivery profiles. |
| Options | One accessory/tooling option | Parent Equipment, dependency/exclusion IDs, quantity basis and its own mapping. |
| Interfaces | One project connection | Upstream/downstream instances, scenario and confirming evidence. |
| Delivery profiles | Reusable product/assembly/service/system/project default | Exact activity/content versions, inheritance and coverage. |
| Activity standards | One governed effort rule | Driver/unit, dimensional basis, roles, factor/minimum/rounding references and coverage. |
| Delivery scope | One resolved project activity selection | Alternative/system/run/profile/standard plus separate applicability, commercial selection, responsibility and review. |
| Content links | One approved-content reference | Clause/version, audience, conditions, grouping, deduplication and conflict rules. |
| Evidence | One source/observation/review | Exact source identity/version, applicability, conflict and reviewer. |

The JSON includes a `blank_record` for every record type, with all values null. Per-field evidence state/source reference are separate workbook columns; any future machine interchange must preserve that attribution beside each field, rather than treating blank_record as a complete operational record. The field dictionary's synthetic examples describe shape, not published identities. Runtime UUID/hash enforcement belongs to the future governed onboarding contract.

Fields marked Required identify the draft record. Conditional requirements name their gate (selection, mapped receiving, calculation, publication or quotation). The workbook's dropdowns assist entry; they do not enforce every cross-record, date, range, completeness, permission or publication rule. Numerical/date entry cells retain native Excel types. Duplicate a record sheet rather than extending a column with incompatible record meanings.

The template now has 171 fields. All original field keys remain. Delivery scope records company, workspace, alternative, saved Discovery/Express revision and, when relevant, the workbench instance/run. Project-wide Manual work records its evidenced scope basis without inventing a run. Use effective driver quantity/key/unit for test counts and training sessions; installed quantity remains a separate physical basis. The standard and effective driver must agree before CPQ calculation; field examples illustrate shapes and are not a connected sample project.

Profile/standard publication is separate from technical review. Content links point to governed library wording, owners and exact hashes; they do not author a new clause library. The saved estimate/quotation package, rate/cost bindings, calculated/adjusted hours and approved amendments belong to CPQ/ES-05, not this equipment collection form. The specification defines their required retention. No workbook upload is required to create a native estimate.

## Review checks before onboarding

- IDs are unique, links resolve and exact company/provider/entity keys are recorded where applicable.
- Limits state units, options and scenario conditions. Minimum does not exceed maximum; ambiguous boundary inclusivity is resolved. Conflicting evidence is retained with disposition.
- Published machine capacity, expected scenario performance and demonstrated trial output remain separate. Electrical/air availability is not verified demand or compatibility.
- Exact Products Variant, revision, hash and unit agree. No mapping by label or guessed conversion. No new ERP item is created here.
- Profiles/standards/content have actual review evidence. One assembly/project activity cannot duplicate component setup, supplier commissioning, travel or minimum allowances.
- Applicability, selection, responsibility and review are all resolved independently. Offered options have separate commercial treatment; supplier coverage has exact evidence.
- Installed quantity drives labour unless an explicit rule says otherwise; spares, waste, packs, reused and customer-supplied items remain distinguishable.
- Internal productivity, hours, costs and margin stay out of customer wording by default. Required promises and qualifications reconcile to resolved scope.

## Source and maintenance

The questionnaire was supplied as `PPA-TPL-004_Form-Javo.docx`; its internal identity is `PPA-COM-FRM-014`, version `0.1 — Draft`, titled Automated Potting Line Project Intake. Preserve both identities; do not rename the original. SHA-256: `f829eeb06601726617d808b31e3b3e8c5ff9bd98f8fe5636f8857fe75b584878`. Only the derived generic field model and source identifiers are recorded here; the commercial-in-confidence original and operational completed forms remain outside public Git.

The updated user-supplied estimating plan adopts O1–O15 and DP1–DP8 on 22 October 2026. See the repository [scope record](../../decisions/nursery-automation-specification.md) for the dependency and authority boundary. No private Page link is published.

Manufacturer context: [Javo application families](https://www.javo.eu/en/applications/) and [Standard 2.0](https://www.javo.eu/en/product/javo-standard-2-0/), consulted 22 October 2026. These sources inform scope and evidence review; no real manufacturer rating or productivity value is prefilled. All example values and IDs in the workbook/JSON are synthetic.

Maintain the JSON dictionary and workbook together. Compare field keys, labels, units, allowed values, examples and blank entry cells before release. Preserve the distinction between template assurance and operational review. Broader requirements and proposed tests are in the [specification](../../blueprints/nursery-automation-configurator.md) and [acceptance catalogue](../../testing/nursery-automation-acceptance.md).
