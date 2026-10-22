// Public source identity only; no approved performance, regional variant or Products mapping.
export const catalogue = {
  edition: "PPO-NAC-EQUIPMENT-1",
  reviewed: false,
  entries: [
    {
      id: "javo-standard-2-0",
      supplier: "Javo",
      model: "Standard 2.0",
      family: "PottingMachine",
      source_url: "https://www.javo.eu/en/product/javo-standard-2-0/",
      observed_on: "2026-10-22",
      review: "Pending",
      product_variant: null,
      approved_limits: null,
      note: "The public description and technical table disagree on minimum pot diameter. Confirm regional configuration, options and limits with the supplier.",
      source_claims: [
        {
          topic: "Minimum pot diameter",
          value: "55 mm",
          source_section: "Description",
        },
        {
          topic: "Minimum pot diameter",
          value: "60 mm",
          source_section: "Technical specifications",
        },
      ],
    },
    {
      id: "javo-plus",
      supplier: "Javo",
      model: "Plus",
      family: "PottingMachine",
      source_url: "https://www.javo.eu/en/applications/potting-machines/",
      observed_on: "2026-10-22",
      review: "Pending",
      product_variant: null,
      approved_limits: null,
      note: "User-selected model listed on Javo’s potting-machines application page. Exact regional configuration, options and limits require supplier confirmation; no ratings adopted.",
      source_claims: [],
    },
  ],
} as const;
