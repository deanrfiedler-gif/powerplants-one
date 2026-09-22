/** Declarative fields statically transcribed from the issued r02 SCHEMAS/EXTRA_FIELDS.
 * Source SHA-256 b51bf2cab7cb1af54e33a0ec739921c4ca1a08da918165d615ead347d6463ab9. No standalone JavaScript is executed.
 * Schema 1 upgrades add only the declared new fields; historical reviews are never signatures. */
export interface LegacyField {
  type: string;
  options?: string[];
  collection?: string;
  integer?: boolean;
  signed?: boolean;
  max?: number;
  added_in_schema_2?: boolean;
}
export const legacyContract: Record<
  string,
  { singleton: boolean; fields: Record<string, LegacyField> }
> = {
  project: {
    singleton: true,
    fields: {
      name: {
        type: "text",
      },
      reference: {
        type: "text",
      },
      customer: {
        type: "text",
      },
      site: {
        type: "text",
      },
      project_type: {
        type: "select",
        options: [
          "New installation",
          "Expansion",
          "Upgrade",
          "Replacement",
          "Mixed",
        ],
      },
      stage: {
        type: "select",
        options: ["Discovery", "Technical development", "Scope review"],
      },
      author: {
        type: "text",
      },
      visit_date: {
        type: "date",
      },
      grower: {
        type: "text",
      },
      agronomist: {
        type: "text",
      },
      designer: {
        type: "text",
      },
      specialist: {
        type: "text",
      },
      reviewer: {
        type: "text",
      },
      target_date: {
        type: "date",
      },
      property_ha: {
        type: "number",
      },
      served_ha: {
        type: "number",
      },
      currency: {
        type: "text",
      },
      budget_low: {
        type: "number",
      },
      budget_high: {
        type: "number",
      },
      outcomes: {
        type: "textarea",
      },
      boundaries: {
        type: "textarea",
      },
      constraints: {
        type: "textarea",
      },
      service: {
        type: "textarea",
      },
      groscales_required: {
        type: "select",
        options: ["Unknown", "Yes", "No"],
        added_in_schema_2: true,
      },
      groscales_connection: {
        type: "select",
        options: ["Unknown", "Wired", "Wireless"],
        added_in_schema_2: true,
      },
      groscales_controller_id: {
        type: "ref",
        collection: "controllers",
        added_in_schema_2: true,
      },
      groscales_gateway_ref: {
        type: "text",
        added_in_schema_2: true,
      },
      groscales_wireless_scope: {
        type: "textarea",
        added_in_schema_2: true,
      },
      groscales_confirmation_ref: {
        type: "text",
        added_in_schema_2: true,
      },
    },
  },
  blocks: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      phase: {
        type: "select",
        options: ["Existing", "Proposed", "Future"],
      },
      area_ha: {
        type: "number",
      },
      area_basis: {
        type: "select",
        options: ["Measured boundary", "Customer plan", "Estimated"],
      },
      location: {
        type: "text",
      },
      structure: {
        type: "text",
      },
      rows: {
        type: "number",
        integer: true,
      },
      row_length_m: {
        type: "number",
      },
      row_spacing_m: {
        type: "number",
      },
      plant_spacing_m: {
        type: "number",
      },
      elevation_low_m: {
        type: "number",
        signed: true,
      },
      elevation_high_m: {
        type: "number",
        signed: true,
      },
      slope_percent: {
        type: "number",
      },
      shed_distance_m: {
        type: "number",
      },
      orientation: {
        type: "text",
      },
      routes: {
        type: "textarea",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
    },
  },
  cohorts: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      block_id: {
        type: "ref",
        collection: "blocks",
      },
      crop: {
        type: "select",
        options: [
          "Blueberry",
          "Raspberry",
          "Strawberry",
          "Blackberry",
          "Other berry",
          "Other",
        ],
      },
      variety: {
        type: "text",
      },
      stage: {
        type: "text",
      },
      planting_date: {
        type: "date",
      },
      season: {
        type: "text",
      },
      system: {
        type: "select",
        options: ["Container / substrate", "Soil", "Gutter / trough", "Other"],
      },
      substrate: {
        type: "text",
      },
      container_l: {
        type: "number",
      },
      density_ha: {
        type: "number",
      },
      actual_containers: {
        type: "number",
        integer: true,
      },
      plants_per_container: {
        type: "number",
      },
      actual_plants: {
        type: "number",
        integer: true,
      },
      missing_plants: {
        type: "number",
        integer: true,
      },
      flow_method: {
        type: "select",
        options: ["Independent drippers", "Verified flow per container"],
      },
      emitters_per_container: {
        type: "number",
      },
      outlets_per_emitter: {
        type: "number",
      },
      containers_per_emitter: {
        type: "number",
      },
      emitter_lph: {
        type: "number",
      },
      container_lph: {
        type: "number",
      },
      emitter_model: {
        type: "text",
      },
      datasheet: {
        type: "text",
      },
      rated_pressure_bar: {
        type: "number",
      },
      minimum_pressure_bar: {
        type: "number",
      },
      maximum_pressure_bar: {
        type: "number",
      },
      pressure_compensated: {
        type: "select",
        options: ["Unknown", "Yes", "No"],
      },
      anti_drain: {
        type: "select",
        options: ["Unknown", "Yes", "No"],
      },
      lateral_id_mm: {
        type: "number",
      },
      lateral_length_m: {
        type: "number",
      },
      laterals_per_row: {
        type: "number",
      },
      emitter_spacing_m: {
        type: "number",
      },
      filtration_requirement: {
        type: "text",
      },
      daily_l_container: {
        type: "number",
      },
      water_basis: {
        type: "select",
        options: ["Unknown", "Gross applied", "Net crop requirement"],
      },
      drain_fraction: {
        type: "number",
        max: 0.99,
      },
      drain_basis_confirmed: {
        type: "select",
        options: ["Unknown", "Yes", "No"],
      },
      water_author: {
        type: "text",
      },
      root_zone: {
        type: "textarea",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
      cohort_area_ha: {
        type: "number",
        added_in_schema_2: true,
      },
    },
  },
  mainlines: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      source_id: {
        type: "ref",
        collection: "sources",
      },
      circuit: {
        type: "text",
      },
      phase: {
        type: "select",
        options: ["Existing", "Proposed", "Future"],
      },
      location: {
        type: "text",
      },
      diameter_mm: {
        type: "number",
      },
      operating_pressure_bar: {
        type: "number",
      },
      model: {
        type: "text",
      },
      actuation: {
        type: "text",
      },
      feedback: {
        type: "text",
      },
      condition: {
        type: "select",
        options: ["Retain", "Replace", "New", "Inspect"],
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
      controller_id: {
        type: "ref",
        collection: "controllers",
        added_in_schema_2: true,
      },
      io_bank_id: {
        type: "ref",
        collection: "io",
        added_in_schema_2: true,
      },
      io_signal_type: {
        type: "select",
        options: [
          "Digital input",
          "Digital output",
          "Analogue input 4–20 mA",
          "Analogue input 0–10 V",
          "Analogue output 4–20 mA",
          "Analogue output 0–10 V",
          "Pulse input",
          "Resistance input",
          "Bus interface",
          "Universal — assigned DI",
          "Universal — assigned DO",
          "Universal — assigned AI",
          "Universal — unassigned",
        ],
        added_in_schema_2: true,
      },
      channel_demand: {
        type: "number",
        integer: true,
        added_in_schema_2: true,
      },
    },
  },
  valves: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      mainline_id: {
        type: "ref",
        collection: "mainlines",
      },
      phase: {
        type: "select",
        options: ["Existing", "Proposed", "Future"],
      },
      location: {
        type: "text",
      },
      model: {
        type: "text",
      },
      flow_basis: {
        type: "select",
        options: ["Emitter inventory", "Measured", "Design allowance"],
      },
      measured_flow_m3h: {
        type: "number",
      },
      design_flow_m3h: {
        type: "number",
      },
      pressure_bar: {
        type: "number",
      },
      actuation: {
        type: "text",
      },
      inrush_va: {
        type: "number",
      },
      holding_va: {
        type: "number",
      },
      control_address: {
        type: "text",
      },
      feedback: {
        type: "text",
      },
      condition: {
        type: "select",
        options: ["Retain", "Replace", "New", "Inspect"],
      },
      allocations: {
        type: "allocations",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
      controller_id: {
        type: "ref",
        collection: "controllers",
        added_in_schema_2: true,
      },
      io_bank_id: {
        type: "ref",
        collection: "io",
        added_in_schema_2: true,
      },
      io_signal_type: {
        type: "select",
        options: [
          "Digital input",
          "Digital output",
          "Analogue input 4–20 mA",
          "Analogue input 0–10 V",
          "Analogue output 4–20 mA",
          "Analogue output 0–10 V",
          "Pulse input",
          "Resistance input",
          "Bus interface",
          "Universal — assigned DI",
          "Universal — assigned DO",
          "Universal — assigned AI",
          "Universal — unassigned",
        ],
        added_in_schema_2: true,
      },
      channel_demand: {
        type: "number",
        integer: true,
        added_in_schema_2: true,
      },
    },
  },
  sources: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      type: {
        type: "select",
        options: [
          "Dam",
          "Tank",
          "Bore / well",
          "Mains",
          "River / stream",
          "Recycled water",
          "Blend",
          "Other",
        ],
      },
      phase: {
        type: "select",
        options: ["Existing", "Proposed", "Future"],
      },
      location: {
        type: "text",
      },
      reliable_flow_m3h: {
        type: "number",
      },
      pressure_bar: {
        type: "number",
      },
      minimum_level_m: {
        type: "number",
        signed: true,
      },
      maximum_level_m: {
        type: "number",
        signed: true,
      },
      nominal_storage_m3: {
        type: "number",
      },
      usable_storage_m3: {
        type: "number",
      },
      availability: {
        type: "text",
      },
      intake: {
        type: "text",
      },
      blending: {
        type: "text",
      },
      level_control: {
        type: "text",
      },
      backup: {
        type: "textarea",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
    },
  },
  water_samples: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      source_id: {
        type: "ref",
        collection: "sources",
      },
      sample_date: {
        type: "date",
      },
      sample_point: {
        type: "text",
      },
      laboratory: {
        type: "text",
      },
      report_ref: {
        type: "text",
      },
      ph: {
        type: "number",
        max: 14,
      },
      ec_mscm: {
        type: "number",
      },
      temperature_c: {
        type: "number",
        signed: true,
      },
      compensation: {
        type: "text",
      },
      alkalinity: {
        type: "text",
      },
      alkalinity_unit: {
        type: "text",
      },
      bicarbonate: {
        type: "text",
      },
      calcium: {
        type: "text",
      },
      magnesium: {
        type: "text",
      },
      hardness: {
        type: "text",
      },
      sodium: {
        type: "text",
      },
      chloride: {
        type: "text",
      },
      iron: {
        type: "text",
      },
      manganese: {
        type: "text",
      },
      boron: {
        type: "text",
      },
      turbidity: {
        type: "text",
      },
      nutrients: {
        type: "textarea",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
    },
  },
  pipes: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      from: {
        type: "text",
      },
      to: {
        type: "text",
      },
      length_m: {
        type: "number",
      },
      internal_diameter_mm: {
        type: "number",
      },
      nominal_diameter_mm: {
        type: "number",
      },
      material: {
        type: "text",
      },
      elevation_change_m: {
        type: "number",
        signed: true,
      },
      design_flow_m3h: {
        type: "number",
      },
      verified_loss_m: {
        type: "number",
      },
      loss_basis: {
        type: "text",
      },
      fittings: {
        type: "textarea",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
    },
  },
  filters: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      type: {
        type: "select",
        options: [
          "Screen filter",
          "Disc filter",
          "Media filter",
          "Sediment removal",
          "Disinfection",
          "Iron / manganese treatment",
          "Reverse osmosis",
          "Other",
        ],
      },
      model: {
        type: "text",
      },
      process_order: {
        type: "number",
        integer: true,
      },
      rating: {
        type: "text",
      },
      capacity_m3h: {
        type: "number",
      },
      clean_loss_m: {
        type: "number",
      },
      dirty_loss_m: {
        type: "number",
      },
      dp_trigger_bar: {
        type: "number",
      },
      backwash_m3h: {
        type: "number",
      },
      backwash_pressure_bar: {
        type: "number",
      },
      backwash_seconds: {
        type: "number",
      },
      backwash_path: {
        type: "text",
      },
      discharge: {
        type: "text",
      },
      monitoring: {
        type: "textarea",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
      flow_path: {
        type: "select",
        options: [
          "Unknown",
          "Pump discharge",
          "Unit delivered flow",
          "Crop delivery flow",
        ],
        added_in_schema_2: true,
      },
      flow_conditions: {
        type: "text",
        added_in_schema_2: true,
      },
    },
  },
  hydraulics: {
    singleton: true,
    fields: {
      pump_model: {
        type: "text",
      },
      serial: {
        type: "text",
      },
      curve_ref: {
        type: "text",
      },
      curve_date: {
        type: "date",
      },
      curve_status: {
        type: "select",
        options: [
          "Unknown",
          "Synthetic example",
          "Supplier documented",
          "Field measured",
        ],
      },
      impeller: {
        type: "text",
      },
      frequency_hz: {
        type: "number",
      },
      speed_rpm: {
        type: "number",
      },
      motor_kw: {
        type: "number",
      },
      drive: {
        type: "text",
      },
      standby: {
        type: "text",
      },
      outlet_pressure_bar: {
        type: "number",
      },
      static_head_m: {
        type: "number",
        signed: true,
      },
      pipe_loss_m: {
        type: "number",
      },
      filter_loss_m: {
        type: "number",
      },
      unit_loss_m: {
        type: "number",
      },
      other_loss_m: {
        type: "number",
      },
      loss_flow_basis: {
        type: "text",
      },
      head_basis_flow_m3h: {
        type: "number",
      },
      measured_flow_m3h: {
        type: "number",
      },
      measured_head_m: {
        type: "number",
      },
      minimum_pump_flow_m3h: {
        type: "number",
      },
      suction: {
        type: "textarea",
      },
      surge: {
        type: "textarea",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
      system_curve_ref: {
        type: "text",
        added_in_schema_2: true,
      },
    },
  },
  recipes: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      revision: {
        type: "text",
      },
      author: {
        type: "text",
      },
      crop_stage: {
        type: "text",
      },
      type: {
        type: "select",
        options: ["Fertigation", "Plain water", "Treatment"],
      },
      ph_target: {
        type: "number",
        max: 14,
      },
      ec_target_mscm: {
        type: "number",
      },
      ec_basis: {
        type: "select",
        options: ["Unknown", "Final delivered EC", "Increment above source EC"],
      },
      ph_tolerance: {
        type: "number",
      },
      ec_tolerance: {
        type: "number",
      },
      ph_low_alarm: {
        type: "number",
        max: 14,
      },
      ph_high_alarm: {
        type: "number",
        max: 14,
      },
      ec_low_alarm: {
        type: "number",
      },
      ec_high_alarm: {
        type: "number",
      },
      root_target: {
        type: "text",
      },
      nutrient_programme: {
        type: "text",
      },
      composition: {
        type: "textarea",
      },
      changeover: {
        type: "textarea",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
    },
  },
  stocks: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      recipe_id: {
        type: "ref",
        collection: "recipes",
      },
      function: {
        type: "select",
        options: ["Nutrient", "Acid", "Alkali", "Trace", "Treatment", "Spare"],
      },
      product: {
        type: "text",
      },
      sds: {
        type: "text",
      },
      concentration: {
        type: "text",
      },
      density_kg_l: {
        type: "number",
      },
      dose_l_m3: {
        type: "number",
      },
      minimum_lph: {
        type: "number",
      },
      maximum_lph: {
        type: "number",
      },
      tank_usable_l: {
        type: "number",
      },
      capacity_conditions: {
        type: "text",
      },
      suction_lift_m: {
        type: "number",
        signed: true,
      },
      suction_length_m: {
        type: "number",
      },
      material: {
        type: "text",
      },
      mixing: {
        type: "text",
      },
      level_sensing: {
        type: "text",
      },
      compatibility: {
        type: "text",
      },
      capacity_verified: {
        type: "select",
        options: ["Unknown", "Yes", "No"],
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
    },
  },
  controllers: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      role: {
        type: "select",
        options: [
          "Existing — retain",
          "Existing — expand",
          "Existing — replace",
          "Proposed new",
          "Future",
        ],
      },
      family: {
        type: "select",
        options: [
          "Compass",
          "Compact CC",
          "Connext",
          "Other / legacy",
          "Unknown",
        ],
      },
      model: {
        type: "text",
      },
      serial: {
        type: "text",
      },
      location: {
        type: "text",
      },
      software: {
        type: "text",
      },
      licences: {
        type: "text",
      },
      licence_limits: {
        type: "text",
      },
      backup: {
        type: "text",
      },
      interface: {
        type: "text",
      },
      ownership: {
        type: "text",
      },
      compatibility: {
        type: "select",
        options: ["Unknown", "Supplier confirmed", "Review required"],
      },
      confirmation_ref: {
        type: "text",
      },
      integration: {
        type: "textarea",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
    },
  },
  io: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      controller_id: {
        type: "ref",
        collection: "controllers",
      },
      location: {
        type: "text",
      },
      module_model: {
        type: "text",
      },
      bank_id: {
        type: "text",
      },
      signal_type: {
        type: "select",
        options: [
          "Digital input",
          "Digital output",
          "Analogue input 4–20 mA",
          "Analogue input 0–10 V",
          "Analogue output 4–20 mA",
          "Analogue output 0–10 V",
          "Pulse input",
          "Resistance input",
          "Bus interface",
          "Universal — assigned DI",
          "Universal — assigned DO",
          "Universal — assigned AI",
          "Universal — unassigned",
        ],
      },
      installed: {
        type: "number",
        integer: true,
      },
      used: {
        type: "number",
        integer: true,
      },
      reserved: {
        type: "number",
        integer: true,
      },
      faulty: {
        type: "number",
        integer: true,
      },
      required: {
        type: "number",
        integer: true,
      },
      voltage: {
        type: "text",
      },
      allocation: {
        type: "text",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
    },
  },
  sensors: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      type: {
        type: "select",
        options: [
          "Feed EC",
          "Feed pH",
          "Source EC",
          "Source pH",
          "Flow",
          "Pressure",
          "Filter differential pressure",
          "Tank level",
          "Radiation intensity",
          "Substrate moisture",
          "Substrate EC",
          "Substrate temperature",
          "Weighing scale",
          "Drain flow",
          "Weather",
          "Equipment feedback",
          "Other",
        ],
      },
      model: {
        type: "text",
      },
      location: {
        type: "text",
      },
      controller_id: {
        type: "ref",
        collection: "controllers",
      },
      signal_type: {
        type: "select",
        options: [
          "Digital input",
          "Digital output",
          "Analogue input 4–20 mA",
          "Analogue input 0–10 V",
          "Analogue output 4–20 mA",
          "Analogue output 0–10 V",
          "Pulse input",
          "Resistance input",
          "Bus interface",
          "Universal — assigned DI",
          "Universal — assigned DO",
          "Universal — assigned AI",
          "Universal — unassigned",
        ],
      },
      phase: {
        type: "select",
        options: ["Existing", "Proposed", "Future"],
      },
      range: {
        type: "text",
      },
      accuracy: {
        type: "text",
      },
      power: {
        type: "text",
      },
      calibration: {
        type: "text",
      },
      purpose: {
        type: "text",
      },
      failure: {
        type: "text",
      },
      scale_load_kg: {
        type: "number",
      },
      sample_containers: {
        type: "number",
        integer: true,
      },
      sampling: {
        type: "textarea",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
      cohort_ids: {
        type: "multi",
        collection: "cohorts",
        added_in_schema_2: true,
      },
      io_bank_id: {
        type: "ref",
        collection: "io",
        added_in_schema_2: true,
      },
      channel_demand: {
        type: "number",
        integer: true,
        added_in_schema_2: true,
      },
    },
  },
  strategies: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      trigger: {
        type: "select",
        options: [
          "Clock",
          "Interval",
          "Multiday programme",
          "Radiation intensity",
          "Radiation sum",
          "Moisture",
          "Weight loss",
          "Drainage feedback",
          "Manual",
          "External request",
        ],
      },
      group_ids: {
        type: "multi",
        collection: "groups",
      },
      recipe_id: {
        type: "ref",
        collection: "recipes",
      },
      trigger_value: {
        type: "number",
      },
      trigger_unit: {
        type: "text",
      },
      logic: {
        type: "select",
        options: ["Standalone", "AND", "OR"],
      },
      window: {
        type: "text",
      },
      termination: {
        type: "text",
      },
      minimum_rest_min: {
        type: "number",
      },
      maximum_interval_min: {
        type: "number",
      },
      priority: {
        type: "number",
        integer: true,
      },
      queue_expiry_min: {
        type: "number",
      },
      daily_limit: {
        type: "text",
      },
      inhibits: {
        type: "text",
      },
      fallback: {
        type: "text",
      },
      capability_status: {
        type: "select",
        options: [
          "Requirement only",
          "Supplier confirmed",
          "Installed and tested",
        ],
      },
      capability_ref: {
        type: "text",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
      sensor_id: {
        type: "ref",
        collection: "sensors",
        added_in_schema_2: true,
      },
      reset_period: {
        type: "text",
        added_in_schema_2: true,
      },
    },
  },
  groups: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      valve_ids: {
        type: "multi",
        collection: "valves",
      },
      recipe_id: {
        type: "ref",
        collection: "recipes",
      },
      duty: {
        type: "select",
        options: ["Minimum", "Normal", "Peak", "Flush / maintenance"],
      },
      delivery_seconds: {
        type: "number",
      },
      prepare_seconds: {
        type: "number",
      },
      flush_seconds: {
        type: "number",
      },
      flush_crop: {
        type: "select",
        options: ["Unknown", "Yes", "No"],
      },
      other_pump_flow_m3h: {
        type: "number",
      },
      other_unit_flow_m3h: {
        type: "number",
      },
      other_path: {
        type: "text",
      },
      resource: {
        type: "text",
      },
      minimum_rest_min: {
        type: "number",
      },
      maximum_dry_min: {
        type: "number",
      },
      maximum_start_interval_min: {
        type: "number",
      },
      constraints: {
        type: "textarea",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
    },
  },
  scenarios: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      group_ids: {
        type: "multi",
        collection: "groups",
      },
      include_future: {
        type: "select",
        options: ["No", "Yes"],
      },
      start_time: {
        type: "time",
      },
      end_time: {
        type: "time",
      },
      cycles: {
        type: "number",
        integer: true,
        max: 1000,
      },
      cycle_spacing_min: {
        type: "number",
      },
      downtime_min: {
        type: "number",
      },
      initial_storage_m3: {
        type: "number",
      },
      storage_capacity_m3: {
        type: "number",
      },
      reserve_m3: {
        type: "number",
      },
      refill_m3h: {
        type: "number",
      },
      basis: {
        type: "textarea",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
      source_id: {
        type: "ref",
        collection: "sources",
        added_in_schema_2: true,
      },
      source_basis: {
        type: "textarea",
        added_in_schema_2: true,
      },
    },
  },
  profiles: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      configuration: {
        type: "text",
      },
      minimum_m3h: {
        type: "number",
      },
      maximum_m3h: {
        type: "number",
      },
      minimum_pressure_bar: {
        type: "number",
      },
      maximum_pressure_bar: {
        type: "number",
      },
      inlet_pressure_bar: {
        type: "number",
      },
      channels: {
        type: "number",
        integer: true,
      },
      controller_support: {
        type: "text",
      },
      control_verified: {
        type: "select",
        options: ["Unknown", "Yes", "No"],
      },
      conditions: {
        type: "text",
      },
      source: {
        type: "text",
      },
      verified_date: {
        type: "date",
      },
      reviewer: {
        type: "text",
      },
      verification: {
        type: "select",
        options: [
          "Not verified",
          "Supplier documented",
          "Supplier confirmed for project",
        ],
      },
      budget: {
        type: "number",
      },
      currency: {
        type: "text",
      },
      cost_date: {
        type: "date",
      },
      inclusions: {
        type: "textarea",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
      controller_id: {
        type: "ref",
        collection: "controllers",
        added_in_schema_2: true,
      },
      source_revision: {
        type: "text",
        added_in_schema_2: true,
      },
      stock_limits_ref: {
        type: "text",
        added_in_schema_2: true,
      },
      delivery_arrangement: {
        type: "select",
        options: [
          "Direct mainline mixing",
          "Inline mixing chamber",
          "Bypass loop",
          "Mixing tank",
          "Other / review",
        ],
        added_in_schema_2: true,
      },
    },
  },
  site: {
    singleton: true,
    fields: {
      shed_location: {
        type: "text",
      },
      floor_area_m2: {
        type: "number",
      },
      door_width_m: {
        type: "number",
      },
      door_height_m: {
        type: "number",
      },
      clearance: {
        type: "text",
      },
      lifting: {
        type: "text",
      },
      drainage: {
        type: "text",
      },
      chemical_storage: {
        type: "text",
      },
      voltage: {
        type: "number",
      },
      phases: {
        type: "select",
        options: ["Unknown", "Single", "Three"],
      },
      available_amps: {
        type: "number",
      },
      switchboard: {
        type: "text",
      },
      electrical_contractor: {
        type: "text",
      },
      earthing: {
        type: "text",
      },
      backup_power: {
        type: "text",
      },
      communications: {
        type: "text",
      },
      internet: {
        type: "text",
      },
      remote_support: {
        type: "text",
      },
      reuse: {
        type: "select",
        options: [
          "Unknown",
          "Drain to waste",
          "Collection only",
          "Treatment and reuse",
        ],
      },
      drain_normal_m3d: {
        type: "number",
      },
      drain_peak_m3d: {
        type: "number",
      },
      drain_destination: {
        type: "text",
      },
      return_treatment: {
        type: "text",
      },
      environmental: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
    },
  },
  alarms: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      detection: {
        type: "text",
      },
      delay_seconds: {
        type: "number",
      },
      action: {
        type: "select",
        options: [
          "Warn",
          "Stop irrigation",
          "Stop dosing",
          "Stop pump",
          "Controlled fallback",
          "Other",
        ],
      },
      affected: {
        type: "text",
      },
      fallback: {
        type: "text",
      },
      acknowledgement: {
        type: "text",
      },
      responder: {
        type: "text",
      },
      crop_impact: {
        type: "text",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      evidence_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
    },
  },
  evidence: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      type: {
        type: "select",
        options: [
          "Site photograph",
          "System serial photograph",
          "Water analysis",
          "Pump curve",
          "Emitter datasheet",
          "Supplier confirmation",
          "Controller backup reference",
          "Drawing / survey",
          "Field measurement",
          "Meeting note",
          "Other",
        ],
      },
      reference: {
        type: "text",
      },
      date: {
        type: "date",
      },
      author: {
        type: "text",
      },
      related: {
        type: "text",
      },
      url: {
        type: "url",
      },
      evidence_status: {
        type: "select",
        options: [
          "Unknown",
          "Assumed",
          "Customer advised",
          "Documented",
          "Measured",
        ],
      },
      notes: {
        type: "textarea",
      },
    },
  },
  responsibilities: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      task: {
        type: "select",
        options: [
          "Design",
          "Supply",
          "Install",
          "Connect",
          "Configure",
          "Test",
          "Train",
          "Maintain",
        ],
      },
      party: {
        type: "text",
      },
      inclusion: {
        type: "select",
        options: [
          "Included",
          "Customer supplied",
          "By others",
          "Excluded",
          "To confirm",
        ],
      },
      prerequisite: {
        type: "text",
      },
      due_date: {
        type: "date",
      },
      notes: {
        type: "textarea",
      },
    },
  },
  commissioning: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      metric: {
        type: "text",
      },
      target: {
        type: "text",
      },
      method: {
        type: "text",
      },
      responsible: {
        type: "text",
      },
      witness: {
        type: "text",
      },
      evidence_ref: {
        type: "text",
      },
      status: {
        type: "select",
        options: [
          "Proposed",
          "Agreed criterion",
          "Evidence recorded",
          "Review required",
        ],
      },
      notes: {
        type: "textarea",
      },
    },
  },
  issues: {
    singleton: false,
    fields: {
      name: {
        type: "text",
      },
      severity: {
        type: "select",
        options: ["Blocker", "Review", "Information"],
      },
      owner: {
        type: "text",
      },
      due_date: {
        type: "date",
      },
      status: {
        type: "select",
        options: ["Open", "In progress", "Resolved"],
      },
      resolution_ref: {
        type: "text",
      },
      notes: {
        type: "textarea",
      },
    },
  },
};
