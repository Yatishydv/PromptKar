export type NotificationType = "like" | "save" | "reaction" | "comment" | "follow";

export const createNotification = async (
  recipientId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  type: NotificationType,
  targetId?: string,
  targetName?: string,
  reactionType?: string
) => {
  if (recipientId === senderId) return; // Don't notify yourself

  try {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId,
        senderId,
        senderName,
        senderAvatar,
        type,
        targetId,
        targetTitle: targetName,
        reactionType,
      }),
    });
  } catch (error) {
    console.error("Error creating notification via API:", error);
  }
};
