import { supabase } from './supabase';

const PROFANITY_LIST = [
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy', 'whore',
  'slut', 'faggot', 'nigger', 'nigga', 'retard', 'crap', 'bastard'
];

export const containsProfanity = (text: string): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some(word => lowerText.includes(word));
};

export const reportPhoto = async (photoId: string, reportedUserId: string, reason: string, details?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be logged in to report');

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_photo_id: photoId,
    reported_user_id: reportedUserId,
    reason,
    details
  });

  if (error) throw error;
};

export const reportUser = async (reportedUserId: string, reason: string, details?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be logged in to report');

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    reason,
    details
  });

  if (error) throw error;
};

export const blockUser = async (blockedUserId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be logged in to block');

  const { error } = await supabase.from('blocked_users').insert({
    blocker_id: user.id,
    blocked_id: blockedUserId
  });

  // Ignore unique constraint violation (already blocked)
  if (error && error.code !== '23505') throw error;
};

export const getBlockedUsers = async (): Promise<string[]> => {
  const { data, error } = await supabase.rpc('get_blocked_users');
  
  if (error) {
    console.error('Error fetching blocked users:', error);
    return [];
  }
  
  return data ? data.map((row: any) => row.blocked_id) : [];
};
