const paths = {
  mail: "M3 5h18v14H3z M3 5l9 8 9-8",
  home: "m3 10 9-7 9 7v10H3z M9 20v-7h6v7",
  work: "M8 4H5v17h14V4h-3 M8 3h8v4H8z M8 12h8 M8 16h5",
  sales: "M3 7h18v14H3z M8 7V3h8v4 M3 12l9 4 9-4 M10 12h4",
  estimate: "M5 2h14v20H5z M8 6h8 M8 11h1 M12 11h1 M16 11h1 M8 15h1 M12 15h1 M16 15h1 M8 19h1 M12 19h1 M16 19h1",
  engineering: "m3 17 14-14 4 4L7 21z M13 7l4 4 M10 10l2 2 M7 13l4 4",
  projects: "M3 5h7l2 3h9v13H3z",
  service: "M4 5h16v16H4z M8 2v6 M16 2v6 M4 11h16 M8 15h3 M8 18h7",
  supply: "m3 7 9-5 9 5v10l-9 5-9-5z M3 7l9 5 9-5 M12 12v10 M7 4l10 6",
  finance: "M5 3l3 2 4-2 4 2 3-2v19l-3-2-4 2-4-2-3 2z M8 9h8 M8 13h8 M8 17h5",
  customers: "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-3a7 7 0 0 1 14 0v3 M16 4a4 4 0 0 1 0 8 M18 15a5 5 0 0 1 4 5v1",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M4 21v-2a8 8 0 0 1 16 0v2",
  settings: "M4 7h16 M4 17h16 M8 4v6 M16 14v6",
  board: "M3 4h5v16H3z M10 4h5v11h-5z M17 4h4v14h-4z",
  list: "M8 5h13 M8 12h13 M8 19h13 M3 5h1 M3 12h1 M3 19h1",
  plus: "M12 4v16 M4 12h16",
  filter: "M3 5h18 M6 12h12 M9 19h6",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2",
  warning: "m12 3 10 18H2z M12 9v5 M12 17v1",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  close: "m5 5 14 14 M5 19 19 5",
};
export type ProductIconName = keyof typeof paths;
export function ProductIcon({ name }: { name: ProductIconName }) {
  return <svg className="product-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
