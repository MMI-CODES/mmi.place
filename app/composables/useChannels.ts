import { query } from "@mmiplace/mmi-core";

export type Channel = {
  id: number;
  title: string;
};

export const useChannels = () => {
  const channels = useState<Channel[]>("channels-data", () => []);
  const loading = useState<boolean>("channels-loading", () => false);
  const error = useState<Error | null>("channels-error", () => null);

  const fetchChannels = async () => {
    loading.value = true;
    try {
      const response = await query<Channel>("channels", {
        select: "id,title",
        orderBy: "id",
        ascending: true,
      });
      channels.value = response.data ?? [];
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  };

  return { channels, loading, error, fetchChannels };
};
