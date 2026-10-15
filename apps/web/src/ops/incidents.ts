/** Serious incidents must reach affected pilot schools within 48 hours (docs/11). */
export const SCHOOLS_DEADLINE_HOURS = 48;

export interface IncidentLike {
  id: number | string;
  title: string;
  severity?: string | null;
  status?: string | null;
  schoolsInformedAt?: string | null;
  createdAt: string;
}

export function overdueIncidents<T extends IncidentLike>(incidents: T[], now = Date.now()): T[] {
  return incidents.filter((i) => i.severity === "serious" && !i.schoolsInformedAt && now - new Date(i.createdAt).getTime() > SCHOOLS_DEADLINE_HOURS * 3600_000);
}
