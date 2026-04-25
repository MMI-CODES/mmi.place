import { query } from "@mmiplace/mmi-core";

export type Course = {
  id: number;
  start: string;
  end: string;
  module: string;
  summary: string;
  location: string;
  teachers: string[];
  group: string;
};

export const usePlanning = () => {
  const { settings } = useSettings();
  const planning = useState<Course[]>("planning-data", () => []);
  const loading = useState<boolean>("planning-loading", () => false);
  const error = useState<Error | null>("planning-error", () => null);

  const fetchPlanning = async () => {
    if (!settings.value.widgets.vencat.group) return;
    loading.value = true;
    try {
      const response = await query<Course>("planning", {
        select:
          "id,start:start_at,end:end_at,module,summary,location,teachers,group:group_name",
        filters: { group_name: settings.value.widgets.vencat.group } as Partial<Course>,
        orderBy: "start_at",
        ascending: true,
      });
      planning.value = response.data ?? [];
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  };

  return { planning, loading, error, fetchPlanning };
};
