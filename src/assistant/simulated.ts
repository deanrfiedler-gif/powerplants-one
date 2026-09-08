export const ASSISTANT_LABEL = 'Simulated assistant · Synthetic data only';
export type ParsedRequest = {
  kind: 'customers' | 'opportunities' | 'summary' | 'create' | 'help';
  query: string;
  mine: boolean;
  next_action?: 'Needed' | 'DueNeeded' | 'Overdue';
  draft: Partial<Record<'title' | 'need_summary' | 'source_channel' | 'source_basis' | 'action_summary', string>>;
  explanation: string;
};
// Deliberately bounded local parser. It never consumes database narrative as instructions.
export function parseSimulatedRequest(message: string): ParsedRequest {
  const result: ParsedRequest = { kind: 'help', query: '', mine: false, draft: {}, explanation: 'This simulation supports finding customers, showing opportunities, summarising the selected customer and preparing an opportunity. It does not use an AI model.' };
  const text = message.trim();
  if (/^(summarise|summarize|summary)\b/i.test(text)) result.kind = 'summary';
  else if (/^(create|add|prepare)\b/i.test(text) && /\b(deal|opportunity)\b/i.test(text)) {
    result.kind = 'create';
    const match = text.match(/(?:deal|opportunity)\s+for\s+(.+?)\s+to\s+([^\n.!?]+)/i);
    if (match) { result.query = match[1].trim().slice(0,200); result.draft.title = match[2].trim().slice(0,200); result.draft.need_summary = match[2].trim(); }
    for (const [label,key] of [['Title','title'],['Requirement','need_summary'],['Source details','source_basis'],['Follow-up','action_summary']] as const) {
      const value = text.split('\n').find(line => line.toLowerCase().startsWith(label.toLowerCase()+':'))?.slice(label.length+1).trim();
      if (value) result.draft[key] = value;
    }
    const channel = text.match(/(?:^|\n)Source:\s*(Phone|Email|Meeting|Referral|Other)\s*(?:\n|$)/i)?.[1];
    if (channel) result.draft.source_channel = channel[0].toUpperCase()+channel.slice(1).toLowerCase();
    result.explanation = 'Choose the existing customer, then review the fields below. The simulation proposes only recognised title/requirement or labelled fields. Check the original request: names, source, owners, dates, values and other details are not inferred or silently saved. Nothing has been created.';
  } else if (/^(show|find|search)\b/i.test(text) && /\b(opportunities|deals)\b/i.test(text)) {
    result.kind = 'opportunities'; result.mine = /\bmy\b/i.test(text);
    if (/overdue/i.test(text)) result.next_action = 'Overdue';
    else if (/due date needed/i.test(text)) result.next_action = 'DueNeeded';
    else if (/next action needed|follow.up needed/i.test(text)) result.next_action = 'Needed';
    result.explanation = 'Showing the first permitted worklist page. The visible filters describe this simulation’s interpretation; this is not a search of every database field.';
  } else if (/^(find|search)\b/i.test(text)) {
    result.kind = 'customers';
    result.query = text.replace(/^(find|search)(\s+for)?\s*/i,'').replace(/^customers?\s*:?\s*/i,'').slice(0,200);
    result.explanation = 'Select an existing permitted customer. Similar names remain separate records.';
  }
  return result;
}
