
import { differenceInDays, differenceInWeeks, format, startOfWeek, startOfMonth, isThisWeek, isThisMonth } from 'date-fns';

export interface ChatHistory {
  id: string;
  title: string;
  messages: any[];
  createdAt: Date;
}

export interface GroupedChats {
  label: string;
  chats: ChatHistory[];
}

export const groupChatsByTime = (chatHistory: ChatHistory[]): GroupedChats[] => {
  if (!chatHistory.length) return [];

  // Sort chats by creation date (newest first)
  const sortedChats = [...chatHistory].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const groups: GroupedChats[] = [];
  const now = new Date();

  // Group chats
  const today: ChatHistory[] = [];
  const yesterday: ChatHistory[] = [];
  const thisWeek: ChatHistory[] = [];
  const lastWeek: ChatHistory[] = [];
  const thisMonth: ChatHistory[] = [];
  const monthlyGroups: Map<string, ChatHistory[]> = new Map();

  sortedChats.forEach(chat => {
    const chatDate = new Date(chat.createdAt);
    const daysAgo = differenceInDays(now, chatDate);
    const weeksAgo = differenceInWeeks(now, chatDate);

    if (daysAgo === 0) {
      today.push(chat);
    } else if (daysAgo === 1) {
      yesterday.push(chat);
    } else if (isThisWeek(chatDate)) {
      thisWeek.push(chat);
    } else if (weeksAgo === 1) {
      lastWeek.push(chat);
    } else if (isThisMonth(chatDate)) {
      thisMonth.push(chat);
    } else {
      // Group by month for older chats
      const monthKey = format(chatDate, 'MMMM yyyy');
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, []);
      }
      monthlyGroups.get(monthKey)!.push(chat);
    }
  });

  // Add groups in order
  if (today.length > 0) {
    groups.push({ label: 'Today', chats: today });
  }
  
  if (yesterday.length > 0) {
    groups.push({ label: 'Yesterday', chats: yesterday });
  }
  
  if (thisWeek.length > 0) {
    groups.push({ label: 'This Week', chats: thisWeek });
  }
  
  if (lastWeek.length > 0) {
    groups.push({ label: 'Last Week', chats: lastWeek });
  }
  
  if (thisMonth.length > 0) {
    groups.push({ label: 'This Month', chats: thisMonth });
  }

  // Add monthly groups (sorted by date, newest first)
  const sortedMonthlyKeys = Array.from(monthlyGroups.keys()).sort((a, b) => {
    const dateA = new Date(a + ' 1');
    const dateB = new Date(b + ' 1');
    return dateB.getTime() - dateA.getTime();
  });

  sortedMonthlyKeys.forEach(monthKey => {
    groups.push({ label: monthKey, chats: monthlyGroups.get(monthKey)! });
  });

  return groups;
};
