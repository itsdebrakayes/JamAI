
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
  console.log('🗂️ Grouping chats by time. Total chats:', chatHistory.length);
  
  if (!chatHistory.length) {
    console.log('🗂️ No chats to group');
    return [];
  }

  // Sort chats by creation date (newest first)
  const sortedChats = [...chatHistory].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  console.log('🗂️ Sorted chats:', sortedChats.map(chat => ({
    id: chat.id,
    title: chat.title,
    createdAt: chat.createdAt
  })));

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

    console.log(`🗂️ Processing chat "${chat.title}": ${chatDate.toISOString()}, ${daysAgo} days ago, ${weeksAgo} weeks ago`);

    if (daysAgo === 0) {
      console.log('🗂️ Adding to Today');
      today.push(chat);
    } else if (daysAgo === 1) {
      console.log('🗂️ Adding to Yesterday');
      yesterday.push(chat);
    } else if (isThisWeek(chatDate)) {
      console.log('🗂️ Adding to This Week');
      thisWeek.push(chat);
    } else if (weeksAgo === 1) {
      console.log('🗂️ Adding to Last Week');
      lastWeek.push(chat);
    } else if (isThisMonth(chatDate)) {
      console.log('🗂️ Adding to This Month');
      thisMonth.push(chat);
    } else {
      // Group by month for older chats
      const monthKey = format(chatDate, 'MMMM yyyy');
      console.log(`🗂️ Adding to month group: ${monthKey}`);
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, []);
      }
      monthlyGroups.get(monthKey)!.push(chat);
    }
  });

  // Add groups in order
  if (today.length > 0) {
    console.log('🗂️ Adding Today group with', today.length, 'chats');
    groups.push({ label: 'Today', chats: today });
  }
  
  if (yesterday.length > 0) {
    console.log('🗂️ Adding Yesterday group with', yesterday.length, 'chats');
    groups.push({ label: 'Yesterday', chats: yesterday });
  }
  
  if (thisWeek.length > 0) {
    console.log('🗂️ Adding This Week group with', thisWeek.length, 'chats');
    groups.push({ label: 'This Week', chats: thisWeek });
  }
  
  if (lastWeek.length > 0) {
    console.log('🗂️ Adding Last Week group with', lastWeek.length, 'chats');
    groups.push({ label: 'Last Week', chats: lastWeek });
  }
  
  if (thisMonth.length > 0) {
    console.log('🗂️ Adding This Month group with', thisMonth.length, 'chats');
    groups.push({ label: 'This Month', chats: thisMonth });
  }

  // Add monthly groups (sorted by date, newest first)
  const sortedMonthlyKeys = Array.from(monthlyGroups.keys()).sort((a, b) => {
    const dateA = new Date(a + ' 1');
    const dateB = new Date(b + ' 1');
    return dateB.getTime() - dateA.getTime();
  });

  sortedMonthlyKeys.forEach(monthKey => {
    console.log(`🗂️ Adding ${monthKey} group with`, monthlyGroups.get(monthKey)!.length, 'chats');
    groups.push({ label: monthKey, chats: monthlyGroups.get(monthKey)! });
  });

  console.log('🗂️ Final groups:', groups.map(g => ({ label: g.label, count: g.chats.length })));
  return groups;
};
