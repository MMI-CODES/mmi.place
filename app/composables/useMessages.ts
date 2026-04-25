import { insert, query, remove, update } from "@mmiplace/mmi-core";

export type Message = {
  id: number;
  title: string;
  content: string;
  channelId: number;
  buttons?: { label: string; link: string; style: string }[];
  createdAt: string;
  publishAt?: string | null;
  expiresAt?: string | null;
};

export const useMessages = () => {
  const { settings } = useSettings();
  const messages = useState<Message[]>("messages-data", () => []);
  const activeMessageIndex = useState<number>("active-message-index", () => 0);
  const loading = useState<boolean>("messages-loading", () => false);
  const error = useState<Error | null>("messages-error", () => null);

  const fetchMessages = async () => {
    loading.value = true;
    try {
      const channels = settings.value.widgets.messages.channels;
      const result = await query<Message>("messages", {
        select:
          "id,title,content,channelId:channel_id,buttons,createdAt:created_at,publishAt:publish_at,expiresAt:expires_at",
        orderBy: "created_at",
        ascending: false,
      });
      const data = (result.data ?? []).filter((m) => channels.includes(m.channelId));
      messages.value = data.filter((message) => !settings.value.widgets.messages.readMessages.includes(message.id));
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  };

  const publishMessage = async (message: {
    title: string;
    content: string;
    channelId: number;
    buttons?: { label: string; link: string; style: string }[];
    publishAt?: string;
    expiresAt?: string;
  }) => {
    await insert<Message>("messages", {
      title: message.title,
      content: message.content,
      channel_id: message.channelId,
      buttons: message.buttons ?? [],
      publish_at: message.publishAt ?? null,
      expires_at: message.expiresAt ?? null,
    });
  };

  const updateMessage = async (
    id: number,
    message: {
      title: string;
      content: string;
      channelId: number;
      buttons?: { label: string; link: string; style: string }[];
      publishAt?: string;
      expiresAt?: string;
    },
  ) => {
    await update<Message>("messages", String(id), {
      title: message.title,
      content: message.content,
      channel_id: message.channelId,
      buttons: message.buttons ?? [],
      publish_at: message.publishAt ?? null,
      expires_at: message.expiresAt ?? null,
    });
  };

  const deleteMessage = async (id: number) => {
    await remove("messages", String(id));
  };

  return { messages, activeMessageIndex, loading, error, fetchMessages, publishMessage, updateMessage, deleteMessage };
};
