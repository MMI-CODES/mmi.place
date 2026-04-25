import { query } from "@mmiplace/mmi-core";

type RoleLiteUser = { id: string; prenom: string; nom: string };
export type Tool = {
  id: number;
  name: string;
  category: "OFFICIAL" | "STUDENTS" | "RESOURCE";
  url: string;
  source?: string | null;
  description?: string | null;
  emoji?: string | null;
  icon?: string | null;
  authors?: RoleLiteUser[];
};

export const useTools = () => {
  const tools = useState<{
    official: Tool[];
    students: Tool[];
    resource: Tool[];
  }>("tools-data", () => ({ official: [], students: [], resource: [] }));

  const loading = useState<boolean>("tools-loading", () => false);
  const error = useState<Error | null>("tools-error", () => null);

  const fetchTools = async () => {
    loading.value = true;
    try {
      const response = await query<Tool>("tools", {
        select: "id,name,category,url,source,description,emoji,icon",
        orderBy: "id",
        ascending: true,
      });
      const data = response.data ?? [];
      tools.value.official = data.filter((tool) => tool.category === "OFFICIAL");
      tools.value.students = data.filter((tool) => tool.category === "STUDENTS");
      tools.value.resource = data.filter((tool) => tool.category === "RESOURCE");
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  };

  return { tools, loading, error, fetchTools };
};
