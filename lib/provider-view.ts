
export interface ProviderView {
  id: string;
  label: string;
  topics: Array<{ id: string; label: string }>;
  sorts: Array<{ value: string; label: string }>;
  defaultTopic: string;
  defaultSort: string;
  hasSummaries: boolean;
  hasSourceFilter: boolean;
}
