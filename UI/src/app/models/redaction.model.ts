export interface Redaction {
  id: string;
  page: number;
  coordinates: { x: number; y: number; width: number; height: number };
}